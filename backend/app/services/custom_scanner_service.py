# backend/app/services/custom_scanner_service.py

import re
import logging
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.services.github_service import GitHubService
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class CustomScannerService:
    """Unified service for rule-based scanning with LLM-enhanced explanations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.github_service = GitHubService()
        self.llm_service = LLMService()

        # Import other services
        from app.services.bitbucket_services import BitbucketService
        self.bitbucket_service = BitbucketService()

        # Enhanced configuration for better file coverage
        self.MAX_FILES_TO_SCAN = 100  # Increased from 50
        self.MAX_FILE_SIZE = 200 * 1024  # Increased to 200KB
        self.BATCH_SIZE = 5  # Process files in batches
        
        # Expanded scannable extensions for better coverage
        self.scannable_extensions = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.php', 
            '.java', '.sql', '.sh', '.bash', '.yaml', '.yml', 
            '.xml', '.json', '.go', '.rs', '.rb', '.cpp', 
            '.c', '.cs', '.swift', '.kt', '.scala', '.pl', 
            '.lua', '.r', '.m', '.h', '.hpp', '.cc'
        }
        
        # Keep excluded paths minimal to scan more files
        self.excluded_paths = {
            'node_modules', '.git', '__pycache__', '.venv', 'venv',
            'vendor', 'dist', 'build', '.next', 'target', 'bin',
            '.idea', '.vscode', 'coverage', '.nyc_output'
        }
    
    async def unified_security_scan(
        self,
        repository_id: int,
        access_token: str,
        provider_type: str,
        rules: List[Dict[str, Any]],
        use_llm_enhancement: bool = True,
        scan_config: Optional[Dict[str, Any]] = None
    ) -> Scan:
        """
        Unified security scan combining rule-based detection with LLM enhancement
        """
        logger.info(f"Starting unified security scan for repository {repository_id}")
        
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
                'scan_type': 'unified_llm_rules',
                'rules_count': len(rules),
                'llm_enhancement': use_llm_enhancement,
                'scan_start_time': datetime.now(timezone.utc).isoformat()
            })
            self.db.commit()
            
            # Get comprehensive repository files
            file_tree = await self._get_comprehensive_repository_files(
                access_token, repository.full_name, provider_type
            )
            
            # Enhanced file filtering for maximum coverage
            scannable_files = self._enhanced_filter_files(file_tree)
            files_to_scan = scannable_files[:self.MAX_FILES_TO_SCAN]
            
            logger.info(f"Found {len(file_tree)} total files, {len(scannable_files)} scannable, will scan {len(files_to_scan)}")
            
            # Phase 1: Rule-based vulnerability detection
            rule_based_results = await self._comprehensive_rule_scan(
                files_to_scan, access_token, repository.full_name, 
                provider_type, rules, scan.id
            )
            
            # Phase 2: LLM enhancement for explanations and mitigations
            enhanced_results = rule_based_results
            if use_llm_enhancement:
                enhanced_results = await self._enhance_with_llm_analysis(
                    rule_based_results, files_to_scan, access_token, 
                    repository.full_name, provider_type
                )

            # 🔥 CRITICAL FIX: Save vulnerabilities AFTER LLM enhancement
            if enhanced_results["vulnerabilities"]:
                await self._save_enhanced_vulnerabilities(scan.id, enhanced_results["vulnerabilities"])
            
            # Update scan with comprehensive results
            current_time = datetime.now(timezone.utc)
            scan.status = "completed"
            scan.completed_at = current_time
            scan.total_files_scanned = enhanced_results["files_scanned"]
            scan.total_vulnerabilities = len(enhanced_results["vulnerabilities"])
            
            # Count by severity
            scan.critical_count = len([v for v in enhanced_results["vulnerabilities"] if v.get('severity') == 'critical'])
            scan.high_count = len([v for v in enhanced_results["vulnerabilities"] if v.get('severity') == 'high'])
            scan.medium_count = len([v for v in enhanced_results["vulnerabilities"] if v.get('severity') == 'medium'])
            scan.low_count = len([v for v in enhanced_results["vulnerabilities"] if v.get('severity') == 'low'])
            
            # Calculate enhanced security metrics
            scan.security_score = round(self._calculate_enhanced_security_score(enhanced_results["vulnerabilities"]), 1)
            
            # Better code coverage calculation
            if len(scannable_files) > 0:
                coverage_ratio = len(files_to_scan) / len(scannable_files)
                actual_scanned_ratio = enhanced_results["files_scanned"] / len(files_to_scan) if len(files_to_scan) > 0 else 0
                final_coverage = min(95.0, (coverage_ratio * actual_scanned_ratio) * 100)
                scan.code_coverage = round(final_coverage, 0)
            else:
                scan.code_coverage = 0
            
            logger.info(f"Enhanced scan metrics - Security Score: {scan.security_score}%, Coverage: {scan.code_coverage}%")
            
            # Update metadata with comprehensive results
            scan.scan_metadata.update({
                'file_scan_results': enhanced_results["file_results"],
                'rule_detection_results': enhanced_results.get("rule_results", []),
                'llm_enhancement_results': enhanced_results.get("llm_results", []),
                'scan_completed': True,
                'scan_end_time': current_time.isoformat(),
                'total_files_found': len(file_tree),
                'total_scannable_files': len(scannable_files),
                'files_scanned': len(files_to_scan),
                'files_with_issues': enhanced_results.get("vulnerable_files_count", 0),
                'scan_phase_breakdown': {
                    'rule_detection_duration': enhanced_results.get("rule_duration", "0s"),
                    'llm_enhancement_duration': enhanced_results.get("llm_duration", "0s")
                }
            })
            
            # Calculate duration
            if scan.started_at.tzinfo is None:
                start_time = scan.started_at.replace(tzinfo=timezone.utc)
            else:
                start_time = scan.started_at
                
            duration = current_time - start_time
            scan.scan_duration = self._format_duration(duration)
            
            self.db.commit()
            
            logger.info(f"Unified scan completed: {len(enhanced_results['vulnerabilities'])} vulnerabilities found")
            logger.info(f"Scan duration: {scan.scan_duration}")
            return scan
            
        except Exception as e:
            logger.error(f"Unified scan failed: {e}", exc_info=True)
            scan.status = "failed"
            scan.error_message = str(e)
            scan.completed_at = datetime.now(timezone.utc)
            
            # Calculate duration even for failed scans
            if scan.started_at.tzinfo is None:
                start_time = scan.started_at.replace(tzinfo=timezone.utc)
            else:
                start_time = scan.started_at
                
            duration = datetime.now(timezone.utc) - start_time
            scan.scan_duration = self._format_duration(duration)
            
            self.db.commit()
            raise
    
    async def _get_comprehensive_repository_files(
        self,
        access_token: str,
        repo_full_name: str,
        provider_type: str
    ) -> List[Dict[str, Any]]:
        """Get ALL files from repository with enhanced discovery"""
        try:
            files = []
            
            if provider_type == "github":
                # Get repository tree (without recursive parameter)
                tree_data = self.github_service.get_repository_tree(
                    access_token, repo_full_name
                )
                
                if tree_data and 'tree' in tree_data:
                    for item in tree_data['tree']:
                        if item.get('type') == 'blob':  # It's a file
                            files.append({
                                'path': item['path'],
                                'sha': item['sha'],
                                'size': item.get('size', 0),
                                'url': item.get('url', ''),
                                'type': 'file'
                            })
                
            elif provider_type == "bitbucket":
                # Enhanced Bitbucket file discovery
                workspace, repo_slug = repo_full_name.split("/", 1)
                
                # Get all files recursively
                files = self.bitbucket_service.get_repository_tree_all_files(
                    access_token, workspace, repo_slug
                )
                
            logger.info(f"Enhanced discovery found {len(files)} total files")
            return files
                
        except Exception as e:
            logger.error(f"Error in comprehensive file discovery: {e}", exc_info=True)
            return []
    
    def _enhanced_filter_files(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enhanced file filtering for maximum security coverage"""
        scannable_files = []
        
        # Priority scoring for security-relevant files
        security_priorities = {
            # High priority - common vulnerability sources
            '.py': 10, '.js': 10, '.jsx': 9, '.ts': 9, '.tsx': 9,
            '.php': 10, '.java': 8, '.sql': 10, '.sh': 9, '.bash': 9,
            
            # Medium priority - configuration and infrastructure
            '.yaml': 7, '.yml': 7, '.xml': 6, '.json': 6,
            '.go': 8, '.rs': 7, '.rb': 7, '.cpp': 6, '.c': 6,
            
            # Lower priority but still relevant
            '.cs': 5, '.swift': 5, '.kt': 5, '.scala': 5,
            '.pl': 4, '.lua': 4, '.r': 4
        }
        
        for file_info in files:
            file_path = file_info['path']
            
            # Skip excluded paths (but be more selective)
            path_lower = file_path.lower()
            if any(excluded in path_lower for excluded in self.excluded_paths):
                # Exception: scan config files even in excluded dirs
                if not any(config in path_lower for config in ['.env', 'config', 'settings', 'dockerfile']):
                    continue
            
            # Skip very large files
            file_size = file_info.get('size', 0)
            if file_size > self.MAX_FILE_SIZE:
                continue
            
            # Get file extension
            file_extension = '.' + file_path.split('.')[-1] if '.' in file_path else ''
            
            # Check if file is scannable
            if file_extension.lower() in self.scannable_extensions:
                priority = security_priorities.get(file_extension.lower(), 1)
                file_info['security_priority'] = priority
                scannable_files.append(file_info)
            
            # Special case: important files without extensions
            filename = file_path.split('/')[-1].lower()
            important_files = {
                'dockerfile', 'makefile', 'requirements.txt', 'package.json',
                'composer.json', 'pom.xml', 'build.gradle', '.env', '.gitignore',
                'web.config', 'app.config', 'settings.py', 'config.py'
            }
            
            if filename in important_files:
                file_info['security_priority'] = 8
                scannable_files.append(file_info)
        
        # Sort by security priority (higher first) and then by file size (smaller first)
        scannable_files.sort(key=lambda x: (-x.get('security_priority', 0), x.get('size', 0)))
        
        logger.info(f"Enhanced filtering: {len(scannable_files)} security-relevant files identified")
        return scannable_files
    
    async def _comprehensive_rule_scan(
        self,
        files: List[Dict[str, Any]],
        access_token: str,
        repo_full_name: str,
        provider_type: str,
        rules: List[Dict[str, Any]],
        scan_id: int
    ) -> Dict[str, Any]:
        """Comprehensive rule-based scanning with improved accuracy"""
        all_vulnerabilities = []
        files_scanned = 0
        file_scan_results = []
        rule_matches_by_file = {}
        
        start_time = datetime.now()
        logger.info(f"Starting comprehensive rule scan on {len(files)} files with {len(rules)} rules")
        
        # Process files in batches for better performance
        for batch_start in range(0, len(files), self.BATCH_SIZE):
            batch_files = files[batch_start:batch_start + self.BATCH_SIZE]
            
            for file_info in batch_files:
                file_path = file_info['path']
                
                try:
                    logger.debug(f"Scanning file: {file_path}")
                    
                    # Get file content with enhanced error handling
                    file_content = await self._get_file_content_enhanced(
                        access_token, repo_full_name, file_path, provider_type
                    )
                    
                    if not file_content:
                        file_scan_results.append({
                            "file_path": file_path,
                            "status": "skipped",
                            "reason": "Could not read file content or binary file",
                            "vulnerabilities": [],
                            "rule_matches": 0,
                            "file_size": file_info.get('size', 0)
                        })
                        continue
                    
                    # Apply all rules to this file with enhanced matching
                    file_vulnerabilities = []
                    rule_matches = []
                    
                    for rule in rules:
                        matches = self._enhanced_rule_matching(file_content, file_path, rule)
                        if matches:
                            logger.debug(f"Rule '{rule.get('name')}' found {len(matches)} matches in {file_path}")
                            file_vulnerabilities.extend(matches)
                            rule_matches.extend([{
                                'rule_name': rule.get('name'),
                                'matches': len(matches),
                                'severity': rule.get('severity', 'medium')
                            }])
                    
                    files_scanned += 1
                    status = "vulnerable" if file_vulnerabilities else "clean"
                    reason = f"Found {len(file_vulnerabilities)} vulnerabilities" if file_vulnerabilities else "No vulnerabilities detected"
                    
                    file_scan_results.append({
                        "file_path": file_path,
                        "status": status,
                        "reason": reason,
                        "vulnerabilities": file_vulnerabilities,
                        "rule_matches": len(rule_matches),
                        "file_size": len(file_content),
                        "rules_applied": rule_matches
                    })
                    
                    all_vulnerabilities.extend(file_vulnerabilities)
                    
                    if rule_matches:
                        rule_matches_by_file[file_path] = rule_matches
                    
                except Exception as e:
                    logger.error(f"Error scanning file {file_path}: {e}")
                    file_scan_results.append({
                        "file_path": file_path,
                        "status": "error",
                        "reason": f"Scan error: {str(e)}",
                        "vulnerabilities": [],
                        "rule_matches": 0,
                        "file_size": file_info.get('size', 0)
                    })
        
        # DON'T save vulnerabilities here - they will be saved after LLM enhancement
        
        end_time = datetime.now()
        duration = self._format_duration(end_time - start_time)
        
        logger.info(f"Rule-based scan completed: {files_scanned} files scanned, {len(all_vulnerabilities)} vulnerabilities found")
        
        return {
            "vulnerabilities": all_vulnerabilities,
            "files_scanned": files_scanned,
            "file_results": file_scan_results,
            "rule_results": rule_matches_by_file,
            "rule_duration": duration,
            "vulnerable_files_count": len([f for f in file_scan_results if f["status"] == "vulnerable"])
        }
    
    async def _enhance_with_llm_analysis(
        self,
        rule_results: Dict[str, Any],
        files: List[Dict[str, Any]],
        access_token: str,
        repo_full_name: str,
        provider_type: str
    ) -> Dict[str, Any]:
        """Enhance rule-based results with LLM analysis for explanations and mitigations"""
        start_time = datetime.now()
        logger.info("Starting LLM enhancement phase")
        
        enhanced_vulnerabilities = []
        llm_analysis_results = []
        
        # Group vulnerabilities by file for efficient LLM processing
        vulnerabilities_by_file = {}
        for vuln in rule_results["vulnerabilities"]:
            file_path = vuln.get('file_path', '')
            if file_path not in vulnerabilities_by_file:
                vulnerabilities_by_file[file_path] = []
            vulnerabilities_by_file[file_path].append(vuln)
        
        # Enhance vulnerabilities with LLM analysis
        for file_path, file_vulns in vulnerabilities_by_file.items():
            try:
                # Get file content for context
                file_content = await self._get_file_content_enhanced(
                    access_token, repo_full_name, file_path, provider_type
                )
                
                if file_content and len(file_vulns) > 0:
                    # Get LLM enhancement for vulnerabilities in this file
                    llm_enhancement = await self._get_llm_vulnerability_enhancement(
                        file_content, file_path, file_vulns
                    )
                    
                    if llm_enhancement:
                        llm_analysis_results.append({
                            'file_path': file_path,
                            'enhancement_successful': True,
                            'vulnerabilities_enhanced': len(file_vulns)
                        })
                        
                        # Apply LLM enhancements to vulnerabilities
                        for i, vuln in enumerate(file_vulns):
                            if i < len(llm_enhancement):
                                enhancement = llm_enhancement[i]
                                vuln.update({
                                    'description': enhancement.get('enhanced_description', vuln.get('description')),
                                    'recommendation': enhancement.get('detailed_recommendation', vuln.get('recommendation')),
                                    'fix_suggestion': enhancement.get('fix_suggestion', vuln.get('fix_suggestion')),
                                    'risk_score': enhancement.get('risk_score', vuln.get('risk_score')),
                                    'exploitability': enhancement.get('exploitability', vuln.get('exploitability')),
                                    'impact': enhancement.get('impact', vuln.get('impact')),
                                    'cwe_id': enhancement.get('related_cwe', vuln.get('cwe_id')),
                                    'owasp_category': enhancement.get('owasp_category', vuln.get('owasp_category')),
                                    'llm_enhanced': True
                                })
                            enhanced_vulnerabilities.append(vuln)
                    else:
                        # Keep original vulnerabilities if LLM enhancement failed
                        enhanced_vulnerabilities.extend(file_vulns)
                        llm_analysis_results.append({
                            'file_path': file_path,
                            'enhancement_successful': False,
                            'reason': 'LLM analysis failed'
                        })
                else:
                    enhanced_vulnerabilities.extend(file_vulns)
                    
            except Exception as e:
                logger.error(f"Error in LLM enhancement for {file_path}: {e}")
                enhanced_vulnerabilities.extend(file_vulns)
                llm_analysis_results.append({
                    'file_path': file_path,
                    'enhancement_successful': False,
                    'reason': str(e)
                })
        
        end_time = datetime.now()
        llm_duration = self._format_duration(end_time - start_time)
        
        logger.info(f"LLM enhancement completed: {len(enhanced_vulnerabilities)} vulnerabilities enhanced")
        
        # Return enhanced results
        enhanced_results = rule_results.copy()
        enhanced_results.update({
            "vulnerabilities": enhanced_vulnerabilities,
            "llm_results": llm_analysis_results,
            "llm_duration": llm_duration
        })
        
        return enhanced_results
    
    async def _get_llm_vulnerability_enhancement(
        self,
        file_content: str,
        file_path: str,
        vulnerabilities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Get LLM enhancement for vulnerabilities"""
        try:
            # Prepare context for LLM
            context = {
                'file_path': file_path,
                'file_content': file_content[:4000],  # Limit content size
                'vulnerabilities': vulnerabilities
            }
            
            # Call LLM service for vulnerability enhancement
            enhancement = await self.llm_service.enhance_vulnerabilities(context)
            return enhancement if enhancement else []
            
        except Exception as e:
            logger.error(f"LLM enhancement failed for {file_path}: {e}")
            return []
    
    def _enhanced_rule_matching(
        self, 
        content: str, 
        file_path: str, 
        rule: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Enhanced rule matching with better accuracy"""
        vulnerabilities = []
        
        try:
            rule_content = rule.get('content', '')
            if not rule_content:
                return vulnerabilities
            
            # Enhanced string extraction
            strings_section = self._extract_strings_from_rule(rule_content)
            if not strings_section:
                return vulnerabilities
            
            # Enhanced condition parsing
            condition = self._extract_condition_from_rule(rule_content)
            
            # Find matches for each string pattern with context
            string_matches = {}
            for string_name, pattern in strings_section.items():
                matches = self._find_enhanced_pattern_matches(content, pattern, file_path)
                string_matches[string_name] = matches
            
            # Evaluate condition with enhanced logic
            if self._evaluate_enhanced_condition(condition, string_matches):
                # Create detailed vulnerability entries
                all_matches = []
                for matches in string_matches.values():
                    all_matches.extend(matches)
                
                if all_matches:
                    # Group matches by proximity for better vulnerability mapping
                    grouped_matches = self._group_matches_by_proximity(all_matches)
                    
                    for match_group in grouped_matches:
                        vulnerabilities.append({
                            'title': rule.get('name', 'Security Rule Match'),
                            'description': f"Security rule '{rule.get('name')}' detected potential vulnerability in {file_path}",
                            'severity': rule.get('severity', 'medium'),
                            'category': rule.get('category', 'security'),
                            'file_path': file_path,
                            'line_number': match_group[0]['line'] if match_group else None,
                            'line_end_number': match_group[-1]['line'] if len(match_group) > 1 else None,
                            'code_snippet': match_group[0]['context'] if match_group else None,
                            'recommendation': f"Review and remediate the security issue detected by rule: {rule.get('name')}",
                            'risk_score': self._severity_to_risk_score(rule.get('severity', 'medium')),
                            'rule_id': rule.get('id'),
                            'matches_count': len(match_group),
                            'match_details': match_group
                        })
        
        except Exception as e:
            logger.error(f"Error in enhanced rule matching for rule {rule.get('name', 'unknown')}: {e}")
        
        return vulnerabilities
    
    def _find_enhanced_pattern_matches(self, content: str, pattern: str, file_path: str) -> List[Dict[str, Any]]:
        """Enhanced pattern matching with better context extraction"""
        matches = []
        
        try:
            # Enhanced regex with multiline support
            flags = re.IGNORECASE | re.MULTILINE | re.DOTALL
            
            for match in re.finditer(pattern, content, flags):
                line_num = content[:match.start()].count('\n') + 1
                
                # Get broader context (3 lines before and after)
                lines = content.split('\n')
                start_line = max(0, line_num - 4)
                end_line = min(len(lines), line_num + 3)
                context_lines = lines[start_line:end_line]
                context = '\n'.join(context_lines)
                
                # Extract the specific line with the match
                match_line = lines[line_num - 1] if line_num - 1 < len(lines) else ""
                
                matches.append({
                    'line': line_num,
                    'column': match.start() - content.rfind('\n', 0, match.start()),
                    'start': match.start(),
                    'end': match.end(),
                    'matched_text': match.group(),
                    'match_line': match_line.strip(),
                    'context': context,
                    'confidence': self._calculate_match_confidence(match.group(), pattern, file_path)
                })
        
        except re.error as e:
            logger.warning(f"Invalid regex pattern '{pattern}': {e}")
        except Exception as e:
            logger.error(f"Error in enhanced pattern matching: {e}")
        
        return matches
    
    def _group_matches_by_proximity(self, matches: List[Dict[str, Any]], max_line_distance: int = 5) -> List[List[Dict[str, Any]]]:
        """Group matches that are close to each other"""
        if not matches:
            return []
        
        # Sort matches by line number
        sorted_matches = sorted(matches, key=lambda x: x.get('line', 0))
        groups = []
        current_group = [sorted_matches[0]]
        
        for match in sorted_matches[1:]:
            last_line = current_group[-1].get('line', 0)
            current_line = match.get('line', 0)
            
            if current_line - last_line <= max_line_distance:
                current_group.append(match)
            else:
                groups.append(current_group)
                current_group = [match]
        
        groups.append(current_group)
        return groups
    
    def _calculate_match_confidence(self, matched_text: str, pattern: str, file_path: str) -> float:
        """Calculate confidence score for a match"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence for longer matches
        if len(matched_text) > 10:
            confidence += 0.2
        
        # Increase confidence for matches in security-sensitive files
        sensitive_paths = ['auth', 'login', 'password', 'token', 'key', 'config', 'admin']
        if any(sensitive in file_path.lower() for sensitive in sensitive_paths):
            confidence += 0.2
        
        # Increase confidence for common vulnerability patterns
        vuln_indicators = ['password', 'secret', 'key', 'token', 'sql', 'query', 'exec', 'eval']
        if any(indicator in matched_text.lower() for indicator in vuln_indicators):
            confidence += 0.1
        
        return min(1.0, confidence)
    
    async def _get_file_content_enhanced(
        self,
        access_token: str,
        repo_full_name: str,
        file_path: str,
        provider_type: str
    ) -> Optional[str]:
        """Enhanced file content retrieval with better error handling"""
        try:
            max_retries = 3
            retry_delay = 1
            
            for attempt in range(max_retries):
                try:
                    if provider_type == "github":
                        file_data = self.github_service.get_file_content(
                            access_token, repo_full_name, file_path
                        )
                        
                        if file_data and not file_data.get('is_binary'):
                            content = file_data.get('content', '')
                            if content:
                                return content
                        return None
                        
                    elif provider_type == "bitbucket":
                        workspace, repo_slug = repo_full_name.split("/", 1)
                        
                        content = self.bitbucket_service.get_file_content(
                            access_token, workspace, repo_slug, file_path
                        )
                        
                        return content if content else None
                
                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"Retry {attempt + 1} for {file_path}: {e}")
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        raise e
            
            return None
                
        except Exception as e:
            logger.error(f"Error getting enhanced file content for {file_path}: {e}")
            return None
    
    async def _save_enhanced_vulnerabilities(self, scan_id: int, vulnerabilities: List[Dict[str, Any]]):
        """Save enhanced vulnerabilities with better data integrity"""
        try:
            logger.info(f"Saving {len(vulnerabilities)} enhanced vulnerabilities")
            
            saved_count = 0
            for vuln_data in vulnerabilities:
                try:
                    # Enhanced data validation
                    title = str(vuln_data.get('title', 'Security Issue'))[:255]
                    description = str(vuln_data.get('description', ''))[:2000]
                    severity = vuln_data.get('severity', 'medium').lower()
                    
                    if severity not in ['critical', 'high', 'medium', 'low']:
                        severity = 'medium'
                    
                    vulnerability = Vulnerability(
                        scan_id=scan_id,
                        title=title,
                        description=description,
                        severity=severity,
                        category=str(vuln_data.get('category', 'security'))[:100],
                        cwe_id=str(vuln_data.get('cwe_id', ''))[:20] if vuln_data.get('cwe_id') else None,
                        owasp_category=str(vuln_data.get('owasp_category', ''))[:50] if vuln_data.get('owasp_category') else None,
                        file_path=str(vuln_data.get('file_path', ''))[:500],
                        line_number=vuln_data.get('line_number') if isinstance(vuln_data.get('line_number'), int) else None,
                        line_end_number=vuln_data.get('line_end_number') if isinstance(vuln_data.get('line_end_number'), int) else None,
                        code_snippet=str(vuln_data.get('code_snippet', ''))[:1000] if vuln_data.get('code_snippet') else None,
                        recommendation=str(vuln_data.get('recommendation', 'Review and fix this security issue'))[:2000],
                        fix_suggestion=str(vuln_data.get('fix_suggestion', ''))[:2000] if vuln_data.get('fix_suggestion') else None,
                        risk_score=float(vuln_data.get('risk_score', 5.0)),
                        exploitability=vuln_data.get('exploitability', 'medium'),
                        impact=vuln_data.get('impact', 'medium'),
                        status='open'
                    )
                    
                    self.db.add(vulnerability)
                    saved_count += 1
                    
                except Exception as e:
                    logger.error(f"Error saving individual vulnerability: {e}")
                    continue
            
            self.db.commit()
            logger.info(f"Successfully saved {saved_count} enhanced vulnerabilities")
            
        except Exception as e:
            logger.error(f"Error saving enhanced vulnerabilities: {e}", exc_info=True)
            self.db.rollback()
            raise
    
    def _calculate_enhanced_security_score(self, vulnerabilities: List[Dict[str, Any]]) -> float:
        """Calculate enhanced security score with weighted factors"""
        if not vulnerabilities:
            return 95.0
        
        total_penalty = 0
        confidence_factor = 1.0
        
        for vuln in vulnerabilities:
            severity = vuln.get('severity', 'medium').lower()
            confidence = vuln.get('confidence', 0.7)
            
            # Base penalties by severity
            base_penalties = {
                'critical': 20,
                'high': 15,
                'medium': 8,
                'low': 3
            }
            
            penalty = base_penalties.get(severity, 8)
            
            # Adjust penalty by confidence
            adjusted_penalty = penalty * confidence
            
            # Additional penalty for LLM-confirmed vulnerabilities
            if vuln.get('llm_enhanced'):
                adjusted_penalty *= 1.1
            
            total_penalty += adjusted_penalty
        
        # Calculate final score
        base_score = 100 - total_penalty
        
        # Apply confidence factor
        final_score = max(10, base_score * confidence_factor)
        
        return round(final_score, 1)
    
    # Enhanced helper methods with fixes
    def _extract_strings_from_rule(self, rule_content: str) -> Dict[str, str]:
        """Enhanced string extraction from YARA rules with better regex handling"""
        strings_section = {}
        
        try:
            # More robust regex for string extraction
            strings_match = re.search(r'strings:\s*(.*?)\s*condition:', rule_content, re.DOTALL | re.IGNORECASE)
            if not strings_match:
                return strings_section
            
            strings_text = strings_match.group(1)
            
            # Enhanced string pattern matching
            string_patterns = re.findall(r'(\$\w+)\s*=\s*["\']([^"\']+)["\'](?:\s+(nocase|wide|ascii|fullword))*', strings_text, re.MULTILINE)
            
            for var_name, pattern, modifiers in string_patterns:
                try:
                    # FIXED: Better pattern conversion with proper escaping
                    regex_pattern = pattern
                    
                    # Escape special regex characters that aren't meant to be regex
                    special_chars = ['(', ')', '[', ']', '{', '}', '\\']
                    for char in special_chars:
                        if char in regex_pattern and not regex_pattern.endswith('\\'):
                            regex_pattern = regex_pattern.replace(char, '\\' + char)
                    
                    # Handle wildcards after escaping
                    regex_pattern = regex_pattern.replace('\\*', '.*').replace('\\?', '.')
                    
                    # Apply modifiers
                    if 'nocase' in (modifiers or ''):
                        regex_pattern = f"(?i){regex_pattern}"
                    if 'fullword' in (modifiers or ''):
                        regex_pattern = f"\\b{regex_pattern}\\b"
                    
                    # Test the regex pattern before adding it
                    re.compile(regex_pattern)
                    strings_section[var_name] = regex_pattern
                    
                except re.error as e:
                    logger.warning(f"Skipping invalid regex pattern '{pattern}' from rule: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"Error extracting strings from rule: {e}")
        
        return strings_section
    
    def _extract_condition_from_rule(self, rule_content: str) -> str:
        """Enhanced condition extraction"""
        try:
            condition_match = re.search(r'condition:\s*(.*?)(?:\}|$)', rule_content, re.DOTALL | re.IGNORECASE)
            if condition_match:
                return condition_match.group(1).strip()
        except Exception as e:
            logger.error(f"Error extracting condition: {e}")
        return ""
    
    def _evaluate_enhanced_condition(self, condition: str, string_matches: Dict[str, List]) -> bool:
        """Enhanced condition evaluation with better logic"""
        if not condition:
            return False
        
        try:
            condition = condition.lower().strip()
            
            # Enhanced condition parsing
            if 'any of' in condition:
                if 'them' in condition:
                    return any(len(matches) > 0 for matches in string_matches.values())
                else:
                    # Parse specific variable groups
                    var_pattern = r'any of \(\$(\w+)\*\)'
                    match = re.search(var_pattern, condition)
                    if match:
                        prefix = f"${match.group(1)}"
                        return any(var.startswith(prefix) and len(matches) > 0 
                                 for var, matches in string_matches.items())
            
            elif 'all of' in condition:
                if 'them' in condition:
                    return all(len(matches) > 0 for matches in string_matches.values())
                else:
                    var_pattern = r'all of \(\$(\w+)\*\)'
                    match = re.search(var_pattern, condition)
                    if match:
                        prefix = f"${match.group(1)}"
                        relevant_vars = [var for var in string_matches.keys() if var.startswith(prefix)]
                        return all(len(string_matches[var]) > 0 for var in relevant_vars)
            
            elif ' and ' in condition:
                parts = condition.split(' and ')
                return all(self._evaluate_condition_part(part.strip(), string_matches) for part in parts)
            
            elif ' or ' in condition:
                parts = condition.split(' or ')
                return any(self._evaluate_condition_part(part.strip(), string_matches) for part in parts)
            
            else:
                return self._evaluate_condition_part(condition, string_matches)
        
        except Exception as e:
            logger.error(f"Error evaluating enhanced condition '{condition}': {e}")
            return False
    
    def _evaluate_condition_part(self, part: str, string_matches: Dict[str, List]) -> bool:
        """Enhanced condition part evaluation"""
        part = part.strip()
        
        # Direct variable reference
        if part.startswith('$'):
            return len(string_matches.get(part, [])) > 0
        
        # Numeric conditions
        if re.match(r'\$\w+\s*[><=]+\s*\d+', part):
            var_match = re.match(r'(\$\w+)\s*([><=]+)\s*(\d+)', part)
            if var_match:
                var_name, operator, threshold = var_match.groups()
                count = len(string_matches.get(var_name, []))
                threshold = int(threshold)
                
                if operator == '>':
                    return count > threshold
                elif operator == '>=':
                    return count >= threshold
                elif operator == '<':
                    return count < threshold
                elif operator == '<=':
                    return count <= threshold
                elif operator == '==':
                    return count == threshold
        
        return False
    
    def _severity_to_risk_score(self, severity: str) -> float:
        """Enhanced severity to risk score mapping"""
        severity_scores = {
            'critical': 9.5,
            'high': 7.5,
            'medium': 5.0,
            'low': 2.5
        }
        return severity_scores.get(severity.lower(), 5.0)
    
    def _format_duration(self, duration) -> str:
        """Format scan duration with enhanced precision"""
        if hasattr(duration, 'total_seconds'):
            total_seconds = int(duration.total_seconds())
        else:
            total_seconds = int(duration)
            
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"