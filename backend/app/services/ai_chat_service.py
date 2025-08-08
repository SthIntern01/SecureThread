import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from app.config.settings import settings
from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class AIChatService:
    def __init__(self, db: Session):
        self.db = db
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = "https://api.deepseek.com/v1"
        self.model = "deepseek-chat"
        
        # Context limits for chat
        self.MAX_INPUT_TOKENS = 30000
        self.MAX_OUTPUT_TOKENS = 2000
        
    def _estimate_tokens(self, text: str) -> int:
        """Rough token estimation (1 token ≈ 4 characters)"""
        return len(text) // 4
    
    def _get_system_prompt(self, user: User, user_context: Dict[str, Any]) -> str:
        """Create system prompt with SecureThread context"""
        return f"""You are SecureThread AI, an expert cybersecurity assistant for the SecureThread platform. You help users with:

🛡️ SECURITY EXPERTISE:
- Vulnerability analysis and remediation
- Code security reviews
- Security best practices
- Threat assessment
- Compliance guidance (SOC 2, ISO 27001, GDPR)

📊 PLATFORM CONTEXT:
- User: {user.full_name or user.github_username}
- Active Projects: {user_context.get('total_repositories', 0)}
- Total Vulnerabilities: {user_context.get('total_vulnerabilities', 0)}
- Security Score: {user_context.get('avg_security_score', 'N/A')}%

🎯 YOUR ROLE:
- Provide actionable security advice
- Explain vulnerabilities in simple terms
- Suggest specific fixes for code issues
- Help prioritize security tasks
- Guide users through SecureThread features

💬 COMMUNICATION STYLE:
- Be concise but thorough
- Use security terminology appropriately
- Provide practical, actionable advice
- Reference specific files/vulnerabilities when relevant
- Use emojis sparingly for clarity

🚫 LIMITATIONS:
- Cannot access external systems
- Cannot modify code directly
- Cannot run scans (guide users to use platform features)
- Cannot access sensitive credentials

Always prioritize security best practices and help users improve their security posture."""

    async def get_user_context(self, user: User) -> Dict[str, Any]:
        """Get user's security context for AI chat"""
        try:
            # Get user's repositories
            repositories = self.db.query(Repository).filter(
                Repository.owner_id == user.id
            ).all()
            
            # Get recent scans
            recent_scans = self.db.query(Scan).join(Repository).filter(
                Repository.owner_id == user.id
            ).order_by(Scan.started_at.desc()).limit(10).all()
            
            # Get vulnerability stats
            total_vulnerabilities = 0
            critical_count = 0
            high_count = 0
            security_scores = []
            
            for scan in recent_scans:
                if scan.status == "completed":
                    total_vulnerabilities += scan.total_vulnerabilities
                    critical_count += scan.critical_count
                    high_count += scan.high_count
                    if scan.security_score:
                        security_scores.append(scan.security_score)
            
            avg_security_score = sum(security_scores) / len(security_scores) if security_scores else None
            
            return {
                "total_repositories": len(repositories),
                "total_vulnerabilities": total_vulnerabilities,
                "critical_vulnerabilities": critical_count,
                "high_vulnerabilities": high_count,
                "avg_security_score": round(avg_security_score, 1) if avg_security_score else None,
                "recent_scans_count": len(recent_scans),
                "repositories": [
                    {
                        "name": repo.name,
                        "language": repo.language,
                        "is_private": repo.is_private
                    } for repo in repositories[:5]  # Limit to 5 for context
                ]
            }
        except Exception as e:
            logger.error(f"Error getting user context: {e}")
            return {}
    
    async def chat_completion(
        self, 
        user: User,
        message: str, 
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Generate AI chat response using DeepSeek
        """
        try:
            # Get user context
            user_context = await self.get_user_context(user)
            
            # Build conversation messages
            messages = [
                {
                    "role": "system",
                    "content": self._get_system_prompt(user, user_context)
                }
            ]
            
            # Add conversation history (limit to last 10 messages)
            if conversation_history:
                messages.extend(conversation_history[-10:])
            
            # Add current message
            messages.append({
                "role": "user",
                "content": message
            })
            
            # Check token limits
            total_content = " ".join([msg["content"] for msg in messages])
            estimated_tokens = self._estimate_tokens(total_content)
            
            if estimated_tokens > self.MAX_INPUT_TOKENS:
                # Truncate conversation history if too long
                messages = messages[:1] + messages[-3:]  # Keep system + last 2 exchanges
                logger.warning("Truncated conversation history due to token limits")
            
            response = await self._make_chat_request(messages)
            
            return {
                "response": response.get("content", "I apologize, but I couldn't generate a response."),
                "tokens_used": response.get("tokens_used", 0),
                "model": self.model,
                "user_context": user_context
            }
            
        except Exception as e:
            logger.error(f"Error in chat completion: {e}")
            return {
                "response": "I'm experiencing technical difficulties. Please try again in a moment.",
                "error": str(e)
            }
    
    async def _make_chat_request(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Make request to DeepSeek chat API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,  # Lower temperature for more consistent security advice
            "max_tokens": self.MAX_OUTPUT_TOKENS,
            "stream": False
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                logger.error(f"DeepSeek API error: {response.status_code} - {response.text}")
                raise Exception(f"AI service unavailable: {response.status_code}")
            
            data = response.json()
            
            return {
                "content": data["choices"][0]["message"]["content"],
                "tokens_used": data.get("usage", {}).get("total_tokens", 0)
            }
    
    async def analyze_vulnerability_with_ai(
        self, 
        vulnerability: Vulnerability,
        file_content: str = None
    ) -> Dict[str, Any]:
        """Get AI analysis of a specific vulnerability"""
        try:
            prompt = f"""Analyze this security vulnerability and provide detailed guidance:

VULNERABILITY DETAILS:
- Title: {vulnerability.title}
- Severity: {vulnerability.severity}
- Category: {vulnerability.category}
- File: {vulnerability.file_path}
- Line: {vulnerability.line_number or 'Unknown'}
- Description: {vulnerability.description}
- Current Recommendation: {vulnerability.recommendation}

{f"CODE CONTEXT:\n```\n{file_content[:2000]}\n```" if file_content else ""}

Please provide:
1. 🔍 Root Cause Analysis
2. 🚨 Security Impact Assessment
3. 🛠️ Step-by-step Fix Instructions
4. 🔒 Prevention Strategies
5. 📚 Additional Resources

Be specific and actionable."""

            messages = [
                {
                    "role": "system",
                    "content": "You are a cybersecurity expert providing detailed vulnerability analysis. Be thorough but concise."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = await self._make_chat_request(messages)
            
            return {
                "analysis": response.get("content", "Analysis unavailable"),
                "vulnerability_id": vulnerability.id,
                "tokens_used": response.get("tokens_used", 0)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing vulnerability {vulnerability.id}: {e}")
            return {
                "analysis": "Unable to generate analysis at this time.",
                "error": str(e)
            }
    
    async def get_security_recommendations(
        self, 
        user: User,
        repository_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get personalized security recommendations"""
        try:
            user_context = await self.get_user_context(user)
            
            # Get specific repository context if provided
            repo_context = ""
            if repository_id:
                repository = self.db.query(Repository).filter(
                    Repository.id == repository_id,
                    Repository.owner_id == user.id
                ).first()
                
                if repository:
                    latest_scan = self.db.query(Scan).filter(
                        Scan.repository_id == repository_id
                    ).order_by(Scan.started_at.desc()).first()
                    
                    repo_context = f"""
REPOSITORY FOCUS: {repository.name}
- Language: {repository.language}
- Private: {repository.is_private}
- Latest Scan: {latest_scan.status if latest_scan else 'None'}
- Vulnerabilities: {latest_scan.total_vulnerabilities if latest_scan else 0}
"""
            
            prompt = f"""Based on this user's security profile, provide personalized recommendations:

USER PROFILE:
- Total Projects: {user_context.get('total_repositories', 0)}
- Total Vulnerabilities: {user_context.get('total_vulnerabilities', 0)}
- Critical Issues: {user_context.get('critical_vulnerabilities', 0)}
- Security Score: {user_context.get('avg_security_score', 'N/A')}%

{repo_context}

Provide 5-7 specific, actionable recommendations prioritized by impact:
1. 🔥 Immediate Actions (Critical)
2. 📈 Security Improvements
3. 🛠️ Process Enhancements
4. 📚 Learning Opportunities

Focus on practical steps they can take today."""

            messages = [
                {
                    "role": "system",
                    "content": "You are a cybersecurity consultant providing personalized security recommendations. Be specific and actionable."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = await self._make_chat_request(messages)
            
            return {
                "recommendations": response.get("content", "Recommendations unavailable"),
                "user_context": user_context,
                "tokens_used": response.get("tokens_used", 0)
            }
            
        except Exception as e:
            logger.error(f"Error getting recommendations for user {user.id}: {e}")
            return {
                "recommendations": "Unable to generate recommendations at this time.",
                "error": str(e)
            }
    
    def get_quick_responses(self) -> List[Dict[str, str]]:
        """Get predefined quick responses for common questions"""
        return [
            {
                "label": "🔍 Scan Repository",
                "description": "How do I start a security scan?",
                "response": "To start a security scan:\n1. Go to Projects page\n2. Select your repository\n3. Click 'Start Scan'\n4. Wait for results\n\nScans typically take 2-10 minutes depending on repository size."
            },
            {
                "label": "🚨 Fix Critical Issues",
                "description": "How should I prioritize vulnerabilities?",
                "response": "Priority order:\n1. **Critical** - Fix immediately (SQL injection, RCE)\n2. **High** - Fix within 24-48 hours\n3. **Medium** - Fix within 1 week\n4. **Low** - Fix during regular maintenance\n\nFocus on vulnerabilities in production code first."
            },
            {
                "label": "📊 Security Score",
                "description": "How is my security score calculated?",
                "response": "Security Score factors:\n- **Vulnerability count & severity** (60%)\n- **Code coverage** (20%)\n- **Fix response time** (10%)\n- **Security practices** (10%)\n\nScores above 90% indicate excellent security posture."
            },
            {
                "label": "🔧 Integration Help",
                "description": "How do I connect GitHub?",
                "response": "To connect GitHub:\n1. Go to Integrations page\n2. Click 'Connect GitHub'\n3. Authorize SecureThread\n4. Import repositories\n\nThis enables automatic scanning on commits."
            }
        ]