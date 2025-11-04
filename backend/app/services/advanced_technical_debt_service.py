import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.models.user import User

logger = logging.getLogger(__name__)

class AdvancedTechnicalDebtService:
    """Industry-standard technical debt calculation with age, criticality, and exploit probability"""
    
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        
        # Industry-standard SLA targets (days to remediate)
        self.sla_targets = {
            'critical': 7,    # 7 days for critical
            'high': 15,       # 15 days for high  
            'medium': 30,     # 30 days for medium
            'low': 90         # 90 days for low
        }
        
        # Base remediation effort (hours) per severity
        self.base_effort_hours = {
            'critical': 24,   # Increased for critical (includes emergency response)
            'high': 12,       # Increased for high
            'medium': 6,      # Increased for medium
            'low': 2          # Increased for low
        }
        
        # Severity weights for risk calculation
        self.severity_weights = {
            'critical': 1.0,
            'high': 0.75,
            'medium': 0.5,
            'low': 0.25
        }
        
        # Asset criticality multipliers
        self.asset_criticality_multipliers = {
            'critical': 2.0,   # Production systems, customer data
            'high': 1.5,       # Important business systems
            'medium': 1.0,     # Standard systems
            'low': 0.5         # Development, test systems
        }
        
        # Developer hourly rates by region/seniority
        self.hourly_rates = {
            'senior': 120,     # Senior security engineer
            'mid': 85,         # Mid-level developer
            'junior': 60       # Junior developer
        }
    
    async def calculate_advanced_technical_debt(
        self, 
        repository_id: Optional[int] = None,
        time_filter: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Calculate advanced technical debt with industry-standard formulas"""
        
        # Get user's vulnerabilities from latest scans
        vulnerabilities = await self._get_vulnerabilities_with_metadata(repository_id, time_filter)
        
        if not vulnerabilities:
            return self._empty_debt_response()
        
        logger.info(f"💰 ADVANCED DEBT CALCULATION - User {self.user_id}")
        logger.info(f"- Processing {len(vulnerabilities)} vulnerabilities")
        
        # Calculate various debt metrics
        debt_metrics = {
            'total_debt_hours': 0,
            'total_debt_cost': 0,
            'debt_by_severity': {},
            'debt_by_age_bucket': {},
            'sla_breach_analysis': {},
            'risk_weighted_debt': 0,
            'financial_risk_exposure': 0,
            'remediation_priority_score': 0
        }
        
        # Process each vulnerability
        for vuln_data in vulnerabilities:
            vuln_debt = await self._calculate_vulnerability_debt(vuln_data)
            debt_metrics = self._accumulate_debt_metrics(debt_metrics, vuln_debt)
        
        # Calculate derived metrics
        debt_metrics.update(self._calculate_derived_metrics(debt_metrics, vulnerabilities))
        
        logger.info(f"💰 ADVANCED DEBT RESULTS:")
        logger.info(f"- Total Hours: {debt_metrics['total_debt_hours']:.1f}")
        logger.info(f"- Total Cost: ${debt_metrics['total_debt_cost']:,.2f}")
        logger.info(f"- Risk Weighted Score: {debt_metrics['risk_weighted_debt']:.1f}")
        logger.info(f"- Financial Risk: ${debt_metrics['financial_risk_exposure']:,.2f}")
        
        return debt_metrics
    
    async def _get_vulnerabilities_with_metadata(
        self, 
        repository_id: Optional[int],
        time_filter: Optional[datetime]
    ) -> List[Dict[str, Any]]:
        """Get vulnerabilities with repository and scan metadata"""
        
        # Get latest scans per repository (matching repository API logic)
        repo_query = self.db.query(Repository).filter(Repository.owner_id == self.user_id)
        if repository_id:
            repo_query = repo_query.filter(Repository.id == repository_id)
        
        repositories = repo_query.all()
        
        latest_scan_ids = []
        repo_metadata = {}
        
        for repo in repositories:
            scan_query = self.db.query(Scan).filter(Scan.repository_id == repo.id)
            if time_filter:
                scan_query = scan_query.filter(Scan.started_at >= time_filter)
            
            latest_scan = scan_query.order_by(Scan.started_at.desc()).first()
            if latest_scan:
                latest_scan_ids.append(latest_scan.id)
                repo_metadata[repo.id] = {
                    'name': repo.name,
                    'asset_criticality': getattr(repo, 'asset_criticality', 'medium'),
                    'business_impact_score': getattr(repo, 'business_impact_score', 1.0),
                    'scan_date': latest_scan.started_at
                }
        
        if not latest_scan_ids:
            return []
        
        # Get vulnerabilities from latest scans only
        vulnerabilities = self.db.query(Vulnerability).join(Scan).join(Repository).filter(
            Vulnerability.scan_id.in_(latest_scan_ids),
            Repository.owner_id == self.user_id
        ).all()
        
        # Enrich with metadata and age calculations
        enriched_vulnerabilities = []
        current_time = datetime.utcnow()
        
        for vuln in vulnerabilities:
            repo_info = repo_metadata.get(vuln.scan.repository_id, {})
            
            # Calculate age in days
            detected_date = vuln.detected_at or vuln.scan.started_at or current_time
            days_open = (current_time - detected_date).days
            
            # Calculate SLA breach
            sla_target = self.sla_targets.get(vuln.severity.lower(), 30)
            sla_breach_days = max(0, days_open - sla_target)
            is_past_sla = days_open > sla_target
            
            # Estimate exploit probability based on age and severity
            exploit_probability = self._calculate_exploit_probability(vuln.severity, days_open)
            
            enriched_vuln = {
                'id': vuln.id,
                'severity': vuln.severity.lower(),
                'category': vuln.category,
                'days_open': days_open,
                'sla_target_days': sla_target,
                'sla_breach_days': sla_breach_days,
                'is_past_sla': is_past_sla,
                'exploit_probability': exploit_probability,
                'repository_id': vuln.scan.repository_id,
                'repository_name': repo_info.get('name', 'Unknown'),
                'asset_criticality': repo_info.get('asset_criticality', 'medium'),
                'business_impact_score': repo_info.get('business_impact_score', 1.0),
                'detected_at': detected_date,
                'risk_score': vuln.risk_score or 5.0,
                'file_path': vuln.file_path
            }
            enriched_vulnerabilities.append(enriched_vuln)
        
        return enriched_vulnerabilities
    
    def _calculate_exploit_probability(self, severity: str, days_open: int) -> float:
        """Calculate exploit probability based on severity and age"""
        
        # Base probability by severity (industry averages)
        base_probabilities = {
            'critical': 0.4,  # 40% chance for critical
            'high': 0.2,      # 20% chance for high
            'medium': 0.1,    # 10% chance for medium
            'low': 0.05       # 5% chance for low
        }
        
        base_prob = base_probabilities.get(severity.lower(), 0.1)
        
        # Age multiplier (older vulnerabilities more likely to be exploited)
        if days_open <= 30:
            age_multiplier = 1.0
        elif days_open <= 90:
            age_multiplier = 1.2
        elif days_open <= 180:
            age_multiplier = 1.5
        else:
            age_multiplier = 2.0  # Very old vulnerabilities
        
        # Cap at 80% probability
        return min(0.8, base_prob * age_multiplier)
    
    async def _calculate_vulnerability_debt(self, vuln_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate debt for a single vulnerability using advanced formula"""
        
        severity = vuln_data['severity']
        days_open = vuln_data['days_open']
        asset_criticality = vuln_data['asset_criticality']
        exploit_probability = vuln_data['exploit_probability']
        business_impact = vuln_data['business_impact_score']
        
        # Base effort calculation
        base_hours = self.base_effort_hours.get(severity, 6)
        
        # Age multiplier (older = more complex to fix)
        if days_open <= 30:
            age_multiplier = 1.0
        elif days_open <= 90:
            age_multiplier = 1.3  # 30% more effort
        elif days_open <= 180:
            age_multiplier = 1.6  # 60% more effort  
        else:
            age_multiplier = 2.0  # 100% more effort (technical debt compounds)
        
        # Asset criticality multiplier
        criticality_multiplier = self.asset_criticality_multipliers.get(asset_criticality, 1.0)
        
        # Calculate total effort hours
        total_hours = base_hours * age_multiplier * criticality_multiplier
        
        # Calculate cost (use senior rate for critical assets)
        if asset_criticality in ['critical', 'high'] or severity in ['critical', 'high']:
            hourly_rate = self.hourly_rates['senior']
        elif severity == 'medium':
            hourly_rate = self.hourly_rates['mid']
        else:
            hourly_rate = self.hourly_rates['junior']
        
        total_cost = total_hours * hourly_rate
        
        # Risk-weighted debt score (industry formula)
        severity_weight = self.severity_weights.get(severity, 0.5)
        risk_weighted_score = (
            severity_weight * 
            exploit_probability * 
            criticality_multiplier * 
            business_impact *
            (1 + (days_open / 365))  # Time decay factor
        ) * 100
        
        # Financial risk exposure (potential business impact)
        # This represents the potential cost if the vulnerability is exploited
        financial_risk = exploit_probability * business_impact * self._get_business_impact_cost(severity, asset_criticality)
        
        return {
            'vulnerability_id': vuln_data['id'],
            'severity': severity,
            'days_open': days_open,
            'asset_criticality': asset_criticality,
            'total_hours': total_hours,
            'total_cost': total_cost,
            'risk_weighted_score': risk_weighted_score,
            'financial_risk_exposure': financial_risk,
            'exploit_probability': exploit_probability,
            'sla_breach_days': vuln_data['sla_breach_days'],
            'is_past_sla': vuln_data['is_past_sla'],
            'age_multiplier': age_multiplier,
            'criticality_multiplier': criticality_multiplier,
            'hourly_rate': hourly_rate
        }
    
    def _get_business_impact_cost(self, severity: str, asset_criticality: str) -> float:
        """Estimate potential business impact cost if vulnerability is exploited"""
        
        # Base impact costs by severity (industry averages)
        base_impacts = {
            'critical': 500000,  # $500k average for critical breach
            'high': 200000,      # $200k average for high severity
            'medium': 50000,     # $50k average for medium
            'low': 10000         # $10k average for low
        }
        
        # Asset criticality multipliers
        criticality_multipliers = {
            'critical': 3.0,  # Production systems
            'high': 2.0,      # Important systems
            'medium': 1.0,    # Standard systems
            'low': 0.3        # Dev/test systems
        }
        
        base_cost = base_impacts.get(severity, 50000)
        multiplier = criticality_multipliers.get(asset_criticality, 1.0)
        
        return base_cost * multiplier
    
    def _accumulate_debt_metrics(self, debt_metrics: Dict[str, Any], vuln_debt: Dict[str, Any]) -> Dict[str, Any]:
        """Accumulate vulnerability debt into total metrics"""
        
        severity = vuln_debt['severity']
        
        # Total accumulation
        debt_metrics['total_debt_hours'] += vuln_debt['total_hours']
        debt_metrics['total_debt_cost'] += vuln_debt['total_cost']
        debt_metrics['risk_weighted_debt'] += vuln_debt['risk_weighted_score']
        debt_metrics['financial_risk_exposure'] += vuln_debt['financial_risk_exposure']
        
        # By severity breakdown
        if severity not in debt_metrics['debt_by_severity']:
            debt_metrics['debt_by_severity'][severity] = {
                'count': 0,
                'hours': 0,
                'cost': 0,
                'avg_days_open': 0,
                'sla_breaches': 0
            }
        
        severity_data = debt_metrics['debt_by_severity'][severity]
        severity_data['count'] += 1
        severity_data['hours'] += vuln_debt['total_hours']
        severity_data['cost'] += vuln_debt['total_cost']
        severity_data['avg_days_open'] = (severity_data['avg_days_open'] * (severity_data['count'] - 1) + vuln_debt['days_open']) / severity_data['count']
        
        if vuln_debt['is_past_sla']:
            severity_data['sla_breaches'] += 1
        
        # Age bucket analysis
        days_open = vuln_debt['days_open']
        if days_open <= 30:
            bucket = '0-30 days'
        elif days_open <= 90:
            bucket = '31-90 days'
        elif days_open <= 180:
            bucket = '91-180 days'
        else:
            bucket = '180+ days'
        
        if bucket not in debt_metrics['debt_by_age_bucket']:
            debt_metrics['debt_by_age_bucket'][bucket] = {
                'count': 0,
                'hours': 0,
                'cost': 0,
                'avg_risk_score': 0
            }
        
        bucket_data = debt_metrics['debt_by_age_bucket'][bucket]
        bucket_data['count'] += 1
        bucket_data['hours'] += vuln_debt['total_hours']
        bucket_data['cost'] += vuln_debt['total_cost']
        bucket_data['avg_risk_score'] = (bucket_data['avg_risk_score'] * (bucket_data['count'] - 1) + vuln_debt['risk_weighted_score']) / bucket_data['count']
        
        return debt_metrics
    
    def _calculate_derived_metrics(self, debt_metrics: Dict[str, Any], vulnerabilities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate derived metrics and analysis"""
        
        total_vulns = len(vulnerabilities)
        if total_vulns == 0:
            return {}
        
        # SLA breach analysis
        total_sla_breaches = sum(1 for v in vulnerabilities if v['is_past_sla'])
        avg_days_open = sum(v['days_open'] for v in vulnerabilities) / total_vulns
        
        sla_breach_analysis = {
            'total_breaches': total_sla_breaches,
            'breach_percentage': (total_sla_breaches / total_vulns) * 100,
            'avg_days_open': avg_days_open,
            'avg_breach_days': sum(v['sla_breach_days'] for v in vulnerabilities if v['is_past_sla']) / max(1, total_sla_breaches)
        }
        
        # Priority recommendation based on multiple factors
        if debt_metrics['total_debt_hours'] > 200 or sla_breach_analysis['breach_percentage'] > 60:
            priority = 'critical'
        elif debt_metrics['total_debt_hours'] > 100 or sla_breach_analysis['breach_percentage'] > 30:
            priority = 'high'
        elif debt_metrics['total_debt_hours'] > 40 or sla_breach_analysis['breach_percentage'] > 15:
            priority = 'medium'
        else:
            priority = 'low'
        
        # ROI analysis (more sophisticated)
        maintenance_savings = debt_metrics['total_debt_cost'] * 0.2  # 20% annual maintenance reduction
        risk_reduction_value = debt_metrics['financial_risk_exposure'] * 0.7  # 70% of potential impact avoided
        productivity_gain = debt_metrics['total_debt_hours'] * self.hourly_rates['mid'] * 0.15  # 15% productivity boost
        
        return {
            'sla_breach_analysis': sla_breach_analysis,
            'priority_recommendation': priority,
            'estimated_sprint_impact': round(debt_metrics['total_debt_hours'] / 80, 1),  # Assuming 80 hours per sprint
            'debt_ratio': round(debt_metrics['total_debt_hours'] / max(1, total_vulns), 2),
            'roi_of_fixing': {
                'maintenance_savings': maintenance_savings,
                'risk_reduction_value': risk_reduction_value,
                'productivity_gain': productivity_gain,
                'total_benefit': maintenance_savings + risk_reduction_value + productivity_gain,
                'net_roi': ((maintenance_savings + risk_reduction_value + productivity_gain) / max(1, debt_metrics['total_debt_cost']) - 1) * 100
            },
            'industry_benchmarks': {
                'debt_per_vulnerability': 'Industry avg: 8-12 hours',
                'sla_breach_target': 'Industry target: <20%',
                'debt_trend': 'declining' if avg_days_open < 45 else 'stable' if avg_days_open < 90 else 'concerning'
            }
        }
    
    def _empty_debt_response(self) -> Dict[str, Any]:
        """Return empty response when no vulnerabilities found"""
        return {
            'total_debt_hours': 0,
            'total_debt_cost': 0,
            'debt_by_severity': {},
            'debt_by_age_bucket': {},
            'sla_breach_analysis': {
                'total_breaches': 0,
                'breach_percentage': 0,
                'avg_days_open': 0,
                'avg_breach_days': 0
            },
            'risk_weighted_debt': 0,
            'financial_risk_exposure': 0,
            'priority_recommendation': 'low',
            'estimated_sprint_impact': 0,
            'debt_ratio': 0,
            'roi_of_fixing': {
                'maintenance_savings': 0,
                'risk_reduction_value': 0,
                'productivity_gain': 0,
                'total_benefit': 0,
                'net_roi': 0
            },
            'industry_benchmarks': {
                'debt_per_vulnerability': 'Industry avg: 8-12 hours',
                'sla_breach_target': 'Industry target: <20%',
                'debt_trend': 'excellent'
            }
        }