# backend/app/services/pdf_report_service.py - SIMPLIFIED VERSION

import os
import io
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
import weasyprint
from weasyprint import HTML, CSS
from sqlalchemy.orm import Session
from collections import Counter, defaultdict

from app.models.vulnerability import Scan, Vulnerability
from app.models.repository import Repository
from app.models.user import User

logger = logging.getLogger(__name__)

class PDFReportService:
    """Professional PDF Report Generation Service"""
    
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
        
        # Register filters using the correct method
        self._register_filters()
        
        # Ensure directories exist
        self.templates_path.mkdir(parents=True, exist_ok=True)
        self.static_path.mkdir(parents=True, exist_ok=True)
    
    def _register_filters(self):
        """Register Jinja2 filters"""
        
        def datetime_format(dt, format_type='full'):
            if isinstance(dt, str):
                try:
                    dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
                except:
                    return dt
            
            if not dt:
                return "N/A"
            
            formats = {
                'full': "%B %d, %Y at %I:%M %p UTC",
                'date': "%B %d, %Y", 
                'time': "%I:%M %p UTC",
                'short': "%m/%d/%Y",
                'iso': "%Y-%m-%d %H:%M:%S"
            }
            
            return dt.strftime(formats.get(format_type, formats['full']))
        
        def currency(value):
            try:
                return f"${float(value):,.0f}"
            except:
                return "$0"
        
        # Register filters
        self.jinja_env.filters['datetime_format'] = datetime_format
        self.jinja_env.filters['currency'] = currency
    
    async def generate_security_report(
        self,
        scan_id: int,
        db: Session,
        user: User,
        report_type: str = "comprehensive"
    ) -> bytes:
        """Generate professional security report PDF"""
        
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
            
            # Get vulnerabilities
            vulnerabilities = db.query(Vulnerability).filter(
                Vulnerability.scan_id == scan_id
            ).order_by(
                Vulnerability.severity.desc(),
                Vulnerability.risk_score.desc()
            ).all()
            
            # Prepare report data
            report_data = self._prepare_report_data(scan, repository, vulnerabilities, user)
            
            # Generate PDF
            return await self._generate_comprehensive_report(report_data)
                
        except Exception as e:
            logger.error(f"Error generating PDF report for scan {scan_id}: {e}", exc_info=True)
            raise
    
    def _prepare_report_data(self, scan: Scan, repository: Repository, vulnerabilities: List[Vulnerability], user: User) -> Dict[str, Any]:
        """Prepare comprehensive data for report generation"""
        
        # Calculate metrics
        total_vulns = len(vulnerabilities)
        severity_counts = {
            'critical': sum(1 for v in vulnerabilities if v.severity == 'critical'),
            'high': sum(1 for v in vulnerabilities if v.severity == 'high'), 
            'medium': sum(1 for v in vulnerabilities if v.severity == 'medium'),
            'low': sum(1 for v in vulnerabilities if v.severity == 'low')
        }
        
        # Risk assessment
        risk_score = self._calculate_overall_risk(vulnerabilities)
        risk_level = self._get_risk_level(risk_score)
        
        # Vulnerability by category
        categories = {}
        for vuln in vulnerabilities:
            cat = vuln.category or 'Other'
            if cat not in categories:
                categories[cat] = {'count': 0, 'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
            categories[cat]['count'] += 1
            categories[cat][vuln.severity] += 1
        
        # OWASP Top 10 mapping
        owasp_mapping = {}
        for vuln in vulnerabilities:
            if vuln.owasp_category:
                cat = vuln.owasp_category
                if cat not in owasp_mapping:
                    owasp_mapping[cat] = {'count': 0, 'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
                owasp_mapping[cat]['count'] += 1
                owasp_mapping[cat][vuln.severity] += 1
        
        # File statistics
        file_counts = Counter(v.file_path for v in vulnerabilities if v.file_path)
        hotspots = [{'file': file_path, 'vulnerability_count': count, 'risk_level': 'High' if count >= 3 else 'Medium', 'recommendation': 'Priority refactoring required'} 
                   for file_path, count in file_counts.items() if count >= 2]
        
        # Attack vectors
        attack_vectors = []
        injection_vulns = [v for v in vulnerabilities if 'injection' in (v.category or '').lower()]
        if injection_vulns:
            attack_vectors.append({
                'vector': 'Code Injection',
                'count': len(injection_vulns),
                'risk': 'High',
                'description': 'Malicious code execution through input validation failures'
            })
        
        # Business calculations
        critical_cost = severity_counts['critical'] * 50000
        high_cost = severity_counts['high'] * 25000
        medium_cost = severity_counts['medium'] * 10000
        low_cost = severity_counts['low'] * 2500
        
        potential_cost = critical_cost + high_cost + medium_cost + low_cost
        remediation_cost = self._calculate_remediation_cost(vulnerabilities)
        roi_percentage = ((potential_cost - remediation_cost) / max(remediation_cost, 1)) * 100 if remediation_cost > 0 else 0
        
        # Resource estimation
        severity_effort = {'critical': 3, 'high': 2, 'medium': 1, 'low': 0.5}
        total_days = sum(severity_effort.get(v.severity, 1) for v in vulnerabilities)
        
        return {
            'metadata': {
                'generated_at': datetime.utcnow(),
                'report_version': '3.0',
                'report_id': f"SSR-{scan.id}-{datetime.utcnow().strftime('%Y%m%d')}",
                'company': 'Sandbox Security',
                'tagline': 'Enterprise Security Assessment Platform',
                'scan_id': scan.id,
                'analyst': {
                    'name': user.full_name or user.email,
                    'email': user.email,
                    'title': 'Security Assessment Specialist',
                    'organization': 'Sandbox Security'
                },
                'classification': 'CONFIDENTIAL',
            },
            'repository': {
                'name': repository.name,
                'full_name': repository.full_name,
                'description': repository.description or "No description provided",
                'source': repository.source_type.title() if repository.source_type else 'Unknown',
                'url': repository.html_url,
                'language': repository.language or "Mixed",
                'is_private': repository.is_private,
                'visibility': "Private" if repository.is_private else "Public",
            },
            'scan': {
                'id': scan.id,
                'status': scan.status.title(),
                'started_at': scan.started_at,
                'completed_at': scan.completed_at,
                'duration': scan.scan_duration or "Unknown",
                'files_scanned': scan.total_files_scanned or 0,
                'methodology': self._get_scan_methodology(getattr(scan, 'scan_type', 'standard')),
            },
            'security': {
                'total_vulnerabilities': total_vulns,
                'severity_counts': severity_counts,
                'security_score': scan.security_score or 0,
                'code_coverage': scan.code_coverage or 0,
                'risk_score': risk_score,
                'risk_level': risk_level,
                'threat_level': self._calculate_threat_level(vulnerabilities),
            },
            'vulnerabilities': [
                {
                    'index': i + 1,
                    'id': v.id,
                    'title': v.title,
                    'description': v.description,
                    'severity': v.severity,
                    'category': v.category,
                    'cwe_id': v.cwe_id,
                    'owasp_category': v.owasp_category,
                    'file_path': v.file_path,
                    'line_number': v.line_number,
                    'code_snippet': v.code_snippet,
                    'recommendation': v.recommendation,
                    'fix_suggestion': v.fix_suggestion,
                    'risk_score': v.risk_score or 5.0,
                    'exploitability': v.exploitability or 'Medium',
                    'impact': v.impact or 'Medium',
                    'detected_at': v.detected_at,
                    'business_impact': self._assess_business_impact(v.severity),
                    'remediation_effort': self._estimate_remediation_effort(v.category),
                    'priority_score': self._calculate_priority_score(v),
                }
                for i, v in enumerate(vulnerabilities)
            ],
            'analysis': {
                'categories': categories,
                'hotspots': hotspots,
                'attack_vectors': attack_vectors,
                'patterns': [],  # Simplified for now
                'file_analysis': {
                    'total_affected_files': len(file_counts),
                    'vulnerable_files': len([f for f in file_counts if file_counts[f] > 0]),
                    'most_vulnerable_files': dict(file_counts.most_common(10)),
                    'vulnerability_density': len(vulnerabilities) / max(1, scan.total_files_scanned or 1),
                },
                'technology_analysis': {
                    'security_maturity': self._assess_security_maturity(vulnerabilities),
                    'framework_vulnerabilities': {},
                    'library_recommendations': [],
                }
            },
            'business': {
                'potential_cost': potential_cost,
                'remediation_cost': remediation_cost,
                'cost_avoidance': max(0, potential_cost - remediation_cost),
                'roi_percentage': max(0, roi_percentage),
                'payback_period_months': max(1, remediation_cost / max(potential_cost / 12, 1000)),
                'business_risk_level': self._assess_business_risk_level(vulnerabilities),
                'compliance_impact': self._assess_compliance_impact(vulnerabilities),
                'operational_impact': self._assess_operational_impact(vulnerabilities),
                'reputation_impact': self._assess_reputation_impact(vulnerabilities),
            },
            'compliance': {
                'owasp_mapping': owasp_mapping,
                'cwe_mapping': {},
                'compliance_scores': {
                    'OWASP Top 10': 85.0,
                    'CWE Coverage': 78.0,
                    'ISO 27001': 82.0,
                    'NIST Framework': 80.0,
                },
                'overall_compliance': 81.25,
            },
            'recommendations': self._generate_recommendations(scan, vulnerabilities),
            'resources': {
                'developer_days': total_days,
                'security_specialist_days': max(5, total_days * 0.2),
                'project_manager_days': max(2, total_days * 0.1),
                'estimated_cost': total_days * 800,
                'timeline_weeks': max(2, total_days / 5),
            },
        }
    
    def _get_scan_methodology(self, scan_type: str) -> str:
        methodologies = {
            'ai': 'AI-Enhanced Static Analysis',
            'custom': 'Custom Rule-Based Analysis',
            'standard': 'Comprehensive Static Analysis'
        }
        return methodologies.get(scan_type, 'Standard Security Assessment')
    
    def _calculate_overall_risk(self, vulnerabilities: List[Vulnerability]) -> float:
        if not vulnerabilities:
            return 0.0
        
        weights = {'critical': 10, 'high': 7, 'medium': 4, 'low': 1}
        total_risk = sum(weights.get(v.severity, 1) * (v.risk_score or 5.0) for v in vulnerabilities)
        max_risk = len(vulnerabilities) * 10 * 10
        
        return min(10.0, (total_risk / max(max_risk, 1)) * 10)
    
    def _get_risk_level(self, score: float) -> str:
        if score >= 8.0: return "Critical"
        elif score >= 6.0: return "High"
        elif score >= 4.0: return "Medium"
        elif score >= 2.0: return "Low"
        else: return "Minimal"
    
    def _calculate_threat_level(self, vulnerabilities: List[Vulnerability]) -> str:
        critical_count = sum(1 for v in vulnerabilities if v.severity == 'critical')
        high_count = sum(1 for v in vulnerabilities if v.severity == 'high')
        
        if critical_count >= 5: return "Severe"
        elif critical_count > 0 or high_count >= 10: return "High"
        elif high_count > 0: return "Moderate"
        else: return "Low"
    
    def _assess_business_impact(self, severity: str) -> str:
        severity_impact = {
            'critical': 'Very High',
            'high': 'High', 
            'medium': 'Medium',
            'low': 'Low'
        }
        return severity_impact.get(severity, 'Medium')
    
    def _estimate_remediation_effort(self, category: str) -> str:
        category_effort = {
            'injection': 'High',
            'authentication': 'Medium',
            'authorization': 'Medium', 
            'configuration': 'Low',
            'cryptography': 'High'
        }
        
        if not category:
            return 'Medium'
            
        category_lower = category.lower()
        for key in category_effort:
            if key in category_lower:
                return category_effort[key]
        
        return 'Medium'
    
    def _calculate_priority_score(self, vuln: Vulnerability) -> float:
        severity_weights = {'critical': 10, 'high': 7, 'medium': 4, 'low': 1}
        base_score = severity_weights.get(vuln.severity, 1)
        risk_multiplier = (vuln.risk_score or 5.0) / 10.0
        
        return base_score * risk_multiplier
    
    def _calculate_remediation_cost(self, vulnerabilities: List[Vulnerability]) -> float:
        base_costs = {'critical': 8000, 'high': 4000, 'medium': 1500, 'low': 500}
        return sum(base_costs.get(v.severity, 1000) for v in vulnerabilities)
    
    def _assess_security_maturity(self, vulnerabilities: List[Vulnerability]) -> str:
        vuln_count = len(vulnerabilities)
        if vuln_count > 20: return "Immature"
        elif vuln_count > 10: return "Developing"
        elif vuln_count > 5: return "Mature"
        else: return "Advanced"
    
    def _assess_business_risk_level(self, vulnerabilities: List[Vulnerability]) -> str:
        critical_count = sum(1 for v in vulnerabilities if v.severity == 'critical')
        if critical_count >= 3: return "Severe"
        elif critical_count > 0: return "High" 
        else: return "Moderate"
    
    def _assess_compliance_impact(self, vulnerabilities: List[Vulnerability]) -> str:
        high_impact_categories = ['injection', 'authentication', 'authorization', 'cryptography']
        compliance_vulns = [v for v in vulnerabilities if any(cat in (v.category or '').lower() for cat in high_impact_categories)]
        
        if len(compliance_vulns) >= 5: return "High Risk"
        elif len(compliance_vulns) > 0: return "Medium Risk"
        else: return "Low Risk"
    
    def _assess_operational_impact(self, vulnerabilities: List[Vulnerability]) -> str:
        critical_operational = sum(1 for v in vulnerabilities if v.severity in ['critical', 'high'])
        if critical_operational >= 10: return "Severe Disruption"
        elif critical_operational >= 5: return "Moderate Disruption"
        elif critical_operational > 0: return "Minor Disruption"
        else: return "No Disruption"
    
    def _assess_reputation_impact(self, vulnerabilities: List[Vulnerability]) -> str:
        public_facing = sum(1 for v in vulnerabilities if 'web' in (v.category or '').lower() or 'api' in (v.category or '').lower())
        if public_facing >= 5: return "High Risk"
        elif public_facing > 0: return "Medium Risk"
        else: return "Low Risk"
    
    def _generate_recommendations(self, scan: Scan, vulnerabilities: List[Vulnerability]) -> Dict[str, Any]:
        immediate_actions = []
        short_term_actions = []
        long_term_actions = []
        
        # Critical vulnerabilities - immediate action
        critical_vulns = [v for v in vulnerabilities if v.severity == 'critical']
        if critical_vulns:
            immediate_actions.append({
                'priority': 'CRITICAL',
                'action': f'Address {len(critical_vulns)} critical security vulnerabilities',
                'timeline': '24-48 hours',
                'effort': 'High',
                'impact': 'Prevents potential security breaches and data loss',
                'cost': f"${len(critical_vulns) * 5000:,}",
                'resources': f'{len(critical_vulns) * 2} developer days'
            })
        
        # High severity - short term
        high_vulns = [v for v in vulnerabilities if v.severity == 'high']
        if high_vulns:
            short_term_actions.append({
                'priority': 'HIGH',
                'action': f'Remediate {len(high_vulns)} high-severity vulnerabilities',
                'timeline': '1-2 weeks',
                'effort': 'Medium',
                'impact': 'Significantly reduces security risk exposure',
                'cost': f"${len(high_vulns) * 2500:,}",
                'resources': f'{len(high_vulns)} developer days'
            })
        
        # Long term actions
        long_term_actions.extend([
            {
                'priority': 'STRATEGIC',
                'action': 'Implement automated security scanning in CI/CD pipeline',
                'timeline': '1-3 months',
                'effort': 'Medium',
                'impact': 'Prevents future vulnerabilities from reaching production',
                'cost': '$15,000',
                'resources': '2 weeks DevOps engineer time'
            }
        ])
        
        return {
            'immediate_actions': immediate_actions,
            'short_term_actions': short_term_actions,
            'long_term_actions': long_term_actions,
            'quick_wins': [],
            'strategic_initiatives': [
                {
                    'initiative': 'DevSecOps Implementation',
                    'description': 'Integrate security into CI/CD pipeline',
                    'timeline': '3-6 months',
                    'investment': '$25,000',
                    'roi': '300%'
                }
            ],
            'implementation_roadmap': {
                'phase_1': {
                    'name': 'Crisis Response',
                    'duration': '1-2 weeks',
                    'actions': immediate_actions,
                    'success_metrics': ['Critical vulnerabilities = 0', 'High vulnerabilities < 5']
                },
                'phase_2': {
                    'name': 'Risk Reduction',
                    'duration': '1-2 months',
                    'actions': short_term_actions,
                    'success_metrics': ['Security score > 80', 'Medium vulnerabilities < 10']
                },
                'phase_3': {
                    'name': 'Security Maturity',
                    'duration': '3-6 months',
                    'actions': long_term_actions,
                    'success_metrics': ['Automated security scanning', 'Zero critical vulnerabilities in production']
                }
            }
        }
    
    async def _generate_comprehensive_report(self, data: Dict[str, Any]) -> bytes:
        """Generate comprehensive security report"""
        
        template = self.jinja_env.get_template('comprehensive_report.html')
        html_content = template.render(**data)
        
        # CSS for styling
        css_content = self._get_report_css()
        
        # Fix base URL for proper image loading
        base_url = f"file:///{str(self.static_path).replace('\\', '/')}/"
        
        # Generate PDF with correct base URL
        html_doc = HTML(
            string=html_content, 
            base_url=base_url
        )
        css_doc = CSS(string=css_content)
        
        pdf_buffer = io.BytesIO()
        html_doc.write_pdf(pdf_buffer, stylesheets=[css_doc])
        
        return pdf_buffer.getvalue()
    
    def _get_report_css(self) -> str:
        """Enhanced CSS for professional report styling"""

        logo_path = str(self.static_path / "images" / "sandboxlogo.png")
        
        return """
        /* Sandbox Security Professional Report Styles */
        
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        /* Page Setup */
        @page {
            size: A4;
            margin: 2cm 1.5cm;
            
            @top-left {
                content: "Sandbox Security";
                font-family: 'Inter', sans-serif;
                font-size: 10px;
                color: #6B7280;
            }
            
            @top-right {
                content: "Security Assessment Report";
                font-family: 'Inter', sans-serif;
                font-size: 10px;
                color: #6B7280;
            }
            
            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-family: 'Inter', sans-serif;
                font-size: 10px;
                color: #6B7280;
            }
            
            @bottom-right {
                content: "Confidential";
                font-family: 'Inter', sans-serif;
                font-size: 10px;
                color: #EF4444;
                font-weight: 600;
            }
        }
        
        /* Cover Page - No Headers/Footers */
        @page cover {
            margin: 0;
            @top-left { content: none; }
            @top-right { content: none; }
            @bottom-center { content: none; }
            @bottom-right { content: none; }
        }
        
        /* Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1F2937;
            background: #FFFFFF;
            font-size: 11px;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
        }
        
        /* Brand Colors - Sandbox Security Orange Theme */
        :root {
            --primary-orange: #EA580C;
            --secondary-orange: #FB923C;
            --light-orange: #FED7AA;
            --accent-orange: #FDBA74;
            --dark-gray: #1F2937;
            --medium-gray: #6B7280;
            --light-gray: #F3F4F6;
            --critical-red: #DC2626;
            --high-orange: #EA580C;
            --medium-yellow: #D97706;
            --low-blue: #2563EB;
            --white: #FFFFFF;
        }
        
        /* ============================================ */
        /* PROFESSIONAL COVER PAGE DESIGN */
        /* ============================================ */
        
        .cover-page {
            page: cover;
            height: 297mm;
            width: 210mm;
            background: linear-gradient(135deg, var(--primary-orange) 0%, var(--secondary-orange) 50%, var(--accent-orange) 100%);
            color: var(--white);
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            margin: 0;
            padding: 0;
        }
        
        /* Subtle background pattern */
        .cover-page::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background-image: 
                radial-gradient(circle at 25% 25%, rgba(255,255,255,0.08) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%);
            animation: subtle-float 20s ease-in-out infinite;
        }
        
        @keyframes subtle-float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(1deg); }
        }
        
        /* Cover Header */
        .cover-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 40px 50px 20px 50px;
            position: relative;
            z-index: 2;
        }
        
        .cover-header-left .company-name {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 1px;
            opacity: 0.9;
            text-transform: uppercase;
        }
        
        .cover-header-right .report-type {
            font-size: 14px;
            font-weight: 500;
            opacity: 0.9;
            text-align: right;
        }
        
        /* Cover Main Content */
        .cover-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 0 50px;
            position: relative;
            z-index: 2;
        }
        
        /* Logo Section */
        .cover-logo-section {
            margin-bottom: 50px;
        }
        
        .logo-container {
            width: 140px;
            height: 140px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            border: 3px solid rgba(255, 255, 255, 0.25);
            position: relative;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .logo-container::after {
            content: '';
            position: absolute;
            inset: -3px;
            border-radius: 31px;
            padding: 3px;
            background: linear-gradient(45deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1));
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: subtract;
            -webkit-mask-composite: subtract;
        }
        
        .company-logo {
            width: 80px;
            height: 80px;
            filter: brightness(0) invert(1);
            opacity: 0.95;
        }
        
        /* Fallback if logo doesn't load */
        .logo-container::before {
            content: '🛡️';
            font-size: 64px;
            position: absolute;
            opacity: 0.9;
        }
        
        .company-logo[src*=".svg"]:not([src=""]) + .logo-container::before,
        .company-logo[src*=".png"]:not([src=""]) + .logo-container::before {
            display: none;
        }
        
        /* Title Section */
        .cover-title-section {
            margin-bottom: 60px;
            max-width: 600px;
        }
        
        .main-title {
            font-size: 56px;
            font-weight: 900;
            line-height: 0.9;
            margin-bottom: 8px;
            letter-spacing: -2px;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            background: linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.9) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .repository-name {
            font-size: 28px;
            font-weight: 300;
            margin-top: 30px;
            opacity: 0.95;
            letter-spacing: -0.5px;
            color: rgba(255, 255, 255, 0.95);
        }
        
        /* Information Grid */
        .cover-info-section {
            margin-bottom: 50px;
            max-width: 650px;
            width: 100%;
        }
        
        .info-grid {
            background: rgba(255, 255, 255, 0.12);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 24px;
            padding: 40px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .info-row:last-child {
            margin-bottom: 0;
        }
        
        .info-item {
            flex: 1;
            text-align: left;
            padding: 0 20px;
        }
        
        .info-item:first-child {
            padding-left: 0;
            border-right: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .info-item:last-child {
            padding-right: 0;
        }
        
        .info-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            opacity: 0.8;
            margin-bottom: 8px;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .info-value {
            font-size: 18px;
            font-weight: 600;
            line-height: 1.3;
            color: var(--white);
        }
        
        /* Risk Level Styling */
        .risk-critical { 
            color: #FEE2E2 !important; 
            background: rgba(220, 38, 38, 0.2);
            padding: 4px 12px;
            border-radius: 8px;
            border: 1px solid rgba(220, 38, 38, 0.3);
        }
        
        .risk-high { 
            color: #FED7AA !important; 
            background: rgba(234, 88, 12, 0.2);
            padding: 4px 12px;
            border-radius: 8px;
            border: 1px solid rgba(234, 88, 12, 0.3);
        }
        
        .risk-medium { 
            color: #FEF3C7 !important; 
            background: rgba(217, 119, 6, 0.2);
            padding: 4px 12px;
            border-radius: 8px;
            border: 1px solid rgba(217, 119, 6, 0.3);
        }
        
        .risk-low { 
            color: #DBEAFE !important; 
            background: rgba(37, 99, 235, 0.2);
            padding: 4px 12px;
            border-radius: 8px;
            border: 1px solid rgba(37, 99, 235, 0.3);
        }
        
        .risk-minimal { 
            color: #D1FAE5 !important; 
            background: rgba(16, 185, 129, 0.2);
            padding: 4px 12px;
            border-radius: 8px;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        /* Cover Footer */
        .cover-footer-section {
            padding: 30px 50px 40px 50px;
            text-align: center;
            position: relative;
            z-index: 2;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            margin-top: auto;
        }
        
        .company-info {
            margin-bottom: 25px;
        }
        
        .company-title {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 6px;
            color: var(--white);
        }
        
        .company-tagline {
            font-size: 16px;
            font-weight: 400;
            opacity: 0.9;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .confidentiality-notice {
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 20px;
        }
        
        .confidential-label {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #FEE2E2;
            margin-bottom: 6px;
        }
        
        .confidential-text {
            font-size: 12px;
            font-weight: 400;
            opacity: 0.8;
            color: rgba(255, 255, 255, 0.8);
        }
        
        /* ============================================ */
        /* REST OF YOUR EXISTING CSS CONTINUES HERE... */
        /* ============================================ */
        
        /* Typography */
        h1 {
            font-size: 28px;
            font-weight: 700;
            color: var(--dark-gray);
            margin-bottom: 8px;
            line-height: 1.2;
        }
        
        h2 {
            font-size: 20px;
            font-weight: 600;
            color: var(--dark-gray);
            margin: 24px 0 12px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--primary-orange);
            page-break-after: avoid;
        }
        
        h3 {
            font-size: 16px;
            font-weight: 600;
            color: var(--dark-gray);
            margin: 18px 0 8px 0;
            page-break-after: avoid;
        }
        
        h4 {
            font-size: 14px;
            font-weight: 600;
            color: var(--dark-gray);
            margin: 12px 0 6px 0;
        }
        
        p {
            margin-bottom: 8px;
            text-align: justify;
        }
        
        /* Table of Contents */
        .toc-page {
            page-break-after: always;
            page-break-before: always;
        }
        
        .toc-container {
            max-width: 600px;
            margin: 40px auto;
        }
        
        .toc-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 40px;
            color: var(--primary-orange);
            text-align: center;
        }
        
        .toc-section {
            margin-bottom: 30px;
        }
        
        .toc-section-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--dark-gray);
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--primary-orange);
        }
        
        .toc-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px dotted #D1D5DB;
        }
        
        .toc-item:last-child {
            border-bottom: none;
        }
        
        .toc-item-content {
            display: flex;
            align-items: center;
            flex: 1;
        }
        
        .toc-item-number {
            font-weight: 600;
            color: var(--primary-orange);
            margin-right: 12px;
            min-width: 30px;
        }
        
        .toc-item-title {
            font-weight: 500;
            color: var(--dark-gray);
        }
        
        .toc-item-dots {
            flex: 1;
            border-bottom: 1px dotted #D1D5DB;
            margin: 0 12px;
            height: 1px;
        }
        
        .toc-item-page {
            font-weight: 600;
            color: var(--primary-orange);
        }
        
        /* Section Headers */
        .section-header {
            page-break-after: avoid;
            margin: 40px 0 24px 0;
        }
        
        .section-number {
            font-size: 14px;
            font-weight: 600;
            color: var(--primary-orange);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        
        .section-title {
            font-size: 32px;
            font-weight: 700;
            color: var(--dark-gray);
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 3px solid var(--primary-orange);
        }
        
        .section-description {
            font-size: 14px;
            color: #6B7280;
            line-height: 1.6;
        }
        
        /* Cards and Containers */
        .card {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .card-elevated {
            border: 2px solid #E5E7EB;
        }
        
        .card-primary {
            border-left: 6px solid var(--primary-orange);
            background: linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%);
        }
        
        .card-warning {
            border-left: 6px solid var(--medium-yellow);
            background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%);
        }
        
        .card-danger {
            border-left: 6px solid var(--critical-red);
            background: linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%);
        }
        
        .card-success {
            border-left: 6px solid #10B981;
            background: linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%);
        }
        
        /* Statistics and Metrics */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 24px 0;
        }
        
        .stats-grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin: 24px 0;
        }
        
        .stat-card {
            background: #FFFFFF;
            border: 2px solid #F3F4F6;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-orange), var(--secondary-orange));
        }
        
        .stat-number {
            font-size: 36px;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 8px;
        }
        
        .stat-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6B7280;
        }
        
        .stat-change {
            font-size: 11px;
            font-weight: 500;
            margin-top: 4px;
        }
        
        /* Severity Colors */
        .stat-critical, .text-critical { color: var(--critical-red); }
        .stat-high, .text-high { color: var(--high-orange); }
        .stat-medium, .text-medium { color: var(--medium-yellow); }
        .stat-low, .text-low { color: var(--low-blue); }
        .stat-success, .text-success { color: #10B981; }
        
        /* Badges and Labels */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .badge-critical {
            background: #FEE2E2;
            color: #991B1B;
            border: 1px solid #FCA5A5;
        }
        
        .badge-high {
            background: #FED7AA;
            color: #9A3412;
            border: 1px solid #FDBA74;
        }
        
        .badge-medium {
            background: #FEF3C7;
            color: #92400E;
            border: 1px solid #FCD34D;
        }
        
        .badge-low {
            background: #DBEAFE;
            color: #1E40AF;
            border: 1px solid #93C5FD;
        }
        
        .badge-success {
            background: #D1FAE5;
            color: #065F46;
            border: 1px solid #A7F3D0;
        }
        
        .badge-info {
            background: #E0E7FF;
            color: #3730A3;
            border: 1px solid #C7D2FE;
        }
        
        /* Vulnerability Cards */
        .vulnerability-card {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 16px;
            page-break-inside: avoid;
            position: relative;
        }
        
        .vulnerability-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            border-radius: 4px 0 0 4px;
        }
        
        .vulnerability-card.critical::before { background: var(--critical-red); }
        .vulnerability-card.high::before { background: var(--high-orange); }
        .vulnerability-card.medium::before { background: var(--medium-yellow); }
        .vulnerability-card.low::before { background: var(--low-blue); }
        
        .vulnerability-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        
        .vulnerability-id {
            font-size: 11px;
            font-weight: 600;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .vulnerability-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--dark-gray);
            margin: 4px 0 8px 0;
        }
        
        .vulnerability-meta {
            font-size: 11px;
            color: #6B7280;
            margin-bottom: 12px;
        }
        
        .vulnerability-description {
            margin-bottom: 12px;
            color: #374151;
            font-size: 11px;
            line-height: 1.5;
        }
        
        .vulnerability-recommendation {
            background: #EFF6FF;
            border-left: 4px solid #3B82F6;
            padding: 12px;
            margin-top: 12px;
            border-radius: 0 6px 6px 0;
            font-size: 11px;
        }
        
        .code-block {
            background: #1F2937;
            color: #F8FAFC;
            border-radius: 6px;
            padding: 12px;
            margin: 8px 0;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            border: 1px solid #374151;
        }
        
        .recommendation-title {
            font-weight: 600;
            color: #1E40AF;
            margin-bottom: 8px;
        }
        
        /* Tables */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 11px;
            page-break-inside: auto;
        }
        
        .data-table th {
            background: var(--light-gray);
            border: 1px solid #D1D5DB;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            color: var(--dark-gray);
            font-size: 11px;
        }
        
        .data-table td {
            border: 1px solid #E5E7EB;
            padding: 10px 8px;
            vertical-align: top;
        }
        
        .data-table tr:nth-child(even) {
            background: #F9FAFB;
        }
        
        /* Risk Matrix */
        .risk-matrix {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }
        
        .risk-matrix th,
        .risk-matrix td {
            border: 1px solid #D1D5DB;
            padding: 12px;
            text-align: center;
            font-weight: 500;
        }
        
        .risk-matrix th {
            background: var(--light-gray);
            font-weight: 600;
        }
        
        .risk-critical { background: #FEE2E2; color: #991B1B; }
        .risk-high { background: #FED7AA; color: #9A3412; }
        .risk-medium { background: #FEF3C7; color: #92400E; }
        .risk-low { background: #DBEAFE; color: #1E40AF; }
        
        /* Alerts and Callouts */
        .alert {
            padding: 20px;
            border-radius: 8px;
            margin: 16px 0;
            border: 2px solid;
            page-break-inside: avoid;
        }
        
        .alert-critical {
            background: #FEF2F2;
            border-color: var(--critical-red);
            color: #991B1B;
        }
        
        .alert-warning {
            background: #FFFBEB;
            border-color: var(--medium-yellow);
            color: #92400E;
        }
        
        .alert-info {
            background: #EFF6FF;
            border-color: #3B82F6;
            color: #1E40AF;
        }
        
        .alert-success {
            background: #F0FDF4;
            border-color: #10B981;
            color: #065F46;
        }
        
        .alert-title {
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        
        .alert-title::before {
            margin-right: 8px;
            font-size: 16px;
        }
        
        .alert-critical .alert-title::before { content: '🚨'; }
        .alert-warning .alert-title::before { content: '⚠️'; }
        .alert-info .alert-title::before { content: 'ℹ️'; }
        .alert-success .alert-title::before { content: '✅'; }
        
        /* Recommendations Section */
        .recommendation-section {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 24px;
            margin: 20px 0;
        }
        
        .recommendation-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .recommendation-icon {
            width: 40px;
            height: 40px;
            background: var(--primary-orange);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            font-size: 20px;
            color: white;
            font-weight: 600;
        }
        
        .recommendation-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--dark-gray);
        }
        
        .recommendation-item {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        
        .recommendation-priority {
            display: inline-block;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 4px 8px;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        
        .priority-critical {
            background: #FEE2E2;
            color: #991B1B;
        }
        
        .priority-high {
            background: #FED7AA;
            color: #9A3412;
        }
        
        .priority-medium {
            background: #FEF3C7;
            color: #92400E;
        }
        
        .priority-strategic {
            background: #E0E7FF;
            color: #3730A3;
        }
        
        /* Footer */
        .report-footer {
            background: var(--light-gray);
            border-top: 3px solid var(--primary-orange);
            padding: 30px;
            text-align: center;
            margin-top: 40px;
            page-break-inside: avoid;
        }
        
        .footer-logo {
            font-size: 20px;
            margin-bottom: 12px;
        }
        
        .footer-company {
            font-size: 16px;
            font-weight: 600;
            color: var(--dark-gray);
            margin-bottom: 8px;
        }
        
        .footer-tagline {
            font-size: 12px;
            color: #6B7280;
            margin-bottom: 16px;
        }
        
        .footer-confidential {
            font-size: 10px;
            font-weight: 700;
            color: var(--critical-red);
            text-transform: uppercase;
            letter-spacing: 1px;
            border-top: 1px solid #E5E7EB;
            padding-top: 16px;
        }
        
        /* Utility Classes */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-mono { font-family: 'Courier New', monospace; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .uppercase { text-transform: uppercase; }
        .capitalize { text-transform: capitalize; }
        .tracking-wide { letter-spacing: 0.5px; }
        .tracking-wider { letter-spacing: 1px; }
        
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-8 { margin-bottom: 32px; }
        
        .mt-2 { margin-top: 8px; }
        .mt-3 { margin-top: 12px; }
        .mt-4 { margin-top: 16px; }
        .mt-6 { margin-top: 24px; }
        .mt-8 { margin-top: 32px; }
        
        .p-4 { padding: 16px; }
        .p-6 { padding: 24px; }
        .px-4 { padding-left: 16px; padding-right: 16px; }
        .py-4 { padding-top: 16px; padding-bottom: 16px; }
        
        /* Page Breaking */
        .page-break { page-break-after: always; }
        .page-break-before { page-break-before: always; }
        .page-break-avoid { page-break-inside: avoid; }
        .page-break-auto { page-break-inside: auto; }
        
        /* Print Optimizations */
        @media print {
            body { 
                font-size: 10px;
                line-height: 1.4;
            }
            
            .stats-grid-4 {
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
            }
            
            .vulnerability-card {
                margin-bottom: 12px;
                padding: 16px;
            }
            
            .code-block {
                font-size: 9px;
                padding: 12px;
            }
        }
        """

# Create alias for backward compatibility  
EnterpriseReportService = PDFReportService