# backend/app/services/latex_templates/cover_page.py

from pylatex import NoEscape
from pathlib import Path

def generate_cover_page(doc, data, logo_path: Path):
    """
    Generates a professional, modern cover page with blue wave design.
    Layout is adjusted to ensure images touch the absolute top/bottom edges (zero whitespace).
    """
    
    # Determine assets path
    assets_path = Path(__file__).parent.parent.parent / "reports" / "assets"
    
    doc.append(NoEscape(r'\begin{titlepage}'))
    
    # CRITICAL: This allows us to write into the bottom margin without triggering a new page
    doc.append(NoEscape(r'\enlargethispage{5cm}'))
    
    # =========================================================================
    # 1. TOP HEADER WAVE IMAGE (Absolute Top)
    # =========================================================================
    
    header_img = assets_path / "cover_header.png"
    
    # 1. Pull up aggressively to override top margin (~1 inch + header space)
    doc.append(NoEscape(r'\vspace*{-3.5cm}'))
    
    if header_img.exists():
        safe_path = str(header_img).replace('\\', '/')
        doc.append(NoEscape(rf'''
        \noindent
        % 2. Pull left to override left margin
        \hspace*{{-2.5cm}}
        % 3. Width slightly larger than paperwidth to ensure edge-to-edge coverage
        \includegraphics[width=1.1\paperwidth, height=3.5cm, keepaspectratio=false]{{{safe_path}}}
        '''))
    else:
        doc.append(NoEscape(r'''
        \noindent\hspace*{-2.5cm}
        \colorbox{STBlue}{\makebox[1.1\paperwidth][l]{\rule{0pt}{3.5cm}}}
        '''))
    
    doc.append(NoEscape(r'\vspace{0.5cm}'))
    
    # =========================================================================
    # 2. BRANDING & TITLE
    # =========================================================================
    
    repository = data['repository']
    
    doc.append(NoEscape(r'''
    \noindent
    \begin{minipage}{0.45\textwidth}
        \begin{flushleft}
            {\fontsize{32}{38}\selectfont\textbf{\textcolor{STBlue}{SecureThread}}}\\[0.1cm]
            {\fontsize{16}{20}\selectfont\textcolor{STLightBlue}{\textbf{OPS}}}\\[0.1cm]
            {\footnotesize\textit{\textcolor{gray}{Securing the Digital Future}}}
        \end{flushleft}
    \end{minipage}
    \hfill
    \begin{minipage}{0.5\textwidth}
        \begin{flushright}
            {\fontsize{24}{28}\selectfont\textbf{\textcolor{STBlue}{SECURITY}}}\\[0.1cm]
            {\fontsize{24}{28}\selectfont\textbf{\textcolor{STBlue}{ASSESSMENT}}}\\[0.1cm]
            {\fontsize{24}{28}\selectfont\textbf{\textcolor{STBlue}{REPORT}}}\\[0.4cm]
            {\Large\textcolor{STLightBlue}{\textbf{''' + repository['name'] + r'''}}}
        \end{flushright}
    \end{minipage}
    '''))
    
    doc.append(NoEscape(r'\vspace{1.0cm}'))
    
    # =========================================================================
    # 3. TARGET INFORMATION BOX
    # =========================================================================
    
    scan = data['scan']
    metadata = data['metadata']
    scan_date = scan['date']
    
    doc.append(NoEscape(r'''
    \begin{center}
    \begin{minipage}{0.9\textwidth}
        \begin{tcolorbox}[
            enhanced,
            colback=white,
            colframe=STBlue,
            boxrule=1.5pt,
            arc=2mm,
            drop fuzzy shadow,
            left=6mm, right=6mm, top=4mm, bottom=4mm
        ]
            \small
            \renewcommand{\arraystretch}{1.3}
            \begin{tabular}{@{} r l @{}}
                \textbf{Repository:} & \texttt{''' + repository['full_name'] + r'''} \\
                \textbf{Branch/Commit:} & \texttt{''' + repository['branch'] + r''' / ''' + repository['commit'][:7] + r'''} \\
                \textbf{Scan Date:} & ''' + scan_date + r''' \\
                \textbf{Stats:} & ''' + f"{scan['files_scanned']:,} files / {scan['loc_estimate']:,} LoC" + r''' \\
                \textbf{Report ID:} & \texttt{''' + metadata['report_id'] + r'''} \\
            \end{tabular}
        \end{tcolorbox}
    \end{minipage}
    \end{center}
    '''))
    
    doc.append(NoEscape(r'\vspace{1.0cm}'))
    
    # =========================================================================
    # 4. SECURITY POSTURE SUMMARY
    # =========================================================================
    
    metrics = data['metrics']
    score = metrics['score']
    grade = metrics['grade']
    total_vulns = metrics['total_vulns']
    
    # Determine score color
    if score >= 90: score_color = 'success'
    elif score >= 75: score_color = 'SevLow'
    elif score >= 60: score_color = 'SevMedium'
    elif score >= 50: score_color = 'SevHigh'
    else: score_color = 'SevCritical'
    
    critical_count = metrics['severity_counts'].get('critical', 0)
    high_count = metrics['severity_counts'].get('high', 0)
    medium_count = metrics['severity_counts'].get('medium', 0)
    low_count = metrics['severity_counts'].get('low', 0)
    
    doc.append(NoEscape(rf'''
    \begin{{center}}
    \begin{{minipage}}{{0.9\textwidth}}
        \begin{{tcolorbox}}[
            enhanced,
            colback=STBgGray,
            colframe={score_color},
            boxrule=2pt,
            arc=2mm,
            title=\textbf{{SECURITY POSTURE SUMMARY}},
            coltitle=white,
            fonttitle=\bfseries\centering
        ]
            \centering
            \renewcommand{{\arraystretch}}{{1.5}}
            \begin{{tabular}}{{c|c|c|c}}
                \textbf{{Score}} & \textbf{{Grade}} & \textbf{{Findings}} & \textbf{{Critical}} \\
                \hline
                \fontsize{{20}}{{24}}\selectfont\textcolor{{{score_color}}}{{\textbf{{{score:.0f}}}}} &
                \fontsize{{20}}{{24}}\selectfont\textcolor{{{score_color}}}{{\textbf{{{grade}}}}} &
                \fontsize{{18}}{{22}}\selectfont\textbf{{{total_vulns}}} &
                \fontsize{{18}}{{22}}\selectfont\textcolor{{SevCritical}}{{\textbf{{{critical_count}}}}}
            \end{{tabular}}
            
            \vspace{{0.4cm}}
            \hrule
            \vspace{{0.2cm}}
            
            \footnotesize
            \begin{{tabular}}{{p{{0.2\textwidth}} p{{0.2\textwidth}} p{{0.2\textwidth}} p{{0.2\textwidth}}}}
                \centering\textcolor{{SevCritical}}{{\textbf{{{critical_count}}}}} Critical &
                \centering\textcolor{{SevHigh}}{{\textbf{{{high_count}}}}} High &
                \centering\textcolor{{SevMedium}}{{\textbf{{{medium_count}}}}} Medium &
                \centering\textcolor{{SevLow}}{{\textbf{{{low_count}}}}} Low
            \end{{tabular}}
        \end{{tcolorbox}}
    \end{{minipage}}
    \end{{center}}
    '''))
    
    # =========================================================================
    # 5. FOOTER TEXT
    # =========================================================================
    
    doc.append(NoEscape(r'\vfill')) # Push everything else to bottom
    
    doc.append(NoEscape(r'''
    \begin{center}
        \textcolor{STBlue}{\rule{0.9\textwidth}{0.5pt}}
        
        \vspace{0.2cm}
        {\footnotesize\textbf{\textcolor{SevCritical}{CONFIDENTIAL: Authorized Personnel Only. Do not distribute without approval.}}}
        \vspace{0.1cm}
        {\scriptsize\textcolor{gray}{SecureThread OPS | Generated: ''' + metadata['generated_at'] + r''' | \url{https://securethread.io}}}
    \end{center}
    '''))
    
    # =========================================================================
    # 6. BOTTOM FOOTER WAVE IMAGE (Absolute Bottom)
    # =========================================================================
    
    footer_img = assets_path / "cover_footer.png"
    
    # Pushes image DOWN into the margin area. 
    # Because we used \enlargethispage{5cm} at the top, this won't break the page.
    doc.append(NoEscape(r'\vspace*{1cm}')) 
    
    if footer_img.exists():
        safe_path = str(footer_img).replace('\\', '/')
        doc.append(NoEscape(rf'''
        \noindent
        \hspace*{{-2.5cm}}
        \includegraphics[width=1.1\paperwidth, height=2.5cm, keepaspectratio=false]{{{safe_path}}}
        '''))
    else:
        doc.append(NoEscape(r'''
        \noindent\hspace*{-2.5cm}
        \colorbox{STLightBlue}{\makebox[1.1\paperwidth][l]{\rule{0pt}{2.5cm}}}
        '''))
    
    doc.append(NoEscape(r'\end{titlepage}'))

def generate_document_control_page(doc, data):
    # Same as before
    pass