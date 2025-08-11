# backend/app/services/llm_service.py

import httpx
import json
import logging
import re
from typing import List, Dict, Any, Optional
from app.core.settings import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = "https://api.deepseek.com/v1"
        self.model = "deepseek-chat"
        
    async def analyze_code_for_vulnerabilities(
        self, 
        code_content: str, 
        file_path: str, 
        file_extension: str
    ) -> List[Dict[str, Any]]:
        """
        Analyze code content for security vulnerabilities using DeepSeek
        """
        try:
            # Determine programming language from file extension
            language_map = {
                '.py': 'Python',
                '.js': 'JavaScript', 
                '.jsx': 'JavaScript/React',
                '.ts': 'TypeScript',
                '.tsx': 'TypeScript/React',
                '.php': 'PHP',
                '.java': 'Java',
                '.cpp': 'C++',
                '.c': 'C',
                '.cs': 'C#',
                '.rb': 'Ruby',
                '.go': 'Go',
                '.rs': 'Rust',
                '.swift': 'Swift',
                '.sql': 'SQL',
                '.sh': 'Shell/Bash',
                '.bash': 'Bash',
                '.yaml': 'YAML',
                '.yml': 'YAML',
                '.json': 'JSON',
                '.xml': 'XML',
                '.html': 'HTML',
                '.css': 'CSS'
            }
            
            language = language_map.get(file_extension.lower(), 'Unknown')
            
            # Create security analysis prompt
            prompt = f"""You are a cybersecurity expert analyzing code for vulnerabilities. 

ANALYZE THIS {language.upper()} CODE:
File: {file_path}
Language: {language}

```{language.lower()}
{code_content[:4000]}  
```

INSTRUCTIONS:
1. Identify ALL security vulnerabilities and issues
2. For EACH vulnerability found, provide JSON in this EXACT format:
3. Focus on real security issues, not minor style problems
4. Be thorough but only report actual vulnerabilities

REQUIRED JSON FORMAT for each vulnerability:
{{
  "title": "Clear vulnerability title",
  "description": "Detailed explanation of the security issue",
  "severity": "critical|high|medium|low",
  "category": "injection|xss|authentication|authorization|crypto|path_traversal|deserialization|other",
  "cwe_id": "CWE-XXX (if applicable)",
  "owasp_category": "OWASP category (if applicable)",
  "file_path": "{file_path}",
  "line_number": line_number_integer_or_null,
  "line_end_number": end_line_number_integer_or_null,
  "code_snippet": "vulnerable code excerpt",
  "recommendation": "Specific fix instructions",
  "fix_suggestion": "Example of secure code",
  "risk_score": risk_score_0_to_10,
  "exploitability": "low|medium|high",
  "impact": "low|medium|high"
}}

Return ONLY a JSON array of vulnerabilities. If no vulnerabilities found, return [].
Do not include any other text or explanations."""

            # Make API request
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a cybersecurity expert. Analyze code for vulnerabilities and respond ONLY with valid JSON arrays. No other text."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "temperature": 0.1,  # Low temperature for consistent security analysis
                "max_tokens": 3000,
                "stream": False
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    logger.error(f"LLM API error: {response.status_code} - {response.text}")
                    return []
                
                data = response.json()
                ai_response = data["choices"][0]["message"]["content"].strip()
                
                # Parse the JSON response
                vulnerabilities = self._parse_vulnerability_response(ai_response, file_path)
                
                logger.info(f"Found {len(vulnerabilities)} vulnerabilities in {file_path}")
                return vulnerabilities
                
        except Exception as e:
            logger.error(f"Error analyzing code with LLM: {e}")
            return []
    
    def _parse_vulnerability_response(self, response: str, file_path: str) -> List[Dict[str, Any]]:
        """Parse LLM response and extract vulnerabilities"""
        try:
            # Clean up the response - remove any non-JSON content
            response = response.strip()
            
            # Try to find JSON array in the response
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_content = response[json_start:json_end]
            else:
                # Try to find individual JSON objects
                json_objects = re.findall(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response)
                if json_objects:
                    json_content = '[' + ','.join(json_objects) + ']'
                else:
                    logger.warning(f"No valid JSON found in LLM response for {file_path}")
                    return []
            
            # Parse JSON
            vulnerabilities_raw = json.loads(json_content)
            
            if not isinstance(vulnerabilities_raw, list):
                logger.warning(f"Expected JSON array, got {type(vulnerabilities_raw)} for {file_path}")
                return []
            
            # Validate and clean up vulnerabilities
            vulnerabilities = []
            for vuln in vulnerabilities_raw:
                if isinstance(vuln, dict) and vuln.get('title'):
                    # Ensure required fields and defaults
                    cleaned_vuln = {
                        'title': str(vuln.get('title', 'Security Issue'))[:200],
                        'description': str(vuln.get('description', 'Security vulnerability detected'))[:1000],
                        'severity': self._validate_severity(vuln.get('severity', 'medium')),
                        'category': self._validate_category(vuln.get('category', 'other')),
                        'cwe_id': str(vuln.get('cwe_id', ''))[:20] if vuln.get('cwe_id') else None,
                        'owasp_category': str(vuln.get('owasp_category', ''))[:50] if vuln.get('owasp_category') else None,
                        'file_path': file_path,
                        'line_number': self._validate_line_number(vuln.get('line_number')),
                        'line_end_number': self._validate_line_number(vuln.get('line_end_number')),
                        'code_snippet': str(vuln.get('code_snippet', ''))[:500] if vuln.get('code_snippet') else None,
                        'recommendation': str(vuln.get('recommendation', 'Review and fix this security issue'))[:1000],
                        'fix_suggestion': str(vuln.get('fix_suggestion', ''))[:1000] if vuln.get('fix_suggestion') else None,
                        'risk_score': self._validate_risk_score(vuln.get('risk_score', 5.0)),
                        'exploitability': self._validate_level(vuln.get('exploitability', 'medium')),
                        'impact': self._validate_level(vuln.get('impact', 'medium'))
                    }
                    vulnerabilities.append(cleaned_vuln)
            
            return vulnerabilities
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error for {file_path}: {e}")
            logger.debug(f"Raw response: {response[:500]}...")
            return []
        except Exception as e:
            logger.error(f"Error parsing vulnerability response for {file_path}: {e}")
            return []
    
    def _validate_severity(self, severity: Any) -> str:
        """Validate and normalize severity level"""
        if isinstance(severity, str):
            severity = severity.lower().strip()
            if severity in ['critical', 'high', 'medium', 'low']:
                return severity
        return 'medium'
    
    def _validate_category(self, category: Any) -> str:
        """Validate and normalize vulnerability category"""
        valid_categories = [
            'injection', 'xss', 'authentication', 'authorization', 'crypto',
            'path_traversal', 'deserialization', 'other'
        ]
        if isinstance(category, str):
            category = category.lower().strip()
            if category in valid_categories:
                return category
        return 'other'
    
    def _validate_level(self, level: Any) -> str:
        """Validate low/medium/high level fields"""
        if isinstance(level, str):
            level = level.lower().strip()
            if level in ['low', 'medium', 'high']:
                return level
        return 'medium'
    
    def _validate_line_number(self, line_num: Any) -> Optional[int]:
        """Validate line number"""
        if isinstance(line_num, int) and line_num > 0:
            return line_num
        if isinstance(line_num, str):
            try:
                num = int(line_num)
                return num if num > 0 else None
            except ValueError:
                pass
        return None
    
    def _validate_risk_score(self, score: Any) -> float:
        """Validate risk score (0-10)"""
        try:
            score_float = float(score)
            return max(0.0, min(10.0, score_float))
        except (ValueError, TypeError):
            return 5.0
    
    async def analyze_code_snippet(
        self, 
        code_snippet: str, 
        language: str,
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Quick analysis of a small code snippet
        """
        try:
            prompt = f"""Analyze this {language} code snippet for security vulnerabilities:

{context}

```{language.lower()}
{code_snippet}
```

Provide a brief security assessment including:
1. Any vulnerabilities found
2. Security recommendations
3. Risk level (low/medium/high)

Keep the response concise but informative."""

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a cybersecurity expert providing quick code security assessments."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.2,
                "max_tokens": 1000,
                "stream": False
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "analysis": data["choices"][0]["message"]["content"],
                        "tokens_used": data.get("usage", {}).get("total_tokens", 0)
                    }
                else:
                    logger.error(f"LLM API error in snippet analysis: {response.status_code}")
                    return {
                        "analysis": "Unable to analyze code snippet at this time.",
                        "error": f"API error: {response.status_code}"
                    }
                    
        except Exception as e:
            logger.error(f"Error in code snippet analysis: {e}")
            return {
                "analysis": "Error occurred during code analysis.",
                "error": str(e)
            }
    
    async def get_security_recommendations(
        self, 
        language: str,
        vulnerability_types: List[str] = None
    ) -> Dict[str, Any]:
        """
        Get general security recommendations for a programming language
        """
        try:
            vuln_context = ""
            if vulnerability_types:
                vuln_context = f"Focus on these vulnerability types: {', '.join(vulnerability_types)}"
            
            prompt = f"""Provide security best practices and recommendations for {language} development.

{vuln_context}

Include:
1. Top 5 security best practices
2. Common vulnerabilities to avoid
3. Recommended security libraries/tools
4. Code review checklist items

Make it practical and actionable for developers."""

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": f"You are a cybersecurity expert specializing in {language} security."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 2000,
                "stream": False
            }
            
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "recommendations": data["choices"][0]["message"]["content"],
                        "language": language,
                        "tokens_used": data.get("usage", {}).get("total_tokens", 0)
                    }
                else:
                    logger.error(f"LLM API error in recommendations: {response.status_code}")
                    return {
                        "recommendations": f"Unable to generate {language} security recommendations at this time.",
                        "error": f"API error: {response.status_code}"
                    }
                    
        except Exception as e:
            logger.error(f"Error getting security recommendations: {e}")
            return {
                "recommendations": "Error occurred while generating recommendations.",
                "error": str(e)
            }
    
    def get_supported_languages(self) -> List[Dict[str, str]]:
        """
        Get list of supported programming languages for analysis
        """
        return [
            {"extension": ".py", "language": "Python", "description": "Python scripts and applications"},
            {"extension": ".js", "language": "JavaScript", "description": "JavaScript files"},
            {"extension": ".jsx", "language": "React", "description": "React components"},
            {"extension": ".ts", "language": "TypeScript", "description": "TypeScript files"},
            {"extension": ".tsx", "language": "TypeScript React", "description": "TypeScript React components"},
            {"extension": ".php", "language": "PHP", "description": "PHP web applications"},
            {"extension": ".java", "language": "Java", "description": "Java applications"},
            {"extension": ".cpp", "language": "C++", "description": "C++ applications"},
            {"extension": ".c", "language": "C", "description": "C programs"},
            {"extension": ".cs", "language": "C#", "description": "C# applications"},
            {"extension": ".rb", "language": "Ruby", "description": "Ruby applications"},
            {"extension": ".go", "language": "Go", "description": "Go applications"},
            {"extension": ".rs", "language": "Rust", "description": "Rust applications"},
            {"extension": ".swift", "language": "Swift", "description": "Swift applications"},
            {"extension": ".sql", "language": "SQL", "description": "SQL queries and scripts"},
            {"extension": ".sh", "language": "Shell", "description": "Shell scripts"},
            {"extension": ".bash", "language": "Bash", "description": "Bash scripts"},
            {"extension": ".yaml", "language": "YAML", "description": "YAML configuration files"},
            {"extension": ".yml", "language": "YAML", "description": "YAML configuration files"},
            {"extension": ".json", "language": "JSON", "description": "JSON configuration files"},
            {"extension": ".xml", "language": "XML", "description": "XML files"},
            {"extension": ".html", "language": "HTML", "description": "HTML files"},
            {"extension": ".css", "language": "CSS", "description": "CSS stylesheets"}
        ]