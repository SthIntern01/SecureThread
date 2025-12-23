# backend/app/services/latex_templates/styles.py

from pylatex import Package, NoEscape, Command

def setup_document_style(doc):
    """
    Comprehensive document styling for SecureThread OPS professional reports. 
    Sets up colors, fonts, headers, footers, custom components, and all required packages.
    """
    
    # =========================================================================
    # 1. ESSENTIAL PACKAGES
    # =========================================================================
    
    packages = [
        # Page layout and geometry
        ('geometry', 'a4paper, margin=2cm, headheight=35pt, footskip=30pt'),
        
        # Colors and graphics
        ('xcolor', 'table,dvipsnames,svgnames'),
        ('graphicx', None),
        ('tikz', None),
        
        # Headers and footers
        ('fancyhdr', None),
        
        # Section and title customization
        ('titlesec', None),
        ('titletoc', None),
        
        # Fonts and typography
        ('helvet', None),           # Helvetica (sans-serif)
        ('fontenc', 'T1'),
        ('inputenc', 'utf8'),
        
        # Advanced boxes and containers
        ('tcolorbox', 'most,breakable,skins'),
        
        # Tables
        ('booktabs', None),         # Professional tables
        ('colortbl', None),         # Colored table cells
        ('longtable', None),        # Multi-page tables
        ('array', None),            # Enhanced table formatting
        ('tabularx', None),         # Auto-width tables
        
        # Code listings
        ('listings', None),
        ('lstautogobble', None),    # Auto-remove indentation in code
        
        # Figures and floats
        ('float', None),            # Better float positioning [H]
        ('caption', None),          # Better caption formatting
        
        # Hyperlinks and references
        ('hyperref', 'hidelinks,bookmarks=true,bookmarksnumbered=true,pdfborder={0 0 0}'),
        
        # Multi-column layouts
        ('multicol', None),
        
        # Page references
        ('lastpage', None),         # For "Page X of Y"
        
        # Lists
        ('enumitem', None),         # Better list control
        
        # Miscellaneous
        ('amsmath', None),          # Math symbols (for formulas if needed)
        ('textcomp', None),         # Additional text symbols
        ('microtype', None),        # Better typography and spacing
    ]
    
    for pkg, opts in packages:
        if opts:
            doc.preamble.append(Package(pkg, options=opts))
        else:
            doc.preamble.append(Package(pkg))
    
    # Load specific TikZ libraries
    doc.preamble.append(NoEscape(r'\usetikzlibrary{positioning,shapes,arrows,backgrounds,calc}'))
    
    # =========================================================================
    # 2. CORPORATE COLOR PALETTE (SecureThread Brand Identity)
    # =========================================================================
    
    colors = [
        # Primary Brand Colors
        ('STBlue',      '12, 45, 72'),      # #0C2D48 - Deep Navy (Primary)
        ('STLightBlue', '46, 139, 192'),    # #2E8BC0 - Bright Blue (Accent)
        ('STBgGray',    '245, 247, 250'),   # #F5F7FA - Very Light Gray (Backgrounds)
        ('STText',      '33, 33, 33'),      # #212121 - Dark Gray (Body Text)
        ('STTextLight', '107, 114, 128'),   # #6B7280 - Medium Gray (Secondary Text)
        
        # Severity Color Palette (Consistent with Snyk/SonarQube)
        ('SevCritical', '220, 38, 38'),     # #DC2626 - Red
        ('SevHigh',     '234, 88, 12'),     # #EA580C - Orange
        ('SevMedium',   '245, 158, 11'),    # #F59E0B - Amber
        ('SevLow',      '59, 130, 246'),    # #3B82F6 - Blue
        ('SevInfo',     '107, 114, 128'),   # #6B7280 - Gray
        
        # Additional UI Colors
        ('success',     '16, 185, 129'),    # #10B981 - Green (Good scores)
        ('warning',     '251, 191, 36'),    # #FBBF24 - Yellow (Warnings)
        ('danger',      '239, 68, 68'),     # #EF4444 - Red (Errors)
        ('white',       '255, 255, 255'),   # #FFFFFF - White
        ('black',       '0, 0, 0'),         # #000000 - Black
    ]
    
    for name, rgb in colors:
        doc.preamble.append(NoEscape(rf'\definecolor{{{name}}}{{RGB}}{{{rgb}}}'))
    
    # =========================================================================
    # 3. TYPOGRAPHY & FONT CONFIGURATION
    # =========================================================================
    
    # Set Sans-Serif as default (modern, professional look)
    doc.preamble.append(NoEscape(r'\renewcommand{\familydefault}{\sfdefault}'))
    
    # Set default text color
    doc.preamble.append(NoEscape(r'\color{STText}'))
    
    # Paragraph spacing (no indentation, space between paragraphs)
    doc.preamble.append(NoEscape(r'\setlength{\parskip}{0.6em}'))
    doc.preamble.append(NoEscape(r'\setlength{\parindent}{0pt}'))
    
    # Line spacing (slightly increased for readability)
    doc.preamble.append(NoEscape(r'\linespread{1.1}'))
    
    # Improved micro-typography
    doc.preamble.append(NoEscape(r'\microtypesetup{final}'))
    
    # =========================================================================
    # 4. SECTION & HEADING STYLES
    # =========================================================================
    
    # Custom section formatting (large, colored, with spacing)
    doc.preamble.append(NoEscape(r'''
    \titleformat{\section}
        {\normalfont\huge\bfseries\color{STBlue}}
        {\thesection}{1em}{}
        [\vspace{-0.5em}\textcolor{STLightBlue}{\titlerule[2pt]}]
    
    \titleformat{\subsection}
        {\normalfont\Large\bfseries\color{STBlue}}
        {\thesubsection}{1em}{}
        [\vspace{-0.3em}\textcolor{STLightBlue}{\titlerule[1pt]}]
    
    \titleformat{\subsubsection}
        {\normalfont\large\bfseries\color{STText}}
        {\thesubsubsection}{1em}{}
    '''))
    
    # Section spacing
    doc.preamble.append(NoEscape(r'''
    \titlespacing*{\section}{0pt}{1.5em}{0.8em}
    \titlespacing*{\subsection}{0pt}{1.2em}{0.6em}
    \titlespacing*{\subsubsection}{0pt}{1em}{0.5em}
    '''))
    
    # =========================================================================
    # 5. HEADERS & FOOTERS
    # =========================================================================
    
    doc.preamble.append(NoEscape(r'''
    \pagestyle{fancy}
    \fancyhf{} % Clear all defaults
    
    % --- Header ---
    \fancyhead[L]{
        \textcolor{STBlue}{\textbf{SecureThread OPS}}
    }
    \fancyhead[C]{
        \textcolor{STText}{\small Security Assessment Report}
    }
    \fancyhead[R]{
        \textcolor{SevCritical}{\small\textbf{CONFIDENTIAL}}
    }
    
    % --- Footer ---
    \fancyfoot[L]{
        \tiny\textcolor{STTextLight}{Generated by SecureThread OPS v4.0}
    }
    \fancyfoot[C]{
        \textcolor{STTextLight}{\small\thepage\ of \pageref{LastPage}}
    }
    \fancyfoot[R]{
        \tiny\textcolor{STTextLight}{\today}
    }
    
    % --- Header/Footer Lines ---
    \renewcommand{\headrulewidth}{1.5pt}
    \renewcommand{\footrulewidth}{0.5pt}
    \renewcommand{\headrule}{\hbox to\headwidth{\color{STLightBlue}\leaders\hrule height \headrulewidth\hfill}}
    \renewcommand{\footrule}{\hbox to\headwidth{\color{STLightBlue}\leaders\hrule height \footrulewidth\hfill}}
    '''))
    
    # Plain page style (for title page, etc.)
    doc.preamble.append(NoEscape(r'''
    \fancypagestyle{plain}{
        \fancyhf{}
        \renewcommand{\headrulewidth}{0pt}
        \renewcommand{\footrulewidth}{0pt}
    }
    '''))
    
    # =========================================================================
    # 6. HYPERLINK CONFIGURATION
    # =========================================================================
    
    doc.preamble.append(NoEscape(r'''
    \hypersetup{
        colorlinks=true,
        linkcolor=STBlue,
        filecolor=STBlue,
        urlcolor=STLightBlue,
        citecolor=STBlue,
        pdftitle={SecureThread OPS Security Assessment Report},
        pdfauthor={SecureThread Security Operations},
        pdfsubject={Application Security Assessment},
        pdfkeywords={Security, SAST, Vulnerability, Assessment, SecureThread},
        bookmarksdepth=3
    }
    '''))
    
    # =========================================================================
    # 7. CODE LISTING STYLES (For Vulnerable Code Display)
    # =========================================================================
    
    doc.preamble.append(NoEscape(r'''
    \lstdefinestyle{vulnerableCode}{
        basicstyle=\ttfamily\footnotesize\color{STText},
        backgroundcolor=\color{STBgGray},
        frame=leftline,
        framesep=8pt,
        rulecolor=\color{SevCritical},
        breaklines=true,
        breakatwhitespace=true,
        keywordstyle=\color{STBlue}\bfseries,
        commentstyle=\color{SevInfo}\itshape,
        stringstyle=\color{SevHigh},
        numberstyle=\tiny\color{STTextLight},
        numbers=left,
        numbersep=8pt,
        showstringspaces=false,
        captionpos=b,
        tabsize=4,
        xleftmargin=15pt,
        framexleftmargin=12pt,
        columns=flexible,
        keepspaces=true,
        autogobble=true
    }
    
    \lstdefinestyle{fixCode}{
        basicstyle=\ttfamily\footnotesize\color{STText},
        backgroundcolor=\color{success!5},
        frame=leftline,
        framesep=8pt,
        rulecolor=\color{success},
        breaklines=true,
        breakatwhitespace=true,
        keywordstyle=\color{success}\bfseries,
        commentstyle=\color{STTextLight}\itshape,
        stringstyle=\color{STBlue},
        numberstyle=\tiny\color{STTextLight},
        numbers=left,
        numbersep=8pt,
        showstringspaces=false,
        captionpos=b,
        tabsize=4,
        xleftmargin=15pt,
        framexleftmargin=12pt,
        columns=flexible,
        keepspaces=true,
        autogobble=true
    }
    
    % Set default listing style
    \lstset{style=vulnerableCode}
    '''))
    
    # =========================================================================
    # 8. CUSTOM COMPONENTS (Finding Boxes, Metric Cards)
    # =========================================================================
    
    # Finding Box (Colored border based on severity)
    doc.preamble.append(NoEscape(r'''
    \newtcolorbox{findingbox}[2][]{
        enhanced,
        colback=white,
        colframe=#2,
        title={#1},
        fonttitle=\bfseries\large,
        coltitle=white,
        boxrule=2.5pt,
        arc=3mm,
        left=8pt,
        right=8pt,
        top=8pt,
        bottom=8pt,
        drop fuzzy shadow=black!50!white,
        breakable,
        before skip=1em,
        after skip=1em
    }
    '''))
    
    # Metric Box (For dashboard-style metrics)
    doc.preamble.append(NoEscape(r'''
    \newtcolorbox{metricbox}[2][]{
        enhanced,
        colback=#2!10,
        colframe=#2,
        arc=4mm,
        boxrule=1.5pt,
        width=#1,
        halign=center,
        valign=center,
        left=5pt,
        right=5pt,
        top=5pt,
        bottom=5pt,
        fontupper=\bfseries
    }
    '''))
    
    # Info Box (For notes, warnings, tips)
    doc.preamble.append(NoEscape(r'''
    \newtcolorbox{infobox}[2][]{
        enhanced,
        colback=#2!5,
        colframe=#2,
        title={#1},
        fonttitle=\bfseries,
        coltitle=white,
        boxrule=1.5pt,
        arc=2mm,
        left=6pt,
        right=6pt,
        top=6pt,
        bottom=6pt,
        breakable
    }
    '''))
    
    # =========================================================================
    # 9. TABLE STYLES
    # =========================================================================
    
    # Better table column padding
    doc.preamble.append(NoEscape(r'\renewcommand{\arraystretch}{1.3}'))
    
    # Custom table row colors (used with \rowcolors)
    doc.preamble.append(NoEscape(r'\setlength{\arrayrulewidth}{0.5pt}'))
    
    # Table caption styling
    doc.preamble.append(NoEscape(r'''
    \captionsetup[table]{
        labelfont={bf,color=STBlue},
        textfont={it,color=STText},
        skip=8pt
    }
    '''))
    
    # Figure caption styling
    doc.preamble.append(NoEscape(r'''
    \captionsetup[figure]{
        labelfont={bf,color=STBlue},
        textfont={it,color=STText},
        skip=8pt
    }
    '''))
    
    # =========================================================================
    # 10. LIST STYLES (Itemize, Enumerate, Description)
    # =========================================================================
    
    # Custom bullet points
    doc. preamble.append(NoEscape(r'''
    \setlist[itemize]{
        label=\textcolor{STLightBlue}{$\bullet$},
        leftmargin=*,
        topsep=6pt,
        itemsep=4pt,
        parsep=0pt
    }
    
    \setlist[enumerate]{
        leftmargin=*,
        topsep=6pt,
        itemsep=4pt,
        parsep=0pt
    }
    
    \setlist[description]{
        leftmargin=2cm,
        labelindent=0pt,
        topsep=6pt,
        itemsep=4pt,
        parsep=0pt,
        font=\bfseries\color{STBlue}
    }
    '''))
    
    # =========================================================================
    # 11. TOC CUSTOMIZATION (Requires titletoc/tocloft)
    # =========================================================================
    
    # Install tocloft if titletoc isn't sufficient
    doc.preamble.append(Package('tocloft'))
    
    doc.preamble.append(NoEscape(r'''
    % TOC section styling
    \renewcommand{\cftsecfont}{\bfseries\color{STBlue}}
    \renewcommand{\cftsecpagefont}{\bfseries\color{STBlue}}
    \renewcommand{\cftsecleader}{\cftdotfill{\cftdotsep}}
    
    % TOC subsection styling
    \renewcommand{\cftsubsecfont}{\color{STText}}
    \renewcommand{\cftsubsecpagefont}{\color{STText}}
    
    % TOC spacing
    \setlength{\cftbeforesecskip}{8pt}
    \setlength{\cftbeforesubsecskip}{4pt}
    
    % List of Figures styling
    \renewcommand{\cftfigfont}{\color{STText}}
    \renewcommand{\cftfigpagefont}{\color{STText}}
    \setlength{\cftbeforefigskip}{4pt}
    '''))
    
    # =========================================================================
    # 12. MATHEMATICAL & SPECIAL SYMBOLS
    # =========================================================================
    
    # Define custom symbols for severity icons (if needed)
    doc.preamble.append(NoEscape(r'''
    \newcommand{\criticalicon}{\textcolor{SevCritical}{\Large\textbf{[!]}}}
    \newcommand{\highicon}{\textcolor{SevHigh}{\Large\textbf{[!]}}}
    \newcommand{\mediumicon}{\textcolor{SevMedium}{\Large\textbf{[>]}}}
    \newcommand{\lowicon}{\textcolor{SevLow}{\Large\textbf{[i]}}}
    \newcommand{\successicon}{\textcolor{success}{\Large\textbf{[OK]}}}
    '''))
    
    # =========================================================================
    # 13. PAGE BREAK CONTROLS
    # =========================================================================
    
    # Prevent widows and orphans
    doc.preamble.append(NoEscape(r'\widowpenalty=10000'))
    doc.preamble.append(NoEscape(r'\clubpenalty=10000'))
    
    # Better float placement
    doc.preamble.append(NoEscape(r'\renewcommand{\topfraction}{0.9}'))
    doc.preamble.append(NoEscape(r'\renewcommand{\bottomfraction}{0.8}'))
    doc.preamble.append(NoEscape(r'\renewcommand{\textfraction}{0.07}'))
    doc.preamble.append(NoEscape(r'\renewcommand{\floatpagefraction}{0.7}'))
    
    # =========================================================================
    # 14. CUSTOM COMMANDS & SHORTCUTS
    # =========================================================================
    
    # Quick commands for common formatting
    doc.preamble.append(NoEscape(r'''
    % Severity badges
    \newcommand{\critical}[1]{\textcolor{SevCritical}{\textbf{#1}}}
    \newcommand{\high}[1]{\textcolor{SevHigh}{\textbf{#1}}}
    \newcommand{\medium}[1]{\textcolor{SevMedium}{\textbf{#1}}}
    \newcommand{\low}[1]{\textcolor{SevLow}{\textbf{#1}}}
    
    % Code inline
    \newcommand{\codeinline}[1]{\texttt{\color{STBlue}#1}}
    
    % File path
    \newcommand{\filepath}[1]{\texttt{\footnotesize\color{STText}#1}}
    
    % CWE reference
    \newcommand{\cwe}[1]{\texttt{\textbf{CWE-#1}}}
    
    % OWASP reference  
    \newcommand{\owasp}[1]{\textbf{OWASP #1}}
    '''))
    
    # =========================================================================
    # 15. FINAL DOCUMENT SETUP
    # =========================================================================
    
    # Set PDF metadata
    doc.preamble.append(NoEscape(r'''
    \pdfinfo{
        /Title (SecureThread OPS Security Assessment Report)
        /Author (SecureThread Security Operations)
        /Subject (Static Application Security Testing)
        /Keywords (Security, SAST, Vulnerability, Assessment)
        /Creator (SecureThread OPS v4.0)
    }
    '''))
    
    # Ensure proper page geometry
    doc.preamble.append(NoEscape(r'\raggedbottom'))  # Better for uneven page content


def add_custom_title_page_style(doc):
    """
    Optional: Additional styling specifically for title page
    Call this before generating the cover page if needed
    """
    
    doc.preamble.append(NoEscape(r'''
    \fancypagestyle{titlepage}{
        \fancyhf{}
        \renewcommand{\headrulewidth}{0pt}
        \renewcommand{\footrulewidth}{0pt}
    }
    '''))