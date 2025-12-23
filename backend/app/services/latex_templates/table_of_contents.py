# backend/app/services/latex_templates/table_of_contents.py

from pylatex import NoEscape, NewPage

def generate_toc(doc):
    """
    Generates professionally styled Table of Contents with:
    - Custom formatting and colors
    - List of Figures and Tables
    - Document navigation guide
    - Roman numerals for front matter
    """
    
    # =========================================================================
    # 1. START NEW PAGE & SETUP
    # =========================================================================
    
    doc.append(NewPage())
    doc.append(NoEscape(r'\thispagestyle{fancy}'))  # Apply header/footer
    
    # Use Roman numerals for front matter (i, ii, iii...)
    doc.append(NoEscape(r'\pagenumbering{roman}'))
    doc.append(NoEscape(r'\setcounter{page}{1}'))
    
    # =========================================================================
    # 2. CUSTOMIZE TOC APPEARANCE
    # =========================================================================
    
    # Customize the "Contents" title
    doc.append(NoEscape(r'''
    \renewcommand{\contentsname}{
        \textcolor{STBlue}{\Huge\bfseries Table of Contents}
    }
    '''))
    
    # Adjust TOC depth (show sections and subsections only)
    doc.append(NoEscape(r'\setcounter{tocdepth}{2}'))
    
    # Custom TOC formatting for better readability
    doc.append(NoEscape(r'''
    % Customize section entries in TOC
    \renewcommand{\cftsecfont}{\bfseries\color{STBlue}}
    \renewcommand{\cftsecpagefont}{\bfseries\color{STBlue}}
    \renewcommand{\cftsecleader}{\cftdotfill{\cftdotsep}}
    
    % Customize subsection entries
    \renewcommand{\cftsubsecfont}{\color{STText}}
    \renewcommand{\cftsubsecpagefont}{\color{STText}}
    
    % Add spacing
    \renewcommand{\cftsecafterpnum}{\vskip 3pt}
    \renewcommand{\cftsubsecafterpnum}{\vskip 2pt}
    '''))
    
    # =========================================================================
    # 3. NAVIGATION GUIDE BOX
    # =========================================================================
    
    doc.append(NoEscape(r'''
    \begin{tcolorbox}[
        colback=STBgGray, 
        colframe=STLightBlue, 
        boxrule=1.5pt,
        arc=2mm,
        title=\textbf{Report Navigation Guide},
        coltitle=white,
        fonttitle=\bfseries
    ]
        \small
        This report is organized into the following main sections:
        
        \vspace{0.2cm}
        \begin{description}[leftmargin=2.5cm, style=nextline, itemsep=5pt]
            \item[\textcolor{STBlue}{\textbf{Section 1:}}] 
            \textbf{Executive Summary} - High-level overview for management and stakeholders
            
            \item[\textcolor{STBlue}{\textbf{Section 2:}}] 
            \textbf{Compliance Mapping} - Regulatory and framework alignment (OWASP, PCI DSS, GDPR)
            
            \item[\textcolor{STBlue}{\textbf{Section 3:}}] 
            \textbf{Detailed Findings} - Technical vulnerability details for development teams
            
            \item[\textcolor{STBlue}{\textbf{Section 4:}}] 
            \textbf{Recommendations} - Prioritized remediation roadmap and best practices
            
            \item[\textcolor{STBlue}{\textbf{Appendices:}}] 
            \textbf{Reference Materials} - Methodology, glossary, CWE reference, and resources
        \end{description}
        
        \vspace{0.2cm}
        \textbf{Quick Start: }
        \begin{itemize}[leftmargin=1.5cm, topsep=2pt, itemsep=2pt]
            \item Executives:  Read Section 1 (Executive Summary)
            \item Developers: Focus on Section 3 (Detailed Findings) and Section 4 (Recommendations)
            \item Compliance: Review Section 2 (Compliance Mapping)
            \item Security Team: Review all sections
        \end{itemize}
    \end{tcolorbox}
    '''))
    
    doc.append(NoEscape(r'\vspace{0.8cm}'))
    
    # =========================================================================
    # 4. GENERATE TABLE OF CONTENTS
    # =========================================================================
    
    doc.append(NoEscape(r'''
    % Insert the actual table of contents
    \tableofcontents
    '''))
    
    doc.append(NoEscape(r'\vspace{1cm}'))
    
    # =========================================================================
    # 5. LIST OF FIGURES (Charts and Visualizations)
    # =========================================================================
    
    doc.append(NoEscape(r'''
    \renewcommand{\listfigurename}{
        \textcolor{STBlue}{\Large\bfseries List of Figures \& Visualizations}
    }
    '''))
    
    doc.append(NoEscape(r'\vspace{0.5cm}'))
    
    doc.append(NoEscape(r'''
    % Customize figure list appearance
    \renewcommand{\cftfigfont}{\color{STText}}
    \renewcommand{\cftfigpagefont}{\color{STText}}
    \renewcommand{\cftfigafterpnum}{\vskip 2pt}
    '''))
    
    doc.append(NoEscape(r'\listoffigures'))
    
    # =========================================================================
    # 6. LIST OF TABLES (Optional - if you add tables)
    # =========================================================================
    
    # Uncomment if you want to include a list of tables
    # doc.append(NoEscape(r'\vspace{1cm}'))
    # doc.append(NoEscape(r'''
    # \renewcommand{\listtablename}{
    #      \textcolor{STBlue}{\Large\bfseries List of Tables}
    # }
    # '''))
    # doc.append(NoEscape(r'\listoftables'))
    
    # =========================================================================
    # 7. SEVERITY LEGEND (Quick Reference)
    # =========================================================================
    
    doc.append(NoEscape(r'\newpage'))
    doc.append(NoEscape(r'\thispagestyle{fancy}'))
    
    doc.append(NoEscape(r'''
    \section*{\textcolor{STBlue}{Severity Rating Legend}}
    \addcontentsline{toc}{section}{Severity Rating Legend}
    
    \vspace{0.3cm}
    
    \noindent
    This report uses a standardized severity rating system based on CVSS (Common Vulnerability 
    Scoring System) and impact assessment.  Use this legend to quickly understand the urgency 
    of each finding. 
    
    \vspace{0.5cm}
    
    \begin{center}
    \renewcommand{\arraystretch}{1.8}
    \begin{tabular}{|c|p{0.18\textwidth}|p{0.35\textwidth}|p{0.25\textwidth}|}
        \hline
        \rowcolor{STBlue}
        \textbf{\textcolor{white}{Icon}} & 
        \textbf{\textcolor{white}{Severity}} & 
        \textbf{\textcolor{white}{Description}} & 
        \textbf{\textcolor{white}{Action Timeline}} \\
        \hline
        
        \cellcolor{SevCritical!20}
        {\Huge\textcolor{SevCritical}{\textbf{C}}} & 
        \textcolor{SevCritical}{\textbf{\Large CRITICAL}} \newline
        {\footnotesize CVSS: 9.0-10.0} & 
        Immediate threat of system compromise, data breach, or complete service disruption.   
        Exploitable remotely without authentication.  & 
        \textcolor{SevCritical}{\textbf{0-72 hours}} \newline
        {\footnotesize Immediate action required} \\
        \hline
        
        \cellcolor{SevHigh!20}
        {\Huge\textcolor{SevHigh}{\textbf{H}}} & 
        \textcolor{SevHigh}{\textbf{\Large HIGH}} \newline
        {\footnotesize CVSS: 7.0-8.9} & 
        Significant security risk allowing unauthorized access, data exposure, or privilege escalation.  
        May require some user interaction.  & 
        \textcolor{SevHigh}{\textbf{7-14 days}} \newline
        {\footnotesize Urgent attention needed} \\
        \hline
        
        \cellcolor{SevMedium!20}
        {\Huge\textcolor{SevMedium}{\textbf{M}}} & 
        \textcolor{SevMedium}{\textbf{\Large MEDIUM}} \newline
        {\footnotesize CVSS: 4.0-6.9} & 
        Moderate security weakness that could lead to information disclosure or limited access.  
        Typically requires specific conditions to exploit. & 
        \textcolor{SevMedium}{\textbf{30-60 days}} \newline
        {\footnotesize Address in next sprint} \\
        \hline
        
        \cellcolor{SevLow!20}
        {\Huge\textcolor{SevLow}{\textbf{L}}} & 
        \textcolor{SevLow}{\textbf{\Large LOW}} \newline
        {\footnotesize CVSS: 0.1-3.9} & 
        Minor security concern with minimal impact.  Difficult to exploit or requires 
        extensive preconditions. & 
        \textcolor{SevLow}{\textbf{60-90 days}} \newline
        {\footnotesize Maintenance priority} \\
        \hline
        
        \cellcolor{gray!10}
        {\Huge\textcolor{gray}{\textbf{I}}} & 
        \textcolor{gray}{\textbf{\Large INFO}} \newline
        {\footnotesize CVSS: 0.0} & 
        Informational finding or security best practice recommendation without 
        direct exploitability. & 
        \textcolor{gray}{\textbf{Ongoing}} \newline
        {\footnotesize Best practice improvement} \\
        \hline
    \end{tabular}
    \end{center}
    '''))
    
    doc.append(NoEscape(r'\vspace{0.5cm}'))
    
    # =========================================================================
    # 8. CVSS SCORING REFERENCE
    # =========================================================================
    
    doc.append(NoEscape(r'''
    \subsection*{\textcolor{STBlue}{CVSS Score Calculation}}
    
    \noindent
    CVSS (Common Vulnerability Scoring System) scores are calculated based on:
    
    \vspace{0.3cm}
    
    \begin{center}
    \begin{tabular}{|p{0.25\textwidth}|p{0.65\textwidth}|}
        \hline
        \rowcolor{STBgGray}
        \textbf{Factor} & \textbf{Description} \\
        \hline
        \textbf{Attack Vector} & How the vulnerability can be exploited (Network, Adjacent, Local, Physical) \\
        \hline
        \textbf{Attack Complexity} & Conditions beyond attacker's control (Low, High) \\
        \hline
        \textbf{Privileges Required} & Level of access needed (None, Low, High) \\
        \hline
        \textbf{User Interaction} & Whether user action is required (None, Required) \\
        \hline
        \textbf{Confidentiality Impact} & Impact on data confidentiality (None, Low, High) \\
        \hline
        \textbf{Integrity Impact} & Impact on data integrity (None, Low, High) \\
        \hline
        \textbf{Availability Impact} & Impact on system availability (None, Low, High) \\
        \hline
    \end{tabular}
    \end{center}
    
    \vspace{0.3cm}
    
    \begin{tcolorbox}[colback=STBgGray, colframe=STBlue]
        \textbf{Note: } For complete CVSS documentation, visit: \url{https://www.first.org/cvss/}
    \end{tcolorbox}
    '''))
    
    # =========================================================================
    # 9. ABBREVIATIONS & ACRONYMS (Quick Reference)
    # =========================================================================
    
    doc.append(NoEscape(r'\newpage'))
    doc.append(NoEscape(r'\thispagestyle{fancy}'))
    
    doc.append(NoEscape(r'''
    \section*{\textcolor{STBlue}{Common Abbreviations \& Acronyms}}
    \addcontentsline{toc}{section}{Abbreviations \& Acronyms}
    
    \vspace{0.3cm}
    
    \noindent
    Quick reference for technical terms used throughout this report:
    
    \vspace{0.5cm}
    
    \begin{multicols}{2}
    \begin{description}[leftmargin=2.5cm, style=nextline, itemsep=3pt]
        \item[API] Application Programming Interface
        \item[CORS] Cross-Origin Resource Sharing
        \item[CSRF] Cross-Site Request Forgery
        \item[CVE] Common Vulnerabilities and Exposures
        \item[CVSS] Common Vulnerability Scoring System
        \item[CWE] Common Weakness Enumeration
        \item[DAST] Dynamic Application Security Testing
        \item[DoS] Denial of Service
        \item[GDPR] General Data Protection Regulation
        \item[HIPAA] Health Insurance Portability and Accountability Act
        \item[HTTPS] Hypertext Transfer Protocol Secure
        \item[IAM] Identity and Access Management
        \item[IaC] Infrastructure as Code
        \item[JSON] JavaScript Object Notation
        \item[JWT] JSON Web Token
        \item[LOC] Lines of Code
        \item[MFA] Multi-Factor Authentication
        \item[NIST] National Institute of Standards and Technology
        \item[OWASP] Open Web Application Security Project
        \item[PCI DSS] Payment Card Industry Data Security Standard
        \item[PII] Personally Identifiable Information
        \item[REST] Representational State Transfer
        \item[RCE] Remote Code Execution
        \item[SANS] SysAdmin, Audit, Network, Security
        \item[SAST] Static Application Security Testing
        \item[SCA] Software Composition Analysis
        \item[SDLC] Software Development Lifecycle
        \item[SOC] Security Operations Center
        \item[SQL] Structured Query Language
        \item[SSRF] Server-Side Request Forgery
        \item[SSL/TLS] Secure Sockets Layer / Transport Layer Security
        \item[XSS] Cross-Site Scripting
        \item[XXE] XML External Entity
    \end{description}
    \end{multicols}
    
    \vspace{0.3cm}
    
    \begin{tcolorbox}[colback=STBgGray, colframe=STLightBlue]
        \textbf{Need More Detail? } A comprehensive glossary is available in Appendix D (page \pageref{sec:glossary}).
    \end{tcolorbox}
    '''))
    
    # =========================================================================
    # 10. RESET PAGE NUMBERING FOR MAIN CONTENT
    # =========================================================================
    
    doc.append(NewPage())
    
    # Switch to Arabic numerals (1, 2, 3...) for main report
    doc.append(NoEscape(r'\pagenumbering{arabic}'))
    doc.append(NoEscape(r'\setcounter{page}{1}'))
    
    # Ensure fancy page style (header/footer) is applied
    doc.append(NoEscape(r'\pagestyle{fancy}'))


def add_back_matter_separator(doc):
    """
    Optional: Add a visual separator before appendices
    Can be called before generating appendix sections
    """
    
    doc.append(NoEscape(r'\newpage'))
    doc.append(NoEscape(r'\thispagestyle{empty}'))
    
    doc.append(NoEscape(r'''
    \vspace*{\fill}
    
    \begin{center}
        \begin{tikzpicture}
            \draw[STBlue, line width=2pt] (0,0) -- (10,0);
        \end{tikzpicture}
        
        \vspace{1cm}
        
        {\Huge\textcolor{STBlue}{\textbf{APPENDICES}}}
        
        \vspace{0.5cm}
        
        {\Large\textcolor{STLightBlue}{Reference Materials \& Technical Documentation}}
        
        \vspace{1cm}
        
        \begin{tikzpicture}
            \draw[STBlue, line width=2pt] (0,0) -- (10,0);
        \end{tikzpicture}
    \end{center}
    
    \vspace*{\fill}
    '''))
    
    doc.append(NoEscape(r'\newpage'))