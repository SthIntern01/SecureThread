# backend/app/services/latex_templates/recommendations_section.py

from pylatex import Section, Subsection, NoEscape
from pylatex.utils import escape_latex
from pathlib import Path

def generate_recommendations_section(doc, data):
    """
    Generates strategic recommendations section with prioritized action plan,
    remediation roadmap, and best practices. 
    """
    
    with doc.create(Section('Strategic Recommendations \\& Remediation Roadmap')):
        
        doc.append(NoEscape(r'''
        \noindent
        This section provides actionable recommendations prioritized by risk, impact, and remediation effort.
        Follow this roadmap to systematically improve your application's security posture.
        '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # ========================================================================
        # EXECUTIVE PRIORITIES (TOP 5 ACTIONS)
        # ========================================================================
        
        with doc.create(Subsection('Executive Action Plan: Top 5 Priorities')):
            
            doc.append(NoEscape(r'''
            \noindent
            The following actions should be prioritized for immediate executive attention based on 
            risk severity, business impact, and compliance requirements.
            \vspace{0.3cm}
            '''))
            
            metrics = data['metrics']
            financial = data['financial']
            compliance = data['compliance']
            
            # Dynamically generate priorities based on actual findings
            priorities = []
            
            # Priority 1: Critical vulnerabilities
            if metrics['severity_counts'].get('critical', 0) > 0:
                priorities.append({
                    'title': 'Address Critical Security Vulnerabilities',
                    'rationale': f"Found {metrics['severity_counts']['critical']} critical vulnerabilities that pose immediate risk of data breach or system compromise.",
                    'impact': 'Prevents potential data breaches, system compromise, and regulatory penalties',
                    'effort': f"{financial['severity_breakdown'].get('critical', {}).get('hours', 0):.0f} hours",
                    'timeline': '0-7 days (Immediate)',
                    'icon': 'SevCritical'
                })
            
            # Priority 2: Compliance issues
            total_compliance = compliance.get('total_compliance_issues', 0)
            if total_compliance > 10:
                priorities.append({
                    'title': 'Achieve Regulatory Compliance',
                    'rationale': f"Identified {total_compliance} compliance violations across OWASP, PCI DSS, and GDPR frameworks.",
                    'impact': 'Ensures regulatory compliance, avoids fines (up to 4% revenue for GDPR)',
                    'effort': 'Legal and compliance review required',
                    'timeline': '7-30 days',
                    'icon': 'SevHigh'
                })
            
            # Priority 3: High-severity issues
            if metrics['severity_counts'].get('high', 0) > 0:
                priorities.append({
                    'title': 'Remediate High-Severity Vulnerabilities',
                    'rationale': f"{metrics['severity_counts']['high']} high-severity issues require attention before production deployment.",
                    'impact': 'Reduces attack surface and exploitation risk significantly',
                    'effort': f"{financial['severity_breakdown'].get('high', {}).get('hours', 0):.0f} hours",
                    'timeline': '14-30 days',
                    'icon': 'SevHigh'
                })
            
            # Priority 4: Security hotspots
            hotspots = data.get('hotspots', {})
            if len(hotspots.get('file_hotspots', {})) > 0:
                top_file = list(hotspots['file_hotspots'].keys())[0] if hotspots['file_hotspots'] else "critical modules"
                priorities.append({
                    'title': 'Refactor Security Hotspots',
                    'rationale': f"Multiple vulnerabilities concentrated in {top_file} and other high-risk files.",
                    'impact': 'Improves overall code quality and reduces maintenance burden',
                    'effort': '40-80 hours (architectural review)',
                    'timeline': '30-60 days',
                    'icon': 'SevMedium'
                })
            
            # Priority 5: Implement secure SDLC
            priorities.append({
                'title': 'Integrate Security into Development Lifecycle',
                'rationale': 'Establish secure coding practices, automated scanning, and security training.',
                'impact': 'Prevents future vulnerabilities, reduces long-term security costs',
                'effort': 'Ongoing process improvement',
                'timeline': '60-90 days',
                'icon': 'STLightBlue'
            })
            
            # Render priorities (top 5)
            for idx, priority in enumerate(priorities[:5], 1):
                # ✅ ESCAPE ALL TEXT FIELDS
                safe_title = escape_latex(priority['title']).replace('&', r'\&')
                safe_rationale = escape_latex(priority['rationale']).replace('&', r'\&')
                safe_impact = escape_latex(priority['impact']).replace('&', r'\&')
                safe_effort = escape_latex(priority['effort']).replace('&', r'\&')
                safe_timeline = escape_latex(priority['timeline']).replace('&', r'\&')
                
                doc.append(NoEscape(rf'''
                \begin{{tcolorbox}}[
                    enhanced,
                    colback=white,
                    colframe={priority['icon']},
                    title={{\textbf{{Priority \#{idx}:   {safe_title}}}}},
                    fonttitle=\bfseries,
                    coltitle=white,
                    boxrule=2pt,
                    arc=2mm,
                    drop fuzzy shadow
                ]
                    \textbf{{Rationale:}} {safe_rationale}
                    
                    \vspace{{0.2cm}}
                    \begin{{tabular}}{{p{{0.22\textwidth}} p{{0.68\textwidth}}}}
                        \textbf{{Business Impact:}} & {safe_impact} \\
                        \textbf{{Estimated Effort:}} & {safe_effort} \\
                        \textbf{{Recommended Timeline:}} & \textcolor{{{priority['icon']}}}{{\textbf{{{safe_timeline}}}}}
                    \end{{tabular}}
                \end{{tcolorbox}}
                \vspace{{0.3cm}}
                '''))
        
        doc.append(NoEscape(r'\newpage'))
        
        # ========================================================================
        # REMEDIATION ROADMAP (SPRINT-BASED)
        # ========================================================================
        
        with doc.create(Subsection('Remediation Roadmap: Sprint Planning')):
            
            doc.append(NoEscape(r'''
            \noindent
            This roadmap organizes remediation activities into 2-week sprints, allowing for 
            iterative security improvements while maintaining development velocity.
            \vspace{0.3cm}
            '''))
            
            # Calculate sprint allocations
            critical_count = metrics['severity_counts'].get('critical', 0)
            high_count = metrics['severity_counts'].get('high', 0)
            medium_count = metrics['severity_counts'].get('medium', 0)
            low_count = metrics['severity_counts'].get('low', 0)
            
            # Sprint 1: Critical + Highest priority high
            sprint_1_items = min(critical_count + min(high_count, 3), 10)
            sprint_1_hours = financial['severity_breakdown'].get('critical', {}).get('hours', 0) + \
                             min(high_count, 3) * 6
            
            # Sprint 2: Remaining high + some medium
            sprint_2_items = max(high_count - 3, 0) + min(medium_count, 5)
            sprint_2_hours = max(high_count - 3, 0) * 6 + min(medium_count, 5) * 3
            
            # Sprint 3: Remaining medium + low
            sprint_3_items = max(medium_count - 5, 0) + min(low_count, 10)
            sprint_3_hours = max(medium_count - 5, 0) * 3 + min(low_count, 10) * 1
            
            doc.append(NoEscape(r'''
            \begin{center}
            \renewcommand{\arraystretch}{1.5}
            \begin{longtable}{|p{0.15\textwidth}|p{0.45\textwidth}|p{0.12\textwidth}|p{0.12\textwidth}|p{0.1\textwidth}|}
                \hline
                \rowcolor{STBlue}
                \textbf{\textcolor{white}{Sprint}} & 
                \textbf{\textcolor{white}{Focus Areas}} & 
                \textbf{\textcolor{white}{Issues}} & 
                \textbf{\textcolor{white}{Effort}} & 
                \textbf{\textcolor{white}{Team}} \\
                \hline
                \endhead
                
                \rowcolor{SevCritical!10}
                \textbf{Sprint 1} \newline (Week 1-2) & 
                \textbf{Critical Vulnerabilities} \newline
                • All critical security issues \newline
                • Top 3 high-severity issues \newline
                • Emergency patches & 
                \textcolor{SevCritical}{\textbf{''' + str(sprint_1_items) + r'''}} & 
                ''' + f"{sprint_1_hours:.0f}" + r''' hrs \newline
                (''' + f"{sprint_1_hours/8:.1f}" + r''' days) & 
                2-3 devs \\
                \hline
                
                \rowcolor{SevHigh!10}
                \textbf{Sprint 2} \newline (Week 3-4) & 
                \textbf{High \& Medium Issues} \newline
                • Remaining high-severity \newline
                • Top medium-severity \newline
                • Compliance gaps & 
                \textcolor{SevHigh}{\textbf{''' + str(sprint_2_items) + r'''}} & 
                ''' + f"{sprint_2_hours:.0f}" + r''' hrs \newline
                (''' + f"{sprint_2_hours/8:.1f}" + r''' days) & 
                2 devs \\
                \hline
                
                \rowcolor{SevMedium!10}
                \textbf{Sprint 3} \newline (Week 5-6) & 
                \textbf{Medium \& Low Issues} \newline
                • Remaining medium issues \newline
                • Quick-win low issues \newline
                • Code quality improvements & 
                \textcolor{SevMedium}{\textbf{''' + str(sprint_3_items) + r'''}} & 
                ''' + f"{sprint_3_hours:.0f}" + r''' hrs \newline
                (''' + f"{sprint_3_hours/8:.1f}" + r''' days) & 
                1-2 devs \\
                \hline
                
                \rowcolor{STBgGray}
                \textbf{Sprint 4+} \newline (Ongoing) & 
                \textbf{Continuous Improvement} \newline
                • Security training \newline
                • Automated testing integration \newline
                • Security documentation & 
                \textcolor{STBlue}{\textbf{Ongoing}} & 
                Ongoing & 
                Full team \\
                \hline
            \end{longtable}
            \end{center}
            '''))
            
            # Total remediation timeline
            total_sprints = 3
            total_weeks = total_sprints * 2
            total_effort_days = financial['estimated_days']
            
            doc.append(NoEscape(rf'''
            \vspace{{0.3cm}}
            \begin{{tcolorbox}}[colback=STBgGray, colframe=STBlue, title=\textbf{{Remediation Timeline Summary}}]
                \begin{{tabular}}{{ll}}
                    \textbf{{Total Sprints: }} & {total_sprints} (6 weeks) \\
                    \textbf{{Total Effort: }} & {financial['formatted']['hours']} \\
                    \textbf{{Estimated Cost:}} & {financial['formatted']['remediation']} \\
                    \textbf{{Team Size:}} & 2-3 developers (recommended) \\
                    \textbf{{Completion Target:}} & 6-8 weeks from start
                \end{{tabular}}
            \end{{tcolorbox}}
            '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # ========================================================================
        # QUICK WINS (Low effort, high impact)
        # ========================================================================
        
        with doc.create(Subsection('Quick Wins: Low Effort, High Impact')):
            
            doc.append(NoEscape(r'''
            \noindent
            The following improvements can be implemented quickly (< 4 hours each) but provide 
            significant security value.  Prioritize these for immediate wins.
            \vspace{0.3cm}
            '''))
            
            # Generate quick wins based on actual vulnerabilities
            vulnerabilities = data.get('vulnerabilities', [])
            quick_wins = []
            
            # Identify quick wins (issues with fix suggestions that are low/medium severity)
            for vuln in vulnerabilities:
                if vuln.get('fix_suggestion') and vuln['severity'] in ['low', 'medium']:
                    quick_wins.append({
                        'category': vuln['category'],
                        'title': vuln['title'],
                        'location': vuln['location'],
                        'effort': '1-4 hours'
                    })
            
            if quick_wins:
                doc.append(NoEscape(r'\begin{itemize}[leftmargin=*, topsep=0pt, itemsep=5pt]'))
                
                # Show top 10 quick wins
                for qw in quick_wins[:10]:
                    doc.append(NoEscape(rf'''
                    \item \textbf{{{qw['category']}}} in \texttt{{{qw['location'][:50]}...}} 
                    \newline \textit{{Effort: {qw['effort']}}}
                    '''))
                
                doc.append(NoEscape(r'\end{itemize}'))
            else:
                doc.append(NoEscape(r'''
                \noindent
                Most vulnerabilities require moderate to significant effort.  Focus on the sprint roadmap above.
                '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # ========================================================================
        # SECURE CODING BEST PRACTICES
        # ========================================================================
        
        with doc.create(Subsection('Secure Coding Best Practices')):
            
            doc.append(NoEscape(r'''
            \noindent
            Implement these secure coding standards to prevent future vulnerabilities:
            \vspace{0.3cm}
            '''))
            
            # Determine which best practices to recommend based on findings
            analytics = data.get('analytics', {})
            top_categories = analytics.get('top_categories', {})
            
            best_practices = []
            
            # Input validation if injection issues found
            if any(cat in str(top_categories) for cat in ['Injection', 'XSS', 'SQL']):
                best_practices.append({
                    'title': 'Input Validation \\& Sanitization',
                    'practices': [
                        'Validate all user input against strict allow-lists',
                        'Use parameterized queries for database operations',
                        'Encode output based on context (HTML, JavaScript, SQL)',
                        'Implement Content Security Policy (CSP) headers'
                    ]
                })
            
            # Authentication if auth issues found
            if any(cat in str(top_categories) for cat in ['Authentication', 'Authorization', 'Access Control']):
                best_practices.append({
                    'title': 'Authentication \\& Authorization',
                    'practices': [
                        'Enforce strong password policies (min 12 chars, complexity)',
                        'Implement multi-factor authentication (MFA)',
                        'Use secure session management (HttpOnly, Secure, SameSite flags)',
                        'Apply principle of least privilege for all access controls'
                    ]
                })
            
            # Cryptography if crypto issues found
            if any(cat in str(top_categories) for cat in ['Cryptographic', 'Encryption', 'Hashing']):
                best_practices.append({
                    'title': 'Cryptographic Standards',
                    'practices': [
                        'Use AES-256 for symmetric encryption',
                        'Use RSA-2048+ or ECC for asymmetric encryption',
                        'Hash passwords with bcrypt, scrypt, or Argon2',
                        'Never store plaintext secrets or API keys in code'
                    ]
                })
            
            # Error handling
            best_practices.append({
                'title': 'Error Handling \\& Logging',
                'practices': [
                    'Never expose stack traces or internal paths to users',
                    'Log all security-relevant events (auth, access, changes)',
                    'Implement centralized logging with tamper-proof storage',
                    'Set up real-time alerting for security anomalies'
                ]
            })
            
            # Dependency management
            best_practices.append({
                'title': 'Dependency \\& Supply Chain Security',
                'practices': [
                    'Keep all dependencies updated to latest stable versions',
                    'Use automated tools (Dependabot, Snyk) for vulnerability scanning',
                    'Verify package integrity using checksums or signatures',
                    'Minimize dependency count and audit third-party code'
                ]
            })
            
            # Render best practices
            for bp in best_practices:
                doc.append(NoEscape(rf'''
                \textbf{{{bp['title']}}}
                \begin{{itemize}}[leftmargin=*, topsep=3pt, itemsep=2pt]
                '''))
                
                for practice in bp['practices']:
                    doc.append(NoEscape(rf'\item {practice}'))
                
                doc.append(NoEscape(r'\end{itemize}'))
                doc.append(NoEscape(r'\vspace{0.2cm}'))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # ========================================================================
        # SECURITY TOOLING RECOMMENDATIONS
        # ========================================================================
        
        with doc.create(Subsection('Recommended Security Tooling')):
            
            doc.append(NoEscape(r'''
            \noindent
            Integrate the following tools into your development pipeline for continuous security: 
            \vspace{0.3cm}
            '''))
            
            doc.append(NoEscape(r'''
            \begin{center}
            \renewcommand{\arraystretch}{1.4}
            \begin{tabular}{|p{0.25\textwidth}|p{0.35\textwidth}|p{0.3\textwidth}|}
                \hline
                \rowcolor{STBlue}
                \textbf{\textcolor{white}{Tool Category}} & 
                \textbf{\textcolor{white}{Recommended Tools}} & 
                \textbf{\textcolor{white}{Integration Point}} \\
                \hline
                
                \textbf{SAST} \newline (Static Analysis) & 
                SecureThread OPS, SonarQube, Semgrep & 
                Pre-commit hooks, CI/CD pipeline \\
                \hline
                
                \textbf{DAST} \newline (Dynamic Analysis) & 
                OWASP ZAP, Burp Suite, Acunetix & 
                Staging environment, nightly scans \\
                \hline
                
                \textbf{SCA} \newline (Dependency Scanning) & 
                Snyk, Dependabot, WhiteSource & 
                PR checks, scheduled scans \\
                \hline
                
                \textbf{Secrets Detection} & 
                GitGuardian, TruffleHog, detect-secrets & 
                Pre-commit, repository scanning \\
                \hline
                
                \textbf{Container Security} & 
                Trivy, Clair, Anchore & 
                Docker build, registry scanning \\
                \hline
                
                \textbf{IaC Security} & 
                Checkov, Terrascan, tfsec & 
                Terraform/CloudFormation validation \\
                \hline
            \end{tabular}
            \end{center}
            '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # ========================================================================
        # METRICS & KPIs TO TRACK
        # ========================================================================
        
        with doc.create(Subsection('Security Metrics \\& KPIs')):
            
            doc.append(NoEscape(r'''
            \noindent
            Track these key performance indicators to measure security improvement over time:
            \vspace{0.3cm}
            '''))
            
            current_score = metrics['score']
            current_density = metrics['density']
            
            fixable_count = metrics['fixable_count']
            total_vulns = metrics['total_vulns']
            critical_issues = metrics['severity_counts'].get('critical', 0)
            high_issues = metrics['severity_counts'].get('high', 0)
            compliance_grade = data.get('_compliance_grade', 'N/A')

            doc.append(NoEscape(rf'''
            \begin{{tcolorbox}}[colback=STBgGray, colframe=STBlue, title=\textbf{{Current Baseline Metrics}}]
                \begin{{tabular}}{{p{{0.45\textwidth}} p{{0.45\textwidth}}}}
                    \textbf{{Security Score:}} {current_score}/100 & 
                    \textbf{{Vulnerability Density:}} {current_density}/1k LOC \\
                    \textbf{{Critical Issues:}} {critical_issues} & 
                    \textbf{{High Issues:}} {high_issues} \\
                    \textbf{{Compliance Grade: }} {compliance_grade} & 
                    \textbf{{Fixable Issues:}} {fixable_count}/{total_vulns}
                \end{{tabular}}
            \end{{tcolorbox}}
            \vspace{{0.3cm}}
            '''))
                        
            # Target metrics
            target_score = min(current_score + 25, 95)
            target_density = max(current_density * 0.3, 0.5)
            
            doc.append(NoEscape(rf'''
            \textbf{{Target Metrics (After Remediation):}}
            \begin{{itemize}}[leftmargin=*, topsep=3pt, itemsep=3pt]
                \item Security Score: \textcolor{{success}}{{\textbf{{{target_score}+/100}}}} (improve by 25+ points)
                \item Vulnerability Density: \textcolor{{success}}{{\textbf{{< {target_density:.1f}/1k LOC}}}} (reduce by 70\%)
                \item Critical Issues: \textcolor{{success}}{{\textbf{{0}}}} (complete elimination)
                \item High Issues:  \textcolor{{success}}{{\textbf{{< 3}}}} (minimal acceptable risk)
                \item Time to Remediate: \textcolor{{success}}{{\textbf{{< 7 days}}}} (for critical issues)
            \end{{itemize}}
            '''))
        
        doc.append(NoEscape(r'\newpage'))