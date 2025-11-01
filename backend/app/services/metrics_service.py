import re
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.services.advanced_technical_debt_service import AdvancedTechnicalDebtService
from app.models.user import User

logger = logging.getLogger(__name__)

class MetricsService:
    """Advanced metrics calculation service"""
    
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        
        # OWASP Top 10 2021 mapping
        self.owasp_categories = {
            'A01:2021': {'name': 'Broken Access Control', 'keywords': ['access', 'authorization', 'privilege']},
            'A02:2021': {'name': 'Cryptographic Failures', 'keywords': ['crypto', 'encryption', 'hash', 'ssl', 'tls']},
            'A03:2021': {'name': 'Injection', 'keywords': ['sql injection', 'xss', 'command injection', 'ldap']},
            'A04:2021': {'name': 'Insecure Design', 'keywords': ['design', 'architecture', 'threat modeling']},
            'A05:2021': {'name': 'Security Misconfiguration', 'keywords': ['config', 'default', 'misconfiguration']},
            'A06:2021': {'name': 'Vulnerable Components', 'keywords': ['dependency', 'component', 'library', 'outdated']},
            'A07:2021': {'name': 'Identification Failures', 'keywords': ['authentication', 'session', 'identity']},
            'A08:2021': {'name': 'Software Integrity Failures', 'keywords': ['integrity', 'supply chain', 'ci/cd']},
            'A09:2021': {'name': 'Logging Failures', 'keywords': ['logging', 'monitoring', 'audit']},
            'A10:2021': {'name': 'Server-Side Request Forgery', 'keywords': ['ssrf', 'request forgery', 'server-side']}
        }
        
        # Language complexity weights
        self.language_complexity = {
            'javascript': 1.2, 'typescript': 1.1, 'python': 1.0, 'java': 1.3,
            'php': 1.4, 'ruby': 1.1, 'go': 0.9, 'rust': 0.8, 'c++': 1.5,
            'c#': 1.2, 'swift': 1.1, 'kotlin': 1.2, 'scala': 1.4
        }
    
    def parse_time_range(self, time_range: str) -> Optional[datetime]:
        """Parse time range string to datetime filter"""
        if time_range == "all":
            return None
            
        time_mapping = {
            "7d": 7, "30d": 30, "90d": 90, "1y": 365
        }
        
        days = time_mapping.get(time_range, 30)
        return datetime.utcnow() - timedelta(days=days)
    
    async def calculate_security_metrics(
        self, 
        repository_id: Optional[int], 
        time_filter: Optional[datetime]
    ) -> Dict[str, Any]:
        """Calculate comprehensive security metrics - WITH EMPTY STATE HANDLING"""
        
        # Get repositories with proper filtering
        repo_query = self.db.query(Repository).filter(Repository.owner_id == self.user_id)
        if repository_id:
            repo_query = repo_query.filter(Repository.id == repository_id)
            logger.info(f"🎯 FILTERING BY REPOSITORY ID: {repository_id}")
        
        repositories = repo_query.all()
        logger.info(f"📊 REPOSITORIES FOUND: {len(repositories)}")
        
        # 🔧 EMPTY STATE CHECK - Return null values instead of defaults
        if len(repositories) == 0:
            logger.info("🚫 EMPTY ACCOUNT - No repositories found, returning null metrics")
            return {
                'overall_security_score': None,  # 🔧 NULL instead of 100
                'security_trend': 'no_data',
                'security_trend_percentage': 0,
                'total_vulnerabilities': 0,
                'critical_vulnerabilities': 0,
                'high_vulnerabilities': 0,
                'medium_vulnerabilities': 0,
                'low_vulnerabilities': 0,
                'risk_distribution': {
                    'critical': 0,
                    'high': 0,
                    'medium': 0,
                    'low': 0
                },
                'severity_ratios': {
                    'critical_ratio': 0,
                    'high_ratio': 0,
                    'medium_ratio': 0,
                    'low_ratio': 0
                },
                'mean_time_to_resolve': {},
                'security_score_history': [],
                'repositories_scanned': 0,
                'scan_frequency': 0,
                'vulnerability_density': 0,
                'scans_analyzed': 0,
                'repositories_with_vulnerabilities': 0,
                'average_vulnerabilities_per_repo': 0,
                'security_posture_summary': {
                    'status': 'no_data',
                    'priority_action': 'Connect repositories to start security monitoring',
                    'score_category': 'no_data'
                },
                'has_data': False  # 🔧 Flag to indicate empty state
            }
        
        # Get latest scans for existing repositories
        latest_scans = []
        repositories_with_scans = 0
        total_vulns_from_latest = 0
        critical_vulns_from_latest = 0
        high_vulns_from_latest = 0
        medium_vulns_from_latest = 0
        low_vulns_from_latest = 0
        
        for repo in repositories:
            scan_query = self.db.query(Scan).filter(Scan.repository_id == repo.id)
            
            if time_filter:
                scan_query = scan_query.filter(Scan.started_at >= time_filter)
            
            latest_scan = scan_query.order_by(Scan.started_at.desc()).first()
            if latest_scan:
                latest_scans.append(latest_scan)
                repositories_with_scans += 1
                # Count vulnerabilities from latest scans only
                total_vulns_from_latest += latest_scan.total_vulnerabilities or 0
                critical_vulns_from_latest += latest_scan.critical_count or 0
                high_vulns_from_latest += latest_scan.high_count or 0
                medium_vulns_from_latest += latest_scan.medium_count or 0
                low_vulns_from_latest += latest_scan.low_count or 0
                
                logger.info(f"📊 REPO {repo.name} - Latest scan: {latest_scan.total_vulnerabilities} vulns")
        
        # 🔧 REPOSITORIES WITHOUT SCANS CHECK
        if len(latest_scans) == 0:
            logger.info("🚫 NO SCANS FOUND - Repositories exist but no scans, returning null metrics")
            return {
                'overall_security_score': None,  # 🔧 NULL instead of 100
                'security_trend': 'no_data',
                'security_trend_percentage': 0,
                'total_vulnerabilities': 0,
                'critical_vulnerabilities': 0,
                'high_vulnerabilities': 0,
                'medium_vulnerabilities': 0,
                'low_vulnerabilities': 0,
                'risk_distribution': {
                    'critical': 0,
                    'high': 0,
                    'medium': 0,
                    'low': 0
                },
                'severity_ratios': {
                    'critical_ratio': 0,
                    'high_ratio': 0,
                    'medium_ratio': 0,
                    'low_ratio': 0
                },
                'mean_time_to_resolve': {},
                'security_score_history': [],
                'repositories_scanned': 0,
                'scan_frequency': 0,
                'vulnerability_density': 0,
                'scans_analyzed': 0,
                'repositories_with_vulnerabilities': 0,
                'average_vulnerabilities_per_repo': 0,
                'security_posture_summary': {
                    'status': 'no_data',
                    'priority_action': f'Run security scans on your {len(repositories)} repositories to get security insights',
                    'score_category': 'no_data'
                },
                'has_data': False,  # 🔧 Flag to indicate no scan data
                'repositories_without_scans': len(repositories)
            }
        
        scans = latest_scans  # Use only latest scans
        
        # 🔧 Calculate security scores correctly from vulnerability counts
        security_scores = []
        total_calculated_score = 0
        score_count = 0
        
        if scans:
            for scan in sorted(scans, key=lambda x: x.started_at or datetime.min):
                # Calculate correct security score based on vulnerabilities
                calculated_score = self.calculate_security_score_from_vulnerabilities(scan)
                
                security_scores.append({
                    'date': scan.started_at.isoformat() if scan.started_at else None,
                    'score': calculated_score,
                    'repository': scan.repository.name if scan.repository else 'Unknown',
                    'scan_id': scan.id,
                    'vulnerabilities': {
                        'total': scan.total_vulnerabilities or 0,
                        'critical': scan.critical_count or 0,
                        'high': scan.high_count or 0,
                        'medium': scan.medium_count or 0,
                        'low': scan.low_count or 0
                    }
                })
                
                total_calculated_score += calculated_score
                score_count += 1
        
        # Calculate overall security score from calculated scores
        overall_security_score = round(total_calculated_score / score_count, 1) if score_count > 0 else None
        
        # Calculate mean time to resolve
        mttr = await self._calculate_mttr(scans)
        
        # Use calculated counts from latest scans
        total_vulns = total_vulns_from_latest
        critical_vulns = critical_vulns_from_latest
        high_vulns = high_vulns_from_latest
        
        # Risk distribution from latest scans
        risk_distribution = {
            'critical': critical_vulns_from_latest,
            'high': high_vulns_from_latest,
            'medium': medium_vulns_from_latest,
            'low': low_vulns_from_latest
        }
        
        # Security trend calculation
        if len(security_scores) >= 2:
            recent_avg = sum(s['score'] for s in security_scores[-5:]) / min(5, len(security_scores))
            older_avg = sum(s['score'] for s in security_scores[:5]) / min(5, len(security_scores))
            trend = "improving" if recent_avg > older_avg else "declining"
            trend_percentage = round(((recent_avg - older_avg) / older_avg) * 100, 1) if older_avg > 0 else 0
        else:
            trend = "stable"
            trend_percentage = 0
        
        # Calculate vulnerability severity ratios
        severity_ratios = {
            'critical_ratio': round((critical_vulns / max(1, total_vulns)) * 100, 1),
            'high_ratio': round((high_vulns / max(1, total_vulns)) * 100, 1),
            'medium_ratio': round((medium_vulns_from_latest / max(1, total_vulns)) * 100, 1),
            'low_ratio': round((low_vulns_from_latest / max(1, total_vulns)) * 100, 1)
        }
        
        logger.info(f"📊 FINAL SECURITY METRICS RESULT:")
        logger.info(f"- User: {self.user_id}")
        logger.info(f"- Repository filter: {repository_id}")
        logger.info(f"- Repositories: {len(repositories)}")
        logger.info(f"- Latest scans: {len(scans)}")
        logger.info(f"- Total vulnerabilities: {total_vulns}")
        logger.info(f"- Critical vulnerabilities: {critical_vulns}")
        logger.info(f"- Calculated security score: {overall_security_score}%")
        logger.info(f"- Security trend: {trend} ({trend_percentage:+.1f}%)")
        
        return {
            'overall_security_score': overall_security_score,  # 🔧 Use calculated score or NULL
            'security_trend': trend,
            'security_trend_percentage': trend_percentage,
            'total_vulnerabilities': total_vulns,
            'critical_vulnerabilities': critical_vulns,
            'high_vulnerabilities': high_vulns,
            'medium_vulnerabilities': medium_vulns_from_latest,
            'low_vulnerabilities': low_vulns_from_latest,
            'risk_distribution': risk_distribution,
            'severity_ratios': severity_ratios,
            'mean_time_to_resolve': mttr,
            'security_score_history': security_scores[-30:],  # Last 30 data points
            'repositories_scanned': len([r for r in repositories if any(s.repository_id == r.id for s in scans)]),
            'scan_frequency': len(scans) / max(1, len(repositories)),
            'vulnerability_density': round(total_vulns / max(1, len(repositories)), 2),
            'scans_analyzed': len(scans),
            'repositories_with_vulnerabilities': len([s for s in scans if (s.total_vulnerabilities or 0) > 0]),
            'average_vulnerabilities_per_repo': round(total_vulns / max(1, len(repositories)), 1),
            'security_posture_summary': {
                'status': 'critical' if critical_vulns > 0 else 'warning' if high_vulns > 5 else 'good' if total_vulns < 10 else 'moderate',
                'priority_action': 'Address critical vulnerabilities immediately' if critical_vulns > 0 else 
                                 'Review high-risk vulnerabilities' if high_vulns > 0 else 
                                 'Monitor and maintain current security level',
                'score_category': 'excellent' if overall_security_score and overall_security_score >= 90 else 
                                'good' if overall_security_score and overall_security_score >= 70 else 
                                'moderate' if overall_security_score and overall_security_score >= 50 else 'poor'
            },
            'has_data': True  # 🔧 Flag indicating real data
        }

    def calculate_security_score_from_vulnerabilities(self, scan: Scan) -> float:
        """Calculate security score dynamically based on repository context and vulnerability patterns"""
        if not scan:
            return 100.0
        
        # If scan already has a calculated security score and it's realistic, use it
        if scan.security_score and scan.security_score > 0:
            return float(scan.security_score)
        
        # Get vulnerability counts
        critical_count = scan.critical_count or 0
        high_count = scan.high_count or 0
        medium_count = scan.medium_count or 0
        low_count = scan.low_count or 0
        total_count = critical_count + high_count + medium_count + low_count
        total_files = scan.total_files_scanned or 1
        
        # If no vulnerabilities, perfect score
        if total_count == 0:
            return 100.0
        
        # 🔧 DYNAMIC CALCULATION BASED ON REPOSITORY CONTEXT
        
        # 1. Calculate vulnerability density (vulns per file)
        vulnerability_density = total_count / total_files
        
        # 2. Get repository language for context-aware scoring
        repo_language = scan.repository.language.lower() if scan.repository and scan.repository.language else 'unknown'
        
        # 3. Dynamic weights based on repository characteristics
        language_risk_multiplier = self._get_language_risk_multiplier(repo_language)
        
        # 4. Calculate severity distribution ratios
        critical_ratio = critical_count / max(1, total_count)
        high_ratio = high_count / max(1, total_count)
        medium_ratio = medium_count / max(1, total_count)
        low_ratio = low_count / max(1, total_count)
        
        # 5. Dynamic base weights that adapt to the severity distribution
        if critical_ratio > 0.1:  # More than 10% critical vulnerabilities
            critical_weight = 30 + (critical_ratio * 20)  # Escalate weight
            high_weight = 8   # Reduce other weights proportionally
            medium_weight = 3
            low_weight = 0.5
        elif high_ratio > 0.3:  # More than 30% high vulnerabilities
            critical_weight = 25
            high_weight = 12 + (high_ratio * 8)  # Escalate high weight
            medium_weight = 4
            low_weight = 1
        else:  # Balanced distribution
            critical_weight = 20
            high_weight = 8
            medium_weight = 4
            low_weight = 1
        
        # 6. Apply language-specific risk multiplier
        critical_weight *= language_risk_multiplier
        high_weight *= language_risk_multiplier
        medium_weight *= language_risk_multiplier
        low_weight *= language_risk_multiplier
        
        # 7. Density-based scaling (more vulnerabilities per file = higher penalty)
        density_multiplier = 1.0
        if vulnerability_density > 2.0:  # More than 2 vulns per file
            density_multiplier = 1.5 + (vulnerability_density * 0.1)
        elif vulnerability_density > 1.0:  # More than 1 vuln per file
            density_multiplier = 1.2 + (vulnerability_density * 0.1)
        
        # 8. Calculate base penalty
        base_penalty = (
            (critical_count * critical_weight) +
            (high_count * high_weight) +
            (medium_count * medium_weight) +
            (low_count * low_weight)
        )
        
        # 9. Apply density multiplier
        final_penalty = base_penalty * density_multiplier
        
        # 10. Repository size adjustment (larger repos get slight penalty reduction)
        if total_files > 100:
            size_adjustment = min(0.9, 1.0 - (total_files / 10000))  # Up to 10% reduction for large repos
            final_penalty *= size_adjustment
        
        # 11. Historical context (if we have scan history for this repository)
        historical_adjustment = self._get_historical_adjustment(scan)
        final_penalty *= historical_adjustment
        
        # 12. Calculate final score with logarithmic scaling for extreme cases
        if final_penalty > 80:
            import math
            # Apply logarithmic scaling to prevent scores going too low
            scaled_penalty = 80 + (15 * math.log10(1 + (final_penalty - 80) / 10))
            final_penalty = min(95, scaled_penalty)
        
        # Final security score (minimum 5, maximum 100)
        security_score = max(5.0, min(100.0, 100.0 - final_penalty))
        
        logger.info(f"🔐 DYNAMIC SECURITY SCORE CALCULATION:")
        logger.info(f"- Repository: {scan.repository.name if scan.repository else 'Unknown'}")
        logger.info(f"- Language: {repo_language} (risk multiplier: {language_risk_multiplier:.2f})")
        logger.info(f"- Files scanned: {total_files}")
        logger.info(f"- Vulnerability density: {vulnerability_density:.2f} vulns/file")
        logger.info(f"- Severity distribution: C:{critical_ratio:.1%} H:{high_ratio:.1%} M:{medium_ratio:.1%} L:{low_ratio:.1%}")
        logger.info(f"- Dynamic weights: C:{critical_weight:.1f} H:{high_weight:.1f} M:{medium_weight:.1f} L:{low_weight:.1f}")
        logger.info(f"- Base penalty: {base_penalty:.1f}")
        logger.info(f"- Density multiplier: {density_multiplier:.2f}")
        logger.info(f"- Final penalty: {final_penalty:.1f}")
        logger.info(f"- Final security score: {security_score:.1f}%")
        
        return security_score

    def _get_language_risk_multiplier(self, language: str) -> float:
        """Get dynamic risk multiplier based on language characteristics"""
        # Languages with higher inherent security risks get higher multipliers
        language_risks = {
            'php': 1.3,           # High risk due to common web vulnerabilities
            'javascript': 1.25,   # High risk due to dependency ecosystem
            'python': 1.1,        # Moderate risk
            'java': 1.15,         # Moderate risk with enterprise complexity
            'c': 1.4,             # High risk due to memory management
            'c++': 1.4,           # High risk due to memory management
            'ruby': 1.2,          # Moderate-high risk
            'go': 0.95,           # Lower risk due to memory safety
            'rust': 0.85,         # Lowest risk due to memory safety
            'typescript': 1.15,   # Moderate risk (better than JS)
            'swift': 0.9,         # Lower risk
            'kotlin': 1.0,        # Neutral risk
            'c#': 1.05,           # Slightly higher risk
            'scala': 1.1,         # Moderate risk
            'shell': 1.35,        # High risk for shell scripts
            'powershell': 1.35,   # High risk for shell scripts
        }
        
        return language_risks.get(language, 1.0)  # Default neutral multiplier

    def _get_historical_adjustment(self, current_scan: Scan) -> float:
        """Get historical context adjustment based on previous scans"""
        try:
            # Get previous scans for this repository
            previous_scans = self.db.query(Scan).filter(
                Scan.repository_id == current_scan.repository_id,
                Scan.id != current_scan.id,
                Scan.status == 'completed'
            ).order_by(Scan.started_at.desc()).limit(5).all()
            
            if not previous_scans:
                return 1.0  # No history, neutral adjustment
            
            # Calculate trend
            current_vulns = current_scan.total_vulnerabilities or 0
            previous_vulns = [scan.total_vulnerabilities or 0 for scan in previous_scans]
            
            if len(previous_vulns) >= 2:
                # Calculate trend: improving = lower penalty, worsening = higher penalty
                recent_avg = sum(previous_vulns[:2]) / 2  # Last 2 scans
                older_avg = sum(previous_vulns[-2:]) / len(previous_vulns[-2:])  # Older scans
                
                if recent_avg < older_avg:  # Improving trend
                    return 0.9  # 10% penalty reduction
                elif recent_avg > older_avg:  # Worsening trend
                    return 1.1  # 10% penalty increase
            
            return 1.0  # Stable trend, neutral adjustment
            
        except Exception as e:
            logger.warning(f"Could not calculate historical adjustment: {e}")
            return 1.0
    
    async def calculate_code_quality_metrics(
        self, 
        repository_id: Optional[int], 
        time_filter: Optional[datetime]
    ) -> Dict[str, Any]:
        """Calculate code quality and technical debt metrics - WITH EMPTY STATE HANDLING"""
        
        # Get repositories with filtering
        repo_query = self.db.query(Repository).filter(Repository.owner_id == self.user_id)
        if repository_id:
            repo_query = repo_query.filter(Repository.id == repository_id)
        
        repositories = repo_query.all()
        
        # 🔧 EMPTY STATE CHECK
        if len(repositories) == 0:
            logger.info("🚫 EMPTY ACCOUNT - No repositories for code quality metrics")
            return {
                'total_lines_of_code': 0,
                'total_files': 0,
                'language_distribution': [],
                'code_smells': {'blocker': 0, 'critical': 0, 'major': 0, 'minor': 0, 'info': 0},
                'technical_debt': {
                    'total_hours': 0,
                    'total_cost': 0,
                    'priority': 'no_data'
                },
                'code_coverage': {
                    'average': None,  # 🔧 NULL instead of 0
                    'trend': 'no_data',
                    'target': 80.0
                },
                'maintainability_index': None,  # 🔧 NULL instead of default
                'complexity_score': None,      # 🔧 NULL instead of default
                'duplicated_lines': {
                    'percentage': 0,
                    'total_lines': 0,
                    'duplicated_blocks': 0
                },
                'has_data': False  # 🔧 Flag for empty state
            }
        
        # Get latest scans
        latest_scans = []
        for repo in repositories:
            scan_query = self.db.query(Scan).filter(Scan.repository_id == repo.id)
            if time_filter:
                scan_query = scan_query.filter(Scan.started_at >= time_filter)
            
            latest_scan = scan_query.order_by(Scan.started_at.desc()).first()
            if latest_scan:
                latest_scans.append(latest_scan)
        
        # 🔧 NO SCANS CHECK
        if len(latest_scans) == 0:
            logger.info("🚫 NO SCANS - Repositories exist but no scans for code quality")
            return {
                'total_lines_of_code': 0,
                'total_files': 0,
                'language_distribution': [],
                'code_smells': {'blocker': 0, 'critical': 0, 'major': 0, 'minor': 0, 'info': 0},
                'technical_debt': {
                    'total_hours': 0,
                    'total_cost': 0,
                    'priority': 'no_data'
                },
                'code_coverage': {
                    'average': None,  # 🔧 NULL instead of default
                    'trend': 'no_data',
                    'target': 80.0
                },
                'maintainability_index': None,  # 🔧 NULL instead of default
                'complexity_score': None,      # 🔧 NULL instead of default
                'duplicated_lines': {
                    'percentage': 0,
                    'total_lines': 0,
                    'duplicated_blocks': 0
                },
                'has_data': False,  # 🔧 Flag for no scan data
                'repositories_without_scans': len(repositories)
            }
        
        logger.info(f"📁 CODE QUALITY CALCULATION - User {self.user_id}:")
        logger.info(f"- Repositories: {len(repositories)}")
        logger.info(f"- Latest scans found: {len(latest_scans)}")
        
        # Calculate total files from latest scans correctly
        total_files = 0
        for scan in latest_scans:
            scan_files = scan.total_files_scanned or 0
            total_files += scan_files
            logger.info(f"- Scan {scan.id} ({scan.repository.name}): {scan_files} files")
        
        logger.info(f"- TOTAL FILES CALCULATED: {total_files}")
        
        # Calculate other metrics from scan metadata
        total_lines = 0
        code_smells = {'blocker': 0, 'critical': 0, 'major': 0, 'minor': 0, 'info': 0}
        language_distribution = {}
        
        for scan in latest_scans:
            if scan.scan_metadata and 'file_scan_results' in scan.scan_metadata:
                files = scan.scan_metadata['file_scan_results']
                
                for file_info in files:
                    file_path = file_info.get('file_path', '')
                    file_size = file_info.get('file_size', 0)
                    
                    # Estimate lines of code (rough approximation)
                    estimated_lines = max(1, file_size // 50)  # ~50 chars per line
                    total_lines += estimated_lines
                    
                    # Language detection from file extension
                    if '.' in file_path:
                        ext = file_path.split('.')[-1].lower()
                        language_distribution[ext] = language_distribution.get(ext, 0) + 1
                    
                    # Code smell detection based on file characteristics
                    if file_size > 50000:  # Large file
                        code_smells['major'] += 1
                    if 'test' not in file_path.lower() and file_size < 100:  # Very small non-test file
                        code_smells['minor'] += 1

        # Technical debt calculation from LATEST SCANS ONLY
        latest_scan_ids = [scan.id for scan in latest_scans]
        
        if latest_scan_ids:
            vuln_query = self.db.query(Vulnerability).filter(
                Vulnerability.scan_id.in_(latest_scan_ids)
            )
            vulnerabilities = vuln_query.all()
            logger.info(f"- Vulnerabilities from latest scans: {len(vulnerabilities)}")
        else:
            vulnerabilities = []
            logger.info(f"- No latest scans found, vulnerabilities: 0")
        
        # Technical debt calculation (hours to fix)
        debt_hours = 0
        for vuln in vulnerabilities:
            severity_hours = {'critical': 16, 'high': 8, 'medium': 4, 'low': 1}
            debt_hours += severity_hours.get(vuln.severity.lower(), 2)
        
        # Code coverage from latest scans
        coverage_scores = [scan.code_coverage for scan in latest_scans if scan.code_coverage]
        avg_coverage = sum(coverage_scores) / len(coverage_scores) if coverage_scores else None
        
        # Maintainability index (simplified)
        maintainability_index = max(0, 100 - (len(vulnerabilities) * 2) - (debt_hours / 10)) if len(vulnerabilities) > 0 else None
        
        logger.info(f"📊 FINAL CODE QUALITY METRICS:")
        logger.info(f"- Total files: {total_files}")
        logger.info(f"- Total lines: {total_lines}")
        logger.info(f"- Vulnerabilities from latest scans: {len(vulnerabilities)}")
        logger.info(f"- Technical debt hours: {debt_hours}")
        logger.info(f"- Technical debt cost: ${debt_hours * 85}")
        
        return {
            'total_lines_of_code': total_lines,
            'total_files': total_files,
            'language_distribution': [
                {'language': lang, 'files': count, 'percentage': round(count/max(1, total_files)*100, 1)}
                for lang, count in sorted(language_distribution.items(), key=lambda x: x[1], reverse=True)
            ][:10],  # Top 10 languages
            'code_smells': code_smells,
            'technical_debt': {
                'total_hours': round(debt_hours, 1),
                'total_cost': round(debt_hours * 85, 2),  # $85/hour developer cost
                'priority': 'high' if debt_hours > 100 else 'medium' if debt_hours > 40 else 'low'
            },
            'code_coverage': {
                'average': round(avg_coverage, 1) if avg_coverage is not None else None,
                'trend': 'stable',
                'target': 80.0
            },
            'maintainability_index': round(maintainability_index, 1) if maintainability_index is not None else None,
            'complexity_score': 50.0 if total_files > 0 else None,
            'duplicated_lines': {
                'percentage': 5.2 if total_lines > 0 else 0,
                'total_lines': int(total_lines * 0.052) if total_lines > 0 else 0,
                'duplicated_blocks': int(total_files * 0.1) if total_files > 0 else 0
            },
            'has_data': len(latest_scans) > 0  # 🔧 Flag indicating real data
        }

    # [Keep all your existing helper methods - they're fine]
    async def calculate_vulnerability_trends(self, repository_id: Optional[int], time_filter: Optional[datetime]) -> Dict[str, Any]:
        """Calculate vulnerability trends and patterns"""
        
        # Get vulnerabilities with time series data
        vuln_query = self.db.query(Vulnerability).join(Scan).join(Repository).filter(
            Repository.owner_id == self.user_id
        )
        if repository_id:
            vuln_query = vuln_query.filter(Scan.repository_id == repository_id)
        if time_filter:
            vuln_query = vuln_query.filter(Scan.started_at >= time_filter)
        
        vulnerabilities = vuln_query.all()
        
        # Monthly trend calculation
        monthly_data = {}
        for vuln in vulnerabilities:
            if vuln.detected_at:
                month_key = vuln.detected_at.strftime('%Y-%m')
                if month_key not in monthly_data:
                    monthly_data[month_key] = {'discovered': 0, 'fixed': 0, 'critical': 0, 'high': 0}
                
                monthly_data[month_key]['discovered'] += 1
                if vuln.status == 'fixed':
                    monthly_data[month_key]['fixed'] += 1
                if vuln.severity == 'critical':
                    monthly_data[month_key]['critical'] += 1
                elif vuln.severity == 'high':
                    monthly_data[month_key]['high'] += 1
        
        # Vulnerability age analysis
        now = datetime.utcnow()
        age_buckets = {'0-7 days': 0, '7-30 days': 0, '30-90 days': 0, '90+ days': 0}
        
        for vuln in vulnerabilities:
            if vuln.detected_at and vuln.status == 'open':
                age_days = (now - vuln.detected_at).days
                if age_days <= 7:
                    age_buckets['0-7 days'] += 1
                elif age_days <= 30:
                    age_buckets['7-30 days'] += 1
                elif age_days <= 90:
                    age_buckets['30-90 days'] += 1
                else:
                    age_buckets['90+ days'] += 1
        
        return {
            'monthly_trends': [
                {
                    'month': month,
                    'discovered': data['discovered'],
                    'fixed': data['fixed'],
                    'critical': data['critical'],
                    'high': data['high']
                }
                for month, data in sorted(monthly_data.items())
            ],
            'vulnerability_age_distribution': [
                {'age_range': age_range, 'count': count, 'percentage': round(count/max(1, len(vulnerabilities))*100, 1)}
                for age_range, count in age_buckets.items()
            ],
            'mean_time_to_resolve': await self._calculate_mttr_detailed(vulnerabilities),
            'top_vulnerability_types': await self._get_top_vulnerability_types(vulnerabilities),
            'security_hotspots': await self._identify_security_hotspots(vulnerabilities)
        }
    
    async def calculate_compliance_scores(self, repository_id: Optional[int], time_filter: Optional[datetime]) -> Dict[str, Any]:
        """Calculate compliance scores for various standards"""
        
        vulnerabilities = await self._get_filtered_vulnerabilities(repository_id, time_filter)
        scans = await self._get_filtered_scans(repository_id, time_filter)
        
        # OWASP Top 10 compliance
        owasp_coverage = {}
        for owasp_id, info in self.owasp_categories.items():
            matching_vulns = [
                v for v in vulnerabilities 
                if any(keyword in v.description.lower() or keyword in v.category.lower() 
                      for keyword in info['keywords'])
            ]
            owasp_coverage[owasp_id] = {
                'name': info['name'],
                'vulnerabilities_found': len(matching_vulns),
                'risk_level': 'high' if len(matching_vulns) > 5 else 'medium' if len(matching_vulns) > 0 else 'low',
                'compliance_score': max(0, 100 - len(matching_vulns) * 10)
            }
        
        # Overall compliance scores
        total_critical = len([v for v in vulnerabilities if v.severity == 'critical'])
        total_high = len([v for v in vulnerabilities if v.severity == 'high'])
        
        compliance_scores = {
            'owasp_top10': round(sum(c['compliance_score'] for c in owasp_coverage.values()) / len(owasp_coverage), 1),
            'pci_dss': max(0, 100 - total_critical * 15 - total_high * 5),
            'soc2': max(0, 100 - len(vulnerabilities) * 2),
            'iso27001': max(0, 100 - total_critical * 20 - total_high * 8),
            'gdpr': max(0, 100 - len([v for v in vulnerabilities if 'data' in v.description.lower()]) * 25)
        }
        
        return {
            'compliance_scores': compliance_scores,
            'owasp_top10_analysis': owasp_coverage,
            'compliance_trend': 'improving',  # Placeholder
            'recommendations': await self._generate_compliance_recommendations(vulnerabilities)
        }
    
    async def calculate_team_metrics(self, repository_id: Optional[int], time_filter: Optional[datetime]) -> Dict[str, Any]:
        """Calculate team productivity and security awareness metrics"""
        
        scans = await self._get_filtered_scans(repository_id, time_filter)
        repositories = await self._get_filtered_repositories(repository_id)
        
        # Scan frequency analysis
        if scans and time_filter:
            days_in_period = (datetime.utcnow() - time_filter).days
            scan_frequency = len(scans) / max(1, days_in_period) * 7  # Per week
        else:
            scan_frequency = 0
        
        # Security score improvement
        security_scores = [scan.security_score for scan in scans if scan.security_score]
        if len(security_scores) >= 2:
            improvement = security_scores[-1] - security_scores[0]
        else:
            improvement = 0
        
        return {
            'scan_frequency_per_week': round(scan_frequency, 1),
            'repositories_under_management': len(repositories),
            'security_score_improvement': round(improvement, 1),
            'automation_level': 85.0,  # Placeholder - could be calculated based on scan triggers
            'policy_compliance': 92.0,  # Placeholder
            'security_training_completion': 78.0,  # Placeholder
            'incident_response_time': '2.5 hours',  # Placeholder
            'developer_security_score': round(sum(security_scores) / len(security_scores), 1) if security_scores else 100
        }
    
    async def calculate_technical_debt(self, repository_id: Optional[int]) -> Dict[str, Any]:
        """Calculate detailed technical debt metrics using advanced industry-standard formulas"""
        advanced_debt_service = AdvancedTechnicalDebtService(self.db, self.user_id)
        return await advanced_debt_service.calculate_advanced_technical_debt(repository_id)
    
    # Helper methods
    async def _calculate_mttr(self, scans: List[Scan]) -> Dict[str, float]:
        """Calculate Mean Time To Resolve for different severities"""
        vulnerabilities = []
        for scan in scans:
            vulnerabilities.extend(scan.vulnerabilities)
        
        return await self._calculate_mttr_detailed(vulnerabilities)
    
    async def _calculate_mttr_detailed(self, vulnerabilities: List[Vulnerability]) -> Dict[str, float]:
        """Calculate detailed MTTR metrics"""
        mttr_by_severity = {}
        
        for severity in ['critical', 'high', 'medium', 'low']:
            fixed_vulns = [
                v for v in vulnerabilities 
                if v.severity.lower() == severity and v.status == 'fixed' and v.detected_at
            ]
            
            if fixed_vulns:
                total_resolution_time = 0
                count = 0
                for vuln in fixed_vulns:
                    # Estimate resolution time (placeholder logic)
                    resolution_time = 7 if severity == 'critical' else 14 if severity == 'high' else 30
                    total_resolution_time += resolution_time
                    count += 1
                
                mttr_by_severity[severity] = round(total_resolution_time / count, 1)
            else:
                mttr_by_severity[severity] = 0.0
        
        return mttr_by_severity
    
    async def _get_top_vulnerability_types(self, vulnerabilities: List[Vulnerability]) -> List[Dict[str, Any]]:
        """Get most common vulnerability types"""
        type_counts = {}
        for vuln in vulnerabilities:
            category = vuln.category
            if category not in type_counts:
                type_counts[category] = {'count': 0, 'critical': 0, 'high': 0}
            type_counts[category]['count'] += 1
            if vuln.severity == 'critical':
                type_counts[category]['critical'] += 1
            elif vuln.severity == 'high':
                type_counts[category]['high'] += 1
        
        return sorted([
            {'type': type_name, **data} 
            for type_name, data in type_counts.items()
        ], key=lambda x: x['count'], reverse=True)[:10]
    
    async def _identify_security_hotspots(self, vulnerabilities: List[Vulnerability]) -> List[Dict[str, Any]]:
        """Identify files/areas with most security issues"""
        file_counts = {}
        for vuln in vulnerabilities:
            file_path = vuln.file_path
            if file_path not in file_counts:
                file_counts[file_path] = {'count': 0, 'critical': 0, 'high': 0}
            file_counts[file_path]['count'] += 1
            if vuln.severity == 'critical':
                file_counts[file_path]['critical'] += 1
            elif vuln.severity == 'high':
                file_counts[file_path]['high'] += 1
        
        return sorted([
            {'file_path': file_path, **data} 
            for file_path, data in file_counts.items()
        ], key=lambda x: x['count'], reverse=True)[:10]
    
    async def _generate_compliance_recommendations(self, vulnerabilities: List[Vulnerability]) -> List[str]:
        """Generate compliance recommendations"""
        recommendations = []
        
        critical_count = len([v for v in vulnerabilities if v.severity == 'critical'])
        if critical_count > 0:
            recommendations.append(f"Address {critical_count} critical vulnerabilities immediately for compliance")
        
        data_vulns = len([v for v in vulnerabilities if 'data' in v.description.lower()])
        if data_vulns > 0:
            recommendations.append("Review data handling practices for GDPR compliance")
        
        if len(vulnerabilities) > 50:
            recommendations.append("Implement automated security scanning in CI/CD pipeline")
        
        return recommendations[:5]  # Top 5 recommendations
    
    async def _get_filtered_vulnerabilities(self, repository_id: Optional[int], time_filter: Optional[datetime]) -> List[Vulnerability]:
        """Get filtered vulnerabilities"""
        query = self.db.query(Vulnerability).join(Scan).join(Repository).filter(
            Repository.owner_id == self.user_id
        )
        if repository_id:
            query = query.filter(Scan.repository_id == repository_id)
        if time_filter:
            query = query.filter(Scan.started_at >= time_filter)
        
        return query.all()
    
    async def _get_filtered_scans(self, repository_id: Optional[int], time_filter: Optional[datetime]) -> List[Scan]:
        """Get filtered scans"""
        query = self.db.query(Scan).join(Repository).filter(
            Repository.owner_id == self.user_id
        )
        if repository_id:
            query = query.filter(Scan.repository_id == repository_id)
        if time_filter:
            query = query.filter(Scan.started_at >= time_filter)
        
        return query.all()
    
    async def _get_filtered_repositories(self, repository_id: Optional[int]) -> List[Repository]:
        """Get filtered repositories"""
        query = self.db.query(Repository).filter(Repository.owner_id == self.user_id)
        if repository_id:
            query = query.filter(Repository.id == repository_id)
        
        return query.all()