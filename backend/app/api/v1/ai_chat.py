from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.vulnerability import Vulnerability
from app.services.ai_chat_service import AIChatService
from pydantic import BaseModel
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = None
    repository_id: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    tokens_used: Optional[int] = None
    user_context: Optional[Dict[str, Any]] = None
    suggestions: Optional[List[str]] = None


class VulnerabilityAnalysisRequest(BaseModel):
    vulnerability_id: int
    include_file_content: bool = False


class RecommendationsRequest(BaseModel):
    repository_id: Optional[int] = None
    focus_area: Optional[str] = None  # "vulnerabilities", "compliance", "general"


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Chat with SecureThread AI assistant"""
    try:
        ai_service = AIChatService(db)
        
        # Convert conversation history to the format expected by AI service
        history = []
        if chat_request.conversation_history:
            for msg in chat_request.conversation_history:
                history.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Get AI response
        result = await ai_service.chat_completion(
            user=current_user,
            message=chat_request.message,
            conversation_history=history
        )
        
        # Generate follow-up suggestions based on the conversation
        suggestions = []
        message_lower = chat_request.message.lower()
        
        if any(word in message_lower for word in ["scan", "vulnerability", "security"]):
            suggestions = [
                "Show me my latest scan results",
                "How do I fix critical vulnerabilities?",
                "What's my current security score?"
            ]
        elif any(word in message_lower for word in ["fix", "resolve", "patch"]):
            suggestions = [
                "Show me step-by-step fix instructions",
                "Which vulnerabilities should I prioritize?",
                "How do I prevent this in the future?"
            ]
        elif any(word in message_lower for word in ["github", "integration", "connect"]):
            suggestions = [
                "Help me set up GitHub integration",
                "How do I import repositories?",
                "What integrations are available?"
            ]
        
        return ChatResponse(
            response=result["response"],
            tokens_used=result.get("tokens_used"),
            user_context=result.get("user_context"),
            suggestions=suggestions
        )
        
    except Exception as e:
        logger.error(f"Error in AI chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI service temporarily unavailable"
        )


@router.post("/analyze-vulnerability")
async def analyze_vulnerability_with_ai(
    analysis_request: VulnerabilityAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI analysis of a specific vulnerability"""
    try:
        # Get vulnerability and verify ownership
        vulnerability = db.query(Vulnerability).join(
            Vulnerability.scan
        ).join(
            Vulnerability.scan.has(repository_id=Repository.id)
        ).filter(
            Vulnerability.id == analysis_request.vulnerability_id,
            Repository.owner_id == current_user.id
        ).first()
        
        if not vulnerability:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vulnerability not found"
            )
        
        ai_service = AIChatService(db)
        
        # Get file content if requested
        file_content = None
        if analysis_request.include_file_content:
            # This would require implementing file content retrieval
            # For now, we'll skip this to keep the implementation simple
            pass
        
        result = await ai_service.analyze_vulnerability_with_ai(
            vulnerability, file_content
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing vulnerability: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze vulnerability"
        )


@router.post("/recommendations")
async def get_security_recommendations(
    recommendations_request: RecommendationsRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get personalized security recommendations"""
    try:
        # Verify repository ownership if repository_id is provided
        if recommendations_request.repository_id:
            repository = db.query(Repository).filter(
                Repository.id == recommendations_request.repository_id,
                Repository.owner_id == current_user.id
            ).first()
            
            if not repository:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Repository not found"
                )
        
        ai_service = AIChatService(db)
        result = await ai_service.get_security_recommendations(
            user=current_user,
            repository_id=recommendations_request.repository_id
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recommendations"
        )


@router.get("/quick-responses")
async def get_quick_responses(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get predefined quick responses for common questions"""
    ai_service = AIChatService(db)
    quick_responses = ai_service.get_quick_responses()
    
    return {"quick_responses": quick_responses}


@router.get("/context")
async def get_user_security_context(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's current security context for AI chat"""
    try:
        ai_service = AIChatService(db)
        context = await ai_service.get_user_context(current_user)
        
        return {"context": context}
        
    except Exception as e:
        logger.error(f"Error getting user context: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user context"
        )


@router.post("/command/{command}")
async def execute_ai_command(
    command: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Execute AI commands like /scan, /analyze, /report, /fix"""
    try:
        ai_service = AIChatService(db)
        
        if command == "scan":
            return {
                "response": "To start a security scan:\n\n1. 📁 Go to the **Projects** page\n2. 🎯 Select the repository you want to scan\n3. ▶️ Click the **'Start Scan'** button\n4. ⏱️ Wait for the scan to complete (usually 2-10 minutes)\n\nYou'll receive a detailed report with vulnerabilities, security score, and fix recommendations.",
                "action": "navigate_to_projects"
            }
        elif command == "analyze":
            user_context = await ai_service.get_user_context(current_user)
            if user_context.get("total_vulnerabilities", 0) > 0:
                return {
                    "response": f"📊 **Your Security Analysis:**\n\n🚨 **{user_context.get('critical_vulnerabilities', 0)} Critical** vulnerabilities need immediate attention\n⚠️ **{user_context.get('high_vulnerabilities', 0)} High** severity issues to address\n📈 **Security Score:** {user_context.get('avg_security_score', 'N/A')}%\n\n💡 **Next Steps:**\n1. Review critical vulnerabilities first\n2. Check the **Solved** page for examples\n3. Use the vulnerability details for fix guidance",
                    "action": "show_vulnerabilities"
                }
            else:
                return {
                    "response": "🎉 **Great news!** No vulnerabilities found in your recent scans.\n\n📋 **Recommendations:**\n1. Run regular scans on new code\n2. Keep dependencies updated\n3. Follow security best practices\n4. Consider setting up automated scanning",
                    "action": "maintain_security"
                }
        elif command == "report":
            return {
                "response": "📄 **Generate Security Reports:**\n\n1. 📊 **Dashboard** - Overview of all projects\n2. 🔍 **Project Details** - Click any project for detailed report\n3. 📋 **Solved Issues** - View resolved vulnerabilities\n4. 📤 **Export** - Download PDF reports from scan details\n\n💡 **Tip:** Use the export button in scan details for comprehensive PDF reports.",
                "action": "navigate_to_dashboard"
            }
        elif command == "fix":
            return {
                "response": "🛠️ **Fix Vulnerabilities:**\n\n**Priority Order:**\n1. 🔴 **Critical** - Fix immediately\n2. 🟠 **High** - Fix within 24-48 hours\n3. 🟡 **Medium** - Fix within 1 week\n4. 🔵 **Low** - Fix during maintenance\n\n**Getting Fix Instructions:**\n1. Click on any vulnerability in scan results\n2. Review the detailed recommendation\n3. Follow the step-by-step fix guide\n4. Re-scan to verify the fix\n\n💬 Ask me about specific vulnerabilities for detailed guidance!",
                "action": "show_fix_guidance"
            }
        else:
            return {
                "response": f"❓ Unknown command: `/{command}`\n\n**Available Commands:**\n- `/scan` - How to start security scans\n- `/analyze` - Analyze your security status\n- `/report` - Generate security reports\n- `/fix` - Get vulnerability fix guidance\n\n💬 Or just ask me any security question!",
                "action": "show_help"
            }
            
    except Exception as e:
        logger.error(f"Error executing command {command}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute command"
        )