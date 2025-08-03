import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = "https://api.deepseek.com/v1"
        self.model = "deepseek-chat"
        
    async def analyze_code_for_vulnerabilities(
        self, 
        file_content: str, 
        file_path: str, 
        file_extension: str
    ) -> List[Dict[str, Any]]:
        """
        Analyze a single file for security vulnerabilities using Deepseek API
        """
        try:
            prompt = self._create_vulnerability_analysis_prompt(
                file_content, file_path, file_extension
            )
            
            response = await self._make_api_request(prompt)
            vulnerabilities = self._parse_vulnerability_response(response, file_path)
            
            logger.info(f"Found {len(vulnerabilities)} vulnerabilities in {file_path}")
            return vulnerabilities
            
        except Exception as e:
            logger.error(f"Error analyzing {file_path}: {e}")
            return []
    
    def _create_vulnerability_analysis_prompt(
        self, 
        file_content: str, 
        file_path: str, 
        file_extension: str
    ) -> str:
        """
        Create a comprehensive security analysis prompt
        """
        language_map = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.jsx': 'JavaScript/React',
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript/React',
            '.java': 'Java',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.sql': 'SQL',
            '.sh': 'Shell Script',
            '.dockerfile': 'Dockerfile',
            '.yaml': 'YAML',
            '.yml': 'YAML',
            '.json': 'JSON',
            '.xml': 'XML'
        }
        
        language = language_map.get(file_extension.lower(), 'Unknown')
        
        prompt = f"""
You are a senior security engineer conducting a comprehensive security audit. Analyze the following {language} code for security vulnerabilities.

FILE: {file_path}
LANGUAGE: {language}

CODE:
```{language.lower()}
{file_content}
```

SECURITY ANALYSIS REQUIREMENTS:

1. **OWASP Top 10 Vulnerabilities:**
   - Injection flaws (SQL, NoSQL, LDAP, XPath)
   - Broken Authentication and Session Management
   - Cross-Site Scripting (XSS)
   - Broken Access Control
   - Security Misconfiguration
   - Insecure Cryptographic Storage
   - Insufficient Transport Layer Protection
   - Unvalidated Redirects and Forwards
   - Components with Known Vulnerabilities
   - Insufficient Logging and Monitoring

2. **Additional Security Checks:**
   - Hardcoded credentials/secrets
   - Insecure random number generation
   - Path traversal vulnerabilities
   - Command injection
   - Code injection
   - Deserialization vulnerabilities
   - Race conditions
   - Integer overflow/underflow
   - Buffer overflow (for C/C++)
   - Denial of Service vulnerabilities
   - Information disclosure
   - Privilege escalation
   - Input validation issues
   - Output encoding problems
   - Insecure file operations
   - Weak cryptography usage

3. **Language-Specific Checks:**
   - For Python: pickle vulnerabilities, eval() usage, subprocess security
   - For JavaScript: prototype pollution, DOM-based XSS, client-side vulnerabilities
   - For Java: deserialization, XXE, class loading vulnerabilities
   - For PHP: file inclusion, variable variables, register_globals issues
   - For SQL: injection, privilege escalation, data exposure

**RESPONSE FORMAT:**
You must respond with a valid JSON array containing vulnerability objects. Each vulnerability must have this exact structure:

```json
[
  {{
    "title": "Brief vulnerability title",
    "description": "Detailed description of the vulnerability and why it's dangerous",
    "severity": "critical|high|medium|low",
    "category": "sql_injection|xss|authentication|authorization|cryptography|injection|configuration|logging|components|validation|other",
    "cwe_id": "CWE-XXX (if applicable)",
    "owasp_category": "A01|A02|A03|A04|A05|A06|A07|A08|A09|A10 (if applicable)",
    "line_number": integer_line_number_where_vulnerability_starts,
    "line_end_number": integer_line_number_where_vulnerability_ends,
    "code_snippet": "The vulnerable code lines",
    "recommendation": "How to fix this vulnerability",
    "fix_suggestion": "Specific code changes or security practices",
    "risk_score": float_between_0_and_10,
    "exploitability": "low|medium|high",
    "impact": "low|medium|high"
  }}
]
```

**SEVERITY GUIDELINES:**
- **Critical**: Remote code execution, SQL injection, authentication bypass
- **High**: XSS, privilege escalation, sensitive data exposure
- **Medium**: Information disclosure, denial of service, weak cryptography
- **Low**: Information leakage, missing security headers, code quality issues

**IMPORTANT RULES:**
1. Only return the JSON array, no additional text
2. If no vulnerabilities found, return an empty array: []
3. Be thorough but avoid false positives
4. Focus on real security issues, not code style
5. Provide specific line numbers and actionable recommendations
6. Consider the context and framework being used

Analyze the code now:
"""
        return prompt
    
    async def _make_api_request(self, prompt: str) -> Dict[str, Any]:
        """
        Make request to Deepseek API
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a security expert specializing in code vulnerability analysis. You always respond with valid JSON format as requested."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1,  # Low temperature for consistent analysis
            "max_tokens": 4000,
            "stream": False
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"Deepseek API error: {response.status_code} - {response.text}")
                raise Exception(f"API request failed: {response.status_code}")
            
            return response.json()
    
    def _parse_vulnerability_response(
        self, 
        response: Dict[str, Any], 
        file_path: str
    ) -> List[Dict[str, Any]]:
        """
        Parse and validate the LLM response
        """
        try:
            content = response['choices'][0]['message']['content']
            
            # Clean up the response - remove markdown code blocks if present
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            # Parse JSON
            vulnerabilities = json.loads(content)
            
            # Validate and enrich each vulnerability
            validated_vulnerabilities = []
            for vuln in vulnerabilities:
                if self._validate_vulnerability(vuln):
                    vuln['file_path'] = file_path
                    validated_vulnerabilities.append(vuln)
                else:
                    logger.warning(f"Invalid vulnerability format in {file_path}: {vuln}")
            
            return validated_vulnerabilities
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response for {file_path}: {e}")
            logger.error(f"Response content: {content}")
            return []
        except KeyError as e:
            logger.error(f"Unexpected response format for {file_path}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error parsing vulnerability response for {file_path}: {e}")
            return []
    
    def _validate_vulnerability(self, vuln: Dict[str, Any]) -> bool:
        """
        Validate vulnerability object structure
        """
        required_fields = [
            'title', 'description', 'severity', 'category', 
            'line_number', 'recommendation', 'risk_score'
        ]
        
        # Check required fields
        for field in required_fields:
            if field not in vuln:
                return False
        
        # Validate severity
        if vuln['severity'] not in ['critical', 'high', 'medium', 'low']:
            return False
        
        # Validate risk score
        try:
            risk_score = float(vuln['risk_score'])
            if not (0 <= risk_score <= 10):
                return False
        except (ValueError, TypeError):
            return False
        
        # Validate line number
        try:
            line_num = int(vuln['line_number'])
            if line_num < 1:
                return False
        except (ValueError, TypeError):
            return False
        
        return True
    
    async def generate_scan_summary(
        self, 
        scan_results: List[Dict[str, Any]], 
        repository_name: str
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive scan summary
        """
        try:
            prompt = self._create_summary_prompt(scan_results, repository_name)
            response = await self._make_api_request(prompt)
            summary = self._parse_summary_response(response)
            return summary
        except Exception as e:
            logger.error(f"Error generating scan summary: {e}")
            return {}
    
    def _create_summary_prompt(
        self, 
        scan_results: List[Dict[str, Any]], 
        repository_name: str
    ) -> str:
        """
        Create a prompt for scan summary generation
        """
        total_vulns = len(scan_results)
        severity_counts = {
            'critical': len([v for v in scan_results if v.get('severity') == 'critical']),
            'high': len([v for v in scan_results if v.get('severity') == 'high']),
            'medium': len([v for v in scan_results if v.get('severity') == 'medium']),
            'low': len([v for v in scan_results if v.get('severity') == 'low'])
        }
        
        categories = {}
        for vuln in scan_results:
            cat = vuln.get('category', 'unknown')
            categories[cat] = categories.get(cat, 0) + 1
        
        prompt = f"""
Generate a comprehensive security scan summary for repository: {repository_name}

SCAN RESULTS:
- Total Vulnerabilities: {total_vulns}
- Critical: {severity_counts['critical']}
- High: {severity_counts['high']}
- Medium: {severity_counts['medium']}
- Low: {severity_counts['low']}

VULNERABILITY CATEGORIES:
{json.dumps(categories, indent=2)}

TOP VULNERABILITIES (Sample):
{json.dumps(scan_results[:5], indent=2)}

Generate a JSON response with this structure:
```json
{{{{
  "security_score": float_between_0_and_100,
  "risk_level": "low|medium|high|critical",
  "summary": "Brief overall security assessment",
  "top_concerns": ["list", "of", "primary", "security", "concerns"],
  "recommendations": ["list", "of", "prioritized", "recommendations"],
  "compliance_status": {{{{
    "owasp_top_10": "compliant|partial|non_compliant",
    "security_best_practices": "good|fair|poor"
  }}}}
}}}}
```

Focus on actionable insights and prioritized recommendations.
"""
        return prompt
    
    def _parse_summary_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse the summary response from LLM
        """
        try:
            content = response['choices'][0]['message']['content']
            content = content.strip()
            
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error parsing summary response: {e}")
            return {
                "security_score": 50.0,
                "risk_level": "medium",
                "summary": "Security analysis completed with mixed results.",
                "top_concerns": ["Manual review required"],
                "recommendations": ["Review scan results manually"]
            }