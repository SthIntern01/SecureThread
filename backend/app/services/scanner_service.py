import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.services.github_service import GitHubService
from app.services.llm_service import LLMService
import time

logger = logging.getLogger(__name__)


class ScannerService:
    def __init__(self, db: Session):
        self.db = db
        self.github_service = GitHubService()
        self.llm_service = LLMService()
        
        # Configuration - MUCH smaller limits for testing
        self.MAX_FILES_TO_SCAN = 10          # Only scan 10 files max
        self.MAX_VULNERABLE_FILES = 5        # Stop after 5 vulnerable files
        self.MAX_FILE_SIZE = 50 * 1024       # 50KB max file size (vs 1MB before)
        self.MAX_TOTAL_TOKENS = 50000        # Stay well under 65.5K limit
        self.BATCH_SIZE = 1                  # Process one file at a time to avoid overload
        
        # File extensions to scan (prioritize common vulnerable files)
        self.scannable_extensions = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.php', 
            '.java', '.sql', '.sh', '.yaml', '.yml'
        }
        
        # Paths to exclude from scanning
        self.excluded_paths = {
            'node_modules', '.git', '__pycache__', '.venv', 'venv',
            'vendor', 'dist', 'build', '.next', 'target', 'bin',
            'obj', '.vs', '.idea', 'coverage', '.nyc_output', 'test',
            'tests', '__tests__', 'spec', 'docs', 'documentation'
        }
    
    def _get_utc_now(self) -> datetime:
        """Get current UTC datetime - consistent timezone handling"""
        return datetime.now(timezone.utc)
    
    async def start_repository_scan(
        self, 
        repository_id: int, 
        access_token: str,  # Generic access token
        provider_type: str,  # "github", "bitbucket", "gitlab"
        scan_config: Optional[Dict[str, Any]] = None
    ) -> Scan:
        """
        Start a limited security scan of a repository - MULTI-PROVIDER SUPPORT
        """
        logger.info(f"Starting {provider_type} repository scan for repository {repository_id}")
        
        # Initialize variables early to prevent scope errors
        scan_results = {
            "vulnerabilities": [],
            "files_scanned": 0,
            "files_skipped": 0,
            "vulnerable_files_count": 0,
            "stop_reason": "initialization_failed",
            "file_results": [],
            "estimated_tokens_used": 0
        }
        scannable_files = []
        
        # Get repository
        repository = self.db.query(Repository).filter(Repository.id == repository_id).first()
        if not repository:
            raise ValueError(f"Repository {repository_id} not found")
        
        # Verify provider type matches repository
        if repository.source_type != provider_type:
            raise ValueError(f"Repository source type '{repository.source_type}' doesn't match provider '{provider_type}'")
        
        # Check for existing running scan - FIXED: Only check for truly active scans
        existing_scan = self.db.query(Scan).filter(
            Scan.repository_id == repository_id,
            Scan.status.in_(["running"])  # ONLY "running", not "pending"
        ).first()
        
        if existing_scan:
            logger.warning(f"Scan already running for repository {repository_id} (scan {existing_scan.id})")
            raise ValueError("A scan is already running for this repository")
        
        # Find the pending scan that was created by the API
        pending_scan = self.db.query(Scan).filter(
            Scan.repository_id == repository_id,
            Scan.status == "pending"
        ).order_by(Scan.started_at.desc()).first()
        
        if not pending_scan:
            logger.error(f"No pending scan found for repository {repository_id}")
            raise ValueError("No pending scan found to execute")
        
        scan = pending_scan
        logger.info(f"Found pending scan {scan.id}, starting execution...")
        
        try:
            # Update scan status to running
            scan.status = "running"
            scan.scan_metadata = {
                "scan_started": True,
                "provider_type": provider_type,
                "max_files": self.MAX_FILES_TO_SCAN,
                "max_vulnerabilities": self.MAX_VULNERABLE_FILES,
                "scan_start_time": self._get_utc_now().isoformat()
            }
            self.db.commit()
            self.db.refresh(scan)
            
            logger.info(f"Scan {scan.id} status updated to 'running'")
            
            # Get repository file tree - MULTI-PROVIDER
            logger.info(f"Fetching repository files for {repository.full_name}")
            file_tree = await self._get_repository_files(
                access_token, 
                repository.full_name,
                provider_type
            )
            
            if not file_tree:
                raise Exception("Failed to retrieve repository files")
            
            logger.info(f"Found {len(file_tree)} total files in repository")
            
            # Filter and prioritize scannable files
            scannable_files = self._filter_and_prioritize_files(file_tree)
            logger.info(f"Filtered to {len(scannable_files)} scannable files")
            
            # Limit files for scanning - take only the most important ones
            files_to_scan = scannable_files[:self.MAX_FILES_TO_SCAN]
            logger.info(f"Limited to {len(files_to_scan)} files for actual scanning")
            
            # Update scan with initial info
            scan.total_files_scanned = len(files_to_scan)
            scan.scan_metadata.update({
                "total_scannable_files": len(scannable_files),
                "files_to_scan": len(files_to_scan),
                "scan_limited": True,
                "limit_reason": "Token/context limits",
                "files_list": [f["path"] for f in files_to_scan[:5]]  # Store first 5 file paths
            })
            self.db.commit()
            
            logger.info(f"Starting file analysis...")
            
            # Scan files with strict limits - MULTI-PROVIDER
            scan_results = await self._scan_files_with_strict_limits(
                files_to_scan, access_token, repository.full_name, provider_type, scan.id
            )
            
            logger.info(f"Scan results: {scan_results['files_scanned']} scanned, {scan_results['vulnerable_files_count']} vulnerable")
            
            # Calculate security metrics
            security_metrics = await self._calculate_security_metrics(
                scan_results["vulnerabilities"], repository.full_name, scan_results
            )

            # Update scan with final results - FIXED: Use consistent datetime
            current_time = self._get_utc_now()
            scan.status = "completed"
            scan.completed_at = current_time
            scan.total_vulnerabilities = len(scan_results["vulnerabilities"])
            scan.critical_count = len([v for v in scan_results["vulnerabilities"] if v.get('severity') == 'critical'])
            scan.high_count = len([v for v in scan_results["vulnerabilities"] if v.get('severity') == 'high'])
            scan.medium_count = len([v for v in scan_results["vulnerabilities"] if v.get('severity') == 'medium'])
            scan.low_count = len([v for v in scan_results["vulnerabilities"] if v.get('severity') == 'low'])
            scan.security_score = security_metrics.get('security_score', 0.0)
            scan.code_coverage = security_metrics.get('code_coverage', 0.0)
            
            # CRITICAL: Ensure scan_metadata is initialized properly
            if scan.scan_metadata is None:
                scan.scan_metadata = {}
            
            # Update scan metadata with detailed results
            scan.scan_metadata.update({
                "files_scanned": scan_results["files_scanned"],
                "files_skipped": scan_results["files_skipped"],
                "vulnerable_files_found": scan_results["vulnerable_files_count"],
                "scan_stopped_reason": scan_results["stop_reason"],
                "file_scan_results": scan_results["file_results"],  # CRITICAL: This must be saved
                "scan_completed": True,
                "scan_end_time": current_time.isoformat(),
                "total_scannable_files": len(scannable_files)
            })
            
            # Calculate scan duration - FIXED: Handle timezone-aware datetimes
            if scan.started_at.tzinfo is None:
                start_time = scan.started_at.replace(tzinfo=timezone.utc)
            else:
                start_time = scan.started_at
            
            duration = current_time - start_time
            scan.scan_duration = self._format_duration(duration)
            
            self.db.commit()
            self.db.refresh(scan)
            
            logger.info(f"Completed scan {scan.id} with {len(scan_results['vulnerabilities'])} vulnerabilities")
            logger.info(f"Security Score: {scan.security_score}, Coverage: {scan.code_coverage}%")
            logger.info(f"Scan duration: {scan.scan_duration}")
            
            return scan
            
        except Exception as e:
            # Update scan with error - FIXED: Use consistent datetime
            logger.error(f"Scan {scan.id} failed: {e}")
            current_time = self._get_utc_now()
            scan.status = "failed"
            scan.completed_at = current_time
            scan.error_message = str(e)
            
            # Initialize scan_metadata if it doesn't exist
            if scan.scan_metadata is None:
                scan.scan_metadata = {}
            
            scan.scan_metadata.update({
                "error": str(e), 
                "scan_failed": True,
                "scan_end_time": current_time.isoformat(),
                "files_scanned": scan_results.get("files_scanned", 0),
                "files_skipped": scan_results.get("files_skipped", 0),
                "total_scannable_files": len(scannable_files),
                "failure_stage": "scan_execution"
            })
            
            # Calculate duration even for failed scans
            if scan.started_at.tzinfo is None:
                start_time = scan.started_at.replace(tzinfo=timezone.utc)
            else:
                start_time = scan.started_at
                
            duration = current_time - start_time
            scan.scan_duration = self._format_duration(duration)
            
            self.db.commit()
            
            raise e
    
    def _filter_and_prioritize_files(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filter files and prioritize them by potential security impact
        """
        scannable_files = []
        
        # Priority order for file types (most likely to have vulnerabilities first)
        priority_extensions = ['.py', '.js', '.php', '.sql', '.sh', '.ts', '.jsx', '.tsx', '.java']
        
        for file_info in files:
            file_path = file_info['path']
            
            # Skip if path contains excluded directories
            if any(excluded in file_path.lower() for excluded in self.excluded_paths):
                continue
            
            # Skip very large files
            if file_info.get('size', 0) > self.MAX_FILE_SIZE:
                continue
            
            # Check file extension
            file_extension = '.' + file_path.split('.')[-1] if '.' in file_path else ''
            if file_extension.lower() in self.scannable_extensions:
                # Add priority score
                priority = 0
                if file_extension.lower() in priority_extensions:
                    priority = priority_extensions.index(file_extension.lower())
                else:
                    priority = len(priority_extensions)
                
                file_info['priority'] = priority
                scannable_files.append(file_info)
            
            # Also include special files
            filename = file_path.split('/')[-1].lower()
            if filename in ['dockerfile', 'makefile', 'requirements.txt', 'package.json']:
                file_info['priority'] = 1  # High priority
                scannable_files.append(file_info)
        
        # Sort by priority (lower number = higher priority)
        scannable_files.sort(key=lambda x: x.get('priority', 999))
        
        return scannable_files
    
    async def _scan_files_with_strict_limits(
        self, 
        files: List[Dict[str, Any]], 
        access_token: str, 
        repo_full_name: str,
        provider_type: str,  # NEW: Provider type
        scan_id: int
    ) -> Dict[str, Any]:
        """
        Scan files with strict token and count limits - MULTI-PROVIDER
        """
        all_vulnerabilities = []
        files_scanned = 0
        files_skipped = 0
        vulnerable_files_count = 0
        stop_reason = "completed"
        estimated_tokens_used = 0
        
        # Track file scan results for detailed reporting
        file_scan_results = []
        
        logger.info(f"Starting to scan {len(files)} files...")
        
        for i, file_info in enumerate(files):
            # Check multiple stop conditions
            if vulnerable_files_count >= self.MAX_VULNERABLE_FILES:
                stop_reason = "vulnerability_limit_reached"
                logger.info(f"Stopping: reached {self.MAX_VULNERABLE_FILES} vulnerable files")
                break
            
            if estimated_tokens_used >= self.MAX_TOTAL_TOKENS:
                stop_reason = "token_limit_reached"
                logger.info(f"Stopping: reached {self.MAX_TOTAL_TOKENS} token limit")
                break
            
            if files_scanned >= self.MAX_FILES_TO_SCAN:
                stop_reason = "file_count_limit_reached"
                logger.info(f"Stopping: reached {self.MAX_FILES_TO_SCAN} file limit")
                break
            
            # Scan single file - MULTI-PROVIDER
            logger.info(f"Scanning file {i+1}/{len(files)}: {file_info['path']}")
            file_result = await self._scan_single_file_with_tracking(
                file_info, access_token, repo_full_name, provider_type
            )
            
            files_scanned += 1
            file_scan_results.append(file_result)
            
            # Estimate token usage (rough estimate)
            if file_result.get("file_size"):
                estimated_tokens_used += file_result["file_size"] // 4  # Rough token estimate
            
            if file_result["vulnerabilities"]:
                vulnerable_files_count += 1
                all_vulnerabilities.extend(file_result["vulnerabilities"])
                logger.info(f"Found {len(file_result['vulnerabilities'])} vulnerabilities in {file_result['file_path']}")
            else:
                logger.info(f"No vulnerabilities found in {file_result['file_path']}")
            
            # Small delay to prevent overwhelming the API
            await asyncio.sleep(1)  # Reduced from 2 seconds
        
        # Mark remaining files as skipped
        for j in range(files_scanned, len(files)):
            file_scan_results.append({
                "file_path": files[j]["path"],
                "status": "skipped",
                "reason": f"Scan stopped: {stop_reason}",
                "vulnerabilities": [],
                "file_size": files[j].get("size", 0)
            })
            files_skipped += 1
        
        # Save vulnerabilities to database
        if all_vulnerabilities:
            logger.info(f"Saving {len(all_vulnerabilities)} vulnerabilities to database")
            await self._save_vulnerabilities(scan_id, all_vulnerabilities)
        
        logger.info(f"Scan completed: {files_scanned} scanned, {files_skipped} skipped, {vulnerable_files_count} vulnerable files")
        
        return {
            "vulnerabilities": all_vulnerabilities,
            "files_scanned": files_scanned,
            "files_skipped": files_skipped,
            "vulnerable_files_count": vulnerable_files_count,
            "stop_reason": stop_reason,
            "file_results": file_scan_results,
            "estimated_tokens_used": estimated_tokens_used
        }
    
    async def _scan_single_file_with_tracking(
        self, 
        file_info: Dict[str, Any], 
        access_token: str, 
        repo_full_name: str,
        provider_type: str  # NEW: Provider type
    ) -> Dict[str, Any]:
        """
        Scan a single file and return detailed results with status tracking - MULTI-PROVIDER
        """
        file_path = file_info['path']
        
        try:
            logger.info(f"Starting scan of file: {file_path}")
            
            # Get file content - MULTI-PROVIDER
            file_content_data = await self._get_file_content(
                access_token, repo_full_name, file_path, provider_type
            )
            
            if not file_content_data or file_content_data.get('is_binary'):
                result = {
                    "file_path": file_path,
                    "status": "skipped",
                    "reason": "Binary file or content not available",
                    "vulnerabilities": [],
                    "file_size": file_info.get('size', 0)
                }
                logger.info(f"Skipped {file_path}: Binary or unavailable")
                return result
            
            file_content = file_content_data.get('content', '')
            if not file_content:
                result = {
                    "file_path": file_path,
                    "status": "skipped",
                    "reason": "Empty file",
                    "vulnerabilities": [],
                    "file_size": file_info.get('size', 0)
                }
                logger.info(f"Skipped {file_path}: Empty file")
                return result
            
            # Check if file content is too large for LLM
            if len(file_content) > 20000:  # Limit to ~20K characters
                result = {
                    "file_path": file_path,
                    "status": "skipped",
                    "reason": "File too large for analysis",
                    "vulnerabilities": [],
                    "file_size": len(file_content)
                }
                logger.info(f"Skipped {file_path}: Too large ({len(file_content)} chars)")
                return result
            
            # Determine file extension
            file_extension = '.' + file_path.split('.')[-1] if '.' in file_path else ''
            
            # Analyze with LLM
            logger.info(f"Analyzing {file_path} with LLM...")
            vulnerabilities = await self.llm_service.analyze_code_for_vulnerabilities(
                file_content, file_path, file_extension
            )
            
            # Determine final status and reason
            if vulnerabilities and len(vulnerabilities) > 0:
                status = "vulnerable"
                reason = f"Found {len(vulnerabilities)} vulnerabilities"
                logger.info(f"{file_path}: Found {len(vulnerabilities)} vulnerabilities!")
            else:
                status = "scanned"
                reason = "No vulnerabilities found"
                logger.info(f"{file_path}: Clean scan, no vulnerabilities")
            
            result = {
                "file_path": file_path,
                "status": status,
                "reason": reason,
                "vulnerabilities": vulnerabilities,
                "file_size": len(file_content)
            }
            
            logger.info(f"Completed scan of {file_path}: {status} with {len(vulnerabilities)} vulns")
            return result
            
        except Exception as e:
            logger.error(f"Error scanning file {file_path}: {e}")
            result = {
                "file_path": file_path,
                "status": "error",
                "reason": f"Scan error: {str(e)}",
                "vulnerabilities": [],
                "file_size": file_info.get('size', 0)
            }
            return result
    
    async def _get_repository_files(
        self, 
        access_token: str, 
        repo_full_name: str,
        provider_type: str  # NEW: Provider type
    ) -> List[Dict[str, Any]]:
        """
        Get all files in the repository using appropriate service - MULTI-PROVIDER
        """
        try:
            if provider_type == "github":
                # Get repository tree recursively
                tree_data = self.github_service.get_repository_tree(
                    access_token, repo_full_name
                )
                
                if not tree_data or 'tree' not in tree_data:
                    return []
                
                files = []
                for item in tree_data['tree']:
                    if item.get('type') == 'blob':  # It's a file
                        files.append({
                            'path': item['path'],
                            'sha': item['sha'],
                            'size': item.get('size', 0)
                        })
                
                return files
                
            elif provider_type == "bitbucket":
                from app.services.bitbucket_services import BitbucketService
                bitbucket_service = BitbucketService()
                
                # Extract workspace and repo_slug from full_name
                workspace, repo_slug = repo_full_name.split("/", 1)
                
                # Get repository tree - use the NEW method
                tree_data = bitbucket_service.get_repository_tree_all_files(
                    access_token, workspace, repo_slug
                )
                
                if not tree_data:
                    return []
                
                return tree_data  # Already in the right format
                
            else:
                logger.error(f"Unsupported provider type: {provider_type}")
                return []
            
        except Exception as e:
            logger.error(f"Error getting repository files: {e}")
            return []
    
    async def _get_file_content(
        self,
        access_token: str,
        repo_full_name: str,
        file_path: str,
        provider_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get file content using appropriate service - MULTI-PROVIDER
        """
        try:
            if provider_type == "github":
                return self.github_service.get_file_content(
                    access_token, repo_full_name, file_path
                )
                
            elif provider_type == "bitbucket":
                from app.services.bitbucket_services import BitbucketService
                bitbucket_service = BitbucketService()
                
                # Extract workspace and repo_slug from full_name
                workspace, repo_slug = repo_full_name.split("/", 1)
                
                # Get file content
                content = bitbucket_service.get_file_content(
                    access_token, workspace, repo_slug, file_path
                )
                
                if content:
                    return {
                        'content': content,
                        'is_binary': False
                    }
                else:
                    return None
            
            else:
                logger.error(f"Unsupported provider type: {provider_type}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting file content: {e}")
            return None
    
    async def _save_vulnerabilities(
        self, 
        scan_id: int, 
        vulnerabilities: List[Dict[str, Any]]
    ):
        """
        Save vulnerabilities to database
        """
        for vuln_data in vulnerabilities:
            try:
                vulnerability = Vulnerability(
                    scan_id=scan_id,
                    title=vuln_data.get('title', ''),
                    description=vuln_data.get('description', ''),
                    severity=vuln_data.get('severity', 'low'),
                    category=vuln_data.get('category', 'other'),
                    cwe_id=vuln_data.get('cwe_id'),
                    owasp_category=vuln_data.get('owasp_category'),
                    file_path=vuln_data.get('file_path', ''),
                    line_number=vuln_data.get('line_number'),
                    line_end_number=vuln_data.get('line_end_number'),
                    code_snippet=vuln_data.get('code_snippet'),
                    recommendation=vuln_data.get('recommendation', ''),
                    fix_suggestion=vuln_data.get('fix_suggestion', ''),
                    risk_score=vuln_data.get('risk_score', 0.0),
                    exploitability=vuln_data.get('exploitability', 'low'),
                    impact=vuln_data.get('impact', 'low')
                )
                self.db.add(vulnerability)
            except Exception as e:
                logger.error(f"Error saving vulnerability: {e}")
        
        self.db.commit()
        logger.info(f"Successfully saved {len(vulnerabilities)} vulnerabilities")
    
    async def _calculate_security_metrics(
        self, 
        vulnerabilities: List[Dict[str, Any]], 
        repo_name: str,
        scan_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate security score and other metrics
        """
        if not vulnerabilities:
            return {
                'security_score': 85.0,  # Good score for no vulnerabilities in scanned files
                'code_coverage': min(80.0, (scan_results["files_scanned"] / max(1, scan_results["files_scanned"] + scan_results["files_skipped"])) * 100)
            }
        
        # Calculate base security score
        total_vulns = len(vulnerabilities)
        critical_count = len([v for v in vulnerabilities if v.get('severity') == 'critical'])
        high_count = len([v for v in vulnerabilities if v.get('severity') == 'high'])
        medium_count = len([v for v in vulnerabilities if v.get('severity') == 'medium'])
        low_count = len([v for v in vulnerabilities if v.get('severity') == 'low'])
        
        # Weight vulnerabilities by severity
        weighted_score = (
            critical_count * 10 +
            high_count * 7 +
            medium_count * 4 +
            low_count * 1
        )
        
        # Calculate security score (0-100, where 100 is perfect)
        base_penalty = min(weighted_score * 3, 75)  # Cap penalty at 75 points
        security_score = max(15, 100 - base_penalty)  # Minimum score of 15
        
        # Calculate code coverage based on actual scanning
        coverage_ratio = scan_results["files_scanned"] / max(1, scan_results["files_scanned"] + scan_results["files_skipped"])
        code_coverage = min(80.0, coverage_ratio * 100)
        
        return {
            'security_score': round(security_score, 1),
            'code_coverage': round(code_coverage, 1)
        }
    
    def _format_duration(self, duration: timedelta) -> str:
        """
        Format scan duration as human readable string
        """
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
    
    def get_scan_status(self, scan_id: int) -> Optional[Scan]:
        """
        Get current status of a scan
        """
        return self.db.query(Scan).filter(Scan.id == scan_id).first()
    
    def get_repository_scans(self, repository_id: int) -> List[Scan]:
        """
        Get all scans for a repository
        """
        return self.db.query(Scan).filter(
            Scan.repository_id == repository_id
        ).order_by(Scan.started_at.desc()).all()
    
    def get_scan_vulnerabilities(self, scan_id: int) -> List[Vulnerability]:
        """
        Get all vulnerabilities for a scan
        """
        return self.db.query(Vulnerability).filter(
            Vulnerability.scan_id == scan_id
        ).order_by(
            Vulnerability.severity.desc(),
            Vulnerability.risk_score.desc()
        ).all()
    
    def get_file_scan_results(self, scan_id: int) -> List[Dict[str, Any]]:
        """
        Get detailed file scan results for a scan
        """
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if scan and scan.scan_metadata and "file_scan_results" in scan.scan_metadata:
            return scan.scan_metadata["file_scan_results"]
        return []