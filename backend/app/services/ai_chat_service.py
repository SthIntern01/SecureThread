# backend/app/services/ai_chat_service.py - Updated with file upload support

import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from app.core.settings import settings
from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.services.file_upload_service import FileUploadService
from app.services.llm_service import LLMService
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class AIChatService:
    def __init__(self, db: Session):
        self.db = db
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = "https://api.deepseek.com/v1"
        self.model = "deepseek-chat"
        self.file_service = FileUploadService()
        self.llm_service = LLMService()
        
        # Context limits for chat
        self.MAX_INPUT_TOKENS = 30000
        self.MAX_OUTPUT_TOKENS = 2000
        
    def _estimate_tokens(self, text: str) -> int:
        """Rough token estimation (1 token ≈ 4 characters)"""
        return len(text) // 4
    
    def _get_system_prompt(self, user: User, user_context: Dict[str, Any]) -> str:
        """Create system prompt with SecureThread context"""
        
        repos = user_context.get('repositories', [])
        repos_str = "\n".join([f"  - {r['name']} ({r['language'] or 'Unknown language'}) - {'Private' if r['is_private'] else 'Public'}" for r in repos]) if repos else "  - No repositories yet"
        
        return f"""You are SecureThread AI, the official and exclusive expert cybersecurity assistant built directly into the SecureThread platform. 

You already have full, authorized access to the user's project data and security context, which is provided to you below. NEVER say you don't have access to their account or project data.

📊 USER CONTEXT & DATA (YOU HAVE FULL ACCESS TO THIS):
- User: {user.full_name or user.github_username}
- Active Projects: {user_context.get('total_repositories', 0)}
- Total Vulnerabilities: {user_context.get('total_vulnerabilities', 0)} (Critical: {user_context.get('critical_vulnerabilities', 0)}, High: {user_context.get('high_vulnerabilities', 0)})
- Security Score: {user_context.get('avg_security_score', 'N/A')}%
- Top Repositories:
{repos_str}

🛡️ YOUR EXPERTISE & MANDATE:
- Vulnerability analysis, code security reviews, and remediation.
- Explaining the security context of the user's repositories.
- Threat assessment and compliance guidance (SOC 2, ISO 27001, GDPR).

🎯 YOUR ROLE:
- Act as the user's personalized security partner. Speak with authority about THEIR specific data provided above.
- If the user asks about their projects, reference the "USER CONTEXT & DATA" seamlessly.
- Provide actionable security advice and suggest specific fixes for code issues.

🚫 STRICT LIMITATIONS (MUST OBEY):
1. OFF-TOPIC REFUSAL: You MUST refuse to answer ANY question that is not related to cybersecurity, programming, or the user's workspace repositories. If asked an unrelated question (e.g., recipes, general history, creative writing), reply firmly: "I am SecureThread AI, a specialized cybersecurity assistant. I can only assist you with code security, vulnerability remediation, and your SecureThread workspace."
2. NO HALLUCINATIONS: Do not invent repositories or vulnerabilities not listed in your context.
3. NEVER CLAIM LACK OF ACCESS: Since the backend provides you with the user's context directly, never claim you cannot see their data.
4. CANNOT MODIFY CODE DIRECTLY: You can only suggest fixes.
5. CANNOT INITIATE SCANS: Guide users to use the platform's UI to run scans.

Always prioritize the user's security posture and maintain your professional cybersecurity persona."""

    async def get_user_context(self, user: User) -> Dict[str, Any]:
        """Get user's security context for AI chat"""
        try:
            # Get user's repositories based on workspace
            active_team_id = getattr(user, 'active_team_id', None)
            
            if active_team_id:
                from app.models.team_repository import TeamRepository
                team_repos = self.db.query(TeamRepository.repository_id).filter(
                    TeamRepository.team_id == active_team_id
                ).all()
                repo_ids = [r[0] for r in team_repos]
                
                repositories = self.db.query(Repository).filter(
                    Repository.id.in_(repo_ids),
                    Repository.is_active == True
                ).all()
            else:
                repositories = self.db.query(Repository).filter(
                    Repository.owner_id == user.id,
                    Repository.is_active == True
                ).all()
            
            repo_ids = [r.id for r in repositories]
            
            # Get recent scans
            if repo_ids:
                recent_scans = self.db.query(Scan).filter(
                    Scan.repository_id.in_(repo_ids)
                ).order_by(Scan.started_at.desc()).limit(10).all()
            else:
                recent_scans = []
            
            # Get vulnerability stats
            total_vulnerabilities = 0
            critical_count = 0
            high_count = 0
            security_scores = []
            
            for scan in recent_scans:
                if scan.status == "completed":
                    total_vulnerabilities += scan.total_vulnerabilities or 0
                    critical_count += scan.critical_count or 0
                    high_count += scan.high_count or 0
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
    
    async def analyze_uploaded_files(
        self, 
        user: User,
        message: str,
        attachments: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Analyze uploaded files for vulnerabilities and provide AI insights"""
        try:
            # Extract file information from attachments
            file_analyses = []
            total_vulnerabilities = 0
            
            for attachment in attachments:
                if attachment.get("is_text") and attachment.get("text_content"):
                    # Analyze file with LLM service
                    file_path = attachment.get("original_name", "uploaded_file")
                    file_extension = attachment.get("extension", "")
                    content = attachment.get("text_content", "")
                    
                    # Use LLM service to analyze the code
                    vulnerabilities = await self.llm_service.analyze_code_for_vulnerabilities(
                        content, file_path, file_extension
                    )
                    
                    file_analysis = {
                        "file_name": file_path,
                        "file_size": attachment.get("size", 0),
                        "line_count": attachment.get("line_count", 0),
                        "code_lines": attachment.get("code_lines", 0),
                        "vulnerabilities": vulnerabilities,
                        "vulnerability_count": len(vulnerabilities),
                        "file_extension": file_extension
                    }
                    
                    file_analyses.append(file_analysis)
                    total_vulnerabilities += len(vulnerabilities)
                else:
                    # Handle non-text files
                    file_analyses.append({
                        "file_name": attachment.get("original_name", "unknown"),
                        "error": "File could not be analyzed - not a text file or too large",
                        "vulnerability_count": 0
                    })
            
            # Generate AI response based on analysis
            user_context = await self.get_user_context(user)
            ai_response = await self._generate_file_analysis_response(
                user, message, file_analyses, total_vulnerabilities, user_context, conversation_history
            )
            
            # Clean up temporary files
            file_ids = [att.get("file_id") for att in attachments if att.get("file_id")]
            if file_ids:
                self.file_service.cleanup_temporary_files(file_ids)
            
            return {
                "response": ai_response,
                "file_analyses": file_analyses,
                "total_vulnerabilities": total_vulnerabilities,
                "user_context": user_context,
                "tokens_used": self._estimate_tokens(ai_response)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing uploaded files: {e}")
            return {
                "response": "I encountered an error while analyzing your uploaded files. Please try again with smaller files or ensure they are valid code files.",
                "error": str(e)
            }
    
    async def _generate_file_analysis_response(
        self,
        user: User,
        user_message: str,
        file_analyses: List[Dict[str, Any]],
        total_vulnerabilities: int,
        user_context: Dict[str, Any],
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """Generate AI response for file analysis"""
        
        # Prepare analysis summary
        analysis_summary = self._create_analysis_summary(file_analyses, total_vulnerabilities)
        
        # Build prompt for AI
        prompt = f"""The user uploaded {len(file_analyses)} file(s) for security analysis and asked: "{user_message}"

FILE ANALYSIS RESULTS:
{analysis_summary}

VULNERABILITY SUMMARY:
- Total Files Analyzed: {len(file_analyses)}
- Total Vulnerabilities Found: {total_vulnerabilities}
- Critical Issues: {sum(1 for fa in file_analyses for v in fa.get('vulnerabilities', []) if v.get('severity') == 'critical')}
- High Priority Issues: {sum(1 for fa in file_analyses for v in fa.get('vulnerabilities', []) if v.get('severity') == 'high')}

Please provide:
1. 📋 Summary of security findings
2. 🚨 Critical issues that need immediate attention
3. 🛠️ Specific fix recommendations
4. 📚 Best practices to prevent similar issues
5. 🎯 Next steps for the user

Be specific about the vulnerabilities found and provide actionable guidance."""

        # Build conversation for AI
        messages = [
            {
                "role": "system", 
                "content": self._get_system_prompt(user, user_context)
            }
        ]
        
        # Add conversation history if available
        if conversation_history:
            messages.extend(conversation_history[-5:])  # Last 5 messages for context
        
        # Add current analysis prompt
        messages.append({"role": "user", "content": prompt})
        
        # Get AI response
        try:
            response = await self._make_chat_request(messages)
            return response.get("content", "I couldn't generate a response for your file analysis.")
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return f"""📁 **File Analysis Complete**

I analyzed {len(file_analyses)} file(s) and found {total_vulnerabilities} potential security issues.

{self._create_fallback_analysis(file_analyses)}

💡 **Recommendations:**
1. Review the identified vulnerabilities carefully
2. Prioritize fixing critical and high-severity issues
3. Consider implementing automated security scanning
4. Follow secure coding practices for future development

For detailed vulnerability information, please check the scan results or ask me specific questions about the findings."""
    
    def _create_analysis_summary(self, file_analyses: List[Dict[str, Any]], total_vulnerabilities: int) -> str:
        """Create a summary of file analysis results"""
        summary_parts = []
        
        for analysis in file_analyses:
            file_name = analysis.get("file_name", "unknown")
            vuln_count = analysis.get("vulnerability_count", 0)
            
            if analysis.get("error"):
                summary_parts.append(f"❌ {file_name}: {analysis['error']}")
            elif vuln_count > 0:
                vulnerabilities = analysis.get("vulnerabilities", [])
                severity_counts = {}
                for vuln in vulnerabilities:
                    severity = vuln.get("severity", "unknown")
                    severity_counts[severity] = severity_counts.get(severity, 0) + 1
                
                severity_str = ", ".join([f"{count} {sev}" for sev, count in severity_counts.items()])
                summary_parts.append(f"🚨 {file_name}: {vuln_count} issues ({severity_str})")
            else:
                summary_parts.append(f"✅ {file_name}: No issues found")
        
        return "\n".join(summary_parts)
    
    def _create_fallback_analysis(self, file_analyses: List[Dict[str, Any]]) -> str:
        """Create fallback analysis when AI service fails"""
        summary_parts = []
        
        for analysis in file_analyses:
            file_name = analysis.get("file_name", "unknown")
            vuln_count = analysis.get("vulnerability_count", 0)
            
            if vuln_count > 0:
                summary_parts.append(f"🔍 **{file_name}**: Found {vuln_count} potential security issues")
                
                # Show top vulnerabilities
                vulnerabilities = analysis.get("vulnerabilities", [])[:3]  # Top 3
                for vuln in vulnerabilities:
                    title = vuln.get("title", "Security Issue")
                    severity = vuln.get("severity", "medium").upper()
                    summary_parts.append(f"   • {severity}: {title}")
            else:
                summary_parts.append(f"✅ **{file_name}**: No security issues detected")
        
        return "\n".join(summary_parts)
    
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
                "label": "📁 Upload Files",
                "description": "How do I analyze uploaded code files?",
                "response": "To analyze code files:\n1. Click the paperclip icon in the chat\n2. Select your code files (.py, .js, .php, etc.)\n3. Add a message describing what you want to analyze\n4. Click Send\n\nI'll analyze the files for vulnerabilities and provide detailed security recommendations."
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