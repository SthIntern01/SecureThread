# backend/app/services/latex_templates/charts_generator.py

import matplotlib
matplotlib.use('Agg')  # Force non-interactive backend
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Wedge, Rectangle, FancyBboxPatch
import numpy as np
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# --- SecureThread Brand Palette ---
COLORS = {
    'critical': '#DC2626',  # Red
    'high':      '#EA580C',  # Orange
    'medium':   '#F59E0B',  # Amber
    'low':      '#3B82F6',  # Blue
    'info':     '#6B7280',  # Gray
    'st_blue':  '#0C2D48',  # Navy
    'st_light': '#2E8BC0',  # Bright Blue
    'white':    '#FFFFFF',
    'success':  '#10B981',  # Green
    'bg_gray':  '#F5F7FA'
}

def generate_charts(doc, data, output_path: Path):
    """
    Main entry point.  Generates all PNG charts required for the comprehensive report.
    """
    
    # Ensure directory exists
    output_path.mkdir(parents=True, exist_ok=True)
    
    logger.info("🎨 Generating comprehensive report charts...")
    
    try:
        # Core Executive Summary Charts
        create_donut_chart(data, output_path / "chart_severity.png")
        create_category_bar_chart(data, output_path / "chart_categories.png")
        create_owasp_radar_chart(data, output_path / "chart_owasp.png")
        create_score_gauge(data, output_path / "chart_gauge.png")
        
        # New Comprehensive Charts
        create_trend_chart(data, output_path / "chart_trends.png")
        create_compliance_dashboard(data, output_path / "chart_compliance.png")
        create_hotspot_heatmap(data, output_path / "chart_hotspots.png")
        create_cwe_distribution(data, output_path / "chart_cwe.png")
        create_financial_impact_chart(data, output_path / "chart_financial.png")
        create_remediation_timeline(data, output_path / "chart_timeline.png")
        
        # Store output path in data for later reference
        data['_output_path'] = output_path
        
        logger.info("✅ All charts generated successfully")
        
    except Exception as e:
        logger.error(f"❌ Error generating charts:  {e}", exc_info=True)
        raise


def create_donut_chart(data, filepath):
    """Enhanced donut chart with better styling"""
    counts = data['metrics']['severity_counts']
    
    labels = ['Critical', 'High', 'Medium', 'Low']
    values = [counts.get('critical', 0), counts.get('high', 0), 
              counts.get('medium', 0), counts.get('low', 0)]
    colors = [COLORS['critical'], COLORS['high'], COLORS['medium'], COLORS['low']]
    
    plot_data = [(l, v, c) for l, v, c in zip(labels, values, colors) if v > 0]
    
    fig, ax = plt.subplots(figsize=(7, 7), facecolor='white')
    
    if not plot_data:
        ax.text(0.5, 0.5, "No Issues Found", ha='center', va='center', 
                fontsize=16, color=COLORS['info'], weight='bold')
        ax.axis('off')
    else:
        p_labels, p_values, p_colors = zip(*plot_data)
        
        wedges, texts, autotexts = ax.pie(
            p_values, 
            labels=p_labels, 
            colors=p_colors, 
            autopct='%1.1f%%',
            startangle=90,
            pctdistance=0.85,
            wedgeprops=dict(width=0.4, edgecolor='white', linewidth=3),
            textprops={'fontsize': 11, 'weight': 'bold'}
        )
        
        # Style percentage text
        for autotext in autotexts: 
            autotext.set_color('white')
            autotext.set_fontsize(10)
            autotext.set_weight('bold')

        # Center text with total count
        total = sum(p_values)
        ax.text(0, 0, f"{total}\nIssues", ha='center', va='center', 
                fontsize=20, weight='bold', color=COLORS['st_blue'])
        
        ax.set_title('Vulnerability Severity Distribution', 
                     fontsize=14, weight='bold', color=COLORS['st_blue'], pad=20)

    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()


def create_category_bar_chart(data, filepath):
    """Enhanced horizontal bar chart for vulnerability categories"""
    categories = data['analytics']['top_categories']
    
    if not categories:
        fig, ax = plt.subplots(figsize=(10, 2), facecolor='white')
        ax.text(0.5, 0.5, "No Vulnerability Categories Detected", 
                ha='center', va='center', fontsize=12)
        ax.axis('off')
        plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        return
        
    names = list(categories.keys())[:8]  # Top 8
    values = list(categories.values())[:8]
    y_pos = np.arange(len(names))

    fig, ax = plt.subplots(figsize=(10, 6), facecolor='white')
    
    # Create gradient colors
    max_val = max(values)
    colors = [plt.cm.RdYlBu_r(v / max_val) for v in values]
    
    bars = ax.barh(y_pos, values, align='center', color=colors, alpha=0.8, edgecolor=COLORS['st_blue'], linewidth=1.5)
    
    ax.set_yticks(y_pos)
    ax.set_yticklabels(names, fontsize=10)
    ax.invert_yaxis()
    ax.set_xlabel('Number of Vulnerabilities', fontsize=11, weight='bold')
    ax.set_title('Top Vulnerability Categories', fontsize=14, weight='bold', color=COLORS['st_blue'], pad=15)
    
    # Clean spines
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['left'].set_color('#CCCCCC')
    ax.spines['bottom'].set_color('#CCCCCC')
    ax.grid(axis='x', alpha=0.3, linestyle='--')
    
    # Add count labels
    for i, (bar, val) in enumerate(zip(bars, values)):
        width = bar.get_width()
        ax.text(width + max_val * 0.02, bar.get_y() + bar.get_height()/2, 
                f'{int(val)}', va='center', fontsize=10, weight='bold', color=COLORS['st_blue'])

    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()


def create_owasp_radar_chart(data, filepath):
    """Enhanced OWASP radar chart"""
    owasp_data = data['analytics']['owasp_top_10']
    
    labels = [k.split(':')[0] for k in owasp_data.keys()]
    values = list(owasp_data.values())
    
    N = len(labels)
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    
    values += values[:1]
    angles += angles[:1]
    
    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True), facecolor='white')
    
    plt.xticks(angles[:-1], labels, color=COLORS['st_blue'], size=10, weight='bold')
    
    ax.set_rlabel_position(0)
    max_value = max(max(values), 5)
    plt.yticks([1, max_value//2, max_value], 
               ["1", str(max_value//2), str(max_value)], 
               color="gray", size=8)
    plt.ylim(0, max_value + 1)
    
    # Plot with fill
    ax.plot(angles, values, linewidth=2, linestyle='solid', color=COLORS['critical'])
    ax.fill(angles, values, COLORS['critical'], alpha=0.25)
    
    # Add grid
    ax.grid(color='gray', linestyle='--', linewidth=0.5, alpha=0.5)
    
    plt.title('OWASP Top 10 2021 Coverage', size=14, color=COLORS['st_blue'], 
              y=1.08, weight='bold')
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()


def create_score_gauge(data, filepath):
    """Enhanced security score gauge with color zones"""
    score = data['metrics']['score']
    
    fig, ax = plt.subplots(figsize=(8, 4), facecolor='white')
    
    # Draw background arc segments
    segment_colors = [COLORS['critical'], COLORS['high'], COLORS['medium'], COLORS['low'], COLORS['success']]
    segment_ranges = [(0, 50), (50, 70), (70, 80), (80, 90), (90, 100)]
    
    for (start, end), color in zip(segment_ranges, segment_colors):
        start_angle = 180 - (start / 100 * 180)
        end_angle = 180 - (end / 100 * 180)
        ax.add_patch(Wedge((0.5, 0), 0.4, end_angle, start_angle, width=0.15, color=color, alpha=0.3))
    
    # Active arc based on score
    angle_end = 180 - (score / 100 * 180)
    
    if score < 50: active_color = COLORS['critical']
    elif score < 70: active_color = COLORS['high']
    elif score < 80: active_color = COLORS['medium']
    elif score < 90: active_color = COLORS['low']
    else: active_color = COLORS['success']
    
    ax.add_patch(Wedge((0.5, 0), 0.4, angle_end, 180, width=0.15, color=active_color))
    
    # Needle
    angle_rad = np.deg2rad(180 - (score / 100 * 180))
    needle_len = 0.35
    tip_x = 0.5 + needle_len * np.cos(angle_rad)
    tip_y = 0 + needle_len * np.sin(angle_rad)
    
    ax.add_patch(Circle((0.5, 0), 0.03, color=COLORS['st_blue'], zorder=10))
    ax.plot([0.5, tip_x], [0, tip_y], color=COLORS['st_blue'], linewidth=3, zorder=9)
    
    # Score text
    ax.text(0.5, -0.18, f"{int(score)}", ha='center', va='center', 
            fontsize=36, weight='bold', color=active_color)
    ax.text(0.5, -0.28, "Security Score", ha='center', va='center', 
            fontsize=12, color=COLORS['info'])
    
    # Grade letter
    grade = data['metrics']['grade']
    ax.text(0.5, -0.38, f"Grade: {grade}", ha='center', va='center',
            fontsize=14, weight='bold', color=active_color)
    
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.45, 0.5)
    ax.axis('off')
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()


def create_trend_chart(data, filepath):
    """Security trend over time (if historical data exists)"""
    trends = data.get('trends', {})
    
    if not trends.get('has_history', False):
        fig, ax = plt.subplots(figsize=(10, 5), facecolor='white')
        ax.text(0.5, 0.5, "No Historical Data Available\n(Run multiple scans to see trends)", 
                ha='center', va='center', fontsize=12, color=COLORS['info'])
        ax.axis('off')
        plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        return
    
    vuln_trend = trends['vulnerability_trend']
    score_trend = trends['score_trend']
    
    dates = [t['date'] for t in vuln_trend]
    vuln_counts = [t['count'] for t in vuln_trend]
    scores = [t['score'] for t in score_trend]
    
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), facecolor='white')
    
    # Vulnerability count trend
    ax1.plot(dates, vuln_counts, marker='o', color=COLORS['critical'], linewidth=2, markersize=8)
    ax1.fill_between(range(len(dates)), vuln_counts, alpha=0.3, color=COLORS['critical'])
    ax1.set_ylabel('Total Vulnerabilities', fontsize=11, weight='bold')
    ax1.set_title('Vulnerability Trend Over Time', fontsize=13, weight='bold', color=COLORS['st_blue'])
    ax1.grid(True, alpha=0.3, linestyle='--')
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    
    # Security score trend
    ax2.plot(dates, scores, marker='s', color=COLORS['success'], linewidth=2, markersize=8)
    ax2.fill_between(range(len(dates)), scores, alpha=0.3, color=COLORS['success'])
    ax2.set_ylabel('Security Score', fontsize=11, weight='bold')
    ax2.set_xlabel('Scan Date', fontsize=11, weight='bold')
    ax2.set_title('Security Score Improvement', fontsize=13, weight='bold', color=COLORS['st_blue'])
    ax2.grid(True, alpha=0.3, linestyle='--')
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    ax2.set_ylim(0, 100)
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()


def create_compliance_dashboard(data, filepath):
    """Compliance framework coverage visualization"""
    compliance = data.get('compliance', {})
    
    frameworks = ['OWASP\nTop 10', 'SANS\nTop 25', 'PCI DSS', 'GDPR']
    
    owasp_score = 100 - min(sum(compliance.get('owasp_top_10', {}).values()) * 5, 100)
    sans_score = 100 - min(sum(compliance.get('sans_top_25', {}).values()) * 10, 100)
    pci_score = 100 - min(sum(compliance.get('pci_dss', {}).values()) * 8, 100)
    gdpr_score = 100 - min(compliance.get('gdpr', {}).get('high_impact_count', 0) * 15, 100)
    
    scores = [owasp_score, sans_score, pci_score, gdpr_score]
    
    fig, ax = plt.subplots(figsize=(10, 6), facecolor='white')
    
    x = np.arange(len(frameworks))
    colors_list = [COLORS['success'] if s >= 80 else COLORS['medium'] if s >= 60 else COLORS['critical'] for s in scores]
    
    bars = ax.bar(x, scores, color=colors_list, alpha=0.8, edgecolor=COLORS['st_blue'], linewidth=2, width=0.6)
    
    ax.set_ylabel('Compliance Score (%)', fontsize=12, weight='bold')
    ax.set_title('Compliance Framework Coverage', fontsize=14, weight='bold', color=COLORS['st_blue'], pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(frameworks, fontsize=11, weight='bold')
    ax.set_ylim(0, 110)
    
    # Add horizontal reference lines
    ax.axhline(y=80, color=COLORS['success'], linestyle='--', alpha=0.5, linewidth=1, label='Good (80%)')
    ax.axhline(y=60, color=COLORS['medium'], linestyle='--', alpha=0.5, linewidth=1, label='Fair (60%)')
    
    # Add score labels on bars
    for bar, score in zip(bars, scores):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2, height + 2,
                f'{int(score)}%', ha='center', va='bottom', fontsize=11, weight='bold')
    
    ax.legend(loc='upper right', fontsize=9)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()


def create_hotspot_heatmap(data, filepath):
    """Security hotspots visualization"""
    hotspots = data.get('hotspots', {})
    file_hotspots = hotspots.get('file_hotspots', {})
    
    if not file_hotspots: 
        fig, ax = plt.subplots(figsize=(10, 5), facecolor='white')
        ax.text(0.5, 0.5, "No Security Hotspots Detected", 
                ha='center', va='center', fontsize=12, color=COLORS['info'])
        ax.axis('off')
        plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        return
    
    # Top 10 hotspots
    top_files = list(file_hotspots.items())[:10]
    files = [f[0].split('/')[-1][:30] for f in top_files]  # Filename only, truncated
    scores = [f[1] for f in top_files]
    
    fig, ax = plt.subplots(figsize=(12, 7), facecolor='white')
    
    y_pos = np.arange(len(files))
    
    # Color gradient based on score
    max_score = max(scores)
    colors_list = [plt.cm.YlOrRd(s / max_score) for s in scores]
    
    bars = ax.barh(y_pos, scores, color=colors_list, alpha=0.8, edgecolor=COLORS['st_blue'], linewidth=1.5)
    
    ax.set_yticks(y_pos)
    ax.set_yticklabels(files, fontsize=9)
    ax.invert_yaxis()
    ax.set_xlabel('Risk Score', fontsize=11, weight='bold')
    ax.set_title('Top 10 Security Hotspots (Files with Most Issues)', 
                 fontsize=13, weight='bold', color=COLORS['st_blue'], pad=15)
    
    # Add score labels
    for bar, score in zip(bars, scores):
        width = bar.get_width()
        ax.text(width + max_score * 0.02, bar.get_y() + bar.get_height()/2,
                f'{int(score)}', va='center', fontsize=9, weight='bold', color=COLORS['st_blue'])
    
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.grid(axis='x', alpha=0.3, linestyle='--')
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()


def create_cwe_distribution(data, filepath):
    """CWE vulnerability distribution pie chart"""
    analytics = data.get('analytics', {})
    top_cwes = analytics.get('top_cwes', {})
    
    if not top_cwes: 
        fig, ax = plt.subplots(figsize=(8, 8), facecolor='white')
        ax.text(0.5, 0.5, "No CWE Data Available", 
                ha='center', va='center', fontsize=12, color=COLORS['info'])
        ax.axis('off')
        plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        return
    
    # Top 8 CWEs
    cwes = list(top_cwes.keys())[:8]
    counts = list(top_cwes.values())[:8]
    
    # If more than 8, group others
    if len(top_cwes) > 8:
        other_count = sum(list(top_cwes.values())[8:])
        cwes.append('Others')
        counts.append(other_count)
    
    fig, ax = plt.subplots(figsize=(10, 8), facecolor='white')
    
    # Use a color palette
    colors_list = plt.cm.Set3(np.linspace(0, 1, len(cwes)))
    
    wedges, texts, autotexts = ax.pie(
        counts,
        labels=cwes,
        autopct='%1.1f%%',
        startangle=90,
        colors=colors_list,
        textprops={'fontsize': 10, 'weight': 'bold'},
        wedgeprops={'edgecolor': 'white', 'linewidth': 2}
    )
    
    for autotext in autotexts: 
        autotext.set_color('black')
        autotext.set_fontsize(9)
    
    ax.set_title('CWE Distribution (Top Weakness Types)', 
                 fontsize=14, weight='bold', color=COLORS['st_blue'], pad=20)
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()


def create_financial_impact_chart(data, filepath):
    """Financial impact breakdown"""
    financial = data.get('financial', {})
    
    remediation_cost = financial.get('total_remediation_cost', 0)
    breach_risk = financial.get('total_breach_risk', 0)
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), facecolor='white')
    
    # Cost breakdown pie chart
    labels = ['Remediation Cost', 'Potential Breach Cost']
    sizes = [remediation_cost, breach_risk]
    colors_list = [COLORS['low'], COLORS['critical']]
    explode = (0.05, 0.05)
    
    wedges, texts, autotexts = ax1.pie(
        sizes,
        labels=labels,
        autopct=lambda pct: f'${pct * sum(sizes) / 100:,.0f}',
        startangle=90,
        colors=colors_list,
        explode=explode,
        textprops={'fontsize': 11, 'weight': 'bold'},
        wedgeprops={'edgecolor': 'white', 'linewidth': 3}
    )
    
    for autotext in autotexts:
        autotext.set_color('white')
    
    ax1.set_title('Financial Impact Breakdown', fontsize=13, weight='bold', color=COLORS['st_blue'])
    
    # Severity cost breakdown
    severity_breakdown = financial.get('severity_breakdown', {})
    severities = ['Critical', 'High', 'Medium', 'Low']
    costs = [severity_breakdown.get(s.lower(), {}).get('cost', 0) for s in severities]
    colors_sev = [COLORS['critical'], COLORS['high'], COLORS['medium'], COLORS['low']]
    
    bars = ax2.bar(severities, costs, color=colors_sev, alpha=0.8, edgecolor=COLORS['st_blue'], linewidth=2)
    
    ax2.set_ylabel('Total Cost ($)', fontsize=11, weight='bold')
    ax2.set_title('Cost by Severity', fontsize=13, weight='bold', color=COLORS['st_blue'])
    ax2.grid(axis='y', alpha=0.3, linestyle='--')
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    
    # Add cost labels
    for bar, cost in zip(bars, costs):
        height = bar.get_height()
        if height > 0:
            ax2.text(bar.get_x() + bar.get_width()/2, height,
                    f'${cost:,.0f}', ha='center', va='bottom', fontsize=9, weight='bold')
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()


def create_remediation_timeline(data, filepath):
    """Remediation timeline Gantt-style chart"""
    metrics = data['metrics']
    financial = data['financial']
    
    fig, ax = plt.subplots(figsize=(12, 6), facecolor='white')
    
    # Define sprints
    sprints = [
        {'name': 'Sprint 1\n(Critical)', 'duration': 2, 'color': COLORS['critical'], 'offset': 0},
        {'name': 'Sprint 2\n(High)', 'duration': 2, 'color': COLORS['high'], 'offset': 2},
        {'name': 'Sprint 3\n(Medium/Low)', 'duration': 2, 'color': COLORS['medium'], 'offset': 4},
        {'name': 'Ongoing\n(Maintenance)', 'duration': 2, 'color': COLORS['success'], 'offset': 6}
    ]
    
    y_pos = 0
    for sprint in sprints:
        ax.barh(y_pos, sprint['duration'], left=sprint['offset'], 
                height=0.6, color=sprint['color'], alpha=0.7, 
                edgecolor=COLORS['st_blue'], linewidth=2)
        
        # Add sprint label inside bar
        ax.text(sprint['offset'] + sprint['duration']/2, y_pos, 
                sprint['name'], ha='center', va='center', 
                fontsize=10, weight='bold', color='white')
        
        y_pos += 1
    
    ax.set_yticks([])
    ax.set_xlabel('Weeks from Start', fontsize=11, weight='bold')
    ax.set_title('Recommended Remediation Timeline', fontsize=14, weight='bold', 
                 color=COLORS['st_blue'], pad=15)
    ax.set_xlim(0, 9)
    ax.grid(axis='x', alpha=0.3, linestyle='--')
    ax.spines['left'].set_visible(False)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Add week markers
    for week in range(0, 9):
        ax.axvline(x=week, color='gray', linestyle='-', alpha=0.2, linewidth=0.5)
    
    # Add total timeline info
    total_weeks = 6
    total_hours = financial.get('total_hours', 0)
    ax.text(0.5, -0.7, f'Total Timeline: {total_weeks} weeks | Estimated Effort: {int(total_hours)} hours',
            ha='left', fontsize=11, weight='bold', color=COLORS['st_blue'],
            transform=ax.transAxes)
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()