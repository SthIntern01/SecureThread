# Create: backend/app/services/custom_scanner_service.py

import re
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.services.github_service import GitHubService

logger = logging.getLogger(__name__)


class CustomScannerService:
    """Service for rule-based scanning using YARA-like rules"""
    
    def __init__(self, db: Session):
        self.db = db
        self.github_service = GitHubService()
        
        # Configuration
        self.MAX_FILES_TO_SCAN = 50
        self.MAX_FILE_SIZE = 100 * 1024  # 100KB
        self.scannable_extensions = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.php', 
            '.java', '.sql', '.sh', '.yaml', '.yml', '.xml', '.json'
        }
        self.excluded_paths = {
            'node_modules', '.git', '__pycache__', '.venv', 'venv',
            'vendor', 'dist', 'build', '.next', 'target', 'bin'
        }
    
    async def scan_with_custom_rules(
        self,
        repository_id: int,
        access_token: str,
        provider_type: str,
        rules: List[Dict[str, Any]],
        scan_config: Optional[Dict[str, Any]] = None
    ) -> Scan:
        """Scan repository using custom rules"""
        logger.info(f"Starting custom rule scan for repository {repository_id}")
        
        # Get repository
        repository = self.db.query(Repository).filter(Repository.id == repository_id).first()
        if not repository:
            raise ValueError(f"Repository {repository_id} not found")
        
        # Find pending scan
        scan = self.db.query(Scan).filter(
            Scan.repository_id == repository_id,
            Scan.status == "pending"
        ).order_by(Scan.started_at.desc()).first()
        
        if not scan:
            raise ValueError("No pending scan found")
        
        try:
            # Update scan status
            scan.status = "running"
            scan.scan_metadata = scan.scan_metadata or {}
            scan.scan_metadata.update({
                'scan_type': 'custom_rules',
                'rules_count': len(rules),
                'scan_start_time': datetime.now(timezone.utc).isoformat()
            })
            self.db.commit()
            
            # Get repository files
            file_tree = await self._get_repository_files(
                access_token, repository.full_name, provider_type
            )
            
            # Filter scannable files
            scannable_files = self._filter_files(file_tree)
            files_to_scan = scannable_files[:self.MAX_FILES_TO_SCAN]
            
            # Scan files with rules
            scan_results = await self._scan_files_with_rules(
                files_to_scan, access_token, repository.full_name, 
                provider_type, rules, scan.id
            )
            
            # Update scan with results
            current_time = datetime.now(timezone.utc)
            scan.status = "completed"
            scan.completed_at = current_time
            scan.total_files_scanned = scan_results["files_scanned"]
            scan.total_vulnerabilities = len(scan_results["vulnerabilities"])
            
            # Count by severity
            scan.critical_count = len([v for v in scan_results["vulnerabilities"] if v.get('severity') == 'critical'])
            scan.high_count = len([v for v in scan_results["vulnerabilities"] if v.get('severity') == 'high'])
            scan.medium_count = len([v for v in scan_results["vulnerabilities"] if v.get('severity') == 'medium'])
            scan.low_count = len([v for v in scan_results["vulnerabilities"] if v.get('severity') == 'low'])
            
            # Calculate security score
            scan.security_score = self._calculate_security_score(scan_results["vulnerabilities"])
            scan.code_coverage = min(80.0, (len(files_to_scan) / max(1, len(scannable_files))) * 100)
            
            # Update metadata
            scan.scan_metadata.update({
                'file_scan_results': scan_results["file_results"],
                'scan_completed': True,
                'scan_end_time': current_time.isoformat()
            })
            
            # Calculate duration
            if scan.started_at.tzinfo is None:
                start_time = scan.started_at.replace(tzinfo=timezone.utc)
            else:
                start_time = scan.started_at
                
            duration = current_time - start_time
            scan.scan_duration = self._format_duration(duration)
            
            self.db.commit()
            
            logger.info(f"Custom scan completed: {len(scan_results['vulnerabilities'])} vulnerabilities found")
            return scan
            
        except Exception as e:
            logger.error(f"Custom scan failed: {e}")
            scan.status = "failed"
            scan.error_message = str(e)
            scan.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            raise
    
    def _filter_files(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter files for scanning"""
        scannable_files = []
        
        for file_info in files:
            file_path = file_info['path']
            
            # Skip excluded paths
            if any(excluded in file_path.lower() for excluded in self.excluded_paths):
                continue
            
            # Skip large files
            if file_info.get('size', 0) > self.MAX_FILE_SIZE:
                continue
            
            # Check extension
            file_extension = '.' + file_path.split('.')[-1] if '.' in file_path else ''
            if file_extension.lower() in self.scannable_extensions:
                scannable_files.append(file_info)
        
        return scannable_files
    
    async def _scan_files_with_rules(
        self,
        files: List[Dict[str, Any]],
        access_token: str,
        repo_full_name: str,
        provider_type: str,
        rules: List[Dict[str, Any]],
        scan_id: int
    ) -> Dict[str, Any]:
        """Scan files using custom rules"""
        all_vulnerabilities = []
        files_scanned = 0
        file_scan_results = []
        
        logger.info(f"Scanning {len(files)} files with {len(rules)} rules")
        
        for file_info in files:
            file_path = file_info['path']
            
            try:
                # Get file content
                file_content = await self._get_file_content(
                    access_token, repo_full_name, file_path, provider_type
                )
                
                if not file_content:
                    file_scan_results.append({
                        "file_path": file_path,
                        "status": "skipped",
                        "reason": "Could not read file content",
                        "vulnerabilities": [],
                        "file_size": file_info.get('size', 0)
                    })
                    continue
                
                # Apply rules to file content
                file_vulnerabilities = []
                for rule in rules:
                    matches = self._apply_rule_to_content(file_content, file_path, rule)
                    file_vulnerabilities.extend(matches)
                
                # Update results
                files_scanned += 1
                status = "vulnerable" if file_vulnerabilities else "scanned"
                reason = f"Found {len(file_vulnerabilities)} vulnerabilities" if file_vulnerabilities else "No vulnerabilities found"
                
                file_scan_results.append({
                    "file_path": file_path,
                    "status": status,
                    "reason": reason,
                    "vulnerabilities": file_vulnerabilities,
                    "file_size": len(file_content)
                })
                
                all_vulnerabilities.extend(file_vulnerabilities)
                
            except Exception as e:
                logger.error(f"Error scanning file {file_path}: {e}")
                file_scan_results.append({
                    "file_path": file_path,
                    "status": "error",
                    "reason": f"Scan error: {str(e)}",
                    "vulnerabilities": [],
                    "file_size": file_info.get('size', 0)
                })
        
        # Save vulnerabilities to database
        if all_vulnerabilities:
            await self._save_vulnerabilities(scan_id, all_vulnerabilities)
        
        return {
            "vulnerabilities": all_vulnerabilities,
            "files_scanned": files_scanned,
            "file_results": file_scan_results
        }
    
    def _apply_rule_to_content(
        self, 
        content: str, 
        file_path: str, 
        rule: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Apply a single rule to file content"""
        vulnerabilities = []
        
        try:
            # Parse YARA-like rule content
            rule_content = rule.get('content', '')
            
            # Extract strings section
            strings_section = self._extract_strings_from_rule(rule_content)
            if not strings_section:
                return vulnerabilities
            
            # Extract condition
            condition = self._extract_condition_from_rule(rule_content)
            
            # Find matches for each string pattern
            string_matches = {}
            for string_name, pattern in strings_section.items():
                matches = self._find_pattern_matches(content, pattern)
                string_matches[string_name] = matches
            
            # Evaluate condition
            if self._evaluate_condition(condition, string_matches):
                # Create vulnerability for each match location
                all_matches = []
                for matches in string_matches.values():
                    all_matches.extend(matches)
                
                # Group matches by line or create one vulnerability per rule match
                if all_matches:
                    vulnerabilities.append({
                        'title': rule.get('name', 'Custom Rule Match'),
                        'description': f"Rule '{rule.get('name')}' matched in {file_path}",
                        'severity': rule.get('severity', 'medium'),
                        'category': rule.get('category', 'custom'),
                        'file_path': file_path,
                        'line_number': all_matches[0]['line'] if all_matches else None,
                        'code_snippet': all_matches[0]['context'] if all_matches else None,
                        'recommendation': f"Review code matching rule: {rule.get('name')}",
                        'risk_score': self._severity_to_risk_score(rule.get('severity', 'medium'))
                    })
        
        except Exception as e:
            logger.error(f"Error applying rule {rule.get('name', 'unknown')}: {e}")
        
        return vulnerabilities
    
    def _extract_strings_from_rule(self, rule_content: str) -> Dict[str, str]:
        """Extract string patterns from YARA rule"""
        strings_section = {}
        
        # Find strings section
        strings_match = re.search(r'strings:\s*(.*?)\s*condition:', rule_content, re.DOTALL)
        if not strings_match:
            return strings_section
        
        strings_text = strings_match.group(1)
        
        # Extract individual string definitions
        string_patterns = re.findall(r'(\$\w+)\s*=\s*["\']([^"\']+)["\'](?:\s+nocase)?', strings_text)
        
        for var_name, pattern in string_patterns:
            # Convert simple pattern to regex (basic implementation)
            regex_pattern = pattern.replace('*', '.*')
            strings_section[var_name] = regex_pattern
        
        return strings_section
    
    def _extract_condition_from_rule(self, rule_content: str) -> str:
        """Extract condition from YARA rule"""
        condition_match = re.search(r'condition:\s*(.*?)(?:\}|$)', rule_content, re.DOTALL)
        if condition_match:
            return condition_match.group(1).strip()
        return ""
    
    def _find_pattern_matches(self, content: str, pattern: str) -> List[Dict[str, Any]]:
        """Find all matches of a pattern in content"""
        matches = []
        
        try:
            # Case-insensitive search (most rules use nocase)
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                line_start = content.rfind('\n', 0, match.start()) + 1
                line_end = content.find('\n', match.end())
                if line_end == -1:
                    line_end = len(content)
                
                context = content[line_start:line_end].strip()
                
                matches.append({
                    'line': line_num,
                    'start': match.start(),
                    'end': match.end(),
                    'matched_text': match.group(),
                    'context': context
                })
        
        except re.error as e:
            logger.warning(f"Invalid regex pattern '{pattern}': {e}")
        
        return matches
    
    def _evaluate_condition(self, condition: str, string_matches: Dict[str, List]) -> bool:
        """Evaluate YARA rule condition (simplified)"""
        if not condition:
            return False
        
        try:
            # Simple condition evaluation
            if 'any of' in condition:
                # Check if any string matched
                return any(len(matches) > 0 for matches in string_matches.values())
            
            elif 'all of' in condition:
                # Check if all strings matched
                return all(len(matches) > 0 for matches in string_matches.values())
            
            elif ' and ' in condition:
                # Split by 'and' and check each part
                parts = condition.split(' and ')
                return all(self._evaluate_condition_part(part, string_matches) for part in parts)
            
            elif ' or ' in condition:
                # Split by 'or' and check each part
                parts = condition.split(' or ')
                return any(self._evaluate_condition_part(part, string_matches) for part in parts)
            
            else:
                # Single condition
                return self._evaluate_condition_part(condition, string_matches)
        
        except Exception as e:
            logger.error(f"Error evaluating condition '{condition}': {e}")
            return False
    
    def _evaluate_condition_part(self, part: str, string_matches: Dict[str, List]) -> bool:
        """Evaluate a single condition part"""
        part = part.strip()
        
        if part.startswith('any of ($'):
            # Extract variable group (e.g., "any of ($sql*)")
            var_group = part[8:-1]  # Remove "any of ($" and ")"
            if var_group.endswith('*'):
                prefix = var_group[:-1]
                return any(var.startswith(prefix) and len(matches) > 0 
                          for var, matches in string_matches.items())
        
        elif part.startswith('$'):
            # Direct variable reference
            return len(string_matches.get(part, [])) > 0
        
        return False
    
    def _severity_to_risk_score(self, severity: str) -> float:
        """Convert severity to risk score"""
        severity_scores = {
            'critical': 9.0,
            'high': 7.0,
            'medium': 5.0,
            'low': 3.0
        }
        return severity_scores.get(severity.lower(), 5.0)
    
    def _calculate_security_score(self, vulnerabilities: List[Dict[str, Any]]) -> float:
        """Calculate security score based on vulnerabilities"""
        if not vulnerabilities:
            return 90.0
        
        total_penalty = 0
        for vuln in vulnerabilities:
            severity = vuln.get('severity', 'medium').lower()
            if severity == 'critical':
                total_penalty += 15
            elif severity == 'high':
                total_penalty += 10
            elif severity == 'medium':
                total_penalty += 5
            else:  # low
                total_penalty += 2
        
        score = max(20, 100 - total_penalty)
        return round(score, 1)
    
    def _format_duration(self, duration) -> str:
        """Format scan duration"""
        total_seconds = int(duration.total_seconds())
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"
    
    async def _get_repository_files(self, access_token: str, repo_full_name: str, provider_type: str):
        """Get repository files (reuse from scanner_service.py)"""
        # Implementation similar to scanner_service.py
        pass
    
    async def _get_file_content(self, access_token: str, repo_full_name: str, file_path: str, provider_type: str):
        """Get file content (reuse from scanner_service.py)"""  
        # Implementation similar to scanner_service.py
        pass
    
    async def _save_vulnerabilities(self, scan_id: int, vulnerabilities: List[Dict[str, Any]]):
        """Save vulnerabilities to database (reuse from scanner_service.py)"""
        # Implementation similar to scanner_service.py
        pass