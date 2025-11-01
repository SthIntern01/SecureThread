import re
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
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
        """Calculate comprehensive security metrics - FIXED VERSION"""
        
        # Base query for user's repositories
        repo_query = self.db.query(Repository).filter(Repository.owner_id == self.user_id)
        if repository_id:
            repo_query = repo_query.filter(Repository.id == repository_id)
        
        repositories = repo_query.all()
        
        # 🔧 FIX: Get ONLY latest scan per repository (like repository API)
        latest_scans = []
        for repo in repositories:
            scan_query = self.db.query(Scan).filter(Scan.repository_id == repo.id)
            
            # Apply time filter to scans if specified
            if time_filter:
                scan_query = scan_query.filter(Scan.started_at >= time_filter)
            
            latest_scan = scan_query.order_by(Scan.started_at.desc()).first()
            if latest_scan:
                latest_scans.append(latest_scan)
        
        scans = latest_scans  # Now this matches repository API logic!
        
        # Calculate security score trend (only from latest scans)
        security_scores = []
        if scans:
            for scan in sorted(scans, key=lambda x: x.started_at or datetime.min):
                if scan.security_score:
                    security_scores.append({
                        'date': scan.started_at.isoformat() if scan.started_at else None,
                        'score': scan.security_score,
                        'repository': scan.repository.name if scan.repository else 'Unknown'
                    })
        
        # Calculate mean time to resolve
        mttr = await self._calculate_mttr(scans)
        
        # 🔧 FIX: Count vulnerabilities from latest scans only (matches repository API)
        total_vulns = sum(scan.total_vulnerabilities or 0 for scan in scans)
        critical_vulns = sum(scan.critical_count or 0 for scan in scans)
        high_vulns = sum(scan.high_count or 0 for scan in scans)
        
        # Risk distribution
        risk_distribution = {
            'critical': critical_vulns,
            'high': high_vulns,
            'medium': sum(scan.medium_count or 0 for scan in scans),
            'low': sum(scan.low_count or 0 for scan in scans)
        }
        
        # Security trend calculation
        if len(security_scores) >= 2:
            recent_avg = sum(s['score'] for s in security_scores[-5:]) / min(5, len(security_scores))
            older_avg = sum(s['score'] for s in security_scores[:5]) / min(5, len(security_scores))
            trend = "improving" if recent_avg > older_avg else "declining"
        else:
            trend = "stable"
        
        logger.info(f"📊 METRICS DEBUG - User {self.user_id}:")
        logger.info(f"- Repositories: {len(repositories)}")
        logger.info(f"- Latest scans: {len(scans)}")
        logger.info(f"- Total vulnerabilities: {total_vulns}")
        logger.info(f"- Critical vulnerabilities: {critical_vulns}")
        logger.info(f"- Time filter: {time_filter}")
        
        return {
            'overall_security_score': round(sum(s['score'] for s in security_scores) / len(security_scores), 1) if security_scores else 100,
            'security_trend': trend,
            'total_vulnerabilities': total_vulns,
            'critical_vulnerabilities': critical_vulns,
            'high_vulnerabilities': high_vulns,
            'risk_distribution': risk_distribution,
            'mean_time_to_resolve': mttr,
            'security_score_history': security_scores[-30:],  # Last 30 data points
            'repositories_scanned': len([r for r in repositories if any(s.repository_id == r.id for s in scans)]),
            'scan_frequency': len(scans) / max(1, len(repositories)),
            'vulnerability_density': total_vulns / max(1, len(repositories))
        }
    
    async def calculate_code_quality_metrics(
        self, 
        repository_id: Optional[int], 
        time_filter: Optional[datetime]
    ) -> Dict[str, Any]:
        """Calculate code quality and technical debt metrics"""
        
        # Get scans with metadata
        scan_query = self.db.query(Scan).join(Repository).filter(
            Repository.owner_id == self.user_id,
            Scan.scan_metadata.isnot(None)
        )
        if repository_id:
            scan_query = scan_query.filter(Scan.repository_id == repository_id)
        if time_filter:
            scan_query = scan_query.filter(Scan.started_at >= time_filter)
        
        scans = scan_query.all()
        
        # Analyze code from scan metadata
        total_files = 0
        total_lines = 0
        code_smells = {'blocker': 0, 'critical': 0, 'major': 0, 'minor': 0, 'info': 0}
        language_distribution = {}
        complexity_score = 0
        
        for scan in scans:
            if scan.scan_metadata and 'file_scan_results' in scan.scan_metadata:
                files = scan.scan_metadata['file_scan_results']
                total_files += len(files)
                
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
        
        # Calculate technical debt
        vuln_query = self.db.query(Vulnerability).join(Scan).join(Repository).filter(
            Repository.owner_id == self.user_id
        )
        if repository_id:
            vuln_query = vuln_query.filter(Scan.repository_id == repository_id)
        if time_filter:
            vuln_query = vuln_query.filter(Scan.started_at >= time_filter)
        
        vulnerabilities = vuln_query.all()
        
        # Technical debt calculation (hours to fix)
        debt_hours = 0
        for vuln in vulnerabilities:
            severity_hours = {'critical': 8, 'high': 4, 'medium': 2, 'low': 0.5}
            debt_hours += severity_hours.get(vuln.severity.lower(), 2)
        
        # Code coverage from scans
        coverage_scores = [scan.code_coverage for scan in scans if scan.code_coverage]
        avg_coverage = sum(coverage_scores) / len(coverage_scores) if coverage_scores else 0
        
        # Maintainability index (simplified)
        maintainability_index = max(0, 100 - (len(vulnerabilities) * 2) - (debt_hours / 10))
        
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
                'total_cost': round(debt_hours * 75, 2),  # $75/hour developer cost
                'priority': 'high' if debt_hours > 40 else 'medium' if debt_hours > 10 else 'low'
            },
            'code_coverage': {
                'average': round(avg_coverage, 1),
                'trend': 'stable',  # Could be improved with historical data
                'target': 80.0
            },
            'maintainability_index': round(maintainability_index, 1),
            'complexity_score': round(complexity_score, 1) if complexity_score else 50.0,
            'duplicated_lines': {
                'percentage': 5.2,  # Placeholder - would need actual analysis
                'total_lines': int(total_lines * 0.052),
                'duplicated_blocks': int(total_files * 0.1)
            }
        }
    
    async def calculate_vulnerability_trends(
        self, 
        repository_id: Optional[int], 
        time_filter: Optional[datetime]
    ) -> Dict[str, Any]:
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
    
    async def calculate_compliance_scores(
        self, 
        repository_id: Optional[int], 
        time_filter: Optional[datetime]
    ) -> Dict[str, Any]:
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
    
    async def calculate_team_metrics(
        self, 
        repository_id: Optional[int], 
        time_filter: Optional[datetime]
    ) -> Dict[str, Any]:
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
    
    async def calculate_owasp_metrics(self, repository_id: Optional[int]) -> Dict[str, Any]:
        """Detailed OWASP Top 10 analysis"""
        vulnerabilities = await self._get_filtered_vulnerabilities(repository_id, None)
        
        owasp_detailed = {}
        for owasp_id, info in self.owasp_categories.items():
            matching_vulns = [
                v for v in vulnerabilities 
                if any(keyword in v.description.lower() or keyword in v.category.lower() 
                      for keyword in info['keywords'])
            ]
            
            severity_breakdown = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
            for vuln in matching_vulns:
                severity_breakdown[vuln.severity.lower()] += 1
            
            owasp_detailed[owasp_id] = {
                'name': info['name'],
                'total_vulnerabilities': len(matching_vulns),
                'severity_breakdown': severity_breakdown,
                'risk_score': sum(
                    {'critical': 9, 'high': 7, 'medium': 4, 'low': 2}.get(v.severity.lower(), 2) 
                    for v in matching_vulns
                ),
                'affected_files': len(set(v.file_path for v in matching_vulns)),
                'compliance_status': 'compliant' if len(matching_vulns) == 0 else 'non-compliant'
            }
        
        return {
            'owasp_analysis': owasp_detailed,
            'overall_owasp_score': round(
                sum(max(0, 100 - analysis['risk_score'] * 5) for analysis in owasp_detailed.values()) / len(owasp_detailed), 1
            ),
            'most_critical_categories': sorted(
                [(k, v) for k, v in owasp_detailed.items()], 
                key=lambda x: x[1]['risk_score'], reverse=True
            )[:3]
        }
    
    async def calculate_technical_debt(self, repository_id: Optional[int]) -> Dict[str, Any]:
        """Calculate detailed technical debt metrics"""
        vulnerabilities = await self._get_filtered_vulnerabilities(repository_id, None)
        
        # Calculate debt by severity
        debt_by_severity = {
            'critical': {'hours': 0, 'count': 0, 'cost': 0},
            'high': {'hours': 0, 'count': 0, 'cost': 0},
            'medium': {'hours': 0, 'count': 0, 'cost': 0},
            'low': {'hours': 0, 'count': 0, 'cost': 0}
        }
        
        severity_hours = {'critical': 16, 'high': 8, 'medium': 4, 'low': 1}
        hourly_rate = 85  # Developer hourly rate
        
        for vuln in vulnerabilities:
            severity = vuln.severity.lower()
            if severity in debt_by_severity:
                hours = severity_hours[severity]
                debt_by_severity[severity]['hours'] += hours
                debt_by_severity[severity]['count'] += 1
                debt_by_severity[severity]['cost'] += hours * hourly_rate
        
        total_hours = sum(s['hours'] for s in debt_by_severity.values())
        total_cost = sum(s['cost'] for s in debt_by_severity.values())
        
        return {
            'total_debt_hours': total_hours,
            'total_debt_cost': total_cost,
            'debt_by_severity': debt_by_severity,
            'debt_ratio': round(total_hours / max(1, len(vulnerabilities)), 2),
            'priority_recommendation': 'high' if total_hours > 100 else 'medium' if total_hours > 40 else 'low',
            'estimated_sprint_impact': round(total_hours / 80, 1),  # Assuming 80 hours per sprint
            'roi_of_fixing': {
                'maintenance_savings': round(total_cost * 0.3, 2),
                'risk_reduction': round(total_cost * 0.5, 2),
                'productivity_gain': round(total_cost * 0.2, 2)
            }
        }
    
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