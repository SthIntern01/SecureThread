"""
LLM-based vulnerability scanning service
Uses DeepSeek API for comprehensive security analysis
"""
import os
import re
import json
import logging
import time
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session
from openai import OpenAI

from app.models.vulnerability import Scan, Vulnerability
from app.models.repository import Repository
from app.core.settings import settings

logger = logging.getLogger(__name__)


class LLMScanService:
    """Service for LLM-based security scanning"""
    
    # Token cost estimation (per 1K tokens) for DeepSeek
    COST_PER_1K_INPUT_TOKENS = 0.00014  # $0.14 per 1M tokens
    COST_PER_1K_OUTPUT_TOKENS = 0.00028  # $0.28 per 1M tokens
    
    PRIORITY_DESCRIPTIONS = {
        'critical': 'ONLY critical security vulnerabilities (RCE, SQL Injection, Authentication Bypass)',
        'high': 'Critical and High severity vulnerabilities (XSS, CSRF, Sensitive Data Exposure)',
        'medium': 'Critical, High, and Medium severity vulnerabilities',
        'low': 'All severity levels including informational issues',
        'all': 'Complete security analysis including best practices and code quality'
    }
    
    def __init__(self, db: Session):
        self.db = db
        self.client = OpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com"
        )
        self.model = "deepseek-chat"
    
    def estimate_scan_time(self, file_count: int, priority: str) -> int:
        """Estimate scan duration in seconds"""
        base_time_per_file = 3  # seconds
        priority_multiplier = {
            'critical': 0.5,
            'high': 0.7,
            'medium': 1.0,
            'low': 1.2,
            'all': 1.5
        }
        
        multiplier = priority_multiplier.get(priority, 1.0)
        return int(file_count * base_time_per_file * multiplier)
    
    def get_scannable_files(self, repo_path: str, max_files: int) -> List[str]:
        """Get list of files to scan"""
        extensions = settings.ALLOWED_FILE_EXTENSIONS
        files = []
        
        try:
            for root, dirs, filenames in os.walk(repo_path):
                # Skip common directories
                dirs[:] = [d for d in dirs if d not in [
                    'node_modules', 'venv', '.git', '__pycache__', 
                    'build', 'dist', '.next', 'vendor'
                ]]
                
                for filename in filenames:
                    if any(filename.endswith(ext) for ext in extensions):
                        file_path = os.path.join(root, filename)
                        relative_path = os.path.relpath(file_path, repo_path)
                        files.append(relative_path)
                        
                        if len(files) >= max_files:
                            return files
            
            return files
        except Exception as e:
            logger.error(f"Error scanning directory: {str(e)}")
            return []
    
    def read_file_content(self, file_path: str) -> Optional[str]:
        """Read file content safely"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {str(e)}")
            return None
    
    def create_scan_prompt(self, file_content: str, file_path: str, priority: str) -> str:
        """Create prompt for LLM analysis"""
        priority_instruction = self.PRIORITY_DESCRIPTIONS.get(priority, self.PRIORITY_DESCRIPTIONS['all'])
        
        prompt = f"""You are a security expert analyzing code for vulnerabilities.

File: {file_path}
Priority Level: {priority.upper()}
Focus: {priority_instruction}

Analyze the following code and identify security vulnerabilities:

Provide your response in the following JSON format (return ONLY valid JSON, no other text):

{{
  "vulnerabilities": [
    {{
      "title": "Brief title of vulnerability",
      "description": "Detailed description",
      "severity": "critical|high|medium|low",
      "category": "Category (e.g., SQL Injection, XSS, etc.)",
      "cwe_id": "CWE-XXX if applicable",
      "owasp_category": "OWASP category if applicable",
      "line_number": line_number,
      "line_end_number": line_number,
      "code_snippet": "vulnerable code snippet",
      "explanation": "Why this is a vulnerability and its impact",
      "solution": "How to fix this vulnerability",
      "code_example": "Example of fixed code",
      "confidence": 0.0-1.0
    }}
  ]
}}

If no vulnerabilities found, return: {{"vulnerabilities": []}}
"""
        return prompt
    
    def parse_llm_response(self, response_text: str) -> List[Dict]:
        """Parse LLM response and extract vulnerabilities"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(0)
            
            data = json.loads(response_text)
            return data.get('vulnerabilities', [])
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response: {str(e)}")
            logger.debug(f"Response text: {response_text}")
            return []
    
    def analyze_file_with_llm(
        self, 
        file_path: str, 
        file_content: str, 
        priority: str
    ) -> Tuple[List[Dict], int, int]:
        """
        Analyze a single file using LLM
        Returns: (vulnerabilities, prompt_tokens, completion_tokens)
        """
        try:
            prompt = self.create_scan_prompt(file_content, file_path, priority)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a security expert. Respond ONLY with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,  # Low temperature for consistent results
                max_tokens=2000
            )
            
            response_text = response.choices[0].message.content
            vulnerabilities = self.parse_llm_response(response_text)
            
            prompt_tokens = response.usage.prompt_tokens
            completion_tokens = response.usage.completion_tokens
            
            return vulnerabilities, prompt_tokens, completion_tokens
            
        except Exception as e:
            logger.error(f"Error analyzing file with LLM: {str(e)}")
            return [], 0, 0
    
    def calculate_cost(self, prompt_tokens: int, completion_tokens: int) -> float:
        """Calculate cost in USD"""
        input_cost = (prompt_tokens / 1000) * self.COST_PER_1K_INPUT_TOKENS
        output_cost = (completion_tokens / 1000) * self.COST_PER_1K_OUTPUT_TOKENS
        return round(input_cost + output_cost, 6)
    
    def save_vulnerability(
        self,
        scan_id: int,
        repository_id: int,
        file_path: str,
        vuln_data: Dict
    ) -> Optional[Vulnerability]:
        """Save a vulnerability to database"""
        try:
            vulnerability = Vulnerability(
                scan_id=scan_id,
                repository_id=repository_id,
                detection_method='llm_based',
                rule_id=None,
                
                title=vuln_data.get('title', 'Untitled Vulnerability'),
                description=vuln_data.get('description', ''),
                severity=vuln_data.get('severity', 'medium').lower(),
                category=vuln_data.get('category', 'Unknown'),
                cwe_id=vuln_data.get('cwe_id'),
                owasp_category=vuln_data.get('owasp_category'),
                
                file_path=file_path,
                line_number=vuln_data.get('line_number'),
                line_end_number=vuln_data.get('line_end_number'),
                code_snippet=vuln_data.get('code_snippet'),
                
                llm_explanation=vuln_data.get('explanation'),
                llm_solution=vuln_data.get('solution'),
                llm_code_example=vuln_data.get('code_example'),
                confidence_score=vuln_data.get('confidence'),
                
                recommendation=vuln_data.get('solution', 'No recommendation provided'),
                status='open'
            )
            
            self.db.add(vulnerability)
            self.db.commit()
            self.db.refresh(vulnerability)
            
            return vulnerability
            
        except Exception as e:
            logger.error(f"Error saving vulnerability: {str(e)}")
            self.db.rollback()
            return None
    
    def perform_llm_scan(
        self,
        scan_id: int,
        repository: Repository,
        max_files: int,
        priority: str,
        repo_path: str
    ) -> Dict:
        """
        Perform complete LLM-based scan
        Returns scan statistics
        """
        start_time = time.time()
        
        # Get scan object
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            raise ValueError(f"Scan {scan_id} not found")
        
        # Update scan status
        scan.status = 'running'
        scan.started_at = datetime.utcnow()
        self.db.commit()
        
        # Get files to scan
        files_to_scan = self.get_scannable_files(repo_path, max_files)
        
        total_files = len(files_to_scan)
        total_vulnerabilities = 0
        severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        
        total_prompt_tokens = 0
        total_completion_tokens = 0
        
        try:
            for idx, relative_file_path in enumerate(files_to_scan, 1):
                full_file_path = os.path.join(repo_path, relative_file_path)
                
                # Read file content
                file_content = self.read_file_content(full_file_path)
                if not file_content:
                    continue
                
                # Analyze with LLM
                vulnerabilities, prompt_tokens, completion_tokens = self.analyze_file_with_llm(
                    relative_file_path,
                    file_content,
                    priority
                )
                
                total_prompt_tokens += prompt_tokens
                total_completion_tokens += completion_tokens
                
                # Save vulnerabilities
                for vuln_data in vulnerabilities:
                    vuln = self.save_vulnerability(
                        scan_id,
                        repository.id,
                        relative_file_path,
                        vuln_data
                    )
                    
                    if vuln:
                        total_vulnerabilities += 1
                        severity = vuln.severity.lower()
                        if severity in severity_counts:
                            severity_counts[severity] += 1
                
                # Update progress
                scan.total_files_scanned = idx
                scan.total_vulnerabilities = total_vulnerabilities
                self.db.commit()
                
                logger.info(f"Scanned file {idx}/{total_files}: {relative_file_path}")
            
            # Calculate final metrics
            total_tokens = total_prompt_tokens + total_completion_tokens
            estimated_cost = self.calculate_cost(total_prompt_tokens, total_completion_tokens)
            scan_duration = time.time() - start_time
            
            # Update scan with final results
            scan.status = 'completed'
            scan.completed_at = datetime.utcnow()
            scan.total_files_scanned = total_files
            scan.total_vulnerabilities = total_vulnerabilities
            scan.critical_count = severity_counts['critical']
            scan.high_count = severity_counts['high']
            scan.medium_count = severity_counts['medium']
            scan.low_count = severity_counts['low']
            scan.total_tokens_used = total_tokens
            scan.estimated_cost = estimated_cost
            scan.scan_duration_seconds = scan_duration
            scan.llm_model_used = self.model
            
            self.db.commit()
            
            return {
                'success': True,
                'scan_id': scan_id,
                'files_scanned': total_files,
                'vulnerabilities_found': total_vulnerabilities,
                'severity_counts': severity_counts,
                'tokens_used': total_tokens,
                'estimated_cost': estimated_cost,
                'duration_seconds': scan_duration
            }
            
        except Exception as e:
            logger.error(f"Error during LLM scan: {str(e)}")
            scan.status = 'failed'
            scan.error_message = str(e)
            scan.completed_at = datetime.utcnow()
            self.db.commit()
            
            return {
                'success': False,
                'error': str(e)
            }