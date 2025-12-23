# backend/app/services/latex_report_service.py

import logging
import re
import os
from datetime import datetime, timezone
from typing import Dict, Any, List
from pathlib import Path

from pylatex import Document, Section, Subsection, Command, Figure, NoEscape, NewPage
from pylatex.utils import escape_latex, bold
from sqlalchemy.orm import Session

from app.models.vulnerability import Scan, Vulnerability
from app.models.repository import Repository
from app.models.user import User

from app.services.latex_templates.styles import setup_document_style
from app.services.latex_templates.cover_page import generate_cover_page
from app.services.latex_templates.table_of_contents import generate_toc
from app.services.latex_templates.executive_summary import generate_executive_summary
from app.services.latex_templates.vulnerability_section import generate_vulnerability_sections
from app.services.latex_templates.charts_generator import generate_charts
from app.services.latex_templates.compliance_section import generate_compliance_section
from app.services.latex_templates.recommendations_section import generate_recommendations_section
from app.services.latex_templates.appendix_section import generate_appendix_section

logger = logging.getLogger(__name__)

class LaTeXReportService:
    """
    SecureThread OPS - Enterprise Reporting Engine v4.0
    Professional vulnerability reporting with comprehensive analysis
    """

    def __init__(self):
        self.base_path = Path(__file__).parent.parent
        self.output_path = self.base_path / "reports" / "output"
        self.static_path = self.base_path / "static"
        self.logo_path = self.static_path / "images" / "securethread_logo.png"

        self.output_path.mkdir(parents=True, exist_ok=True)
        self.static_path.mkdir(parents=True, exist_ok=True)
        
        # Enhanced cost model with industry benchmarks
        self.COST_MODEL = {
            'critical': {'remediation': 2500, 'breach_risk': 50000, 'hours': 12.0},
            'high':     {'remediation': 1200, 'breach_risk': 15000, 'hours': 6.0},
            'medium':   {'remediation': 600,  'breach_risk': 3000,  'hours': 3.0},
            'low':      {'remediation': 200,  'breach_risk': 800,   'hours': 1.0},
            'info':     {'remediation': 0,    'breach_risk': 0,     'hours': 0.0}
        }

        # Compliance frameworks mapping
        self.COMPLIANCE_FRAMEWORKS = {
            'owasp_top_10': 'OWASP Top 10 2021',
            'sans_top_25': 'SANS Top 25 CWEs',
            'pci_dss': 'PCI DSS v4.0',
            'gdpr': 'GDPR Article 32',
            'hipaa': 'HIPAA Security Rule',
            'iso_27001': 'ISO/IEC 27001:2022'
        }

    async def generate_security_report(
        self,
        scan_id: int,
        db: Session,
        user: User,
        report_type: str = "comprehensive"
    ) -> bytes:
        """
        Generate a comprehensive professional security report
        """
        try:
            logger.info(f"🎯 Starting comprehensive PDF generation for Scan ID: {scan_id}")

            # Fetch all data
            scan, repository, vulnerabilities = self._fetch_data(scan_id, db)
            
            # Prepare comprehensive report context
            report_data = self._prepare_comprehensive_context(scan, repository, vulnerabilities, user, db)

            # Generate filename
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            safe_repo_name = re.sub(r'[^\w\-]', '_', repository.name)
            filename_base = f"SecureThread_Report_{safe_repo_name}_{date_str}_Scan{scan.id}"

            # Cleanup old artifacts
            self._cleanup_artifacts(filename_base)
            
            # Compile comprehensive LaTeX document
            pdf_bytes = await self._compile_comprehensive_latex(report_data, filename_base, report_type)

            logger.info(f"✅ PDF generation completed successfully - {len(pdf_bytes)} bytes")
            return pdf_bytes

        except Exception as e:
            logger.error(f"❌ Critical error generating report for scan {scan_id}: {e}", exc_info=True)
            raise

    def _fetch_data(self, scan_id: int, db: Session):
        """Fetch scan, repository, and vulnerabilities"""
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            raise ValueError(f"Scan ID {scan_id} not found.")

        repository = db.query(Repository).filter(Repository.id == scan.repository_id).first()
        if not repository: 
            raise ValueError(f"Repository ID {scan.repository_id} not found.")

        vulnerabilities = db.query(Vulnerability).filter(
            Vulnerability.scan_id == scan_id
        ).order_by(
            Vulnerability.severity.desc(), 
            Vulnerability.risk_score.desc()
        ).all()

        return scan, repository, vulnerabilities

    def _prepare_comprehensive_context(
        self, 
        scan: Scan, 
        repository: Repository, 
        vulnerabilities: List[Vulnerability], 
        user: User,
        db: Session
    ) -> Dict[str, Any]: 
        """
        Prepare comprehensive report data with all metrics and analytics
        """
        
        # === BASIC METRICS ===
        total_vulns = len(vulnerabilities)
        sev_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
        
        for v in vulnerabilities:
            s = v.severity.lower() if v.severity else 'info'
            if s in sev_counts: 
                sev_counts[s] += 1
            else:
                sev_counts['info'] += 1

        # === CODE METRICS ===
        files_scanned = scan.total_files_scanned or 1
        estimated_loc = files_scanned * 80  # More realistic average
        vuln_density = round((total_vulns / estimated_loc) * 1000, 2) if estimated_loc > 0 else 0

        # === SECURITY SCORE ===
        security_score = scan.security_score
        if security_score is None:
            security_score = self._calculate_comprehensive_score(sev_counts, vuln_density)
        
        letter_grade = self._calculate_letter_grade(security_score)

        # === FINANCIAL ANALYSIS ===
        financial_data = self._calculate_financial_impact(vulnerabilities)

        # === VULNERABILITY ANALYTICS ===
        analytics = self._generate_vulnerability_analytics(vulnerabilities, db)

        # === COMPLIANCE MAPPING ===
        compliance_data = self._map_to_compliance_frameworks(vulnerabilities)

        # === TREND ANALYSIS (if historical data exists) ===
        trend_data = self._analyze_security_trends(scan, repository, db)

        # === HOTSPOT ANALYSIS ===
        hotspots = self._identify_security_hotspots(vulnerabilities)

        # === FIXABILITY METRICS ===
        fixable_count = sum(1 for v in vulnerabilities if v.fix_suggestion or v.recommendation)
        auto_fixable = sum(1 for v in vulnerabilities if v.fix_suggestion)

        # === PROCESS VULNERABILITIES ===
        processed_vulns = self._process_vulnerabilities_detailed(vulnerabilities)

        # === RETURN COMPREHENSIVE CONTEXT ===
        return {
            'metadata': {
                'report_id': f"ST-{scan.id}-{datetime.now().strftime('%Y%m%d-%H%M')}",
                'generated_at': datetime.now().strftime("%d %B %Y %H:%M UTC"),
                'analyst': escape_latex(user.full_name or user.email),
                'tool_version': "SecureThread OPS v4.0",
                'report_type': 'Comprehensive Security Assessment'
            },
            'repository': {
                'name': escape_latex(repository.name),
                'full_name': escape_latex(repository.full_name),
                'url': escape_latex(repository.html_url or "N/A"),
                'branch': escape_latex(repository.default_branch or "main"),
                'commit': scan.scan_metadata.get('commit_hash', 'HEAD')[:8] if scan.scan_metadata else 'HEAD',
                'language': escape_latex(repository. language or "Multi-language"),
                'visibility': 'Private' if repository.is_private else 'Public'
            },
            'scan': {
                'id': scan.id,
                'date': scan.completed_at.strftime("%d %B %Y %H:%M") if scan.completed_at else "In Progress",
                'duration': escape_latex(scan.scan_duration or "N/A"),
                'files_scanned': files_scanned,
                'loc_estimate': estimated_loc,
                'scan_type': scan.scan_metadata.get('scan_type', 'comprehensive') if scan.scan_metadata else 'comprehensive'
            },
            'metrics': {
                'total_vulns': total_vulns,
                'severity_counts': sev_counts,
                'density': vuln_density,
                'score': round(security_score, 1),
                'grade': letter_grade,
                'fixable_count': fixable_count,
                'auto_fixable_count': auto_fixable,
                'fixable_pct': round((fixable_count/total_vulns)*100, 1) if total_vulns > 0 else 0,
                'code_coverage': scan.code_coverage or 0
            },
            'financial': financial_data,
            'analytics': analytics,
            'compliance': compliance_data,
            'trends': trend_data,
            'hotspots': hotspots,
            'vulnerabilities': processed_vulns
        }

    def _calculate_financial_impact(self, vulns: List[Vulnerability]) -> Dict[str, Any]:
        """Calculate detailed financial impact"""
        total_remediation_cost = 0.0
        total_breach_risk = 0.0
        total_hours = 0.0
        
        severity_costs = {
            'critical': {'cost': 0, 'hours': 0},
            'high':     {'cost': 0, 'hours': 0},
            'medium':   {'cost': 0, 'hours': 0},
            'low':      {'cost': 0, 'hours': 0}
        }
        
        for v in vulns:
            sev = v.severity.lower() if v.severity else 'info'
            model = self.COST_MODEL.get(sev, self.COST_MODEL['info'])
            
            remediation = model['remediation']
            breach = model['breach_risk']
            hours = model['hours']
            
            total_remediation_cost += remediation
            total_breach_risk += breach
            total_hours += hours
            
            if sev in severity_costs:
                severity_costs[sev]['cost'] += remediation + breach
                severity_costs[sev]['hours'] += hours

        return {
            'total_remediation_cost': total_remediation_cost,
            'total_breach_risk': total_breach_risk,
            'total_potential_loss': total_remediation_cost + total_breach_risk,
            'total_hours': total_hours,
            'estimated_days': round(total_hours / 8, 1),
            'severity_breakdown': severity_costs,
            'formatted': {
                'remediation': f"\\${total_remediation_cost:,.2f}",
                'breach_risk': f"\\${total_breach_risk:,.2f}",
                'total': f"\\${(total_remediation_cost + total_breach_risk):,.2f}",
                'hours': f"{int(total_hours)} hours ({round(total_hours/8, 1)} days)"
            }
        }

    def _generate_vulnerability_analytics(self, vulns: List[Vulnerability], db: Session) -> Dict[str, Any]:
        """Generate comprehensive vulnerability analytics"""
        
        # Category analysis
        categories = {}
        for v in vulns:
            cat = v.category or "Security Misconfiguration"
            categories[cat] = categories.get(cat, 0) + 1
        top_categories = dict(sorted(categories.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # CWE distribution
        cwe_distribution = {}
        for v in vulns:
            cwe = v.cwe_id or "CWE-Unknown"
            cwe_distribution[cwe] = cwe_distribution.get(cwe, 0) + 1
        top_cwes = dict(sorted(cwe_distribution.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # OWASP mapping
        owasp_mapping = self._map_to_owasp(vulns)
        
        # File-based analysis
        file_vuln_count = {}
        for v in vulns:
            file_path = v.file_path or "Unknown"
            file_vuln_count[file_path] = file_vuln_count.get(file_path, 0) + 1
        most_vulnerable_files = dict(sorted(file_vuln_count.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # Exploitability analysis
        exploitability_dist = {'easy': 0, 'medium': 0, 'hard': 0, 'unknown': 0}
        for v in vulns: 
            exp = (v.exploitability or 'unknown').lower()
            if exp in exploitability_dist:
                exploitability_dist[exp] += 1
            else:
                exploitability_dist['unknown'] += 1

        return {
            'top_categories': top_categories,
            'top_cwes': top_cwes,
            'owasp_top_10': owasp_mapping,
            'most_vulnerable_files': most_vulnerable_files,
            'exploitability_distribution': exploitability_dist,
            'unique_categories': len(categories),
            'unique_cwes': len(cwe_distribution),
            'unique_files_affected': len(file_vuln_count)
        }

    def _map_to_compliance_frameworks(self, vulns: List[Vulnerability]) -> Dict[str, Any]:
        """Map vulnerabilities to compliance frameworks"""
        
        # OWASP Top 10 2021
        owasp_mapping = self._map_to_owasp(vulns)
        
        # SANS Top 25 (CWE-based)
        sans_top_25 = [
            'CWE-79', 'CWE-89', 'CWE-20', 'CWE-78', 'CWE-787',
            'CWE-416', 'CWE-22', 'CWE-352', 'CWE-434', 'CWE-306'
        ]
        sans_coverage = {}
        for cwe in sans_top_25:
            count = sum(1 for v in vulns if v.cwe_id == cwe)
            if count > 0:
                sans_coverage[cwe] = count
        
        # PCI DSS Relevant Requirements
        pci_relevant = self._map_to_pci_dss(vulns)
        
        # GDPR Article 32 (Security of processing)
        gdpr_impact = self._assess_gdpr_impact(vulns)
        
        return {
            'owasp_top_10': owasp_mapping,
            'sans_top_25': sans_coverage,
            'pci_dss': pci_relevant,
            'gdpr': gdpr_impact,
            'total_compliance_issues': len(owasp_mapping) + len(sans_coverage)
        }

    def _analyze_security_trends(self, current_scan: Scan, repository: Repository, db: Session) -> Dict[str, Any]:
        """Analyze security trends from historical scans"""
        
        # Get previous scans for the repository
        previous_scans = db.query(Scan).filter(
            Scan.repository_id == repository.id,
            Scan.id < current_scan.id,
            Scan.status == 'completed'
        ).order_by(Scan.completed_at.desc()).limit(5).all()
        
        if not previous_scans:
            return {
                'has_history': False,
                'message': 'No previous scans available for trend analysis'
            }
        
        # Calculate trends
        vuln_trend = []
        score_trend = []
        
        for scan in reversed(previous_scans):
            vuln_trend.append({
                'date': scan.completed_at.strftime("%Y-%m-%d") if scan.completed_at else 'Unknown',
                'count': scan.total_vulnerabilities
            })
            score_trend.append({
                'date': scan.completed_at.strftime("%Y-%m-%d") if scan.completed_at else 'Unknown',
                'score': scan.security_score or 0
            })
        
        # Add current scan
        vuln_trend.append({
            'date': current_scan.completed_at.strftime("%Y-%m-%d") if current_scan.completed_at else 'Today',
            'count': current_scan.total_vulnerabilities
        })
        score_trend.append({
            'date': current_scan.completed_at.strftime("%Y-%m-%d") if current_scan.completed_at else 'Today',
            'score': current_scan.security_score or 0
        })
        
        # Calculate improvement
        if len(vuln_trend) >= 2:
            prev_vulns = vuln_trend[-2]['count']
            curr_vulns = vuln_trend[-1]['count']
            vuln_change = curr_vulns - prev_vulns
            vuln_change_pct = round((vuln_change / prev_vulns * 100), 1) if prev_vulns > 0 else 0
        else: 
            vuln_change = 0
            vuln_change_pct = 0
        
        return {
            'has_history': True,
            'vulnerability_trend': vuln_trend,
            'score_trend': score_trend,
            'vulnerability_change': vuln_change,
            'vulnerability_change_pct': vuln_change_pct,
            'improving': vuln_change < 0,
            'total_historical_scans': len(previous_scans)
        }

    def _identify_security_hotspots(self, vulns: List[Vulnerability]) -> Dict[str, Any]:
        """Identify security hotspots (high-risk areas)"""
        
        # File-based hotspots
        file_scores = {}
        for v in vulns:
            file_path = v.file_path or "Unknown"
            severity_score = {'critical': 10, 'high': 5, 'medium': 2, 'low': 1}.get(v.severity.lower() if v.severity else 'low', 1)
            file_scores[file_path] = file_scores.get(file_path, 0) + severity_score
        
        top_hotspot_files = dict(sorted(file_scores.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # Directory-based hotspots
        dir_scores = {}
        for v in vulns:
            if v.file_path:
                dir_path = '/'.join(v.file_path.split('/')[:-1]) or 'root'
                severity_score = {'critical': 10, 'high': 5, 'medium': 2, 'low': 1}.get(v.severity.lower() if v.severity else 'low', 1)
                dir_scores[dir_path] = dir_scores.get(dir_path, 0) + severity_score
        
        top_hotspot_dirs = dict(sorted(dir_scores.items(), key=lambda x: x[1], reverse=True)[:5])
        
        return {
            'file_hotspots': top_hotspot_files,
            'directory_hotspots': top_hotspot_dirs,
            'total_hotspots': len(file_scores)
        }

    def _process_vulnerabilities_detailed(self, vulns: List[Vulnerability]) -> List[Dict[str, Any]]:
        """Process vulnerabilities with comprehensive details"""
        
        processed = []
        for idx, v in enumerate(vulns, 1):
            processed.append({
                'index': idx,
                'title': escape_latex(v.title or "Unknown Vulnerability"),
                'severity': v.severity.lower() if v.severity else 'info',
                'cvss': v.risk_score or 0.0,
                'cwe': escape_latex(v.cwe_id or "CWE-Unknown"),
                'category': escape_latex(v.category or "Security Misconfiguration"),
                'location': escape_latex(f"{v.file_path}:{v.line_number}" if v.line_number else v.file_path or "Unknown"),
                'line_range': f"{v.line_number}-{v.line_end_number}" if v.line_number and v.line_end_number else str(v.line_number or "N/A"),
                'description': escape_latex(v.description or "No description provided."),
                'code_snippet': v.code_snippet,
                'remediation': escape_latex(v.recommendation or "Review code logic manually."),
                'fix_suggestion': v.fix_suggestion,
                'owasp': escape_latex(v.owasp_category or "N/A"),
                'exploitability': escape_latex(v.exploitability or "Unknown"),
                'impact': escape_latex(v.impact or "Unknown"),
                'confidence': v.confidence_level if hasattr(v, 'confidence_level') else 'medium',
                'status': v.status or 'open',
                'detected_at': v.detected_at.strftime("%Y-%m-%d %H:%M") if v.detected_at else "Unknown"
            })
        
        return processed

    def _calculate_comprehensive_score(self, sev_counts: Dict[str, int], density: float) -> float:
        """Calculate comprehensive security score with density factor"""
        base_score = 100.0
        
        # Severity penalties
        base_score -= (sev_counts.get('critical', 0) * 20)
        base_score -= (sev_counts.get('high', 0) * 8)
        base_score -= (sev_counts.get('medium', 0) * 3)
        base_score -= (sev_counts.get('low', 0) * 1)
        
        # Density penalty (high density = more issues relative to code size)
        if density > 10: 
            base_score -= 15
        elif density > 5:
            base_score -= 10
        elif density > 2:
            base_score -= 5
        
        return max(0.0, min(100.0, base_score))

    def _calculate_letter_grade(self, score: float) -> str:
        """Calculate letter grade from score"""
        if score >= 95: return 'A+'
        if score >= 90: return 'A'
        if score >= 85: return 'A-'
        if score >= 80: return 'B+'
        if score >= 75: return 'B'
        if score >= 70: return 'B-'
        if score >= 65: return 'C+'
        if score >= 60: return 'C'
        if score >= 55: return 'C-'
        if score >= 50: return 'D'
        return 'F'

    def _map_to_owasp(self, vulns: List[Vulnerability]) -> Dict[str, int]:
        """Map vulnerabilities to OWASP Top 10 2021"""
        mapping = {
            'A01: Broken Access Control': 0,
            'A02: Cryptographic Failures': 0,
            'A03: Injection': 0,
            'A04: Insecure Design': 0,
            'A05: Security Misconfiguration': 0,
            'A06: Vulnerable Components': 0,
            'A07: Identification Failures': 0,
            'A08: Integrity Failures': 0,
            'A09: Logging Failures': 0,
            'A10: SSRF': 0
        }
        
        for v in vulns:
            cat = (v.category or "").lower()
            title = (v.title or "").lower()
            cwe = (v.cwe_id or "").lower()
            full = f"{cat} {title} {cwe}"
            
            if 'sql' in full or 'xss' in full or 'injection' in full or 'cwe-89' in full or 'cwe-79' in full:
                mapping['A03: Injection'] += 1
            elif 'password' in full or 'auth' in full or 'jwt' in full or 'session' in full:
                mapping['A07: Identification Failures'] += 1
            elif 'access' in full or 'permission' in full or 'authorization' in full:
                mapping['A01: Broken Access Control'] += 1
            elif 'crypto' in full or 'hash' in full or 'encryption' in full:
                mapping['A02: Cryptographic Failures'] += 1
            elif 'config' in full or 'default' in full or 'misconfigur' in full:
                mapping['A05: Security Misconfiguration'] += 1
            elif 'dependency' in full or 'library' in full or 'component' in full:
                mapping['A06: Vulnerable Components'] += 1
            elif 'log' in full or 'audit' in full or 'monitor' in full:
                mapping['A09: Logging Failures'] += 1
            elif 'ssrf' in full or 'cwe-918' in full: 
                mapping['A10: SSRF'] += 1
            elif 'integrity' in full or 'tamper' in full: 
                mapping['A08: Integrity Failures'] += 1
            else:
                mapping['A04: Insecure Design'] += 1
        
        return mapping

    def _map_to_pci_dss(self, vulns: List[Vulnerability]) -> Dict[str, int]:
        """Map to PCI DSS requirements"""
        pci_mapping = {
            'Req 6.2: Secure Coding': 0,
            'Req 6.5: Common Vulnerabilities': 0,
            'Req 8: Strong Access Control': 0,
            'Req 4: Encryption in Transit': 0,
            'Req 3: Protect Stored Data': 0
        }
        
        for v in vulns:
            full = f"{v.category} {v.title} {v.cwe_id}".lower()
            
            if 'injection' in full or 'xss' in full: 
                pci_mapping['Req 6.5: Common Vulnerabilities'] += 1
            elif 'auth' in full or 'password' in full: 
                pci_mapping['Req 8: Strong Access Control'] += 1
            elif 'crypto' in full or 'ssl' in full or 'tls' in full:
                pci_mapping['Req 4: Encryption in Transit'] += 1
            elif 'sensitive' in full or 'pii' in full:
                pci_mapping['Req 3: Protect Stored Data'] += 1
            else:
                pci_mapping['Req 6.2: Secure Coding'] += 1
        
        return pci_mapping

    def _assess_gdpr_impact(self, vulns: List[Vulnerability]) -> Dict[str, Any]:
        """Assess GDPR compliance impact"""
        high_impact = 0
        medium_impact = 0
        
        gdpr_keywords = ['personal', 'pii', 'data breach', 'encryption', 'access control', 'audit', 'logging']
        
        for v in vulns:
            full = f"{v.category} {v.title} {v.description}".lower()
            
            if any(keyword in full for keyword in gdpr_keywords):
                if v.severity in ['critical', 'high']: 
                    high_impact += 1
                else:
                    medium_impact += 1
        
        return {
            'high_impact_count': high_impact,
            'medium_impact_count': medium_impact,
            'requires_attention': high_impact > 0,
            'risk_level': 'High' if high_impact > 5 else 'Medium' if high_impact > 0 else 'Low'
        }

    async def _compile_comprehensive_latex(self, data: Dict[str, Any], filename_base: str, report_type: str) -> bytes:
        """Compile comprehensive LaTeX document"""
        
        doc = Document(
            documentclass='report',
            document_options=['11pt', 'a4paper']
        )
        
        # Setup styling
        setup_document_style(doc)
        
        # Generate all charts
        generate_charts(doc, data, self.output_path)
        
        # Build document structure
        generate_cover_page(doc, data, self.logo_path)
        generate_toc(doc)
        generate_executive_summary(doc, data, self.output_path)
        
        # Add new comprehensive sections
        generate_compliance_section(doc, data)
        generate_vulnerability_sections(doc, data)
        generate_recommendations_section(doc, data)
        generate_appendix_section(doc, data)
        
        # Compile to PDF
        pdf_path = self.output_path / filename_base
        
        try:
            doc.generate_pdf(
                str(pdf_path),
                clean_tex=False,
                compiler='pdflatex',
                compiler_args=['-interaction=nonstopmode', '-halt-on-error'],
                silent=False
            )
            
            final_pdf = pdf_path.with_suffix('.pdf')
            if not final_pdf.exists():
                raise FileNotFoundError(f"PDF not found at {final_pdf}")

            with open(final_pdf, 'rb') as f:
                pdf_bytes = f.read()
            
            logger.info(f"✅ PDF compiled successfully: {len(pdf_bytes)} bytes")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"❌ LaTeX Compile Error: {e}")
            log_file = pdf_path.with_suffix('.log')
            if log_file.exists():
                with open(log_file, 'r', encoding='latin-1', errors='ignore') as f:
                    log_content = f.read()
                    logger.error(f"LaTeX Log (last 2000 chars):\n{log_content[-2000:]}")
            raise

    def _cleanup_artifacts(self, filename_base: str):
        """Cleanup LaTeX artifacts"""
        exts = ['.aux', '.toc', '.log', '.out', '.fls', '.fdb_latexmk', '.synctex.gz', '.lof']
        for ext in exts:
            f = self.output_path / (filename_base + ext)
            if f.exists():
                try:
                    os.remove(f)
                except OSError:
                    pass