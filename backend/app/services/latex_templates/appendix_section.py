# backend/app/services/latex_templates/appendix_section.py

from pylatex import Section, Subsection, NoEscape
from pylatex.utils import escape_latex
from pathlib import Path

def generate_appendix_section(doc, data):
    """
    Generates comprehensive appendix with glossary, references, 
    methodology, and technical details.
    """
    
    doc.append(NoEscape(r'\appendix'))
    
    # ========================================================================
    # APPENDIX A: METHODOLOGY
    # ========================================================================
    
    with doc.create(Section('Scanning Methodology')):
        
        doc.append(NoEscape(r'''
        \noindent
        This appendix describes the methodology, tools, and techniques used to conduct 
        this security assessment.
        '''))
        
        doc.append(NoEscape(r'\vspace{0.3cm}'))
        
        with doc.create(Subsection('Assessment Approach')):
            
            scan_metadata = data['scan']
            scan_type = scan_metadata.get('scan_type', 'comprehensive')
            
            doc.append(NoEscape(r'''
            \noindent
            \textbf{Assessment Type:} Static Application Security Testing (SAST)
            
            \textbf{Scope:} Full repository source code analysis including all branches and commits. 
            
            \textbf{Methodology:} Hybrid approach combining: 
            \begin{itemize}[leftmargin=*, topsep=3pt, itemsep=3pt]
                \item \textbf{Pattern-based Detection: } Regular expression and syntax tree analysis
                \item \textbf{Rule-based Analysis:} Custom security rules (OWASP, SANS, CWE)
                \item \textbf{Data Flow Analysis:} Taint tracking for injection vulnerabilities
                \item \textbf{LLM Enhancement:} AI-powered context analysis for false positive reduction
                \item \textbf{Semantic Analysis:} Understanding code intent and business logic flaws
            \end{itemize}
            '''))
        
        doc.append(NoEscape(r'\vspace{0.3cm}'))
        
        with doc.create(Subsection('Scan Configuration')):
            
            doc.append(NoEscape(r'''
            \begin{center}
            \renewcommand{\arraystretch}{1.4}
            \begin{tabular}{|p{0.35\textwidth}|p{0.55\textwidth}|}
                \hline
                \rowcolor{STBlue}
                \textbf{\textcolor{white}{Configuration Item}} & 
                \textbf{\textcolor{white}{Value}} \\
                \hline
                
                Scan Engine & SecureThread OPS v4.0 \\
                \hline
                Repository & ''' + data['repository']['full_name'] + r''' \\
                \hline
                Branch & ''' + data['repository']['branch'] + r''' \\
                \hline
                Commit Hash & \texttt{''' + data['repository']['commit'] + r'''} \\
                \hline
                Primary Language & ''' + data['repository'].get('language', 'Multi-language') + r''' \\
                \hline
                Files Scanned & ''' + str(data['scan']['files_scanned']) + r''' \\
                \hline
                Estimated Lines of Code & ''' + f"{data['scan']['loc_estimate']:,}" + r''' \\
                \hline
                Scan Duration & ''' + data['scan']['duration'] + r''' \\
                \hline
                Scan Date & ''' + data['scan']['date'] + r''' \\
                \hline
                Rules Applied & ''' + str(data['scan'].get('rules_count', 'Default ruleset')) + r''' \\
                \hline
                LLM Enhancement & ''' + ('Enabled' if data['scan'].get('llm_enabled', False) else 'Disabled') + r''' \\
                \hline
            \end{tabular}
            \end{center}
            '''))
        
        doc.append(NoEscape(r'\vspace{0.3cm}'))
        
        with doc.create(Subsection('Severity Classification')):
            
            doc.append(NoEscape(r'''
            \noindent
            Vulnerabilities are classified using a risk-based severity model:
            \vspace{0.3cm}
            
            \begin{center}
            \renewcommand{\arraystretch}{1.5}
            \begin{tabular}{|p{0.15\textwidth}|p{0.2\textwidth}|p{0.55\textwidth}|}
                \hline
                \rowcolor{STBlue}
                \textbf{\textcolor{white}{Severity}} & 
                \textbf{\textcolor{white}{CVSS Range}} & 
                \textbf{\textcolor{white}{Description}} \\
                \hline
                
                \rowcolor{SevCritical!15}
                \textcolor{SevCritical}{\textbf{CRITICAL}} & 
                9.0 - 10.0 & 
                Immediate threat of complete system compromise, data breach, or service disruption.  
                Exploitable remotely without authentication. \\
                \hline
                
                \rowcolor{SevHigh!15}
                \textcolor{SevHigh}{\textbf{HIGH}} & 
                7.0 - 8.9 & 
                Significant security risk allowing unauthorized access, data exposure, or privilege escalation.   
                May require some user interaction. \\
                \hline
                
                \rowcolor{SevMedium!15}
                \textcolor{SevMedium}{\textbf{MEDIUM}} & 
                4.0 - 6.9 & 
                Moderate security weakness that could lead to information disclosure or limited access.  
                Typically requires specific conditions to exploit. \\
                \hline
                
                \rowcolor{SevLow!15}
                \textcolor{SevLow}{\textbf{LOW}} & 
                0.1 - 3.9 & 
                Minor security concern with minimal impact. Difficult to exploit or requires 
                extensive preconditions. \\
                \hline
                
                \textbf{INFO} & 
                0.0 & 
                Informational finding or security best practice recommendation without 
                direct exploitability.  \\
                \hline
            \end{tabular}
            \end{center}
            '''))
        
        doc.append(NoEscape(r'\vspace{0.3cm}'))
        
        with doc.create(Subsection('False Positive Management')):
            
            doc.append(NoEscape(r'''
            \noindent
            SecureThread OPS employs multiple techniques to minimize false positives:
            
            \begin{enumerate}[leftmargin=*, topsep=3pt, itemsep=3pt]
                \item \textbf{Context-Aware Analysis:} Understanding code flow and business logic
                \item \textbf{Framework Detection:} Recognizing security features in frameworks (Django, Spring, etc.)
                \item \textbf{Confidence Scoring:} Each finding includes a confidence level (High/Medium/Low)
                \item \textbf{LLM Validation:} AI review of potential findings for contextual accuracy
                \item \textbf{Community Rules:} Continuously updated rules based on real-world feedback
            \end{enumerate}
            
            \vspace{0.2cm}
            \noindent
            \textbf{Note:} While we strive for accuracy, manual review by security experts is recommended 
            for production deployments.
            '''))
    
    doc.append(NoEscape(r'\newpage'))
    
    # ========================================================================
    # APPENDIX B: SECURITY HOTSPOTS ANALYSIS
    # ========================================================================
    
    with doc.create(Section('Security Hotspots Analysis')):
        
        doc.append(NoEscape(r'''
        \noindent
        Security hotspots are files or modules with concentrated vulnerabilities, indicating 
        areas requiring architectural review or refactoring.
        '''))
        
        doc.append(NoEscape(r'\vspace{0.3cm}'))
        
        hotspots = data.get('hotspots', {})
        file_hotspots = hotspots.get('file_hotspots', {})
        dir_hotspots = hotspots.get('directory_hotspots', {})
        
        with doc.create(Subsection('File-Level Hotspots')):
            
            if file_hotspots:
                doc.append(NoEscape(r'''
                \noindent
                The following files contain the highest concentration of security issues:
                \vspace{0.3cm}
                
                \begin{center}
                \renewcommand{\arraystretch}{1.3}
                \begin{longtable}{|p{0.1\textwidth}|p{0.6\textwidth}|p{0.12\textwidth}|p{0.12\textwidth}|}
                    \hline
                    \rowcolor{STBlue}
                    \textbf{\textcolor{white}{Rank}} & 
                    \textbf{\textcolor{white}{File Path}} & 
                    \textbf{\textcolor{white}{Risk Score}} & 
                    \textbf{\textcolor{white}{Priority}} \\
                    \hline
                    \endhead
                '''))
                
                for idx, (file_path, score) in enumerate(list(file_hotspots.items())[:15], 1):
                    # Determine priority
                    if score >= 30:
                        priority = r'\textcolor{SevCritical}{\textbf{URGENT}}'
                        score_color = 'SevCritical'
                    elif score >= 15:
                        priority = r'\textcolor{SevHigh}{\textbf{HIGH}}'
                        score_color = 'SevHigh'
                    elif score >= 8:
                        priority = r'\textcolor{SevMedium}{\textbf{MEDIUM}}'
                        score_color = 'SevMedium'
                    else:
                        priority = r'\textcolor{SevLow}{\textbf{LOW}}'
                        score_color = 'SevLow'
                    
                    # Truncate long file paths
                    display_path = file_path if len(file_path) <= 60 else "..." + file_path[-57:]
                    
                    # ✅ ESCAPE UNDERSCORES in file paths
                    safe_path = escape_latex(display_path)
                    
                    doc.append(NoEscape(rf'''{idx} & \texttt{{{safe_path}}} & \textcolor{{{score_color}}}{{\textbf{{{score}}}}} & {priority} \\'''))
                
                doc.append(NoEscape(r'''
                    \hline
                \end{longtable}
                \end{center}
                '''))
                
                doc.append(NoEscape(r'''
                \vspace{0.2cm}
                \noindent
                \textbf{Recommendation:} Files with Risk Score $\geq$ 15 should undergo comprehensive 
                security review and potential refactoring.
                '''))
            else:
                doc.append(NoEscape(r'''
                \noindent
                No significant file-level hotspots detected.  Vulnerabilities are well-distributed across the codebase.
                '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        with doc.create(Subsection('Directory-Level Hotspots')):
            
            if dir_hotspots:
                doc.append(NoEscape(r'''
                \noindent
                The following directories contain the highest concentration of security issues:
                \vspace{0.3cm}
                
                \begin{center}
                \renewcommand{\arraystretch}{1.3}
                \begin{tabular}{|p{0.15\textwidth}|p{0.5\textwidth}|p{0.15\textwidth}|p{0.15\textwidth}|}
                    \hline
                    \rowcolor{STBlue}
                    \textbf{\textcolor{white}{Rank}} & 
                    \textbf{\textcolor{white}{Directory}} & 
                    \textbf{\textcolor{white}{Risk Score}} & 
                    \textbf{\textcolor{white}{Action}} \\
                    \hline
                '''))
                
                for idx, (dir_path, score) in enumerate(list(dir_hotspots.items())[:10], 1):
                    if score >= 20:
                        action = 'Refactor'
                        score_color = 'SevCritical'
                    elif score >= 10:
                        action = 'Review'
                        score_color = 'SevHigh'
                    else:
                        action = 'Monitor'
                        score_color = 'SevMedium'
                    
                    display_dir = dir_path if len(dir_path) <= 45 else "..." + dir_path[-42:]
                    
                    doc.append(NoEscape(rf'''{idx} & \texttt{{{display_dir}}} & \textcolor{{{score_color}}}{{\textbf{{{score}}}}} & {action} \\'''))
                
                doc.append(NoEscape(r'''
                    \hline
                \end{tabular}
                \end{center}
                '''))
            else:
                doc.append(NoEscape(r'''
                \noindent
                No significant directory-level hotspots detected. 
                '''))
    
    doc.append(NoEscape(r'\newpage'))
    
    # ========================================================================
    # APPENDIX C: CWE REFERENCE GUIDE
    # ========================================================================
    
    with doc.create(Section('CWE Reference Guide')):
        
        doc.append(NoEscape(r'''
        \noindent
        This section provides detailed information about the Common Weakness Enumeration (CWE) 
        identifiers found in this assessment.
        '''))
        
        doc.append(NoEscape(r'\vspace{0.3cm}'))
        
        analytics = data.get('analytics', {})
        top_cwes = analytics.get('top_cwes', {})
        
        if top_cwes:
            doc.append(NoEscape(r'''
            \begin{center}
            \renewcommand{\arraystretch}{1.5}
            \begin{longtable}{|p{0.12\textwidth}|p{0.45\textwidth}|p{0.08\textwidth}|p{0.25\textwidth}|}
                \hline
                \rowcolor{STBlue}
                \textbf{\textcolor{white}{CWE ID}} & 
                \textbf{\textcolor{white}{Description}} & 
                \textbf{\textcolor{white}{Count}} & 
                \textbf{\textcolor{white}{Impact}} \\
                \hline
                \endhead
            '''))
            
            # CWE descriptions database
            cwe_database = {
                'CWE-79': ('Cross-site Scripting (XSS)', 'Code injection via untrusted user input'),
                'CWE-89': ('SQL Injection', 'Database manipulation via unsanitized input'),
                'CWE-20': ('Improper Input Validation', 'Insufficient validation of user data'),
                'CWE-78': ('OS Command Injection', 'Execution of arbitrary system commands'),
                'CWE-22': ('Path Traversal', 'Unauthorized file system access'),
                'CWE-352': ('CSRF', 'Cross-Site Request Forgery attacks'),
                'CWE-434': ('Unrestricted Upload', 'Malicious file upload vulnerability'),
                'CWE-306': ('Missing Authentication', 'Critical functions lack auth checks'),
                'CWE-327': ('Broken Crypto', 'Use of weak cryptographic algorithms'),
                'CWE-798': ('Hard-coded Credentials', 'Embedded passwords/keys in code'),
                'CWE-502': ('Insecure Deserialization', 'Remote code execution via object injection'),
                'CWE-918': ('SSRF', 'Server-Side Request Forgery'),
                'CWE-611': ('XXE', 'XML External Entity injection'),
                'CWE-917': ('OGNL Injection', 'Expression language injection'),
                'CWE-94': ('Code Injection', 'Dynamic code execution vulnerability')
            }
            
            for cwe_id, count in sorted(top_cwes.items(), key=lambda x: x[1], reverse=True):
                if count > 0:
                    description, impact = cwe_database.get(cwe_id, ('Security Weakness', 'Potential security risk'))
                    
                    if count >= 5:
                        count_display = rf'\textcolor{{SevCritical}}{{\textbf{{{count}}}}}'
                    elif count >= 3:
                        count_display = rf'\textcolor{{SevHigh}}{{\textbf{{{count}}}}}'
                    else:
                        count_display = rf'\textcolor{{SevMedium}}{{\textbf{{{count}}}}}'
                    
                    doc.append(NoEscape(rf'''\texttt{{{cwe_id}}} & \textbf{{{description}}} & {count_display} & {impact} \\'''))
            
            doc.append(NoEscape(r'''
                \hline
            \end{longtable}
            \end{center}
            '''))
            
            doc.append(NoEscape(r'''
            \vspace{0.3cm}
            \noindent
            \textbf{Reference:} For complete CWE descriptions and mitigation guidance, visit: \\
            \url{https://cwe.mitre.org/}
            '''))
        else:
            doc.append(NoEscape(r'''
            \noindent
            No CWE classifications available for this scan.
            '''))
    
    doc.append(NoEscape(r'\newpage'))
    
    

    # ========================================================================
    # APPENDIX D: GLOSSARY OF TERMS
    # ========================================================================
    
    with doc.create(Section('Glossary of Terms')):
        
        doc.append(NoEscape(r'''
        \noindent
        \textbf{Common security and technical terms used in this report:}
        \vspace{0.3cm}
        
        \begin{description}[leftmargin=3cm, style=nextline, itemsep=8pt]
            
            \item[SAST] Static Application Security Testing - Analysis of source code without execution
            
            \item[DAST] Dynamic Application Security Testing - Analysis of running applications
            
            \item[CVSS] Common Vulnerability Scoring System - Standardized severity rating (0-10)
            
            \item[CWE] Common Weakness Enumeration - Dictionary of software weakness types
            
            \item[CVE] Common Vulnerabilities and Exposures - Public vulnerability database
            
            \item[OWASP] Open Web Application Security Project - Leading security standards body
            
            \item[XSS] Cross-Site Scripting - Code injection through untrusted web input
            
            \item[SQL Injection] Database attack via unsanitized SQL queries
            
            \item[CSRF] Cross-Site Request Forgery - Unauthorized actions via authenticated user
            
            \item[SSRF] Server-Side Request Forgery - Unauthorized internal resource access
            
            \item[XXE] XML External Entity - XML parser exploitation vulnerability
            
            \item[PCI DSS] Payment Card Industry Data Security Standard - Payment security requirements
            
            \item[GDPR] General Data Protection Regulation - EU data privacy law
            
            \item[Zero-Day] Vulnerability unknown to vendor with no available patch
            
            \item[Supply Chain Attack] Compromise through third-party dependencies
            
            \item[Threat Modeling] Systematic identification of security threats
            
            \item[Attack Surface] Total exposure points vulnerable to exploitation
            
            \item[Least Privilege] Minimal access rights principle
            
            \item[Defense in Depth] Layered security approach
            
            \item[Shift Left] Early integration of security in development lifecycle
            
        \end{description}
        '''))
    
    doc.append(NoEscape(r'\newpage'))
    
    # ========================================================================
    # APPENDIX E: REFERENCES & RESOURCES
    # ========================================================================
    
    with doc.create(Section('References \\& Resources')):
        
        doc.append(NoEscape(r'''
        \noindent
        \textbf{Industry Standards and Frameworks:}
        \vspace{0.2cm}
        
        \begin{itemize}[leftmargin=*, topsep=3pt, itemsep=5pt]
            \item \textbf{OWASP Top 10 2021} \\
            \url{https://owasp.org/Top10/}
            
            \item \textbf{SANS Top 25 Most Dangerous Software Weaknesses} \\
            \url{https://www.sans.org/top25-software-errors/}
            
            \item \textbf{CWE/SANS Top 25} \\
            \url{https://cwe.mitre.org/top25/}
            
            \item \textbf{NIST Secure Software Development Framework (SSDF)} \\
            \url{https://csrc.nist.gov/Projects/ssdf}
            
            \item \textbf{PCI DSS v4.0 Requirements} \\
            \url{https://www.pcisecuritystandards.org/}
            
            \item \textbf{GDPR Security Requirements (Article 32)} \\
            \url{https://gdpr-info.eu/art-32-gdpr/}
        \end{itemize}
        
        \vspace{0.4cm}
        \noindent
        \textbf{Vulnerability Databases:}
        \vspace{0.2cm}
        
        \begin{itemize}[leftmargin=*, topsep=3pt, itemsep=5pt]
            \item \textbf{National Vulnerability Database (NVD)} \\
            \url{https://nvd.nist.gov/}
            
            \item \textbf{MITRE CVE} \\
            \url{https://cve.mitre.org/}
            
            \item \textbf{Exploit Database} \\
            \url{https://www.exploit-db.com/}
            
            \item \textbf{Snyk Vulnerability Database} \\
            \url{https://snyk.io/vuln/}
        \end{itemize}
        
        \vspace{0.4cm}
        \noindent
        \textbf{Secure Coding Guidelines:}
        \vspace{0.2cm}
        
        \begin{itemize}[leftmargin=*, topsep=3pt, itemsep=5pt]
            \item \textbf{OWASP Secure Coding Practices} \\
            \url{https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/}
            
            \item \textbf{SEI CERT Coding Standards} \\
            \url{https://wiki.sei.cmu.edu/confluence/display/seccode/}
            
            \item \textbf{Microsoft Security Development Lifecycle} \\
            \url{https://www.microsoft.com/en-us/securityengineering/sdl/}
            
            \item \textbf{Google Security Best Practices} \\
            \url{https://cloud.google.com/security/best-practices}
        \end{itemize}
        
        \vspace{0.4cm}
        \noindent
        \textbf{Security Tools and Services:}
        \vspace{0.2cm}
        
        \begin{itemize}[leftmargin=*, topsep=3pt, itemsep=5pt]
            \item \textbf{SecureThread OPS Documentation} \\
            \url{https://securethread.io/docs}
            
            \item \textbf{OWASP ZAP (Dynamic Scanner)} \\
            \url{https://www.zaproxy.org/}
            
            \item \textbf{SonarQube (Code Quality)} \\
            \url{https://www.sonarqube.org/}
            
            \item \textbf{Snyk (Dependency Scanner)} \\
            \url{https://snyk.io/}
            
            \item \textbf{GitHub Security Features} \\
            \url{https://github.com/security}
        \end{itemize}
        '''))
    
    doc.append(NoEscape(r'\newpage'))
    
    # ========================================================================
    # APPENDIX F: REPORT METADATA & DISCLAIMER
    # ========================================================================
    
    with doc.create(Section('Report Metadata \\& Legal Disclaimer')):
        
        doc.append(NoEscape(r'''
        \subsection*{Report Information}
        \vspace{0.2cm}
        
        \begin{tabular}{ll}
            \textbf{Report ID: } & ''' + data['metadata']['report_id'] + r''' \\
            \textbf{Generated:} & ''' + data['metadata']['generated_at'] + r''' \\
            \textbf{Analyst:} & ''' + data['metadata']['analyst'] + r''' \\
            \textbf{Tool Version:} & ''' + data['metadata']['tool_version'] + r''' \\
            \textbf{Report Version:} & 1.0 \\
            \textbf{Classification:} & \textcolor{SevCritical}{\textbf{CONFIDENTIAL}}
        \end{tabular}
        
        \vspace{0.5cm}
        \subsection*{Legal Disclaimer}
        
        \noindent
        This security assessment report is provided "as-is" for informational purposes only. 
        While SecureThread OPS employs industry-leading detection techniques, no automated 
        security tool can guarantee 100\% accuracy or detect all vulnerabilities.
        
        \vspace{0.3cm}
        \noindent
        \textbf{Limitations:}
        
        \begin{itemize}[leftmargin=*, topsep=3pt, itemsep=3pt]
            \item This report reflects a point-in-time assessment of the scanned codebase
            \item Static analysis cannot detect runtime or configuration vulnerabilities
            \item Business logic flaws may require manual security review
            \item False positives may occur and require expert validation
            \item New vulnerabilities may be discovered after report generation
        \end{itemize}
        
        \vspace{0.3cm}
        \noindent
        \textbf{Recommendations:}
        
        \begin{itemize}[leftmargin=*, topsep=3pt, itemsep=3pt]
            \item Conduct manual penetration testing for production systems
            \item Perform regular security assessments (quarterly recommended)
            \item Implement defense-in-depth security controls
            \item Train development teams on secure coding practices
            \item Maintain an incident response plan
        \end{itemize}
        
        \vspace{0.5cm}
        \subsection*{Confidentiality Notice}
        
        \noindent
        This document contains confidential and proprietary security information.  
        Distribution is restricted to authorized personnel only.  Unauthorized disclosure, 
        copying, or distribution may result in legal liability.
        
        \vspace{0.3cm}
        \noindent
        For questions or concerns regarding this report, contact:
        
        \begin{center}
        \begin{tcolorbox}[colback=STBgGray, colframe=STBlue, width=0.7\textwidth]
            \textbf{SecureThread Security Operations Center (SOC)} \\
            Email: security@securethread.io \\
            Support Portal: \url{https://support.securethread.io}
        \end{tcolorbox}
        \end{center}
        
        \vspace{0.5cm}
        \begin{center}
        \textcolor{STBlue}{\rule{0.8\textwidth}{0.5pt}}
        
        \vspace{0.3cm}
        \textit{End of Report}
        
        \vspace{0.2cm}
        \textcolor{STBlue}{\textbf{SecureThread OPS - Securing the Digital Future}}
        \end{center}
        '''))