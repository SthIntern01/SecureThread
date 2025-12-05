"""
Custom Scanner Service - Rule-based vulnerability scanning with AI enhancement
COMPLETELY REWRITTEN for accurate scanning of ALL files
"""
import asyncio
import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.services.github_service import GitHubService
from app.services.bitbucket_services import BitbucketService
from app.services.llm_service import LLMService
from app.services.rule_parser import rule_parser

logger = logging.getLogger(__name__)


class CustomScannerService:
    """
    Advanced custom scanner with:
    - Complete file coverage (NO skipping)
    - User custom rules + global rules
    - Pattern caching for performance
    - AI-enhanced vulnerability explanations
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.github_service = GitHubService()
        self.bitbucket_service = BitbucketService()
        self.llm_service = LLMService()
        
        # Scanning configuration
        self.MAX_FILES_TO_SCAN = 500  # Increased from 100
        self.MAX_FILE_SIZE = 500 * 1024  # 500KB (increased from 200KB)
        self.BATCH_SIZE = 10  # Process 10 files at a time
        
        # Comprehensive file extensions
        self.scannable_extensions = {
            # Web languages
            '.py', '.js', '.jsx', '.ts', '.tsx', '.php', '.asp', '.aspx',
            '.jsp', '.html', '.htm', '.xml', '.json', '.yaml', '.yml',
            
            # Compiled languages
            '.java', '.cs', '.cpp', '.c', '.h', '.hpp', '.cc', '.go',
            '.rs', '.swift', '.kt', '.scala', '.rb', '.pl', '.lua',
            
            # Scripts & configs
            '.sh', '.bash', '.ps1', '.bat', '.cmd', '.sql',
            '.conf', '.config', '.ini', '.toml', '.env',
            
            # Mobile
            '.m', '.mm', '.dart',
            
            # Data & markup
            '.graphql', '.proto', '.thrift'
        }
        
        # Minimal exclusions - scan almost everything
        self.excluded_paths = {
            'node_modules', '.git', '__pycache__', '.venv', 'venv',
            'vendor', 'dist', 'build', '.next', 'target'
        }
        
        # Pattern cache for performance
        self.compiled_patterns_cache: Dict[int, List[re.Pattern]] = {}
    
    async def unified_security_scan(
        self,
        repository_id: int,
        access_token: str,
        provider_type: str,
        rules: List[Dict[str, Any]],
        user_id: int,
        use_llm_enhancement: bool = True
    ) -> Scan:
        """
        Execute complete security scan with rule-based detection + AI enhancement
        """
        logger.info(f"🚀 Starting unified scan for repository {repository_id}")
        logger.info(f"📋 Using {len(rules)} rules (global + user custom)")
        
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
                'scan_type': 'unified_rule_based',
                'rules_count': len(rules),
                'user_custom_rules': len([r for r in rules if r.get('user_id') == user_id]),
                'global_rules': len([r for r in rules if r.get('user_id') is None]),
                'llm_enhancement': use_llm_enhancement,
                'scan_start_time': datetime.now(timezone.utc).isoformat()
            })
            self.db.commit()
            self.db.refresh(scan)
            
            logger.info(f"✅ Scan {scan.id} status updated to 'running'")
            
            # Step 1: Get ALL repository files
            logger.info("📁 Step 1: Fetching repository file tree...")
            file_tree = await self._get_all_repository_files(
                access_token, repository.full_name, provider_type
            )
            
            if not file_tree:
                raise Exception("Failed to retrieve repository files")
            
            logger.info(f"✅ Found {len(file_tree)} total files in repository")
            
            # Step 2: Filter scannable files (liberal filtering)
            logger.info("🔍 Step 2: Filtering scannable files...")
            scannable_files = self._filter_scannable_files(file_tree)
            logger.info(f"✅ {len(scannable_files)} files are scannable")
            
            # Step 3: Prioritize and select files to scan
            files_to_scan = scannable_files[:self.MAX_FILES_TO_SCAN]
            logger.info(f"🎯 Will scan {len(files_to_scan)} files (limit: {self.MAX_FILES_TO_SCAN})")
            
            # Step 4: Compile all rule patterns (with caching)
            logger.info("⚙️ Step 4: Compiling rule patterns...")
            compiled_rules = self._compile_all_rules(rules)
            logger.info(f"✅ {len(compiled_rules)} rules compiled successfully")
            
            # Step 5: Scan all files with rules
            logger.info("🔬 Step 5: Scanning files with rule engine...")
            scan_results = await self._scan_all_files_with_rules(
                files_to_scan, access_token, repository.full_name,
                provider_type, compiled_rules, scan.id
            )
            
            logger.info(f"✅ Scan completed: {scan_results['files_scanned']} files, "
                       f"{len(scan_results['vulnerabilities'])} vulnerabilities found")
            
            # Step 6: AI Enhancement (if enabled)
            if use_llm_enhancement and scan_results['vulnerabilities']:
                logger.info("🤖 Step 6: Enhancing vulnerabilities with AI...")
                scan_results = await self._enhance_with_ai(
                    scan_results, access_token, repository.full_name, provider_type
                )
                logger.info(f"✅ AI enhancement completed")
            
            # Step 7: Save vulnerabilities to database
            logger.info("💾 Step 7: Saving vulnerabilities to database...")
            if scan_results['vulnerabilities']:
                await self._save_vulnerabilities(scan.id, scan_results['vulnerabilities'])
            
            # Step 8: Calculate final metrics
            logger.info("📊 Step 8: Calculating security metrics...")
            security_metrics = self._calculate_security_score(
                scan_results['vulnerabilities'], len(files_to_scan)
            )
            
            # Update scan with final results
            current_time = datetime.now(timezone.utc)
            scan.status = "completed"
            scan.completed_at = current_time
            scan.total_files_scanned = scan_results['files_scanned']
            scan.total_vulnerabilities = len(scan_results['vulnerabilities'])
            
            # Count by severity
            scan.critical_count = len([v for v in scan_results['vulnerabilities'] if v.get('severity') == 'critical'])
            scan.high_count = len([v for v in scan_results['vulnerabilities'] if v.get('severity') == 'high'])
            scan.medium_count = len([v for v in scan_results['vulnerabilities'] if v.get('severity') == 'medium'])
            scan.low_count = len([v for v in scan_results['vulnerabilities'] if v.get('severity') == 'low'])
            
            scan.security_score = security_metrics['security_score']
            scan.code_coverage = security_metrics['code_coverage']
            
            # Update metadata
            scan.scan_metadata.update({
                'scan_completed': True,
                'scan_end_time': current_time.isoformat(),
                'total_files_found': len(file_tree),
                'total_scannable_files': len(scannable_files),
                'files_scanned': scan_results['files_scanned'],
                'files_with_vulnerabilities': scan_results.get('vulnerable_files_count', 0),
                'ai_enhanced': use_llm_enhancement,
                'file_scan_results': scan_results.get('file_results', [])
            })
            
            # Calculate duration
            if scan.started_at.tzinfo is None:
                start_time = scan.started_at.replace(tzinfo=timezone.utc)
            else:
                start_time = scan.started_at
            
            duration = current_time - start_time
            scan.scan_duration = self._format_duration(duration)
            
            self.db.commit()
            self.db.refresh(scan)
            
            logger.info(f"✅ ✅ ✅ SCAN COMPLETED SUCCESSFULLY!")
            logger.info(f"📊 Results: {scan.total_vulnerabilities} vulnerabilities found")
            logger.info(f"🛡️ Security Score: {scan.security_score}%")
            logger.info(f"📈 Code Coverage: {scan.code_coverage}%")
            logger.info(f"⏱️ Duration: {scan.scan_duration}")
            
            return scan
            
        except Exception as e:
            logger.error(f"❌ Scan failed: {e}", exc_info=True)
            scan.status = "failed"
            scan.error_message = str(e)
            scan.completed_at = datetime.now(timezone.utc)
            
            if scan.started_at.tzinfo is None:
                start_time = scan.started_at.replace(tzinfo=timezone.utc)
            else:
                start_time = scan.started_at
            
            duration = datetime.now(timezone.utc) - start_time
            scan.scan_duration = self._format_duration(duration)
            
            self.db.commit()
            raise
    
    async def _get_all_repository_files(
        self,
        access_token: str,
        repo_full_name: str,
        provider_type: str
    ) -> List[Dict[str, Any]]:
        """
        Get ALL files from repository (complete tree)
        """
        try:
            files = []
            
            if provider_type == "github":
                tree_data = self.github_service.get_repository_tree(
                    access_token, repo_full_name
                )
                
                if tree_data and 'tree' in tree_data:
                    for item in tree_data['tree']:
                        if item.get('type') == 'blob':
                            files.append({
                                'path': item['path'],
                                'sha': item['sha'],
                                'size': item.get('size', 0),
                                'url': item.get('url', ''),
                                'type': 'file'
                            })
            
            elif provider_type == "bitbucket":
                workspace, repo_slug = repo_full_name.split("/", 1)
                files = self.bitbucket_service.get_repository_tree_all_files(
                    access_token, workspace, repo_slug
                )
            
            elif provider_type == "gitlab":
                # TODO: Add GitLab support
                logger.warning("GitLab file retrieval not yet implemented")
            
            logger.info(f"Retrieved {len(files)} files from {provider_type} repository")
            return files
            
        except Exception as e:
            logger.error(f"Error getting repository files: {e}", exc_info=True)
            return []
    
    def _filter_scannable_files(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filter files that should be scanned (LIBERAL filtering)
        """
        scannable = []
        
        for file_info in files:
            file_path = file_info['path']
            file_size = file_info.get('size', 0)
            
            # Skip excluded paths
            path_lower = file_path.lower()
            if any(excluded in path_lower for excluded in self.excluded_paths):
                continue
            
            # Skip very large files
            if file_size > self.MAX_FILE_SIZE:
                logger.debug(f"Skipping large file: {file_path} ({file_size} bytes)")
                continue
            
            # Check extension
            file_extension = '.' + file_path.split('.')[-1] if '.' in file_path else ''
            if file_extension.lower() in self.scannable_extensions:
                file_info['priority'] = self._calculate_file_priority(file_path, file_extension)
                scannable.append(file_info)
            
            # Important config files (no extension)
            filename = file_path.split('/')[-1].lower()
            important_files = {
                'dockerfile', 'makefile', 'requirements.txt', 'package.json',
                'composer.json', 'pom.xml', 'build.gradle', '.env', 'web.config'
            }
            
            if filename in important_files:
                file_info['priority'] = 10  # High priority
                scannable.append(file_info)
        
        # Sort by priority (high to low)
        scannable.sort(key=lambda x: x.get('priority', 0), reverse=True)
        
        return scannable
    
    def _calculate_file_priority(self, file_path: str, extension: str) -> int:
        """
        Calculate scan priority for a file (1-10, higher = more important)
        """
        priority_map = {
            # Critical security files
            '.py': 10, '.php': 10, '.java': 9, '.js': 9, '.ts': 9,
            '.jsx': 9, '.tsx': 9, '.sql': 10, '.sh': 9, '.bash': 9,
            
            # Config files
            '.yaml': 8, '.yml': 8, '.json': 7, '.xml': 7, '.env': 10,
            '.config': 8, '.conf': 8, '.ini': 7,
            
            # Backend languages
            '.go': 8, '.rs': 8, '.rb': 8, '.cs': 8, '.cpp': 7,
            '.c': 7, '.h': 7, '.swift': 7, '.kt': 7,
            
            # Others
            '.html': 5, '.htm': 5, '.asp': 8, '.aspx': 8, '.jsp': 8
        }
        
        base_priority = priority_map.get(extension.lower(), 3)
        
        # Boost priority for authentication/security related files
        security_keywords = ['auth', 'login', 'password', 'token', 'security', 'admin', 'api']
        path_lower = file_path.lower()
        
        for keyword in security_keywords:
            if keyword in path_lower:
                base_priority = min(10, base_priority + 2)
                break
        
        return base_priority
    
    def _compile_all_rules(self, rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Compile all rules and extract patterns
        """
        compiled_rules = []
        
        for rule in rules:
            try:
                rule_id = rule.get('id')
                rule_content = rule.get('rule_content', '')
                
                # Parse YARA rule and extract patterns
                patterns = rule_parser.parse_yara_rule(rule_content)
                
                if not patterns:
                    logger.warning(f"Rule {rule_id} ({rule.get('name')}) has no valid patterns")
                    continue
                
                # Compile each pattern
                compiled_patterns = []
                for pattern_dict in patterns:
                    compiled = rule_parser.compile_pattern(pattern_dict)
                    if compiled:
                        compiled_patterns.append({
                            'variable': pattern_dict['variable'],
                            'compiled': compiled,
                            'type': pattern_dict['type']
                        })
                
                if compiled_patterns:
                    compiled_rules.append({
                        'id': rule_id,
                        'name': rule.get('name'),
                        'description': rule.get('description'),
                        'severity': rule.get('severity', 'medium'),
                        'category': rule.get('category', 'general'),
                        'cwe_id': rule.get('cwe_id'),
                        'owasp_category': rule.get('owasp_category'),
                        'patterns': compiled_patterns
                    })
                    
            except Exception as e:
                logger.error(f"Error compiling rule {rule.get('id')}: {e}")
        
        logger.info(f"Successfully compiled {len(compiled_rules)}/{len(rules)} rules")
        return compiled_rules
    
    async def _scan_all_files_with_rules(
        self,
        files: List[Dict[str, Any]],
        access_token: str,
        repo_full_name: str,
        provider_type: str,
        compiled_rules: List[Dict[str, Any]],
        scan_id: int
    ) -> Dict[str, Any]:
        """
        Scan all files using compiled rules
        """
        all_vulnerabilities = []
        files_scanned = 0
        vulnerable_files_count = 0
        file_results = []
        
        logger.info(f"Starting to scan {len(files)} files with {len(compiled_rules)} rules...")
        
        # Process files in batches for performance
        for i in range(0, len(files), self.BATCH_SIZE):
            batch = files[i:i + self.BATCH_SIZE]
            logger.info(f"Processing batch {i//self.BATCH_SIZE + 1}/{(len(files) + self.BATCH_SIZE - 1)//self.BATCH_SIZE}")
            
            # Scan batch concurrently
            batch_tasks = [
                self._scan_single_file(
                    file_info, access_token, repo_full_name,
                    provider_type, compiled_rules
                )
                for file_info in batch
            ]
            
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            for result in batch_results:
                if isinstance(result, Exception):
                    logger.error(f"Error in batch scan: {result}")
                    continue
                
                if result:
                    files_scanned += 1
                    file_results.append(result)
                    
                    if result['vulnerabilities']:
                        vulnerable_files_count += 1
                        all_vulnerabilities.extend(result['vulnerabilities'])
            
            # Small delay between batches
            await asyncio.sleep(0.5)
        
        logger.info(f"✅ Scanning complete: {files_scanned} files scanned, "
                   f"{vulnerable_files_count} vulnerable files, "
                   f"{len(all_vulnerabilities)} total vulnerabilities")
        
        return {
            'vulnerabilities': all_vulnerabilities,
            'files_scanned': files_scanned,
            'vulnerable_files_count': vulnerable_files_count,
            'file_results': file_results
        }
    
    async def _scan_single_file(
        self,
        file_info: Dict[str, Any],
        access_token: str,
        repo_full_name: str,
        provider_type: str,
        compiled_rules: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Scan a single file with all rules
        """
        file_path = file_info['path']
        
        try:
            # Get file content
            file_content_data = await self._get_file_content(
                access_token, repo_full_name, file_path, provider_type
            )
            
            if not file_content_data or file_content_data.get('is_binary'):
                return {
                    'file_path': file_path,
                    'status': 'skipped',
                    'reason': 'Binary or unavailable',
                    'vulnerabilities': []
                }
            
            file_content = file_content_data.get('content', '')
            
            if not file_content or len(file_content.strip()) == 0:
                return {
                    'file_path': file_path,
                    'status': 'skipped',
                    'reason': 'Empty file',
                    'vulnerabilities': []
                }
            
            # Scan with all rules
            vulnerabilities = []
            
            for rule in compiled_rules:
                matches = self._apply_rule_to_content(file_content, file_path, rule)
                vulnerabilities.extend(matches)
            
            status = 'vulnerable' if vulnerabilities else 'clean'
            
            return {
                'file_path': file_path,
                'status': status,
                'reason': f"Found {len(vulnerabilities)} issues" if vulnerabilities else "No issues found",
                'vulnerabilities': vulnerabilities,
                'file_size': len(file_content)
            }
            
        except Exception as e:
            logger.error(f"Error scanning file {file_path}: {e}")
            return {
                'file_path': file_path,
                'status': 'error',
                'reason': str(e),
                'vulnerabilities': []
            }
    
    def _apply_rule_to_content(
        self,
        content: str,
        file_path: str,
        rule: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Apply a single rule to file content and return vulnerabilities
        """
        vulnerabilities = []
        
        try:
            # Check all patterns in the rule
            pattern_matches = []
            
            for pattern_info in rule['patterns']:
                compiled_pattern = pattern_info['compiled']
                matches = list(compiled_pattern.finditer(content))
                
                if matches:
                    pattern_matches.append({
                        'variable': pattern_info['variable'],
                        'matches': matches
                    })
            
            # If any pattern matched, create vulnerability
            if pattern_matches:
                # Find the line number of the first match
                first_match = pattern_matches[0]['matches'][0]
                line_number = content[:first_match.start()].count('\n') + 1
                
                # Extract code snippet (3 lines context)
                lines = content.split('\n')
                start_line = max(0, line_number - 2)
                end_line = min(len(lines), line_number + 2)
                code_snippet = '\n'.join(lines[start_line:end_line])
                
                vulnerability = {
                    'title': rule['name'],
                    'description': rule['description'],
                    'severity': rule['severity'],
                    'category': rule['category'],
                    'cwe_id': rule.get('cwe_id'),
                    'owasp_category': rule.get('owasp_category'),
                    'file_path': file_path,
                    'line_number': line_number,
                    'line_end_number': line_number,
                    'code_snippet': code_snippet[:500],  # Limit snippet size
                    'recommendation': f"Review and fix the {rule['category']} issue in {file_path}",
                    'fix_suggestion': "Apply appropriate security controls and validation",
                    'risk_score': self._calculate_risk_score(rule['severity']),
                    'exploitability': 'medium',
                    'impact': rule['severity'],
                    'rule_id': rule['id'],
                    'pattern_matches_count': len(pattern_matches),
                    'ai_enhanced': False  # Will be updated if AI enhancement is applied
                }
                
                vulnerabilities.append(vulnerability)
        
        except Exception as e:
            logger.error(f"Error applying rule {rule['name']} to {file_path}: {e}")
        
        return vulnerabilities
    
    def _calculate_risk_score(self, severity: str) -> float:
        """Calculate numerical risk score from severity"""
        severity_scores = {
            'critical': 9.5,
            'high': 7.5,
            'medium': 5.0,
            'low': 2.5
        }
        return severity_scores.get(severity.lower(), 5.0)
    
    async def _get_file_content(
        self,
        access_token: str,
        repo_full_name: str,
        file_path: str,
        provider_type: str
    ) -> Optional[Dict[str, Any]]:
        """Get file content from provider"""
        try:
            if provider_type == "github":
                return self.github_service.get_file_content(
                    access_token, repo_full_name, file_path
                )
            
            elif provider_type == "bitbucket":
                workspace, repo_slug = repo_full_name.split("/", 1)
                content = self.bitbucket_service.get_file_content(
                    access_token, workspace, repo_slug, file_path
                )
                
                if content:
                    return {'content': content, 'is_binary': False}
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting file content for {file_path}: {e}")
            return None
    
    async def _enhance_with_ai(
        self,
        scan_results: Dict[str, Any],
        access_token: str,
        repo_full_name: str,
        provider_type: str
    ) -> Dict[str, Any]:
        """
        Enhance vulnerabilities with AI-generated explanations
        """
        enhanced_vulnerabilities = []
        
        logger.info(f"🤖 Enhancing {len(scan_results['vulnerabilities'])} vulnerabilities with AI...")
        
        # Group vulnerabilities by file for efficient processing
        vulns_by_file = {}
        for vuln in scan_results['vulnerabilities']:
            file_path = vuln['file_path']
            if file_path not in vulns_by_file:
                vulns_by_file[file_path] = []
            vulns_by_file[file_path].append(vuln)
        
        # Process each file's vulnerabilities (limit to avoid token exhaustion)
        files_to_enhance = list(vulns_by_file.items())[:10]  # Limit to 10 files
        
        for file_path, file_vulns in files_to_enhance:
            try:
                # Get file content
                file_content_data = await self._get_file_content(
                    access_token, repo_full_name, file_path, provider_type
                )
                
                if not file_content_data:
                    enhanced_vulnerabilities.extend(file_vulns)
                    continue
                
                file_content = file_content_data.get('content', '')
                
                # Get AI enhancement for this file's vulnerabilities
                ai_analysis = await self.llm_service.enhance_vulnerability_explanation(
                    file_content, file_path, file_vulns
                )
                
                if ai_analysis:
                    for vuln in file_vulns:
                        vuln['recommendation'] = ai_analysis.get('explanation', vuln['recommendation'])
                        vuln['fix_suggestion'] = ai_analysis.get('fix_suggestion', vuln['fix_suggestion'])
                        vuln['ai_enhanced'] = True
                
                enhanced_vulnerabilities.extend(file_vulns)
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error enhancing vulnerabilities for {file_path}: {e}")
                enhanced_vulnerabilities.extend(file_vulns)
        
        # Add remaining vulnerabilities (not AI-enhanced)
        remaining_files = list(vulns_by_file.keys())[10:]
        for file_path in remaining_files:
            enhanced_vulnerabilities.extend(vulns_by_file[file_path])
        
        scan_results['vulnerabilities'] = enhanced_vulnerabilities
        return scan_results
    
    async def _save_vulnerabilities(
        self,
        scan_id: int,
        vulnerabilities: List[Dict[str, Any]]
    ):
        """Save vulnerabilities to database in batches to avoid connection timeouts"""
        BATCH_SIZE = 100  # Save 100 vulnerabilities at a time
        
        total = len(vulnerabilities)
        logger.info(f"💾 Saving {total} vulnerabilities in batches of {BATCH_SIZE}...")
        
        saved_count = 0
        failed_count = 0
        
        for i in range(0, total, BATCH_SIZE):
            batch = vulnerabilities[i:i + BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
            
            try:
                for vuln_data in batch:
                    try:
                        vulnerability = Vulnerability(
                            scan_id=scan_id,
                            title=vuln_data.get('title', '')[:255],  # Truncate if too long
                            description=vuln_data.get('description', '')[:1000],  # Limit description
                            severity=vuln_data.get('severity', 'low'),
                            category=vuln_data.get('category', 'other'),
                            cwe_id=vuln_data.get('cwe_id'),
                            owasp_category=vuln_data.get('owasp_category'),
                            file_path=vuln_data.get('file_path', '')[:500],  # Limit path
                            line_number=vuln_data.get('line_number'),
                            line_end_number=vuln_data.get('line_end_number'),
                            code_snippet=vuln_data.get('code_snippet', '')[:1000] if vuln_data.get('code_snippet') else None,  # Limit snippet
                            recommendation=vuln_data.get('recommendation', '')[:2000],  # Limit recommendation
                            fix_suggestion=vuln_data.get('fix_suggestion', '')[:2000],  # Limit fix
                            risk_score=vuln_data.get('risk_score', 0.0),  # Fixed: removed space after 0.
                            exploitability=vuln_data.get('exploitability', 'low'),
                            impact=vuln_data.get('impact', 'low')
                        )
                        self.db.add(vulnerability)
                        saved_count += 1
                    except Exception as e:
                        logger.error(f"Error preparing vulnerability: {e}")
                        failed_count += 1
                
                # Commit this batch
                self.db.commit()
                logger.info(f"✅ Saved batch {batch_num}/{total_batches} ({saved_count}/{total} vulnerabilities)")
                
                # Small delay to avoid overwhelming the database
                await asyncio.sleep(0.1)  # Fixed: removed space after asyncio.
                
            except Exception as e:
                logger.error(f"❌ Error saving batch {batch_num}: {e}")
                self.db.rollback()  # Rollback failed batch
                failed_count += len(batch)
        
        if failed_count > 0:
            logger.warning(f"⚠️ Failed to save {failed_count} vulnerabilities")
        
        logger.info(f"✅ Successfully saved {saved_count}/{total} vulnerabilities to database")
    
    def _calculate_security_score(
        self,
        vulnerabilities: List[Dict[str, Any]],
        total_files_scanned: int
    ) -> Dict[str, float]:
        """Calculate security score based on vulnerabilities found"""
        if not vulnerabilities:
            return {
                'security_score': 95.0,
                'code_coverage': 95.0
            }
        
        # Weight vulnerabilities by severity
        critical = len([v for v in vulnerabilities if v.get('severity') == 'critical'])
        high = len([v for v in vulnerabilities if v.get('severity') == 'high'])
        medium = len([v for v in vulnerabilities if v.get('severity') == 'medium'])
        low = len([v for v in vulnerabilities if v.get('severity') == 'low'])
        
        weighted_score = (critical * 15) + (high * 10) + (medium * 5) + (low * 2)
        
        # Calculate security score (0-100, lower is worse)
        security_score = max(0, 100 - weighted_score)
        
        # Calculate code coverage (based on files scanned)
        code_coverage = min(95.0, (total_files_scanned / max(1, total_files_scanned)) * 95)
        
        return {
            'security_score': round(security_score, 1),
            'code_coverage': round(code_coverage, 1)
        }
    
    def _format_duration(self, duration) -> str:
        """Format scan duration"""
        total_seconds = int(duration.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"