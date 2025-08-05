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
        
        # Token management for Deepseek limits
        self.MAX_INPUT_TOKENS = 60000  # Stay well under 65.5K limit
        self.MAX_OUTPUT_TOKENS = 4000
        
    def _estimate_tokens(self, text: str) -> int:
        """Rough token estimation (1 token ≈ 4 characters for code)"""
        return len(text) // 4
        
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
            # Check token limits before processing
            estimated_tokens = self._estimate_tokens(file_content)
            if estimated_tokens > self.MAX_INPUT_TOKENS // 2:  # Leave room for prompt
                logger.warning(f"File {file_path} too large ({estimated_tokens} tokens), skipping")
                return []
            
            prompt = self._create_concise_vulnerability_analysis_prompt(
                file_content, file_path, file_extension
            )
            
            response = await self._make_api_request(prompt)
            vulnerabilities = self._parse_vulnerability_response(response, file_path)
            
            logger.info(f"Found {len(vulnerabilities)} vulnerabilities in {file_path}")
            return vulnerabilities
            
        except Exception as e:
            logger.error(f"Error analyzing {file_path}: {e}")
            return []
    
    def _create_concise_vulnerability_analysis_prompt(
        self, 
        file_content: str, 
        file_path: str, 
        file_extension: str
    ) -> str:
        """
        Create a concise security analysis prompt optimized for token limits
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
            '.yml': 'YAML'
        }
        
        language = language_map.get(file_extension.lower(), 'Unknown')
        
        # Truncate file content if too long
        max_content_length = 15000  # Limit content to ~15K characters
        if len(file_content) > max_content_length:
            file_content = file_content[:max_content_length] + "\n... [FILE TRUNCATED] ..."
            logger.info(f"Truncated {file_path} content for analysis")
        
        prompt = f"""Analyze this {language} code for critical security vulnerabilities. Focus only on high-impact issues.

FILE: {file_path}

CODE:
```{language.lower()}
{file_content}
```

FIND ONLY THESE CRITICAL VULNERABILITIES:
1. SQL/NoSQL Injection
2. XSS (Cross-Site Scripting)
3. Command Injection
4. Path Traversal
5. Hardcoded Secrets/Credentials
6. Insecure Cryptography
7. Authentication/Authorization Bypass
8. Remote Code Execution

RESPONSE FORMAT (JSON only):
```json
[
  {{
    "title": "Brief vulnerability title",
    "description": "Why this is dangerous",
    "severity": "critical|high|medium|low",
    "category": "sql_injection|xss|command_injection|path_traversal|hardcoded_secrets|crypto|auth|rce|other",
    "line_number": line_number,
    "code_snippet": "vulnerable code",
    "recommendation": "How to fix",
    "risk_score": 1.0-10.0
  }}
]
```

IMPORTANT:
- Return empty array [] if no critical vulnerabilities found
- Focus on exploitable issues only
- Be concise but accurate
- Include specific line numbers
- Maximum 5 vulnerabilities per file"""

        return prompt
    
    async def _make_api_request(self, prompt: str) -> Dict[str, Any]:
        """
        Make request to Deepseek API with strict token limits
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
                    "content": "You are a security expert. Respond only with valid JSON arrays of vulnerability objects. Be concise and focus on critical issues only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1,
            "max_tokens": self.MAX_OUTPUT_TOKENS,
            "stream": False
        }
        
        # Estimate total tokens and warn if too high
        total_estimated = self._estimate_tokens(prompt) + 500  # System message overhead
        if total_estimated > self.MAX_INPUT_TOKENS:
            logger.warning(f"Request may exceed token limit: {total_estimated} tokens")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
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
            
            # Clean up the response
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            # Handle empty responses
            if not content or content.lower() in ['[]', 'none', 'no vulnerabilities']:
                return []
            
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
            'line_number', 'recommendation'
        ]
        
        # Check required fields
        for field in required_fields:
            if field not in vuln:
                logger.warning(f"Missing required field: {field}")
                return False
        
        # Validate severity
        if vuln['severity'] not in ['critical', 'high', 'medium', 'low']:
            logger.warning(f"Invalid severity: {vuln['severity']}")
            return False
        
        # Validate risk score if present
        if 'risk_score' in vuln:
            try:
                risk_score = float(vuln['risk_score'])
                if not (0 <= risk_score <= 10):
                    logger.warning(f"Invalid risk score: {risk_score}")
                    return False
            except (ValueError, TypeError):
                logger.warning(f"Invalid risk score format: {vuln['risk_score']}")
                return False
        
        # Validate line number
        try:
            line_num = int(vuln['line_number'])
            if line_num < 1:
                logger.warning(f"Invalid line number: {line_num}")
                return False
        except (ValueError, TypeError):
            logger.warning(f"Invalid line number format: {vuln['line_number']}")
            return False
        
        return True
    
    async def generate_scan_summary(
        self, 
        scan_results: List[Dict[str, Any]], 
        repository_name: str,
        files_scanned: int,
        files_skipped: int
    ) -> Dict[str, Any]:
        """
        Generate a lightweight scan summary
        """
        try:
            if not scan_results:
                return {
                    "security_score": 85.0,
                    "risk_level": "low",
                    "summary": f"Scanned {files_scanned} files, no critical vulnerabilities found.",
                    "top_concerns": ["Limited scan coverage"] if files_skipped > 0 else [],
                    "recommendations": ["Continue monitoring", "Consider full repository scan"]
                }
            
            # Quick analysis without LLM to save tokens
            total_vulns = len(scan_results)
            severity_counts = {
                'critical': len([v for v in scan_results if v.get('severity') == 'critical']),
                'high': len([v for v in scan_results if v.get('severity') == 'high']),
                'medium': len([v for v in scan_results if v.get('severity') == 'medium']),
                'low': len([v for v in scan_results if v.get('severity') == 'low'])
            }
            
            # Calculate risk level
            if severity_counts['critical'] > 0:
                risk_level = "critical"
                security_score = max(10, 50 - (severity_counts['critical'] * 10))
            elif severity_counts['high'] > 2:
                risk_level = "high"
                security_score = max(20, 70 - (severity_counts['high'] * 5))
            elif severity_counts['high'] > 0 or severity_counts['medium'] > 3:
                risk_level = "medium"
                security_score = max(40, 80 - (severity_counts['medium'] * 3))
            else:
                risk_level = "low"
                security_score = max(60, 90 - (severity_counts['low'] * 2))
            
            # Generate summary
            summary = f"Scanned {files_scanned} files in {repository_name}. "
            if files_skipped > 0:
                summary += f"{files_skipped} files skipped due to limits. "
            summary += f"Found {total_vulns} vulnerabilities requiring attention."
            
            # Top concerns
            concerns = []
            if severity_counts['critical'] > 0:
                concerns.append(f"{severity_counts['critical']} critical vulnerabilities")
            if severity_counts['high'] > 0:
                concerns.append(f"{severity_counts['high']} high severity issues")
            if files_skipped > files_scanned:
                concerns.append("Limited scan coverage")
            
            # Recommendations
            recommendations = []
            if severity_counts['critical'] > 0:
                recommendations.append("Fix critical vulnerabilities immediately")
            if severity_counts['high'] > 0:
                recommendations.append("Address high severity issues")
            if files_skipped > 0:
                recommendations.append("Consider full repository scan")
            if not recommendations:
                recommendations.append("Continue regular security monitoring")
            
            return {
                "security_score": round(security_score, 1),
                "risk_level": risk_level,
                "summary": summary,
                "top_concerns": concerns,
                "recommendations": recommendations[:3],  # Limit to top 3
                "scan_coverage": {
                    "files_scanned": files_scanned,
                    "files_skipped": files_skipped,
                    "coverage_percentage": round((files_scanned / max(1, files_scanned + files_skipped)) * 100, 1)
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating scan summary: {e}")
            return {
                "security_score": 50.0,
                "risk_level": "medium",
                "summary": f"Security analysis completed for {repository_name}. Manual review recommended.",
                "top_concerns": ["Analysis error occurred"],
                "recommendations": ["Review scan results manually", "Check scan logs"]
            }