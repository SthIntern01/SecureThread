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
        
        # Debug log to verify API key is loaded
        if not self.api_key:
            logger.error("❌ DEEPSEEK_API_KEY is not set!")
        else:
            logger.info(f"✅ DEEPSEEK_API_KEY loaded: {self.api_key[:10]}...")
    
    # ✅ ADD THIS NEW METHOD HERE (around line 25)
    def _clean_ai_response(self, raw_response: str) -> str:
        """
        Clean up AI response to remove JSON artifacts and formatting issues. 
        
        Args:
            raw_response: Raw text from AI model
            
        Returns:
            Cleaned, human-readable text
        """
        try:
            # Remove common JSON artifacts
            cleaned = raw_response
            
            # Remove JSON prefixes like "json |", "{", "}"
            cleaned = re.sub(r'^[\s\{]*["\']? json[\s\|:]+["\']?', '', cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r'^[\s\{]*["\']?explanation["\']?[\s:]+', '', cleaned, flags=re.IGNORECASE)
            
            # Remove markdown code blocks
            cleaned = re.sub(r'^```[\w]*\n? ', '', cleaned, flags=re.MULTILINE)
            cleaned = re.sub(r'\n? ```$', '', cleaned, flags=re.MULTILINE)
            
            # Remove leading/trailing quotes and braces
            cleaned = cleaned.strip('{}"\' \n\r')
            
            # Replace escaped newlines with actual newlines
            cleaned = cleaned.replace('\\n', '\n')
            
            # Remove multiple consecutive newlines
            cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
            
            # Remove "Recommendation:" or "Fix:" prefixes if they're redundant
            cleaned = re.sub(r'^(Recommendation|Fix|Solution):\s*', '', cleaned, flags=re.IGNORECASE)
            
            return cleaned.strip()
            
        except Exception as e:
            logger.error(f"Error cleaning AI response: {e}")
            return raw_response
        
    
    async def _call_deepseek_api(self, prompt: str, max_tokens: int = 2000) -> Optional[str]:
        """
        Internal method to call DeepSeek API with given prompt
        """
        try:
            if not self.api_key:
                logger.error("❌ Cannot call API: DEEPSEEK_API_KEY not configured")
                return None
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a cybersecurity expert specializing in vulnerability analysis and remediation. Provide detailed, actionable security guidance."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "temperature": 0.1,
                "max_tokens": max_tokens,
                "stream": False
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"❌ LLM API error: {response.status_code} - {error_text}")
                    return None
                
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
                
        except httpx.TimeoutException:
            logger.error("⏰ LLM API request timed out")
            return None
        except httpx.RequestError as e:
            logger.error(f"🌐 LLM API request error: {e}")
            return None
        except Exception as e:
            logger.error(f"💥 Error in API call: {e}", exc_info=True)
            return None
    
    async def enhance_vulnerabilities(
        self, 
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Enhance rule-detected vulnerabilities with detailed explanations and mitigations
        """
        try:
            file_path = context.get('file_path', '')
            file_content = context.get('file_content', '')
            vulnerabilities = context.get('vulnerabilities', [])
            
            logger.info(f"🔍 LLM Enhancement Request for {file_path} with {len(vulnerabilities)} vulnerabilities")
            
            if not vulnerabilities:
                logger.warning("No vulnerabilities to enhance")
                return []
            
            if not self.api_key:
                logger.error("❌ Cannot enhance vulnerabilities: DEEPSEEK_API_KEY not configured")
                return []
            
            # Create enhancement prompt
            prompt = self._create_vulnerability_enhancement_prompt(file_path, file_content, vulnerabilities)
            
            logger.info(f"🚀 Sending request to DeepSeek API...")
            
            # Make API request using internal method
            ai_response = await self._call_deepseek_api(prompt, max_tokens=4000)
            
            if not ai_response:
                logger.error("❌ No response from DeepSeek API")
                return []
            
            logger.info(f"✅ Received LLM response: {len(ai_response)} characters")
            logger.debug(f"🔍 LLM Response Preview: {ai_response[:200]}...")
            
            # Parse enhancement response
            enhancements = self._parse_vulnerability_enhancements(ai_response, vulnerabilities)
            
            logger.info(f"🎯 Enhanced {len(enhancements)} vulnerabilities with LLM analysis")
            return enhancements
                
        except Exception as e:
            logger.error(f"💥 Error in vulnerability enhancement: {e}", exc_info=True)
            return []
    
    async def enhance_vulnerability_explanation(
        self,
        file_content: str,
        file_path: str,
        vulnerabilities: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Use AI to enhance vulnerability explanations with context-aware details
        """
        try:
            # Limit file content to avoid token exhaustion
            if len(file_content) > 10000:
                file_content = file_content[:10000] + "\n...  (truncated)"
            
            # Create vulnerability summary
            vuln_summary = "\n".join([
                f"- {v['severity'].upper()}: {v['title']} at line {v.get('line_number', '?')}"
                for v in vulnerabilities[:5]  # Limit to 5 vulnerabilities
            ])
            
            prompt = f"""You are a security expert. Analyze this code and provide detailed explanations for the detected vulnerabilities.

File: {file_path}

Detected Issues:
{vuln_summary}

Code:
{file_content}

For each vulnerability, provide:
1. A clear explanation of why it's dangerous
2. Specific fix recommendations with code examples
3. Best practices to prevent similar issues

Format your response as JSON:
{{
    "explanation": "Detailed explanation of the security issues...",
    "fix_suggestion": "Specific steps to fix with code examples...",
    "best_practices": ["Practice 1", "Practice 2", ...]
}}"""

            logger.info(f"🚀 Sending explanation enhancement request for {file_path}")
            response = await self._call_deepseek_api(prompt, max_tokens=2000)
            
            if response:
                logger.info(f"✅ Received explanation enhancement: {len(response)} characters")
                # Try to parse JSON response
                try:
                    result = json.loads(response)
                    
                    # Validate the response structure
                    validated_result = {
                        'explanation': result.get('explanation', '')[:2000],
                        'fix_suggestion': result.get('fix_suggestion', '')[:2000],
                        'best_practices': result.get('best_practices', [])
                    }
                    
                    # Ensure best_practices is a list
                    if not isinstance(validated_result['best_practices'], list):
                        validated_result['best_practices'] = []
                    else:
                        # Limit each practice to reasonable length
                        validated_result['best_practices'] = [
                            str(practice)[:500] for practice in validated_result['best_practices'][:10]
                        ]
                    
                    return validated_result
                    
                except json.JSONDecodeError:
                    logger.warning("❌ Could not parse JSON from enhancement response, returning as plain text")
                    # If not JSON, return as plain text
                    return {
                        'explanation': response[:500],
                        'fix_suggestion': response[500:1000] if len(response) > 500 else response,
                        'best_practices': []
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"💥 Error enhancing vulnerability explanation: {e}", exc_info=True)
            return None
    
    def _create_vulnerability_enhancement_prompt(
        self, 
        file_path: str, 
        file_content: str, 
        vulnerabilities: List[Dict[str, Any]]
    ) -> str:
        """Create prompt for vulnerability enhancement"""
        
        vuln_summaries = []
        for i, vuln in enumerate(vulnerabilities):
            vuln_summaries.append(f"""
VULNERABILITY {i+1}:
- Title: {vuln.get('title', 'Unknown')}
- Severity: {vuln.get('severity', 'medium')}
- Line: {vuln.get('line_number', 'Unknown')}
- Description: {vuln.get('description', 'Rule-based detection')}
- Code: {vuln.get('code_snippet', 'N/A')}
""")
        
        vulnerabilities_text = "\n".join(vuln_summaries)
        
        prompt = f"""
SECURITY ANALYSIS REQUEST:

File: {file_path}

Code Context (first 4000 chars):{file_content}

DETECTED VULNERABILITIES (from security rules):
{vulnerabilities_text}

ENHANCEMENT REQUEST:
For EACH vulnerability above, provide enhanced analysis in this EXACT JSON format:

{{
  "enhanced_description": "Detailed technical explanation of the vulnerability, its root cause, and potential attack vectors. Be specific about why this code is vulnerable.",
  "detailed_recommendation": "Specific, actionable steps to fix this vulnerability with concrete examples",
  "fix_suggestion": "Exact code snippet showing how to remediate this issue",
  "risk_score": numeric_value_0_to_10,
  "exploitability": "low|medium|high",
  "impact": "low|medium|high",
  "mitigation_priority": "immediate|high|medium|low",
  "related_cwe": "CWE-XXX if applicable",
  "owasp_category": "OWASP category if applicable"
}}

Return ONLY a JSON array with one enhancement object per vulnerability.
Ensure the array has exactly {len(vulnerabilities)} elements.
Focus on practical, implementable security guidance.

EXAMPLE for SQL injection:
[{{
  "enhanced_description": "This code constructs SQL queries using string concatenation with user input, creating a classic SQL injection vulnerability. An attacker can manipulate the query structure by injecting malicious SQL commands.",
  "detailed_recommendation": "Use parameterized queries or prepared statements instead of string concatenation. Implement input validation and sanitization.",
  "fix_suggestion": "Replace 'SELECT * FROM products WHERE id = ' + userInput with prepared statement: db.query('SELECT * FROM products WHERE id = ?', [userInput])",
  "risk_score": 8.5,
  "exploitability": "high",
  "impact": "high",
  "mitigation_priority": "immediate",
  "related_cwe": "CWE-89",
  "owasp_category": "A03:2021 – Injection"
}}]
"""
        
        return prompt
    
    def _parse_vulnerability_enhancements(
        self, 
        response: str, 
        original_vulnerabilities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Parse LLM enhancement response with better error handling"""
        try:
            # Clean response
            response = response.strip()
            
            logger.debug(f"🔍 Parsing LLM response: {response[:500]}...")
            
            # Extract JSON array
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_content = response[json_start:json_end]
                logger.debug(f"📋 Extracted JSON: {json_content[:200]}...")
            else:
                # Try to find individual JSON objects
                json_objects = re.findall(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response)
                if json_objects:
                    json_content = '[' + ','.join(json_objects) + ']'
                    logger.debug(f"📋 Reconstructed JSON from objects: {json_content[:200]}...")
                else:
                    logger.warning("❌ No valid JSON found in enhancement response")
                    return []
            
            enhancements = json.loads(json_content)
            
            if not isinstance(enhancements, list):
                logger.warning(f"❌ Expected JSON array, got {type(enhancements)}")
                return []
            
            logger.info(f"✅ Successfully parsed {len(enhancements)} enhancements")
            
            # Validate and clean enhancements
            validated_enhancements = []
            for i, enhancement in enumerate(enhancements):
                if isinstance(enhancement, dict):
                    validated_enhancement = {
                        'enhanced_description': str(enhancement.get('enhanced_description', ''))[:2000],
                        'detailed_recommendation': str(enhancement.get('detailed_recommendation', ''))[:2000],
                        'fix_suggestion': str(enhancement.get('fix_suggestion', ''))[:2000],
                        'risk_score': self._validate_risk_score(enhancement.get('risk_score', 5.0)),
                        'exploitability': self._validate_level(enhancement.get('exploitability', 'medium')),
                        'impact': self._validate_level(enhancement.get('impact', 'medium')),
                        'mitigation_priority': enhancement.get('mitigation_priority', 'medium'),
                        'related_cwe': str(enhancement.get('related_cwe', ''))[:20] if enhancement.get('related_cwe') else None,
                        'owasp_category': str(enhancement.get('owasp_category', ''))[:50] if enhancement.get('owasp_category') else None
                    }
                    validated_enhancements.append(validated_enhancement)
                    logger.debug(f"✅ Validated enhancement {i+1}")
            
            return validated_enhancements
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error in enhancement response: {e}")
            logger.debug(f"🔍 Raw response causing error: {response}")
            return []
        except Exception as e:
            logger.error(f"💥 Error parsing enhancement response: {e}")
            return []
    
    def _validate_risk_score(self, score: Any) -> float:
        """Validate risk score (0-10)"""
        try:
            score_float = float(score)
            return max(0.0, min(10.0, score_float))
        except (ValueError, TypeError):
            return 5.0
    
    def _validate_level(self, level: Any) -> str:
        """Validate low/medium/high level fields"""
        if isinstance(level, str):
            level = level.lower().strip()
            if level in ['low', 'medium', 'high']:
                return level
        return 'medium'