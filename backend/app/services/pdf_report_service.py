# backend/app/services/pdf_report_service.py

import os
import io
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path
from collections import Counter

# Third-party imports
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
from sqlalchemy.orm import Session

# App imports
from app.models.vulnerability import Scan, Vulnerability
from app.models.repository import Repository
from app.models.user import User

logger = logging.getLogger(__name__)

class PDFReportService:
    """
    Professional PDF Report Generation Service
    Matches Sandbox Security / Pay10 Black Box Penetration Testing Report Standards.
    """

    def __init__(self):
        self.base_path = Path(__file__).parent.parent
        self.templates_path = self.base_path / "templates" / "reports"
        self.static_path = self.base_path / "static"

        # Initialize Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.templates_path)),
            autoescape=True,
            trim_blocks=True,
            lstrip_blocks=True
        )

        # Register filters
        self._register_filters()

        # Ensure directories exist
        self.templates_path.mkdir(parents=True, exist_ok=True)
        self.static_path.mkdir(parents=True, exist_ok=True)

    def _register_filters(self):
        """Register Jinja2 filters for template rendering"""

        def datetime_format(dt, format_type='full'):
            """Format datetime objects in various formats"""
            if isinstance(dt, str):
                try:
                    dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
                except ValueError:
                    return dt

            if not dt:
                return "N/A"

            formats = {
                'full': "%B %d, %Y at %I:%M %p UTC",
                'date': "%B %d, %Y",
                'time': "%I:%M %p UTC",
                'short': "%m/%d/%Y",
                'iso': "%Y-%m-%d %H:%M:%S",
                'ordinal': self._format_ordinal_date(dt),
                'month_year': "%B %Y"
            }

            return dt.strftime(formats.get(format_type, formats['full']))

        def currency(value):
            """Format numbers as currency"""
            try:
                return f"${float(value):,.0f}"
            except (ValueError, TypeError):
                return "$0"

        def percentage(value):
            """Format numbers as percentage"""
            try:
                return f"{float(value):.1f}%"
            except (ValueError, TypeError):
                return "0%"

        # Register all filters
        self.jinja_env.filters['datetime_format'] = datetime_format
        self.jinja_env.filters['currency'] = currency
        self.jinja_env.filters['percentage'] = percentage

    def _format_ordinal_date(self, dt):
        """Format date with ordinal suffix (e.g., November 7th, 2025)"""
        if not dt:
            return "N/A"

        day = dt.day
        if 4 <= day <= 20 or 24 <= day <= 30:
            suffix = "th"
        else:
            suffix = ["st", "nd", "rd"][day % 10 - 1]

        return dt.strftime(f"%B {day}{suffix}, %Y")

    async def generate_security_report(
        self,
        scan_id: int,
        db: Session,
        user: User,
        report_type: str = "comprehensive"
    ) -> bytes:
        """
        Generate professional security report PDF matching Sandbox Security template.

        Args:
            scan_id: ID of the scan to generate report for
            db: Database session
            user: Current user
            report_type: Type of report (comprehensive or executive)

        Returns:
            bytes: PDF content
        """
        try:
            # Get scan data with all relationships
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if not scan:
                raise ValueError(f"Scan {scan_id} not found")

            # Get repository
            repository = db.query(Repository).filter(Repository.id == scan.repository_id).first()
            if not repository:
                raise ValueError(f"Repository {scan.repository_id} not found")

            # Verify ownership
            if repository.owner_id != user.id:
                raise PermissionError("Access denied to scan")

            # Get vulnerabilities ordered by severity and risk
            vulnerabilities = db.query(Vulnerability).filter(
                Vulnerability.scan_id == scan_id
            ).order_by(
                Vulnerability.severity.desc(),
                Vulnerability.risk_score.desc()
            ).all()

            # Prepare comprehensive report data
            report_data = self._prepare_report_data(scan, repository, vulnerabilities, user)

            # Generate PDF
            return await self._generate_comprehensive_report(report_data)

        except Exception as e:
            logger.error(f"Error generating PDF report for scan {scan_id}: {e}", exc_info=True)
            raise

    def _prepare_report_data(self, scan: Scan, repository: Repository, vulnerabilities: List[Vulnerability], user: User) -> Dict[str, Any]:
        """
        Prepare comprehensive data structure for report generation.
        Matches the exact structure needed for the Sandbox Security template.
        """

        # ========================================
        # SECTION 1: Calculate Basic Metrics
        # ========================================

        total_vulns = len(vulnerabilities)

        # Count vulnerabilities by severity
        severity_counts = {
            'critical': sum(1 for v in vulnerabilities if v.severity == 'critical'),
            'high': sum(1 for v in vulnerabilities if v.severity == 'high'),
            'medium': sum(1 for v in vulnerabilities if v.severity == 'medium'),
            'low': sum(1 for v in vulnerabilities if v.severity == 'low')
        }

        # ========================================
        # SECTION 2: CVSS Ranges and Definitions
        # ========================================

        cvss_ranges = {
            'critical': '9.0-10.0',
            'high': '7.0-8.9',
            'medium': '4.0-6.9',
            'low': '0.1-3.9',
            'informational': 'N/A'
        }

        severity_definitions = {
            'critical': 'Exploitation is straightforward and usually results in system-level compromise. It is advised to form a plan of action and patch immediately.',
            'high': 'Exploitation is more difficult but could cause elevated privileges and potentially a loss of data or downtime. It is advised to form a plan of action and patch as soon as possible.',
            'medium': 'Vulnerabilities exist but are not exploitable or require extra steps such as social engineering, access (privileged or regular). It is advised to form a plan of action and patch after high-priority issues have been resolved.',
            'low': 'Vulnerabilities are non-exploitable but would reduce an organization\'s attack surface. It is advised to form a plan of action and patch during the next maintenance window.',
            'informational': 'No vulnerability exists. Additional information is provided regarding items noticed during testing, strong controls, and additional documentation.'
        }

        # ========================================
        # SECTION 3: Risk Assessment
        # ========================================

        risk_score = self._calculate_overall_risk(vulnerabilities)
        risk_level = self._get_risk_level(risk_score)
        threat_level = self._calculate_threat_level(vulnerabilities)

        # ========================================
        # SECTION 4: Vulnerability Categorization
        # ========================================

        # Group by category
        categories = {}
        for vuln in vulnerabilities:
            cat = vuln.category or 'Other'
            if cat not in categories:
                categories[cat] = {
                    'count': 0,
                    'critical': 0,
                    'high': 0,
                    'medium': 0,
                    'low': 0,
                    'vulnerabilities': []
                }
            categories[cat]['count'] += 1
            categories[cat][vuln.severity] += 1
            categories[cat]['vulnerabilities'].append(vuln)

        # Group by OWASP category
        owasp_mapping = {}
        for vuln in vulnerabilities:
            if vuln.owasp_category:
                cat = vuln.owasp_category
                if cat not in owasp_mapping:
                    owasp_mapping[cat] = {
                        'count': 0,
                        'critical': 0,
                        'high': 0,
                        'medium': 0,
                        'low': 0
                    }
                owasp_mapping[cat]['count'] += 1
                owasp_mapping[cat][vuln.severity] += 1

        # ========================================
        # SECTION 5: File Analysis
        # ========================================

        file_counts = Counter(v.file_path for v in vulnerabilities if v.file_path)

        # Identify hotspot files (files with multiple vulnerabilities)
        hotspots = []
        for file_path, count in file_counts.items():
            if count >= 2:
                file_vulns = [v for v in vulnerabilities if v.file_path == file_path]
                hotspots.append({
                    'file': file_path,
                    'vulnerability_count': count,
                    'risk_level': 'Critical' if count >= 5 else 'High' if count >= 3 else 'Medium',
                    'severity_breakdown': {
                        'critical': sum(1 for v in file_vulns if v.severity == 'critical'),
                        'high': sum(1 for v in file_vulns if v.severity == 'high'),
                        'medium': sum(1 for v in file_vulns if v.severity == 'medium'),
                        'low': sum(1 for v in file_vulns if v.severity == 'low'),
                    },
                    'recommendation': 'Priority refactoring required' if count >= 3 else 'Review and remediate'
                })

        # Sort hotspots by vulnerability count
        hotspots.sort(key=lambda x: x['vulnerability_count'], reverse=True)

        # ========================================
        # SECTION 6: Attack Vector Analysis
        # ========================================

        attack_vectors = []

        # Injection vulnerabilities
        injection_vulns = [v for v in vulnerabilities if 'injection' in (v.category or '').lower()]
        if injection_vulns:
            attack_vectors.append({
                'vector': 'Code Injection',
                'count': len(injection_vulns),
                'risk': 'High' if len(injection_vulns) >= 3 else 'Medium',
                'description': 'Malicious code execution through input validation failures',
                'severity_breakdown': {
                    'critical': sum(1 for v in injection_vulns if v.severity == 'critical'),
                    'high': sum(1 for v in injection_vulns if v.severity == 'high'),
                    'medium': sum(1 for v in injection_vulns if v.severity == 'medium'),
                }
            })

        # Authentication/Authorization issues
        auth_vulns = [v for v in vulnerabilities if any(
            keyword in (v.category or '').lower()
            for keyword in ['authentication', 'authorization', 'access control']
        )]
        if auth_vulns:
            attack_vectors.append({
                'vector': 'Authentication & Authorization',
                'count': len(auth_vulns),
                'risk': 'High' if len(auth_vulns) >= 2 else 'Medium',
                'description': 'Unauthorized access through weak authentication or authorization controls',
                'severity_breakdown': {
                    'critical': sum(1 for v in auth_vulns if v.severity == 'critical'),
                    'high': sum(1 for v in auth_vulns if v.severity == 'high'),
                    'medium': sum(1 for v in auth_vulns if v.severity == 'medium'),
                }
            })

        # Cryptography issues
        crypto_vulns = [v for v in vulnerabilities if 'crypt' in (v.category or '').lower()]
        if crypto_vulns:
            attack_vectors.append({
                'vector': 'Cryptographic Weaknesses',
                'count': len(crypto_vulns),
                'risk': 'High',
                'description': 'Weak cryptographic implementations that could expose sensitive data',
                'severity_breakdown': {
                    'critical': sum(1 for v in crypto_vulns if v.severity == 'critical'),
                    'high': sum(1 for v in crypto_vulns if v.severity == 'high'),
                    'medium': sum(1 for v in crypto_vulns if v.severity == 'medium'),
                }
            })

        # ========================================
        # SECTION 7: Business Impact Calculations
        # ========================================

        # Cost estimates based on industry standards
        critical_cost = severity_counts['critical'] * 50000
        high_cost = severity_counts['high'] * 25000
        medium_cost = severity_counts['medium'] * 10000
        low_cost = severity_counts['low'] * 2500

        potential_cost = critical_cost + high_cost + medium_cost + low_cost
        remediation_cost = self._calculate_remediation_cost(vulnerabilities)
        cost_avoidance = max(0, potential_cost - remediation_cost)
        roi_percentage = ((potential_cost - remediation_cost) / max(remediation_cost, 1)) * 100 if remediation_cost > 0 else 0

        # Resource estimation (developer days)
        severity_effort = {'critical': 3, 'high': 2, 'medium': 1, 'low': 0.5}
        total_days = sum(severity_effort.get(v.severity, 1) for v in vulnerabilities)
        security_specialist_days = max(5, total_days * 0.2)
        project_manager_days = max(2, total_days * 0.1)

        # Timeline estimation
        timeline_weeks = max(2, total_days / 5)

        # ========================================
        # SECTION 8: Prepare Metadata
        # ========================================

        metadata = {
            'generated_at': datetime.utcnow(),
            'report_version': '1.0',
            'report_id': f"PEN-TEST-{repository.name.upper()}-{scan.id}",
            'company': 'Sandbox Security',
            'tagline': 'sandboxsecurity.ai',
            'contact_email': 'rahul@sandboxsecurity.ai',
            'scan_id': scan.id,
            'analyst': {
                'name': user.full_name or user.email,
                'email': user.email,
                'title': 'Security Assessment Specialist',
                'organization': 'Sandbox Security'
            },
            'classification': 'CONFIDENTIAL',
            'client_name': repository.name,
        }

        # ========================================
        # SECTION 9: Repository Information
        # ========================================

        repository_data = {
            'name': repository.name,
            'full_name': repository.full_name,
            'description': repository.description or "Security assessment of application codebase",
            'source': repository.source_type.title() if repository.source_type else 'Unknown',
            'url': repository.html_url or repository.full_name,
            'language': repository.language or "Mixed",
            'is_private': repository.is_private,
            'visibility': "Private" if repository.is_private else "Public",
            'owner': repository.owner.email if hasattr(repository, 'owner') else 'N/A',
        }

        # ========================================
        # SECTION 10: Scan Information
        # ========================================

        scan_data = {
            'id': scan.id,
            'status': scan.status.title(),
            'started_at': scan.started_at,
            'completed_at': scan.completed_at,
            'duration': scan.scan_duration or "Unknown",
            'files_scanned': scan.total_files_scanned or 0,
            'methodology': 'Black Box Penetration Testing',
            'scan_type': getattr(scan, 'scan_type', 'standard').title(),
            'assessment_period': self._format_assessment_period(scan.started_at, scan.completed_at),
            'assessment_date': scan.completed_at or scan.started_at or datetime.utcnow(),
        }

        # ========================================
        # SECTION 11: Security Metrics
        # ========================================

        security_data = {
            'total_vulnerabilities': total_vulns,
            'severity_counts': severity_counts,
            'severity_definitions': severity_definitions,
            'cvss_ranges': cvss_ranges,
            'security_score': scan.security_score or 0,
            'code_coverage': scan.code_coverage or 0,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'threat_level': threat_level,
            'vulnerability_density': len(vulnerabilities) / max(1, scan.total_files_scanned or 1),
        }

        # ========================================
        # SECTION 12: Process Vulnerabilities
        # ========================================

        processed_vulnerabilities = []
        for i, v in enumerate(vulnerabilities):
            vuln_data = {
                'index': i + 1,
                'id': v.id,
                'title': v.title,
                'description': v.description or 'No description provided',
                'severity': v.severity,
                'severity_label': v.severity.upper(),
                'category': v.category or 'Uncategorized',
                'cwe_id': v.cwe_id,
                'owasp_category': v.owasp_category,
                'file_path': v.file_path,
                'line_number': v.line_number,
                'code_snippet': v.code_snippet,
                'recommendation': v.recommendation or 'Remediate this vulnerability following security best practices',
                'fix_suggestion': v.fix_suggestion,
                'risk_score': v.risk_score or 5.0,
                'exploitability': v.exploitability or 'Medium',
                'impact': v.impact or 'Medium',
                'detected_at': v.detected_at,
                'business_impact': self._assess_business_impact(v.severity),
                'remediation_effort': self._estimate_remediation_effort(v.category),
                'priority_score': self._calculate_priority_score(v),
                'cvss_score': self._estimate_cvss_score(v.severity, v.risk_score),
            }
            processed_vulnerabilities.append(vuln_data)

        # ========================================
        # SECTION 13: Analysis Data
        # ========================================

        analysis_data = {
            'categories': categories,
            'hotspots': hotspots,
            'attack_vectors': attack_vectors,
            'owasp_mapping': owasp_mapping,
            'file_analysis': {
                'total_affected_files': len(file_counts),
                'vulnerable_files': len([f for f in file_counts if file_counts[f] > 0]),
                'most_vulnerable_files': dict(file_counts.most_common(10)),
                'vulnerability_density': len(vulnerabilities) / max(1, scan.total_files_scanned or 1),
                'hotspot_count': len(hotspots),
            },
            'technology_analysis': {
                'primary_language': repository.language or 'Mixed',
                'security_maturity': self._assess_security_maturity(vulnerabilities),
                'code_quality': self._assess_code_quality(vulnerabilities, scan.total_files_scanned or 1),
            }
        }

        # ========================================
        # SECTION 14: Business Data
        # ========================================

        business_data = {
            'potential_cost': potential_cost,
            'remediation_cost': remediation_cost,
            'cost_avoidance': cost_avoidance,
            'roi_percentage': max(0, roi_percentage),
            'payback_period_months': self._calculate_payback_period(remediation_cost, potential_cost),
            'business_risk_level': self._assess_business_risk_level(vulnerabilities),
            'compliance_impact': self._assess_compliance_impact(vulnerabilities),
            'operational_impact': self._assess_operational_impact(vulnerabilities),
            'reputation_impact': self._assess_reputation_impact(vulnerabilities),
        }

        # ========================================
        # SECTION 15: Compliance Data
        # ========================================

        compliance_data = {
            'owasp_mapping': owasp_mapping,
            'cwe_coverage': len(set(v.cwe_id for v in vulnerabilities if v.cwe_id)),
            'compliance_scores': {
                'OWASP Top 10': self._calculate_owasp_compliance(vulnerabilities),
                'CWE Coverage': min(100, len(set(v.cwe_id for v in vulnerabilities if v.cwe_id)) * 5),
                'ISO 27001': 82.0,
                'NIST Framework': 80.0,
            },
            'overall_compliance': self._calculate_overall_compliance(vulnerabilities),
        }

        # ========================================
        # SECTION 16: Recommendations
        # ========================================

        recommendations = self._generate_recommendations(scan, vulnerabilities, severity_counts)

        # ========================================
        # SECTION 17: Resource Estimates
        # ========================================

        resources = {
            'developer_days': total_days,
            'security_specialist_days': security_specialist_days,
            'project_manager_days': project_manager_days,
            'estimated_cost': total_days * 800,  # $800 per developer day
            'timeline_weeks': timeline_weeks,
            'team_size': max(2, int(total_days / timeline_weeks / 5)) if timeline_weeks > 0 else 2,
        }

        # ========================================
        # SECTION 18: Executive Summary
        # ========================================

        executive_summary = self._generate_executive_summary(
            repository_data,
            severity_counts,
            risk_level,
            scan_data
        )

        # ========================================
        # SECTION 19: Return Complete Data Structure
        # ========================================

        return {
            'metadata': metadata,
            'repository': repository_data,
            'scan': scan_data,
            'security': security_data,
            'vulnerabilities': processed_vulnerabilities,
            'analysis': analysis_data,
            'business': business_data,
            'compliance': compliance_data,
            'recommendations': recommendations,
            'resources': resources,
            'executive_summary': executive_summary,
        }

    # ========================================
    # HELPER METHODS FOR DATA PREPARATION
    # ========================================

    def _format_assessment_period(self, start_date, end_date):
        """Format assessment period as 'Month Day, Year to Month Day, Year'"""
        if not start_date:
            return "N/A"

        start_str = start_date.strftime("%B %d, %Y") if start_date else "N/A"
        end_str = end_date.strftime("%B %d, %Y") if end_date else "Ongoing"

        return f"{start_str} to {end_str}"

    def _estimate_cvss_score(self, severity: str, risk_score: Optional[float]) -> str:
        """Estimate CVSS score based on severity"""
        if risk_score:
            return f"{risk_score:.1f}"

        score_ranges = {
            'critical': '9.5',
            'high': '7.5',
            'medium': '5.5',
            'low': '2.5'
        }
        return score_ranges.get(severity, '5.0')

    def _calculate_payback_period(self, remediation_cost: float, potential_cost: float) -> float:
        """Calculate payback period in months"""
        if potential_cost == 0:
            return 0

        monthly_savings = potential_cost / 12
        if monthly_savings == 0:
            return 12

        return max(1, remediation_cost / monthly_savings)

    def _calculate_owasp_compliance(self, vulnerabilities: List[Vulnerability]) -> float:
        """Calculate OWASP Top 10 compliance score"""
        if not vulnerabilities:
            return 100.0

        owasp_vulns = [v for v in vulnerabilities if v.owasp_category]
        if not owasp_vulns:
            return 90.0

        # Calculate based on severity
        critical_count = sum(1 for v in owasp_vulns if v.severity == 'critical')
        high_count = sum(1 for v in owasp_vulns if v.severity == 'high')

        if critical_count > 0:
            return max(50, 100 - (critical_count * 15) - (high_count * 5))
        elif high_count > 0:
            return max(70, 100 - (high_count * 5))
        else:
            return 85.0

    def _calculate_overall_compliance(self, vulnerabilities: List[Vulnerability]) -> float:
        """Calculate overall compliance score"""
        if not vulnerabilities:
            return 95.0

        total_vulns = len(vulnerabilities)
        critical_count = sum(1 for v in vulnerabilities if v.severity == 'critical')
        high_count = sum(1 for v in vulnerabilities if v.severity == 'high')

        # Base score
        base_score = 100

        # Deduct points
        base_score -= (critical_count * 20)
        base_score -= (high_count * 10)
        base_score -= ((total_vulns - critical_count - high_count) * 2)

        return max(40.0, min(100.0, base_score))

    def _calculate_overall_risk(self, vulnerabilities: List[Vulnerability]) -> float:
        """Calculate overall risk score (0-10)"""
        if not vulnerabilities:
            return 0.0

        weights = {'critical': 10, 'high': 7, 'medium': 4, 'low': 1}
        total_risk = sum(weights.get(v.severity, 1) * (v.risk_score or 5.0) for v in vulnerabilities)
        max_risk = len(vulnerabilities) * 10 * 10

        return min(10.0, (total_risk / max(max_risk, 1)) * 10)

    def _get_risk_level(self, score: float) -> str:
        """Convert risk score to risk level"""
        if score >= 8.0:
            return "Critical"
        elif score >= 6.0:
            return "High"
        elif score >= 4.0:
            return "Medium"
        elif score >= 2.0:
            return "Low"
        else:
            return "Minimal"

    def _calculate_threat_level(self, vulnerabilities: List[Vulnerability]) -> str:
        """Calculate overall threat level"""
        critical_count = sum(1 for v in vulnerabilities if v.severity == 'critical')
        high_count = sum(1 for v in vulnerabilities if v.severity == 'high')

        if critical_count >= 5:
            return "Severe"
        elif critical_count > 0 or high_count >= 10:
            return "High"
        elif high_count > 0:
            return "Moderate"
        else:
            return "Low"

    def _assess_business_impact(self, severity: str) -> str:
        """Assess business impact based on severity"""
        severity_impact = {
            'critical': 'Very High - Potential for complete system compromise',
            'high': 'High - Significant operational disruption possible',
            'medium': 'Medium - Limited operational impact',
            'low': 'Low - Minimal business impact'
        }
        return severity_impact.get(severity, 'Medium')

    def _estimate_remediation_effort(self, category: str) -> str:
        """Estimate remediation effort based on vulnerability category"""
        category_effort = {
            'injection': 'High - Requires code refactoring and input validation',
            'authentication': 'Medium - Update authentication logic',
            'authorization': 'Medium - Review and update access controls',
            'configuration': 'Low - Configuration changes',
            'cryptography': 'High - Update cryptographic implementations',
            'xss': 'Medium - Input sanitization and output encoding',
            'csrf': 'Low - Add CSRF tokens',
            'sensitive data': 'High - Implement proper data protection',
        }

        if not category:
            return 'Medium - Standard remediation effort'

        category_lower = category.lower()
        for key in category_effort:
            if key in category_lower:
                return category_effort[key]

        return 'Medium - Standard remediation effort'

    def _calculate_priority_score(self, vuln: Vulnerability) -> float:
        """Calculate priority score for vulnerability"""
        severity_weights = {'critical': 10, 'high': 7, 'medium': 4, 'low': 1}
        base_score = severity_weights.get(vuln.severity, 1)
        risk_multiplier = (vuln.risk_score or 5.0) / 10.0

        return round(base_score * risk_multiplier, 2)

    def _calculate_remediation_cost(self, vulnerabilities: List[Vulnerability]) -> float:
        """Calculate estimated remediation cost"""
        base_costs = {
            'critical': 8000,
            'high': 4000,
            'medium': 1500,
            'low': 500
        }
        return sum(base_costs.get(v.severity, 1000) for v in vulnerabilities)

    def _assess_security_maturity(self, vulnerabilities: List[Vulnerability]) -> str:
        """Assess security maturity level"""
        vuln_count = len(vulnerabilities)
        critical_count = sum(1 for v in vulnerabilities if v.severity == 'critical')

        if critical_count > 5 or vuln_count > 20:
            return "Immature - Significant security improvements needed"
        elif critical_count > 0 or vuln_count > 10:
            return "Developing - Security practices need enhancement"
        elif vuln_count > 5:
            return "Mature - Good security practices with room for improvement"
        else:
            return "Advanced - Strong security posture"

    def _assess_code_quality(self, vulnerabilities: List[Vulnerability], total_files: int) -> str:
        """Assess code quality based on vulnerability density"""
        if total_files == 0:
            return "Unknown"

        density = len(vulnerabilities) / total_files

        if density > 1.0:
            return "Poor - High vulnerability density"
        elif density > 0.5:
            return "Fair - Moderate vulnerability density"
        elif density > 0.2:
            return "Good - Low vulnerability density"
        else:
            return "Excellent - Very low vulnerability density"

    def _assess_business_risk_level(self, vulnerabilities: List[Vulnerability]) -> str:
        """Assess business risk level"""
        critical_count = sum(1 for v in vulnerabilities if v.severity == 'critical')
        high_count = sum(1 for v in vulnerabilities if v.severity == 'high')

        if critical_count >= 3:
            return "Severe - Immediate executive attention required"
        elif critical_count > 0:
            return "High - Priority business concern"
        elif high_count >= 5:
            return "Moderate - Requires management attention"
        else:
            return "Low - Standard business risk"

    def _assess_compliance_impact(self, vulnerabilities: List[Vulnerability]) -> str:
        """Assess compliance impact"""
        high_impact_categories = ['injection', 'authentication', 'authorization', 'cryptography', 'sensitive data']
        compliance_vulns = [v for v in vulnerabilities if any(
            cat in (v.category or '').lower() for cat in high_impact_categories
        )]

        if len(compliance_vulns) >= 5:
            return "High Risk - May violate compliance requirements"
        elif len(compliance_vulns) > 0:
            return "Medium Risk - Potential compliance concerns"
        else:
            return "Low Risk - Minimal compliance impact"

    def _assess_operational_impact(self, vulnerabilities: List[Vulnerability]) -> str:
        """Assess operational impact"""
        critical_operational = sum(1 for v in vulnerabilities if v.severity in ['critical', 'high'])

        if critical_operational >= 10:
            return "Severe Disruption - Critical operational risk"
        elif critical_operational >= 5:
            return "Moderate Disruption - Significant operational impact"
        elif critical_operational > 0:
            return "Minor Disruption - Limited operational impact"
        else:
            return "No Disruption - Minimal operational impact"

    def _assess_reputation_impact(self, vulnerabilities: List[Vulnerability]) -> str:
        """Assess reputation impact"""
        public_facing = sum(1 for v in vulnerabilities if any(
            keyword in (v.category or '').lower()
            for keyword in ['web', 'api', 'xss', 'injection', 'authentication']
        ))
        critical_count = sum(1 for v in vulnerabilities if v.severity == 'critical')

        if critical_count >= 3 or public_facing >= 5:
            return "High Risk - Potential for public exposure and brand damage"
        elif critical_count > 0 or public_facing > 0:
            return "Medium Risk - Reputation concerns if exploited"
        else:
            return "Low Risk - Limited reputation impact"

    def _generate_executive_summary(
        self,
        repository_data: Dict[str, Any],
        severity_counts: Dict[str, int],
        risk_level: str,
        scan_data: Dict[str, Any]
    ) -> str:
        """Generate executive summary text"""

        total_vulns = sum(severity_counts.values())
        repo_name = repository_data['name']

        summary_parts = []

        # Opening statement
        summary_parts.append(
            f"Sandbox Security has been engaged by {repo_name} to conduct a comprehensive Black Box Penetration Test "
            f"aimed at identifying security weaknesses in the application codebase."
        )

        # Assessment details
        summary_parts.append(
            f"Sandbox Security conducted an external, Black Box Penetration Test against {repo_name}'s estate to "
            f"simulate an attack with no insider knowledge. The objective was to identify potential vulnerabilities that "
            f"could lead to unauthorized access, data exposure, or disruption of critical services and to determine the potential "
            f"business impact."
        )

        # Findings summary
        if total_vulns == 0:
            summary_parts.append(
                f"The assessment found no significant security vulnerabilities. The application demonstrates strong security controls "
                f"and adherence to security best practices."
            )
        else:
            findings_text = f"During the engagement we discovered {total_vulns} findings across reconnaissance, access control, and application logic layers."

            if severity_counts['critical'] > 0:
                findings_text += f" There {'are' if severity_counts['critical'] > 1 else 'is'} {severity_counts['critical']} critical issue{'s' if severity_counts['critical'] > 1 else ''} that require immediate attention."

            if severity_counts['high'] > 0:
                findings_text += f" Additionally, {severity_counts['high']} high-severity vulnerabilities were identified that pose significant security risks."

            summary_parts.append(findings_text)

        # Recommendations teaser
        if total_vulns > 0:
            summary_parts.append(
                f"Recommendations in this report focus on immediate mitigation for critical and high findings, "
                f"followed by medium-term improvements to authentication, monitoring, and secure development controls."
            )

        return " ".join(summary_parts)

    def _generate_recommendations(
        self,
        scan: Scan,
        vulnerabilities: List[Vulnerability],
        severity_counts: Dict[str, int]
    ) -> Dict[str, Any]:
        """Generate comprehensive recommendations matching template format"""

        immediate_actions = []
        short_term_actions = []
        long_term_actions = []

        # ========================================
        # IMMEDIATE ACTIONS (0-7 days)
        # ========================================

        # Critical vulnerabilities
        critical_vulns = [v for v in vulnerabilities if v.severity == 'critical']
        if critical_vulns:
            immediate_actions.append({
                'priority': 'CRITICAL',
                'action': f'Address {len(critical_vulns)} critical security vulnerabilities',
                'timeline': '24-48 hours',
                'effort': 'High',
                'impact': 'Prevents potential security breaches and data loss',
                'description': 'These vulnerabilities pose immediate risk of system compromise and must be patched urgently.'
            })

        # High severity vulnerabilities
        high_vulns = [v for v in vulnerabilities if v.severity == 'high']
        if high_vulns and len(high_vulns) >= 3:
            immediate_actions.append({
                'priority': 'HIGH',
                'action': f'Create incident response plan for {len(high_vulns)} high-severity issues',
                'timeline': '3-7 days',
                'effort': 'Medium',
                'impact': 'Reduces risk exposure and prepares for rapid remediation',
                'description': 'Prioritize and plan remediation activities for high-severity vulnerabilities.'
            })

        # If no critical/high, add general immediate action
        if not immediate_actions:
            immediate_actions.append({
                'priority': 'STANDARD',
                'action': 'Review and validate all security findings',
                'timeline': '1-3 days',
                'effort': 'Low',
                'impact': 'Ensures accurate understanding of security posture',
                'description': 'Conduct thorough review of all identified vulnerabilities with development team.'
            })

        # ========================================
        # SHORT-TERM ACTIONS (1-3 months)
        # ========================================

        # High severity remediation
        if high_vulns:
            short_term_actions.append({
                'priority': 'HIGH',
                'action': f'Remediate {len(high_vulns)} high-severity vulnerabilities',
                'timeline': '2-4 weeks',
                'effort': 'Medium to High',
                'impact': 'Significantly reduces security risk exposure',
                'description': 'Implement fixes for all high-severity findings following secure coding practices.'
            })

        # Medium severity remediation
        medium_vulns = [v for v in vulnerabilities if v.severity == 'medium']
        if medium_vulns:
            short_term_actions.append({
                'priority': 'MEDIUM',
                'action': f'Address {len(medium_vulns)} medium-severity vulnerabilities',
                'timeline': '1-2 months',
                'effort': 'Medium',
                'impact': 'Improves overall security posture',
                'description': 'Remediate medium-severity issues as part of regular development cycles.'
            })

        # Security training
        if len(vulnerabilities) >= 5:
            short_term_actions.append({
                'priority': 'STRATEGIC',
                'action': 'Conduct security awareness training for development team',
                'timeline': '1-2 months',
                'effort': 'Medium',
                'impact': 'Prevents future vulnerabilities through education',
                'description': 'Train developers on secure coding practices and common vulnerability patterns.'
            })

        # ========================================
        # LONG-TERM ACTIONS (3-12 months)
        # ========================================

        long_term_actions.extend([
            {
                'priority': 'STRATEGIC',
                'action': 'Implement automated security scanning in CI/CD pipeline',
                'timeline': '3-4 months',
                'effort': 'Medium',
                'impact': 'Prevents vulnerabilities from reaching production',
                'description': 'Integrate SAST, DAST, and dependency scanning tools into development workflow.'
            },
            {
                'priority': 'STRATEGIC',
                'action': 'Establish Security Champions program',
                'timeline': '3-6 months',
                'effort': 'Medium',
                'impact': 'Builds security culture within development teams',
                'description': 'Designate and train security champions in each development team.'
            },
            {
                'priority': 'STRATEGIC',
                'action': 'Implement continuous security monitoring',
                'timeline': '6-9 months',
                'effort': 'High',
                'impact': 'Enables rapid detection and response to security incidents',
                'description': 'Deploy security monitoring tools and establish incident response procedures.'
            },
            {
                'priority': 'STRATEGIC',
                'action': 'Conduct annual penetration testing',
                'timeline': 'Ongoing',
                'effort': 'Low',
                'impact': 'Ensures continuous security validation',
                'description': 'Schedule regular penetration tests to validate security controls.'
            }
        ])

        # ========================================
        # RETURN COMPREHENSIVE RECOMMENDATIONS
        # ========================================

        return {
            'immediate_actions': immediate_actions,
            'short_term_actions': short_term_actions,
            'long_term_actions': long_term_actions,
            'summary': f"Total of {len(immediate_actions) + len(short_term_actions) + len(long_term_actions)} recommended actions across all timeframes.",
            'implementation_roadmap': {
                'phase_1': {
                    'name': 'Immediate Response',
                    'duration': '0-7 days',
                    'actions': immediate_actions,
                    'success_metrics': [
                        'Critical vulnerabilities = 0' if severity_counts.get('critical', 0) > 0 else 'All findings validated',
                        'High vulnerabilities documented and prioritized',
                        'Incident response plan created'
                    ]
                },
                'phase_2': {
                    'name': 'Risk Reduction',
                    'duration': '1-3 months',
                    'actions': short_term_actions,
                    'success_metrics': [
                        'All high-severity vulnerabilities remediated',
                        'Security training completed for development team',
                        'Medium-severity issues reduced by 70%'
                    ]
                },
                'phase_3': {
                    'name': 'Security Maturity',
                    'duration': '3-12 months',
                    'actions': long_term_actions,
                    'success_metrics': [
                        'Automated security scanning in CI/CD pipeline',
                        'Security champions program established',
                        'Zero critical vulnerabilities in production',
                        'Continuous monitoring and alerting active'
                    ]
                }
            }
        }

    # ========================================
    # PDF GENERATION METHODS
    # ========================================

    async def _generate_comprehensive_report(self, data: Dict[str, Any]) -> bytes:
        """
        Generate comprehensive security report PDF
        Uses Jinja2 template and WeasyPrint for PDF generation
        """

        try:
            # Load and render HTML template
            template = self.jinja_env.get_template('comprehensive_report.html')
            html_content = template.render(**data)

            # Get CSS styling
            css_content = self._get_report_css()

            # Fix base URL for proper image loading
            base_url = f"file:///{str(self.static_path).replace('\\', '/')}/"

            logger.info(f"Generating PDF report for scan {data['scan']['id']}")
            logger.debug(f"Base URL for assets: {base_url}")

            # Generate PDF with WeasyPrint
            html_doc = HTML(
                string=html_content,
                base_url=base_url
            )
            css_doc = CSS(string=css_content)

            pdf_buffer = io.BytesIO()
            html_doc.write_pdf(
                pdf_buffer,
                stylesheets=[css_doc],
                presentational_hints=True
            )

            pdf_content = pdf_buffer.getvalue()
            logger.info(f"PDF generated successfully: {len(pdf_content)} bytes")

            return pdf_content

        except Exception as e:
            logger.error(f"Error generating PDF: {e}", exc_info=True)
            raise

    def _get_report_css(self) -> str:
        """
        Enhanced CSS for professional report styling
        Matches Sandbox Security penetration testing report template exactly.
        Includes styling for Cover Page, Tables, Charts, and Findings.
        """

        return """
        /* ============================================ */
        /* Sandbox Security Penetration Testing Report */
        /* Professional PDF Styling - Matching Template */
        /* ============================================ */

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        /* ============================================ */
        /* PAGE SETUP AND CONFIGURATION */
        /* ============================================ */

        @page {
            size: A4;
            margin: 20mm 20mm 25mm 20mm;

            @bottom-left {
                content: "Sandboxsecurity.ai";
                font-family: 'Inter', sans-serif;
                font-size: 8pt;
                color: #1E3A8A;
                font-weight: 500;
            }

            @bottom-right {
                content: "Confidential";
                font-family: 'Inter', sans-serif;
                font-size: 8pt;
                color: #DC2626;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            @bottom-center {
                content: counter(page);
                font-family: 'Inter', sans-serif;
                font-size: 8pt;
                color: #1E3A8A;
                font-weight: 600;
            }
        }

        /* Cover Page - No Headers/Footers */
        @page cover {
            margin: 0;
            @bottom-left { content: none; }
            @bottom-right { content: none; }
            @bottom-center { content: none; }
        }

        /* Table of Contents Page */
        @page toc {
            margin: 20mm 20mm 25mm 20mm;
        }

        /* Content Pages */
        @page content {
            margin: 20mm 20mm 25mm 20mm;
        }

        /* ============================================ */
        /* BASE STYLES */
        /* ============================================ */

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1F2937;
            background: #FFFFFF;
            font-size: 10pt;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
        }

        /* ============================================ */
        /* BRAND COLORS - SANDBOX SECURITY */
        /* ============================================ */

        :root {
            /* Primary Colors */
            --primary-blue: #1E3A8A;
            --dark-blue: #1E40AF;
            --light-blue: #3B82F6;
            --sky-blue: #60A5FA;
            --pale-blue: #DBEAFE;

            /* Accent Colors */
            --orange-accent: #F59E0B;
            --yellow-accent: #FCD34D;

            /* Severity Colors */
            --critical-red: #DC2626;
            --high-orange: #EA580C;
            --medium-yellow: #D97706;
            --low-blue: #2563EB;
            --info-gray: #6B7280;

            /* Neutral Colors */
            --dark-gray: #1F2937;
            --medium-gray: #6B7280;
            --light-gray: #F3F4F6;
            --border-gray: #E5E7EB;
            --white: #FFFFFF;

            /* Background Colors */
            --bg-critical: #FEE2E2;
            --bg-high: #FED7AA;
            --bg-medium: #FEF3C7;
            --bg-low: #DBEAFE;
            --bg-info: #F3F4F6;
        }

        /* ============================================ */
        /* COVER PAGE DESIGN */
        /* ============================================ */

        .cover-page {
            page: cover;
            height: 297mm;
            width: 210mm;
            background: #FFFFFF;
            position: relative;
            page-break-after: always;
            overflow: hidden;
        }
        
        /* Blue wave pattern at top - using SVG background */
        .cover-wave-header {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100px;
            background: #3B82F6;
            background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 40%, #1E3A8A 70%, #2563EB 100%);
            z-index: 1;
        }
        
        /* White wave overlay using border-radius */
        .cover-wave-overlay {
            position: absolute;
            top: 60px;
            left: -10%;
            width: 120%;
            height: 80px;
            background: #FFFFFF;
            border-radius: 50% 50% 0 0;
            z-index: 2;
        }
        
        /* Bottom yellow/orange bar */
        .cover-bottom-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 10px;
            background: #F59E0B;
            z-index: 1;
        }
        
        /* Main content container */
        .cover-content {
            position: relative;
            height: 297mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0 50mm;
            z-index: 3;
        }
        
        /* Title section */
        .cover-title {
            text-align: center;
            margin-bottom: 15mm;
        }
        
        .cover-title h1 {
            font-size: 42pt;
            font-weight: 600;
            color: #1E3A8A;
            line-height: 1. 3;
            margin: 0;
            padding: 0;
            letter-spacing: 3px;
        }
        
        . cover-title h2 {
            font-size: 32pt;
            font-weight: 500;
            color: #1E3A8A;
            line-height: 1.3;
            margin: 8px 0 0 0;
            padding: 0;
            letter-spacing: 2px;
            border: none;
        }
        
        /* Repository name */
        .cover-subtitle {
            text-align: center;
            margin-top: 20mm;
        }
        
        .repo-name {
            font-size: 20pt;
            font-weight: 700;
            color: #1E3A8A;
            letter-spacing: 1px;
        }
        
        /* Footer */
        .cover-footer {
            position: absolute;
            bottom: 25mm;
            left: 0;
            right: 0;
            text-align: center;
            z-index: 3;
        }
        
        .footer-company {
            text-align: center;
        }
        
        .company-name {
            font-size: 14pt;
            font-weight: 700;
            color: #1E3A8A;
            letter-spacing: 1px;
        }

        /* ============================================ */
        /* TABLE OF CONTENTS - MATCHING TEMPLATE */
        /* ============================================ */

        .toc-page {
            page: toc;
            page-break-after: always;
            page-break-before: always;
            padding: 0;
        }

        .toc-header {
            margin-bottom: 35px;
        }

        .toc-logo {
            height: 45px;
            width: auto;
            margin-bottom: 25px;
        }

        .toc-title {
            font-size: 28pt;
            font-weight: 700;
            color: var(--primary-blue);
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }

        .toc-section {
            margin-bottom: 20px;
        }

        .toc-main-item {
            font-size: 11pt;
            font-weight: 700;
            color: #000000;
            margin: 12px 0 8px 0;
            padding-bottom: 6px;
            border-bottom: 2px solid var(--primary-blue);
        }

        .toc-item {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding: 6px 0 6px 5px;
            font-size: 9.5pt;
            border-bottom: 1px dotted #D1D5DB;
        }

        .toc-item:last-child {
            border-bottom: none;
        }

        .toc-item-title {
            color: #374151;
            font-weight: 400;
        }

        .toc-item-page {
            color: var(--primary-blue);
            font-weight: 600;
            margin-left: 15px;
        }

        /* ============================================ */
        /* CONTENT PAGES - MAIN STYLING */
        /* ============================================ */

        .content-page {
            page: content;
            page-break-before: always;
        }

        .page-header {
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-gray);
        }

        .page-logo {
            height: 38px;
            width: auto;
        }

        /* ============================================ */
        /* TYPOGRAPHY */
        /* ============================================ */

        h1 {
            font-size: 22pt;
            font-weight: 700;
            color: var(--primary-blue);
            margin-bottom: 20px;
            line-height: 1.2;
            letter-spacing: -0.3px;
            page-break-after: avoid;
        }

        h2 {
            font-size: 16pt;
            font-weight: 600;
            color: var(--primary-blue);
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--primary-blue);
            page-break-after: avoid;
            letter-spacing: -0.2px;
        }

        h3 {
            font-size: 13pt;
            font-weight: 600;
            color: var(--dark-gray);
            margin: 20px 0 12px 0;
            page-break-after: avoid;
        }

        h4 {
            font-size: 11pt;
            font-weight: 600;
            color: var(--dark-gray);
            margin: 15px 0 10px 0;
            page-break-after: avoid;
        }

        p {
            margin-bottom: 10px;
            text-align: justify;
            color: #374151;
            line-height: 1.65;
        }

        strong {
            font-weight: 600;
            color: var(--dark-gray);
        }

        em {
            font-style: italic;
            color: var(--medium-gray);
        }

        /* ============================================ */
        /* INFO BOXES - MATCHING TEMPLATE */
        /* ============================================ */

        .info-box {
            background: #EFF6FF;
            border-left: 4px solid var(--primary-blue);
            border-radius: 4px;
            padding: 15px 20px;
            margin: 18px 0;
            page-break-inside: avoid;
        }

        .info-box-title {
            font-weight: 700;
            color: var(--dark-blue);
            margin-bottom: 10px;
            font-size: 10.5pt;
        }

        .info-box p {
            font-size: 9.5pt;
            margin-bottom: 6px;
            line-height: 1.6;
        }

        .info-box p:last-child {
            margin-bottom: 0;
        }

        .info-box strong {
            color: var(--primary-blue);
        }

        /* Alert variations */
        .info-box.alert-critical {
            background: #FEF2F2;
            border-color: var(--critical-red);
        }

        .info-box.alert-critical .info-box-title {
            color: #991B1B;
        }

        .info-box.alert-warning {
            background: #FFFBEB;
            border-color: var(--medium-yellow);
        }

        .info-box.alert-warning .info-box-title {
            color: #92400E;
        }

        .info-box.alert-success {
            background: #F0FDF4;
            border-color: #10B981;
        }

        .info-box.alert-success .info-box-title {
            color: #065F46;
        }

        /* ============================================ */
        /* SEVERITY TABLE - MATCHING TEMPLATE EXACTLY */
        /* ============================================ */

        .severity-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            page-break-inside: avoid;
            font-size: 9.5pt;
        }

        .severity-table th {
            background: var(--primary-blue);
            color: white;
            padding: 12px 10px;
            text-align: center;
            font-weight: 600;
            font-size: 10pt;
            border: 1px solid var(--primary-blue);
            vertical-align: middle;
        }

        .severity-table td {
            padding: 10px;
            border: 1px solid var(--border-gray);
            vertical-align: top;
            line-height: 1.6;
        }

        .severity-table tr:nth-child(even) {
            background: #F9FAFB;
        }

        /* Severity cell colors - matching template */
        .severity-critical {
            background: var(--bg-critical) !important;
            color: #991B1B;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .severity-high {
            background: var(--bg-high) !important;
            color: #9A3412;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .severity-medium {
            background: var(--bg-medium) !important;
            color: #92400E;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .severity-low {
            background: var(--bg-low) !important;
            color: #1E40AF;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .severity-info {
            background: var(--bg-info) !important;
            color: #4B5563;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* ============================================ */
        /* STATISTICS GRID - RESULTS OVERVIEW */
        /* ============================================ */

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 25px 0;
        }

        .stat-box {
            background: #FFFFFF;
            border: 2px solid var(--border-gray);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .stat-number {
            font-size: 36pt;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 8px;
            display: block;
        }

        .stat-label {
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--medium-gray);
            letter-spacing: 0.5px;
        }

        /* Stat color variants */
        .stat-critical { color: var(--critical-red); }
        .stat-high { color: var(--high-orange); }
        .stat-medium { color: var(--medium-yellow); }
        .stat-low { color: var(--low-blue); }

        /* ============================================ */
        /* VULNERABILITY SECTIONS - MATCHING TEMPLATE */
        /* ============================================ */

        .vulnerability-section {
            margin: 25px 0;
            page-break-inside: avoid;
        }

        .vulnerability-header-box {
            background: var(--primary-blue);
            color: white;
            padding: 12px 20px;
            margin: 20px 0 15px 0;
            border-radius: 4px;
            page-break-after: avoid;
        }

        .vulnerability-header-box h3 {
            color: white;
            margin: 0;
            font-size: 13pt;
            font-weight: 600;
            letter-spacing: 0.3px;
        }

        /* Vulnerability Card - matching template design */
        .vulnerability-card {
            background: #FFFFFF;
            border: 1px solid var(--border-gray);
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .vuln-title-section {
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--light-gray);
        }

        .vuln-title {
            font-size: 12pt;
            font-weight: 700;
            color: var(--dark-gray);
            margin-bottom: 10px;
            line-height: 1.3;
        }

        .vuln-meta {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 9pt;
            color: var(--medium-gray);
        }

        .vuln-meta span {
            display: inline-block;
        }

        .vuln-section {
            margin: 15px 0;
        }

        .vuln-section-title {
            font-weight: 700;
            color: var(--primary-blue);
            margin-bottom: 8px;
            font-size: 10pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .vuln-section p {
            font-size: 9.5pt;
            line-height: 1.65;
            margin-bottom: 8px;
        }

        /* Code Block Styling */
        .code-block {
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-left: 3px solid var(--primary-blue);
            border-radius: 4px;
            padding: 12px 15px;
            margin: 10px 0;
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 8.5pt;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.5;
            color: #1F2937;
        }

        .code-block code {
            font-family: inherit;
        }

        /* ============================================ */
        /* BADGES - SEVERITY INDICATORS */
        /* ============================================ */

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 8.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }

        .badge-critical { background: var(--critical-red); color: white; }
        .badge-high { background: var(--high-orange); color: white; }
        .badge-medium { background: var(--medium-yellow); color: white; }
        .badge-low { background: var(--low-blue); color: white; }
        .badge-info { background: var(--info-gray); color: white; }

        /* ============================================ */
        /* LISTS - ORDERED AND UNORDERED */
        /* ============================================ */

        ul, ol {
            margin: 12px 0 12px 25px;
            padding: 0;
        }

        li {
            margin-bottom: 8px;
            font-size: 9.5pt;
            color: #374151;
            line-height: 1.65;
        }

        ul li {
            list-style-type: disc;
        }

        ul li::marker {
            color: var(--primary-blue);
        }

        ol li {
            list-style-type: decimal;
        }

        ol li::marker {
            color: var(--primary-blue);
            font-weight: 600;
        }

        /* Nested lists */
        ul ul, ol ul, ul ol, ol ol {
            margin-top: 6px;
            margin-bottom: 6px;
        }

        /* ============================================ */
        /* TABLES - GENERAL DATA TABLES */
        /* ============================================ */

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 18px 0;
            font-size: 9.5pt;
            page-break-inside: auto;
        }

        .data-table thead {
            background: var(--light-gray);
        }

        .data-table th {
            border: 1px solid var(--border-gray);
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            color: var(--dark-gray);
            background: var(--light-gray);
        }

        .data-table td {
            border: 1px solid var(--border-gray);
            padding: 9px 8px;
            vertical-align: top;
            line-height: 1.5;
        }

        .data-table tr:nth-child(even) {
            background: #F9FAFB;
        }

        .data-table tr:hover {
            background: #F3F4F6;
        }

        /* ============================================ */
        /* RECOMMENDATIONS SECTION */
        /* ============================================ */

        .recommendation-section {
            margin: 25px 0;
            page-break-inside: avoid;
        }

        .recommendation-header {
            background: var(--light-blue);
            color: white;
            padding: 10px 20px;
            border-radius: 4px 4px 0 0;
            margin-bottom: 0;
        }

        .recommendation-header h3 {
            color: white;
            margin: 0;
            font-size: 12pt;
        }

        .recommendation-content {
            background: #EFF6FF;
            border: 1px solid var(--pale-blue);
            border-top: none;
            border-radius: 0 0 4px 4px;
            padding: 18px 20px;
        }

        .recommendation-item {
            background: white;
            border: 1px solid var(--border-gray);
            border-left: 4px solid var(--primary-blue);
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 12px;
        }

        .recommendation-item:last-child {
            margin-bottom: 0;
        }

        .recommendation-priority {
            display: inline-block;
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 3px 8px;
            border-radius: 3px;
            margin-bottom: 8px;
        }

        .priority-critical { background: var(--bg-critical); color: #991B1B; }
        .priority-high { background: var(--bg-high); color: #9A3412; }
        .priority-medium { background: var(--bg-medium); color: #92400E; }
        .priority-strategic { background: #E0E7FF; color: #3730A3; }

        .recommendation-item h4 {
            font-size: 10.5pt;
            color: var(--dark-gray);
            margin: 8px 0;
        }

        .recommendation-item p {
            font-size: 9pt;
            margin: 6px 0;
        }

        /* ============================================ */
        /* CHARTS AND VISUAL ELEMENTS */
        /* ============================================ */

        .chart-container {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border: 1px solid var(--border-gray);
            border-radius: 6px;
            page-break-inside: avoid;
        }

        .chart-title {
            font-size: 11pt;
            font-weight: 600;
            color: var(--dark-gray);
            margin-bottom: 15px;
        }

        /* Progress bars */
        .progress-bar {
            width: 100%;
            height: 20px;
            background: var(--light-gray);
            border-radius: 10px;
            overflow: hidden;
            margin: 8px 0;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--light-blue), var(--primary-blue));
            transition: width 0.3s ease;
        }

        /* Risk indicators */
        .risk-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 6px;
        }

        .risk-indicator.critical { background: var(--critical-red); }
        .risk-indicator.high { background: var(--high-orange); }
        .risk-indicator.medium { background: var(--medium-yellow); }
        .risk-indicator.low { background: var(--low-blue); }

        /* ============================================ */
        /* PAGE BREAKING CONTROLS */
        /* ============================================ */

        .page-break { page-break-after: always; }
        .page-break-before { page-break-before: always; }
        .page-break-avoid { page-break-inside: avoid; }
        .page-break-auto { page-break-inside: auto; }

        /* Avoid breaking after headers */
        h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
        }

        /* Keep figures with captions */
        figure {
            page-break-inside: avoid;
        }

        /* ============================================ */
        /* UTILITY CLASSES */
        /* ============================================ */

        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-justify { text-align: justify; }

        .font-bold { font-weight: 700; }
        .uppercase { text-transform: uppercase; }

        /* Colors */
        .text-primary { color: var(--primary-blue); }
        .text-secondary { color: var(--medium-gray); }
        .text-danger { color: var(--critical-red); }

        /* Background Colors */
        .bg-primary { background-color: var(--primary-blue); }
        .bg-light { background-color: var(--light-gray); }

        /* Margins & Padding */
        .m-0 { margin: 0; }
        .mt-4 { margin-top: 20px; }
        .mb-4 { margin-bottom: 20px; }
        .p-4 { padding: 20px; }

        /* Borders */
        .border { border: 1px solid var(--border-gray); }

        /* ============================================ */
        /* PRINT-SPECIFIC OPTIMIZATIONS */
        /* ============================================ */

        @media print {
            body {
                font-size: 10pt;
                line-height: 1.5;
            }

            .cover-page {
                size: A4;
                height: 297mm;
                width: 210mm;
            }

            .cover-title h1 {
                font-size: 42pt;
            }

            .repo-name {
                font-size: 20pt;
            }

            .stats-grid {
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
            }

            .stat-number {
                font-size: 32pt;
            }

            .vulnerability-card {
                margin-bottom: 15px;
                padding: 18px;
            }

            .code-block {
                font-size: 8pt;
                padding: 10px 12px;
            }

            .footer-logo img {
                height: 65px;
            }

            /* Ensure proper page breaks */
            .vulnerability-section {
                page-break-inside: avoid;
            }

            table {
                page-break-inside: auto;
            }

            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
        }

        /* Orphans and Widows Control */
        p, li {
            orphans: 3;
            widows: 3;
        }
        """

# Create alias for backward compatibility
EnterpriseReportService = PDFReportService