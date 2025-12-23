# backend/app/services/latex_templates/executive_summary.py

from pylatex import Section, Subsection, NoEscape
from pathlib import Path

def generate_executive_summary(doc, data, output_path: Path):
    """
    Generates comprehensive Executive Summary section. 
    Includes Security Grade, Financial Analysis, Critical Highlights, and Key Metrics.
    """
    
    with doc.create(Section('Executive Summary', numbering=False)):
        
        # =====================================================================
        # 1. ASSESSMENT OVERVIEW WITH SECURITY SCORE GAUGE
        # =====================================================================
        
        metrics = data['metrics']
        financial = data['financial']
        repository = data['repository']
        scan = data['scan']
        
        gauge_path = str(output_path / "chart_gauge.png").replace('\\', '/')
        
        doc.append(NoEscape(r'''
        \noindent
        \begin{minipage}[t]{0.52\textwidth}
            \raggedright
            \vspace{0pt}
            
            \textbf{\Large Assessment Overview}\\[0.4cm]
            
            SecureThread OPS has completed a comprehensive automated security assessment 
            of the \textbf{''' + repository['name'] + r'''} repository using Static Application 
            Security Testing (SAST) techniques combined with AI-powered analysis. 
            
            \vspace{0.3cm}
            \textbf{Key Statistics: }
            
            \renewcommand{\arraystretch}{1.4}
            \begin{tabular}{@{}ll@{}}
                \textbf{Scan Date:} & ''' + scan['date'] + r''' \\
                \textbf{Branch/Commit:} & \texttt{''' + repository['branch'] + r''' / ''' + repository['commit'] + r'''} \\
                \textbf{Files Analyzed:} & ''' + f"{scan['files_scanned']:,}" + r''' \\
                \textbf{Lines of Code:} & ''' + f"{scan['loc_estimate']:,}" + r''' \\
                \textbf{Total Findings:} & \textcolor{SevCritical}{\textbf{''' + str(metrics['total_vulns']) + r'''}} \\
                \textbf{Vulnerability Density:} & ''' + str(metrics['density']) + r''' per 1k LOC \\
                \textbf{Auto-Fixable:} & \textcolor{success}{\textbf{''' + str(metrics['auto_fixable_count']) + r''' (''' + f"{metrics['auto_fixable_count']/max(metrics['total_vulns'],1)*100:.0f}" + r'''\%)}}
            \end{tabular}
        \end{minipage}
        \hfill
        \begin{minipage}[t]{0.45\textwidth}
            \vspace{0pt}
            \centering
            \includegraphics[width=1.0\linewidth]{''' + gauge_path + r'''}
        \end{minipage}
        '''))
        
        doc.append(NoEscape(r'\vspace{0.8cm}'))
        
        # =====================================================================
        # 2. SEVERITY BREAKDOWN SUMMARY
        # =====================================================================
        
        critical_count = metrics['severity_counts'].get('critical', 0)
        high_count = metrics['severity_counts'].get('high', 0)
        medium_count = metrics['severity_counts'].get('medium', 0)
        low_count = metrics['severity_counts'].get('low', 0)
        
        doc.append(NoEscape(r'''
        \subsection*{Severity Distribution}
        
        \noindent
        The following table summarizes the distribution of vulnerabilities by severity level:
        \vspace{0.3cm}
        
        \begin{center}
        \renewcommand{\arraystretch}{1.6}
        \begin{tabular}{|c|c|c|p{0.5\textwidth}|}
            \hline
            \rowcolor{STBlue}
            \textbf{\textcolor{white}{Severity}} & 
            \textbf{\textcolor{white}{Count}} & 
            \textbf{\textcolor{white}{\%}} & 
            \textbf{\textcolor{white}{Risk Assessment}} \\
            \hline
            
            \rowcolor{SevCritical!15}
            \textcolor{SevCritical}{\textbf{CRITICAL}} & 
            \textcolor{SevCritical}{\textbf{''' + str(critical_count) + r'''}} & 
            \textbf{''' + f"{(critical_count/max(metrics['total_vulns'],1)*100):.1f}" + r'''\%} & 
            ''' + ('Immediate remediation required - system compromise risk' if critical_count > 0 else 'None detected') + r''' \\
            \hline
            
            \rowcolor{SevHigh!15}
            \textcolor{SevHigh}{\textbf{HIGH}} & 
            \textcolor{SevHigh}{\textbf{''' + str(high_count) + r'''}} & 
            \textbf{''' + f"{(high_count/max(metrics['total_vulns'],1)*100):.1f}" + r'''\%} & 
            ''' + ('Urgent attention needed - significant security risk' if high_count > 0 else 'None detected') + r''' \\
            \hline
            
            \rowcolor{SevMedium!15}
            \textcolor{SevMedium}{\textbf{MEDIUM}} & 
            \textcolor{SevMedium}{\textbf{''' + str(medium_count) + r'''}} & 
            \textbf{''' + f"{(medium_count/max(metrics['total_vulns'],1)*100):.1f}" + r'''\%} & 
            ''' + ('Address in next sprint - moderate risk' if medium_count > 0 else 'None detected') + r''' \\
            \hline
            
            \rowcolor{SevLow!15}
            \textcolor{SevLow}{\textbf{LOW}} & 
            \textcolor{SevLow}{\textbf{''' + str(low_count) + r'''}} & 
            \textbf{''' + f"{(low_count/max(metrics['total_vulns'],1)*100):.1f}" + r'''\%} & 
            ''' + ('Address during maintenance - minimal risk' if low_count > 0 else 'None detected') + r''' \\
            \hline
        \end{tabular}
        \end{center}
        '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # =====================================================================
        # 3. BUSINESS IMPACT & FINANCIAL ANALYSIS
        # =====================================================================
        
        doc.append(NoEscape(r'''
        \subsection*{Business Impact Analysis}
        
        \noindent
        This section quantifies the financial and operational impact of identified vulnerabilities:
        \vspace{0.3cm}
        '''))
        
        doc.append(NoEscape(r'''
        \begin{center}
        \begin{tabular}{|p{0.3\textwidth}|p{0.3\textwidth}|p{0.3\textwidth}|}
            \hline
            \rowcolor{STBlue}
            \textbf{\textcolor{white}{Metric}} & 
            \textbf{\textcolor{white}{Value}} & 
            \textbf{\textcolor{white}{Impact Level}} \\
            \hline
            
            \textbf{Remediation Cost} \newline 
            {\footnotesize Developer hours to fix} & 
            {\Large \textbf{''' + financial['formatted']['remediation'] + r'''}} & 
            ''' + ('\\textcolor{SevCritical}{\\textbf{HIGH}}' if financial['total_remediation_cost'] > 10000 else '\\textcolor{SevMedium}{\\textbf{MEDIUM}}') + r''' \\
            \hline
            
            \textbf{Potential Breach Cost} \newline 
            {\footnotesize If vulnerabilities exploited} & 
            {\Large \textbf{''' + financial['formatted']['breach_risk'] + r'''}} & 
            ''' + ('\\textcolor{SevCritical}{\\textbf{CRITICAL}}' if financial['total_breach_risk'] > 50000 else '\\textcolor{SevHigh}{\\textbf{HIGH}}') + r''' \\
            \hline
            
            \textbf{Total Estimated Effort} \newline 
            {\footnotesize Time to complete remediation} & 
            {\Large \textbf{''' + financial['formatted']['hours'] + r'''}} & 
            ''' + ('\\textcolor{SevHigh}{\\textbf{SIGNIFICANT}}' if financial['total_hours'] > 100 else '\\textcolor{SevMedium}{\\textbf{MODERATE}}') + r''' \\
            \hline
            
            \textbf{Total Financial Risk} \newline 
            {\footnotesize Combined cost exposure} & 
            {\Large \textbf{''' + financial['formatted']['total'] + r'''}} & 
            ''' + ('\\textcolor{SevCritical}{\\textbf{SEVERE}}' if financial['total_potential_loss'] > 75000 else '\\textcolor{SevHigh}{\\textbf{ELEVATED}}') + r''' \\
            \hline
        \end{tabular}
        \end{center}
        '''))
        
        # Financial impact recommendation
        if financial['total_potential_loss'] > 50000:
            doc.append(NoEscape(r'''
            \vspace{0.3cm}
            \begin{tcolorbox}[colback=SevCritical!10, colframe=SevCritical, title=\textbf{Executive Action Required}]
                The identified vulnerabilities represent a \textbf{significant financial risk} exceeding 
                \textbf{''' + financial['formatted']['total'] + r'''}.  Immediate executive attention and 
                resource allocation is recommended to address critical security gaps and prevent potential 
                data breaches that could result in regulatory fines, legal liability, and reputational damage.
            \end{tcolorbox}
            '''))
        elif financial['total_potential_loss'] > 20000:
            doc.append(NoEscape(r'''
            \vspace{0.3cm}
            \begin{tcolorbox}[colback=SevHigh!10, colframe=SevHigh, title=\textbf{Management Attention Needed}]
                The security findings indicate a \textbf{moderate financial risk} of approximately 
                \textbf{''' + financial['formatted']['total'] + r'''}. Prioritize remediation activities 
                in upcoming development sprints to reduce exposure. 
            \end{tcolorbox}
            '''))
        else:
            doc.append(NoEscape(r'''
            \vspace{0.3cm}
            \begin{tcolorbox}[colback=success!10, colframe=success, title=\textbf{Manageable Risk Profile}]
                The financial risk is \textbf{manageable} at approximately 
                \textbf{''' + financial['formatted']['total'] + r'''}. Address vulnerabilities as part of 
                regular maintenance cycles. 
            \end{tcolorbox}
            '''))
        
        doc.append(NoEscape(r'\vspace{0.6cm}'))
        
        # =====================================================================
        # 4. COMPREHENSIVE VISUALIZATIONS
        # =====================================================================
        
        doc.append(NoEscape(r'\subsection*{Security Analysis Visualizations}'))
        
        chart_sev = str(output_path / "chart_severity.png").replace('\\', '/')
        chart_cat = str(output_path / "chart_categories.png").replace('\\', '/')
        chart_owasp = str(output_path / "chart_owasp.png").replace('\\', '/')
        chart_compliance = str(output_path / "chart_compliance.png").replace('\\', '/')
        
        # First row: Severity + Categories
        doc.append(NoEscape(r'''
        \begin{figure}[h!]
            \centering
            \begin{minipage}{0.48\textwidth}
                \centering
                \includegraphics[width=1.0\linewidth]{''' + chart_sev + r'''}
                \caption{Vulnerability Severity Distribution}
                \label{fig:severity}
            \end{minipage}
            \hfill
            \begin{minipage}{0.48\textwidth}
                \centering
                \includegraphics[width=1.0\linewidth]{''' + chart_owasp + r'''}
                \caption{OWASP Top 10 2021 Coverage}
                \label{fig:owasp}
            \end{minipage}
        \end{figure}
        '''))
        
        doc.append(NoEscape(r'\vspace{0.3cm}'))
        
        # Second row: Top Categories (full width)
        doc.append(NoEscape(r'''
        \begin{figure}[h!]
            \centering
            \includegraphics[width=0.9\textwidth]{''' + chart_cat + r'''}
            \caption{Top Vulnerability Categories Detected}
            \label{fig:categories}
        \end{figure}
        '''))
        
        doc.append(NoEscape(r'\vspace{0.3cm}'))
        
        # Third row: Compliance Dashboard (full width)
        doc.append(NoEscape(r'''
        \begin{figure}[h!]
            \centering
            \includegraphics[width=0.9\textwidth]{''' + chart_compliance + r'''}
            \caption{Compliance Framework Coverage Assessment}
            \label{fig:compliance}
        \end{figure}
        '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # =====================================================================
        # 5. CRITICAL VULNERABILITIES HIGHLIGHT TABLE
        # =====================================================================
        
        doc.append(NoEscape(r'\subsection*{Critical \& High Priority Findings}'))
        
        vulnerabilities = data['vulnerabilities']
        critical_high_vulns = [v for v in vulnerabilities if v['severity'] in ['critical', 'high']]
        
        if critical_high_vulns:
            doc.append(NoEscape(r'''
            \noindent
            The following table highlights the most critical security findings requiring immediate attention:
            \vspace{0.3cm}
            
            \begin{center}
            \rowcolors{2}{STBgGray}{white}
            \begin{longtable}{|p{0.08\textwidth}|p{0.12\textwidth}|p{0.3\textwidth}|p{0.35\textwidth}|p{0.1\textwidth}|}
                \hline
                \rowcolor{STBlue}
                \textbf{\textcolor{white}{ID}} & 
                \textbf{\textcolor{white}{Severity}} & 
                \textbf{\textcolor{white}{Title}} & 
                \textbf{\textcolor{white}{Location}} & 
                \textbf{\textcolor{white}{CVSS}} \\
                \hline
                \endhead
            '''))
            
            # Show top 10 critical/high
            for v in critical_high_vulns[:10]:
                sev_color = 'SevCritical' if v['severity'] == 'critical' else 'SevHigh'
                
                # Truncate title and location for table fit
                title_display = v['title'][:40] + '...' if len(v['title']) > 40 else v['title']
                location_display = v['location'][:45] + '...' if len(v['location']) > 45 else v['location']
                
                doc.append(NoEscape(rf'''
                \textbf{{\#{v['index']}}} & 
                \textcolor{{{sev_color}}}{{\textbf{{{v['severity'].upper()}}}}} & 
                {title_display} & 
                \texttt{{\footnotesize {location_display}}} & 
                \textbf{{{v['cvss']:.1f}}} \\
                '''))
            
            doc.append(NoEscape(r'''
                \hline
            \end{longtable}
            \end{center}
            '''))
            
            if len(critical_high_vulns) > 10:
                remaining = len(critical_high_vulns) - 10
                doc.append(NoEscape(rf'''
                \noindent
                \textit{{Note: {remaining} additional critical/high severity findings are documented 
                in the Detailed Findings section (Section 4).}}
                '''))
        else:
            doc.append(NoEscape(r'''
            \begin{tcolorbox}[colback=success!10, colframe=success, title=\textbf{Excellent Security Posture}]
                \textbf{No critical or high-severity vulnerabilities detected.} This repository 
                demonstrates strong security practices.  Continue to address medium and low priority 
                findings to maintain excellent security posture.
            \end{tcolorbox}
            '''))
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        
        # =====================================================================
        # 6. KEY RECOMMENDATIONS SUMMARY
        # =====================================================================
        
        doc.append(NoEscape(r'\subsection*{Key Recommendations}'))
        
        doc.append(NoEscape(r'''
        \noindent
        Based on this assessment, we recommend the following prioritized actions:
        \vspace{0.2cm}
        '''))
        
        # Generate dynamic recommendations based on findings
        recommendations = []
        
        if critical_count > 0:
            recommendations.append({
                'priority': '1',
                'action': 'Immediate Critical Remediation',
                'description': f'Address all {critical_count} critical vulnerabilities within 7 days to prevent system compromise',
                'icon': 'SevCritical'
            })
        
        if high_count > 5:
            recommendations.append({
                'priority': '2',
                'action': 'High-Severity Sprint Planning',
                'description': f'Allocate development resources to remediate {high_count} high-severity issues across 2-3 sprints',
                'icon': 'SevHigh'
            })
        
        compliance_issues = data['compliance'].get('total_compliance_issues', 0)
        if compliance_issues > 10:
            recommendations.append({
                'priority': '3',
                'action': 'Compliance Alignment',
                'description': f'Address {compliance_issues} compliance violations (OWASP, PCI DSS, GDPR) to meet regulatory requirements',
                'icon': 'SevMedium'
            })
        
        if metrics['density'] > 5:
            recommendations.append({
                'priority': '4',
                'action': 'Code Quality Improvement',
                'description': f'Vulnerability density ({metrics["density"]}/1k LOC) is elevated. Implement secure coding training and SAST in CI/CD',
                'icon': 'SevMedium'
            })
        
        if metrics['auto_fixable_count'] > 0:
            recommendations.append({
                'priority': '5',
                'action': 'Leverage Auto-Fix Suggestions',
                'description': f'{metrics["auto_fixable_count"]} vulnerabilities have automated fix suggestions - implement these quick wins first',
                'icon': 'success'
            })
        
        # Default recommendation if nothing critical
        if not recommendations:
            recommendations.append({
                'priority': '1',
                'action': 'Maintain Security Excellence',
                'description': 'Continue regular security scans, keep dependencies updated, and provide ongoing security training',
                'icon': 'success'
            })
        
        # Render recommendations
        doc.append(NoEscape(r'\begin{enumerate}[leftmargin=*, topsep=5pt, itemsep=8pt]'))
        
        for rec in recommendations[:5]:  # Top 5
            doc.append(NoEscape(rf'''
            \item \textbf{{\textcolor{{{rec['icon']}}}{{\#{rec['priority']}: {rec['action']}}}}} \\
            {rec['description']}
            '''))
        
        doc.append(NoEscape(r'\end{enumerate}'))
        
        doc.append(NoEscape(r'''
        \vspace{0.3cm}
        \noindent
        \textit{Detailed remediation guidance, sprint planning, and secure coding best practices 
        are provided in Section 5: Strategic Recommendations \& Remediation Roadmap.}
        '''))
        
        # =====================================================================
        # 7. COMPARISON WITH INDUSTRY BENCHMARKS (Optional)
        # =====================================================================
        
        doc.append(NoEscape(r'\vspace{0.5cm}'))
        doc.append(NoEscape(r'\subsection*{Industry Benchmark Comparison}'))
        
        # Calculate benchmark comparison
        score = metrics['score']
        density = metrics['density']
        
        if score >= 90:
            benchmark_text = 'exceptional and exceeds industry standards'
            benchmark_color = 'success'
        elif score >= 75:
            benchmark_text = 'above average and meets industry best practices'
            benchmark_color = 'success'
        elif score >= 60:
            benchmark_text = 'average for similar applications'
            benchmark_color = 'SevMedium'
        else:
            benchmark_text = 'below industry standards and requires significant improvement'
            benchmark_color = 'SevHigh'
        
        doc.append(NoEscape(rf'''
        \begin{{center}}
        \begin{{tcolorbox}}[colback={benchmark_color}!10, colframe={benchmark_color}, width=0.85\textwidth]
            \textbf{{Security Posture Rating: }} Your security score of \textbf{{{score}/100}} 
            is \textcolor{{{benchmark_color}}}{{\textbf{{{benchmark_text}}}}}.
            
            \vspace{{0.2cm}}
            \begin{{tabular}}{{@{{}}ll@{{}}}}
                \textbf{{Your Score: }} & {score}/100 (Grade: {metrics['grade']}) \\
                \textbf{{Industry Average:}} & 72/100 (Grade: C+) \\
                \textbf{{Your Density:}} & {density} vulnerabilities per 1k LOC \\
                \textbf{{Industry Average:}} & 3.5 vulnerabilities per 1k LOC
            \end{{tabular}}
        \end{{tcolorbox}}
        \end{{center}}
        '''))
        
        doc.append(NoEscape(r'\newpage'))