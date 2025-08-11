# backend/app/api/v1/ai_chat.py - Updated with file upload support

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Vulnerability
from app.models.ai_chat import ChatSession, ChatMessage as ChatMessageModel, AIAnalysisRequest, AIRecommendation, AIFeedback, AIUsageMetrics
from app.services.ai_chat_service import AIChatService
from app.services.file_upload_service import FileUploadService
from app.schemas.ai_chat import (
    ChatSessionCreate, ChatSessionResponse, ChatMessageCreate, ChatMessageResponse,
    AIAnalysisRequestCreate, AIAnalysisResponse, AIRecommendationCreate, 
    AIRecommendationResponse, AIFeedbackCreate, AIUsageMetricsResponse
)
from pydantic import BaseModel
import logging
import json

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
    session_id: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    session_id: Optional[int] = None
    message_id: Optional[int] = None
    tokens_used: Optional[int] = None
    user_context: Optional[Dict[str, Any]] = None
    suggestions: Optional[List[str]] = None
    file_analyses: Optional[List[Dict[str, Any]]] = None
    total_vulnerabilities: Optional[int] = None


class FileUploadResponse(BaseModel):
    files_processed: int
    files_analyzed: int
    total_vulnerabilities: int
    ai_response: str
    file_details: List[Dict[str, Any]]


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
    """Chat with SecureThread AI assistant - text only"""
    try:
        # Get or create chat session
        session = None
        if chat_request.session_id:
            session = db.query(ChatSession).filter(
                ChatSession.id == chat_request.session_id,
                ChatSession.user_id == current_user.id
            ).first()
        
        if not session:
            # Create new session
            session = ChatSession(
                user_id=current_user.id,
                title=f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                session_metadata={"created_from": "web_interface"}
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # Save user message
        user_message = ChatMessageModel(
            session_id=session.id,
            user_id=current_user.id,
            role="user",
            content=chat_request.message,
            message_type="text"
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)
        
        ai_service = AIChatService(db)
        
        # Convert conversation history to the format expected by AI service
        history = []
        if chat_request.conversation_history:
            for msg in chat_request.conversation_history:
                history.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Record start time for metrics
        import time
        start_time = time.time()
        
        # Regular chat completion
        result = await ai_service.chat_completion(
            user=current_user,
            message=chat_request.message,
            conversation_history=history
        )
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Save AI response message
        ai_message = ChatMessageModel(
            session_id=session.id,
            user_id=current_user.id,
            role="assistant",
            content=result["response"],
            message_type="text",
            tokens_used=result.get("tokens_used"),
            model_used=result.get("model", "deepseek-chat"),
            response_time_ms=response_time_ms,
            context_data=result.get("user_context")
        )
        db.add(ai_message)
        db.commit()
        db.refresh(ai_message)
        
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
        elif any(word in message_lower for word in ["upload", "file", "analyze code"]):
            suggestions = [
                "How do I upload files for analysis?",
                "What file types can you analyze?",
                "Show me an example of code analysis"
            ]
        
        return ChatResponse(
            response=result["response"],
            session_id=session.id,
            message_id=ai_message.id,
            tokens_used=result.get("tokens_used"),
            user_context=result.get("user_context"),
            suggestions=suggestions
        )
        
    except Exception as e:
        logger.error(f"Error in AI chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service temporarily unavailable: {str(e)}"
        )


@router.post("/chat-with-files", response_model=ChatResponse)
async def chat_with_files(
    message: str = Form(...),
    files: List[UploadFile] = File(...),
    conversation_history: Optional[str] = Form(None),
    session_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Chat with AI including file uploads for analysis"""
    try:
        # Parse conversation history if provided
        history = []
        if conversation_history:
            try:
                history_data = json.loads(conversation_history)
                history = [
                    {"role": msg["role"], "content": msg["content"]} 
                    for msg in history_data
                ]
            except Exception as e:
                logger.warning(f"Failed to parse conversation history: {e}")
        
        # Get or create chat session
        session = None
        if session_id:
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == current_user.id
            ).first()
        
        if not session:
            session = ChatSession(
                user_id=current_user.id,
                title=f"File Analysis {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                session_metadata={"created_from": "web_interface", "has_files": True}
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # Process uploaded files
        file_service = FileUploadService()
        processed_files = await file_service.process_uploaded_files(files)
        
        # Save user message with file attachments
        user_message = ChatMessageModel(
            session_id=session.id,
            user_id=current_user.id,
            role="user",
            content=message,
            message_type="file_upload",
            context_data={
                "files": [
                    {
                        "name": pf.get("original_name"),
                        "size": pf.get("size"),
                        "type": pf.get("extension"),
                        "analyzed": pf.get("is_text", False)
                    }
                    for pf in processed_files
                ]
            }
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)
        
        # Analyze files with AI
        ai_service = AIChatService(db)
        
        # Record start time for metrics
        import time
        start_time = time.time()
        
        # Use the file analysis method
        result = await ai_service.analyze_uploaded_files(
            user=current_user,
            message=message,
            attachments=processed_files,
            conversation_history=history
        )
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Save AI response with file analysis data
        ai_message = ChatMessageModel(
            session_id=session.id,
            user_id=current_user.id,
            role="assistant",
            content=result["response"],
            message_type="file_analysis",
            tokens_used=result.get("tokens_used"),
            model_used="deepseek-chat",
            response_time_ms=response_time_ms,
            context_data={
                "file_analyses": result.get("file_analyses", []),
                "total_vulnerabilities": result.get("total_vulnerabilities", 0),
                "user_context": result.get("user_context", {})
            }
        )
        db.add(ai_message)
        db.commit()
        db.refresh(ai_message)
        
        # Generate suggestions for file analysis
        total_vulns = result.get("total_vulnerabilities", 0)
        suggestions = []
        
        if total_vulns > 0:
            suggestions = [
                f"How do I fix the {total_vulns} vulnerabilities found?",
                "Which issues should I prioritize first?",
                "Show me detailed fix instructions for critical issues",
                "How can I prevent these vulnerabilities in the future?"
            ]
        else:
            suggestions = [
                "What security best practices should I follow?",
                "How can I improve my code security further?",
                "Can you review my coding patterns for potential issues?",
                "What automated security tools do you recommend?"
            ]
        
        return ChatResponse(
            response=result["response"],
            session_id=session.id,
            message_id=ai_message.id,
            tokens_used=result.get("tokens_used"),
            user_context=result.get("user_context"),
            suggestions=suggestions,
            file_analyses=result.get("file_analyses"),
            total_vulnerabilities=result.get("total_vulnerabilities")
        )
        
    except Exception as e:
        logger.error(f"Error in file chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File analysis failed: {str(e)}"
        )


@router.post("/upload-files", response_model=FileUploadResponse)
async def upload_files_for_analysis(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload files for immediate vulnerability analysis"""
    try:
        # Process uploaded files
        file_service = FileUploadService()
        processed_files = await file_service.process_uploaded_files(files)
        
        # Analyze files with AI
        ai_service = AIChatService(db)
        
        result = await ai_service.analyze_uploaded_files(
            user=current_user,
            message="Please analyze these uploaded files for security vulnerabilities.",
            attachments=processed_files
        )
        
        files_analyzed = len([f for f in processed_files if f.get("is_text")])
        
        return FileUploadResponse(
            files_processed=len(processed_files),
            files_analyzed=files_analyzed,
            total_vulnerabilities=result.get("total_vulnerabilities", 0),
            ai_response=result["response"],
            file_details=result.get("file_analyses", [])
        )
        
    except Exception as e:
        logger.error(f"Error in file upload analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload analysis failed: {str(e)}"
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
            Repository,
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
        elif command == "upload":
            return {
                "response": "📁 **File Upload for Analysis:**\n\n🔍 **How to upload files:**\n1. Click the **paperclip icon** (📎) in the chat\n2. Select your code files (.py, .js, .php, .java, etc.)\n3. Add a message describing what you want analyzed\n4. Click **Send**\n\n✅ **Supported file types:**\n- Python (.py)\n- JavaScript (.js, .jsx, .ts, .tsx)\n- PHP (.php)\n- Java (.java)\n- C/C++ (.c, .cpp)\n- And many more!\n\n💡 **What I'll analyze:**\n- Security vulnerabilities\n- Code quality issues\n- Best practice violations\n- Detailed fix recommendations",
                "action": "show_file_upload"
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
                "response": f"❓ Unknown command: `/{command}`\n\n**Available Commands:**\n- `/scan` - How to start security scans\n- `/analyze` - Analyze your security status\n- `/upload` - How to upload files for analysis\n- `/report` - Generate security reports\n- `/fix` - Get vulnerability fix guidance\n\n💬 Or just ask me any security question!",
                "action": "show_help"
            }
            
    except Exception as e:
        logger.error(f"Error executing command {command}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute command"
        )


# Include all other existing endpoints from the original file...
# (get_chat_sessions, get_session_messages, submit_ai_feedback, get_ai_usage_metrics)

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's chat sessions"""
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id,
        ChatSession.is_active == True
    ).order_by(ChatSession.updated_at.desc()).limit(20).all()
    
    session_responses = []
    for session in sessions:
        message_count = db.query(ChatMessageModel).filter(
            ChatMessageModel.session_id == session.id
        ).count()
        
        session_responses.append(ChatSessionResponse(
            id=session.id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            is_active=session.is_active,
            message_count=message_count
        ))
    
    return session_responses


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_session_messages(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get messages for a specific chat session"""
    # Verify session ownership
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    messages = db.query(ChatMessageModel).filter(
        ChatMessageModel.session_id == session_id
    ).order_by(ChatMessageModel.created_at.asc()).all()
    
    return [
        ChatMessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            message_type=msg.message_type,
            created_at=msg.created_at,
            tokens_used=msg.tokens_used,
            model_used=msg.model_used,
            response_time_ms=msg.response_time_ms
        )
        for msg in messages
    ]


@router.post("/feedback")
async def submit_ai_feedback(
    feedback: AIFeedbackCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit feedback on AI responses"""
    try:
        ai_feedback = AIFeedback(
            user_id=current_user.id,
            message_id=feedback.message_id,
            analysis_request_id=feedback.analysis_request_id,
            rating=feedback.rating,
            feedback_type=feedback.feedback_type,
            feedback_text=feedback.feedback_text,
            was_accurate=feedback.was_accurate,
            was_helpful=feedback.was_helpful
        )
        
        db.add(ai_feedback)
        db.commit()
        
        return {"message": "Feedback submitted successfully"}
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback"
        )


@router.get("/usage-metrics", response_model=AIUsageMetricsResponse)
async def get_ai_usage_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's AI usage metrics"""
    try:
        # Get today's metrics
        from datetime import date
        today = date.today()
        
        metrics = db.query(AIUsageMetrics).filter(
            AIUsageMetrics.user_id == current_user.id,
            AIUsageMetrics.date >= today
        ).first()
        
        if not metrics:
            # Create empty metrics for today
            metrics = AIUsageMetrics(user_id=current_user.id)
            db.add(metrics)
            db.commit()
            db.refresh(metrics)
        
        return AIUsageMetricsResponse(
            date=metrics.date,
            chat_messages_sent=metrics.chat_messages_sent,
            vulnerability_analyses=metrics.vulnerability_analyses,
            recommendations_generated=metrics.recommendations_generated,
            commands_executed=metrics.commands_executed,
            total_tokens_used=metrics.total_tokens_used,
            avg_response_time_ms=metrics.avg_response_time_ms,
            total_requests=metrics.total_requests,
            failed_requests=metrics.failed_requests,
            estimated_cost=metrics.estimated_cost
        )
        
    except Exception as e:
        logger.error(f"Error getting usage metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get usage metrics"
        )


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a chat session and its messages"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Delete all messages in the session first
    db.query(ChatMessageModel).filter(
        ChatMessageModel.session_id == session_id
    ).delete()
    
    # Delete the session
    db.delete(session)
    db.commit()
    
    return {"message": "Chat session deleted successfully"}


@router.post("/sessions/{session_id}/archive")
async def archive_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Archive a chat session"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    session.is_active = False
    db.commit()
    
    return {"message": "Chat session archived successfully"}


@router.get("/file-types")
async def get_supported_file_types(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of supported file types for upload"""
    from app.services.llm_service import LLMService
    
    llm_service = LLMService()
    supported_languages = llm_service.get_supported_languages()
    
    return {
        "supported_file_types": supported_languages,
        "max_file_size_mb": settings.MAX_FILE_SIZE // (1024 * 1024),
        "max_files_per_upload": 5
    }