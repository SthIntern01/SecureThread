# backend/app/services/latex_templates/compliance_section.py

from pylatex import Section, Subsection, NoEscape
from pathlib import Path

def generate_compliance_section(doc, data):
    """
    Generates comprehensive compliance and regulatory mapping section.
    Maps vulnerabilities to OWASP Top 10, SANS Top 25, PCI DSS, GDPR, etc.
    """
    
    with doc.create(Section('Compliance \\& Regulatory Mapping')):
        
        doc.append(NoEscape(r'''
        \noindent
        This section maps identified vulnerabilities to industry-standard security frameworks 
        and regulatory requirements, helping organizations understand their compliance posture.
        '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # ========================================================================
        # OWASP TOP 10 2021 COVERAGE
        # ========================================================================
        
        with doc.create(Subsection('OWASP Top 10 2021 Coverage')):
            owasp_data = data['compliance']['owasp_top_10']
            
            doc.append(NoEscape(r'''
            \noindent
            The \textbf{OWASP Top 10} represents the most critical security risks to web applications.  
            This assessment identifies which OWASP categories are present in your codebase. 
            \vspace{0.3cm}
            '''))
            
            # OWASP Coverage Table
            doc.append(NoEscape(r'\begin{center}'))
            doc.append(NoEscape(r'\rowcolors{2}{STBgGray}{white}'))
            doc.append(NoEscape(r'\begin{longtable}{|p{0.12\textwidth}|p{0.58\textwidth}|p{0.12\textwidth}|p{0.12\textwidth}|}'))
            doc.append(NoEscape(r'\hline'))
            doc.append(NoEscape(r'\rowcolor{STBlue}'))
            doc.append(NoEscape(r'\textbf{\textcolor{white}{Category}} & \textbf{\textcolor{white}{Description}} & \textbf{\textcolor{white}{Findings}} & \textbf{\textcolor{white}{Risk}} \\'))
            doc.append(NoEscape(r'\hline'))
            doc.append(NoEscape(r'\endhead'))
            
            # OWASP Descriptions
            owasp_descriptions = {
                'A01: Broken Access Control': 'Failures related to enforcing access policies',
                'A02: Cryptographic Failures': 'Weak or missing encryption, exposed sensitive data',
                'A03: Injection': 'SQL, NoSQL, OS command injection attacks',
                'A04: Insecure Design': 'Missing or ineffective security design patterns',
                'A05: Security Misconfiguration': 'Insecure default configurations or settings',
                'A06: Vulnerable Components': 'Use of outdated or vulnerable libraries',
                'A07: Identification Failures': 'Authentication and session management flaws',
                'A08: Integrity Failures': 'Insecure CI/CD, unsigned code or data',
                'A09: Logging Failures': 'Insufficient logging and monitoring',
                'A10: SSRF': 'Server-Side Request Forgery vulnerabilities'
            }
            
            for category, count in owasp_data.items():
                description = owasp_descriptions.get(category, 'Security vulnerability')
                
                # Determine risk level based on count
                if count == 0:
                    risk = r'\textcolor{success}{\textbf{None}}'
                elif count <= 2:
                    risk = r'\textcolor{SevLow}{\textbf{Low}}'
                elif count <= 5:
                    risk = r'\textcolor{SevMedium}{\textbf{Medium}}'
                elif count <= 10:
                    risk = r'\textcolor{SevHigh}{\textbf{High}}'
                else:
                    risk = r'\textcolor{SevCritical}{\textbf{Critical}}'
                
                # Color the count based on severity
                if count == 0:
                    count_display = r'\textcolor{gray}{0}'
                elif count <= 2:
                    count_display = rf'\textcolor{{SevLow}}{{\textbf{{{count}}}}}'
                elif count <= 5:
                    count_display = rf'\textcolor{{SevMedium}}{{\textbf{{{count}}}}}'
                else:
                    count_display = rf'\textcolor{{SevCritical}}{{\textbf{{{count}}}}}'
                
                doc.append(NoEscape(rf'\texttt{{{category.split(":")[0]}}} & {description} & {count_display} & {risk} \\'))
            
            doc.append(NoEscape(r'\hline'))
            doc.append(NoEscape(r'\end{longtable}'))
            doc.append(NoEscape(r'\end{center}'))
            
            # OWASP Radar Chart Reference
            chart_owasp = str(data['_output_path'] / "chart_owasp.png").replace('\\', '/') if '_output_path' in data else ""
            if chart_owasp:
                doc.append(NoEscape(r'\vspace{0.3cm}'))
                doc.append(NoEscape(r'\begin{figure}[h!]'))
                doc.append(NoEscape(r'\centering'))
                doc.append(NoEscape(rf'\includegraphics[width=0.5\textwidth]{{{chart_owasp}}}'))
                doc.append(NoEscape(r'\caption{OWASP Top 10 Coverage Visualization}'))
                doc.append(NoEscape(r'\end{figure}'))
        
        doc.append(NoEscape(r'\newpage'))
        
        # ========================================================================
        # SANS TOP 25 CWE COVERAGE
        # ========================================================================
        
        with doc.create(Subsection('SANS Top 25 Most Dangerous Software Weaknesses')):
            sans_data = data['compliance']['sans_top_25']
            
            doc.append(NoEscape(r'''
            \noindent
            The \textbf{SANS Top 25} list identifies the most widespread and critical software security 
            weaknesses based on Common Weakness Enumeration (CWE) identifiers.
            \vspace{0.3cm}
            '''))
            
            if not sans_data or all(v == 0 for v in sans_data.values()):
                doc.append(NoEscape(r'''
                \begin{tcolorbox}[colback=success!10, colframe=success, title=\textbf{No SANS Top 25 Issues Found}]
                    This codebase does not contain any vulnerabilities from the SANS Top 25 most dangerous weaknesses.
                \end{tcolorbox}
                '''))
            else:
                doc.append(NoEscape(r'\begin{center}'))
                doc.append(NoEscape(r'\rowcolors{2}{STBgGray}{white}'))
                doc.append(NoEscape(r'\begin{longtable}{|p{0.15\textwidth}|p{0.55\textwidth}|p{0.15\textwidth}|p{0.1\textwidth}|}'))
                doc.append(NoEscape(r'\hline'))
                doc.append(NoEscape(r'\rowcolor{STBlue}'))
                doc.append(NoEscape(r'\textbf{\textcolor{white}{CWE ID}} & \textbf{\textcolor{white}{Weakness Name}} & \textbf{\textcolor{white}{Findings}} & \textbf{\textcolor{white}{Rank}} \\'))
                doc.append(NoEscape(r'\hline'))
                doc.append(NoEscape(r'\endhead'))
                
                # SANS Top 25 with names and rankings (2023)
                sans_names = {
                    'CWE-79': ('Cross-site Scripting (XSS)', 1),
                    'CWE-89': ('SQL Injection', 2),
                    'CWE-20': ('Improper Input Validation', 3),
                    'CWE-78': ('OS Command Injection', 4),
                    'CWE-787': ('Out-of-bounds Write', 5),
                    'CWE-416': ('Use After Free', 6),
                    'CWE-22': ('Path Traversal', 7),
                    'CWE-352': ('Cross-Site Request Forgery (CSRF)', 8),
                    'CWE-434': ('Unrestricted File Upload', 9),
                    'CWE-306': ('Missing Authentication', 10)
                }
                
                sorted_sans = sorted(sans_data.items(), key=lambda x: x[1], reverse=True)
                
                for cwe, count in sorted_sans: 
                    if count > 0:
                        name, rank = sans_names.get(cwe, ('Security Weakness', 'N/A'))
                        
                        # Color based on severity
                        if count >= 5:
                            count_display = rf'\textcolor{{SevCritical}}{{\textbf{{{count}}}}}'
                        elif count >= 3:
                            count_display = rf'\textcolor{{SevHigh}}{{\textbf{{{count}}}}}'
                        else:
                            count_display = rf'\textcolor{{SevMedium}}{{\textbf{{{count}}}}}'
                        
                        doc.append(NoEscape(rf'\texttt{{{cwe}}} & {name} & {count_display} & \#{rank} \\'))
                
                doc.append(NoEscape(r'\hline'))
                doc.append(NoEscape(r'\end{longtable}'))
                doc.append(NoEscape(r'\end{center}'))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # ========================================================================
        # PCI DSS v4.0 MAPPING
        # ========================================================================
        
        with doc.create(Subsection('PCI DSS v4.0 Requirements')):
            pci_data = data['compliance']['pci_dss']
            
            doc.append(NoEscape(r'''
            \noindent
            The \textbf{Payment Card Industry Data Security Standard (PCI DSS)} is mandatory for 
            organizations that handle credit card information.  Requirement 6 focuses on secure software development.
            \vspace{0.3cm}
            '''))
            
            doc.append(NoEscape(r'\begin{center}'))
            doc.append(NoEscape(r'\rowcolors{2}{STBgGray}{white}'))
            doc.append(NoEscape(r'\begin{tabular}{|p{0.45\textwidth}|p{0.15\textwidth}|p{0.25\textwidth}|}'))
            doc.append(NoEscape(r'\hline'))
            doc.append(NoEscape(r'\rowcolor{STBlue}'))
            doc.append(NoEscape(r'\textbf{\textcolor{white}{PCI DSS Requirement}} & \textbf{\textcolor{white}{Findings}} & \textbf{\textcolor{white}{Compliance Status}} \\'))
            doc.append(NoEscape(r'\hline'))
            
            for req, count in pci_data.items():
                if count == 0:
                    status = r'\textcolor{success}{\textbf{Compliant}}'
                    count_display = r'\textcolor{gray}{0}'
                elif count <= 3:
                    status = r'\textcolor{SevMedium}{\textbf{At Risk}}'
                    count_display = rf'\textcolor{{SevMedium}}{{\textbf{{{count}}}}}'
                else:
                    status = r'\textcolor{SevCritical}{\textbf{Non-Compliant}}'
                    count_display = rf'\textcolor{{SevCritical}}{{\textbf{{{count}}}}}'
                
                doc.append(NoEscape(rf'{req} & {count_display} & {status} \\'))
            
            doc.append(NoEscape(r'\hline'))
            doc.append(NoEscape(r'\end{tabular}'))
            doc.append(NoEscape(r'\end{center}'))
            
            # PCI DSS Recommendation
            total_pci_issues = sum(pci_data.values())
            if total_pci_issues > 0:
                doc.append(NoEscape(r'\vspace{0.3cm}'))
                doc.append(NoEscape(r'''
                \begin{tcolorbox}[colback=SevHigh!10, colframe=SevHigh, title=\textbf{PCI DSS Compliance Alert}]
                    \textbf{Action Required:} This application has ''' + str(total_pci_issues) + r''' findings that may impact 
                    PCI DSS compliance. Organizations processing payment card data must remediate these issues 
                    to maintain certification.  Consult with your QSA (Qualified Security Assessor).
                \end{tcolorbox}
                '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # ========================================================================
        # GDPR ARTICLE 32 ASSESSMENT
        # ========================================================================
        
        with doc.create(Subsection('GDPR Article 32: Security of Processing')):
            gdpr_data = data['compliance']['gdpr']
            
            doc.append(NoEscape(r'''
            \noindent
            \textbf{GDPR Article 32} requires appropriate technical and organizational measures to ensure 
            a level of security appropriate to the risk when processing personal data. 
            \vspace{0.3cm}
            '''))
            
            high_impact = gdpr_data.get('high_impact_count', 0)
            medium_impact = gdpr_data.get('medium_impact_count', 0)
            risk_level = gdpr_data.get('risk_level', 'Low')
            
            # GDPR Summary Box
            if risk_level == 'High': 
                box_color = 'SevCritical'
            elif risk_level == 'Medium':
                box_color = 'SevMedium'
            else: 
                box_color = 'success'
            
            doc.append(NoEscape(rf'''
            \begin{{tcolorbox}}[colback={box_color}!10, colframe={box_color}, title=\textbf{{GDPR Risk Assessment}}]
                \begin{{tabular}}{{ll}}
                    \textbf{{High-Impact Issues: }} & \textcolor{{{box_color}}}{{\textbf{{{high_impact}}}}} \\
                    \textbf{{Medium-Impact Issues:}} & \textcolor{{{box_color}}}{{\textbf{{{medium_impact}}}}} \\
                    \textbf{{Overall Risk Level:}} & \textcolor{{{box_color}}}{{\textbf{{{risk_level}}}}}
                \end{{tabular}}
            \end{{tcolorbox}}
            '''))
            
            doc.append(NoEscape(r'\vspace{0.3cm}'))
            
            # GDPR Recommendations
            if high_impact > 0:
                doc.append(NoEscape(r'''
                \noindent
                \textbf{GDPR Compliance Actions:}
                \begin{itemize}[leftmargin=*, topsep=0pt, itemsep=3pt]
                    \item Conduct a Data Protection Impact Assessment (DPIA) for high-risk vulnerabilities
                    \item Notify your Data Protection Officer (DPO) of these findings
                    \item Document remediation efforts in your Records of Processing Activities (ROPA)
                    \item Consider whether a breach notification (Article 33) may be required if exploited
                    \item Implement "Privacy by Design" principles (Article 25)
                \end{itemize}
                '''))
            else:
                doc.append(NoEscape(r'''
                \noindent
                \textbf{GDPR Status:} No critical data protection vulnerabilities detected.  Continue to maintain 
                security measures in accordance with Article 32 requirements.
                '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # ========================================================================
        # COMPLIANCE SUMMARY DASHBOARD
        # ========================================================================
        
        with doc.create(Subsection('Compliance Summary Dashboard')):
            
            doc.append(NoEscape(r'''
            \noindent
            The following dashboard provides an at-a-glance view of your compliance posture across 
            multiple security frameworks and regulatory standards.
            \vspace{0.3cm}
            '''))
            
            # Calculate compliance scores
            total_owasp = sum(data['compliance']['owasp_top_10'].values())
            total_sans = sum(data['compliance']['sans_top_25'].values())
            total_pci = sum(data['compliance']['pci_dss'].values())
            total_compliance_issues = data['compliance'].get('total_compliance_issues', 0)
            
            # Determine overall compliance grade
            if total_compliance_issues == 0:
                compliance_grade = 'A'
                grade_color = 'success'
            elif total_compliance_issues <= 5:
                compliance_grade = 'B'
                grade_color = 'SevLow'
            elif total_compliance_issues <= 15:
                compliance_grade = 'C'
                grade_color = 'SevMedium'
            elif total_compliance_issues <= 30:
                compliance_grade = 'D'
                grade_color = 'SevHigh'
            else:
                compliance_grade = 'F'
                grade_color = 'SevCritical'
            
            doc.append(NoEscape(r'''
            \begin{center}
            \begin{tabular}{|c|c|c|c|c|}
                \hline
                \rowcolor{STBlue}
                \textbf{\textcolor{white}{Framework}} & 
                \textbf{\textcolor{white}{Total Issues}} & 
                \textbf{\textcolor{white}{Critical}} & 
                \textbf{\textcolor{white}{Status}} & 
                \textbf{\textcolor{white}{Priority}} \\
                \hline
                \rowcolor{STBgGray}
                OWASP Top 10 & ''' + str(total_owasp) + r''' & ''' + str(data['metrics']['severity_counts'].get('critical', 0)) + r''' & 
                ''' + (r'\textcolor{SevCritical}{\textbf{At Risk}}' if total_owasp > 10 else r'\textcolor{success}{\textbf{Good}}') + r''' & 
                ''' + (r'\textcolor{SevCritical}{\textbf{HIGH}}' if total_owasp > 10 else r'\textcolor{gray}{Medium}') + r''' \\
                \hline
                SANS Top 25 & ''' + str(total_sans) + r''' & ''' + str(sum(1 for v in data['compliance']['sans_top_25'].values() if v >= 5)) + r''' & 
                ''' + (r'\textcolor{SevHigh}{\textbf{At Risk}}' if total_sans > 5 else r'\textcolor{success}{\textbf{Good}}') + r''' & 
                ''' + (r'\textcolor{SevHigh}{\textbf{HIGH}}' if total_sans > 5 else r'\textcolor{gray}{Low}') + r''' \\
                \hline
                \rowcolor{STBgGray}
                PCI DSS v4.0 & ''' + str(total_pci) + r''' & ''' + str(sum(1 for v in data['compliance']['pci_dss'].values() if v >= 5)) + r''' & 
                ''' + (r'\textcolor{SevCritical}{\textbf{Non-Compliant}}' if total_pci > 10 else r'\textcolor{success}{\textbf{Compliant}}') + r''' & 
                ''' + (r'\textcolor{SevCritical}{\textbf{CRITICAL}}' if total_pci > 10 else r'\textcolor{gray}{Low}') + r''' \\
                \hline
                GDPR Article 32 & ''' + str(high_impact + medium_impact) + r''' & ''' + str(high_impact) + r''' & 
                \textcolor{''' + box_color + r'''}{\textbf{''' + risk_level + r'''}} & 
                ''' + (r'\textcolor{SevCritical}{\textbf{HIGH}}' if risk_level == 'High' else r'\textcolor{gray}{Medium}') + r''' \\
                \hline
                \hline
                \multicolumn{4}{|r|}{\textbf{Overall Compliance Grade: }} & 
                \textcolor{''' + grade_color + r'''}{\Huge\textbf{''' + compliance_grade + r'''}} \\
                \hline
            \end{tabular}
            \end{center}
            '''))
        
        doc.append(NoEscape(r'\newpage'))