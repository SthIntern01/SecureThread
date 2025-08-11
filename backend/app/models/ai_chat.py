from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ChatSession(Base):
    """Chat session model to track user conversations"""
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=True)  # Auto-generated or user-defined title
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    session_metadata = Column(JSON, nullable=True)  # Store session-specific data
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    """Individual chat messages within a session"""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="text")  # 'text', 'command', 'analysis', 'recommendation'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # AI-specific fields
    tokens_used = Column(Integer, nullable=True)
    model_used = Column(String(100), nullable=True)  # Track which AI model was used
    response_time_ms = Column(Integer, nullable=True)  # Track response time
    
    # Context and metadata
    context_data = Column(JSON, nullable=True)  # Store context used for this message
    message_metadata = Column(JSON, nullable=True)  # Additional metadata
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    user = relationship("User")


class AIAnalysisRequest(Base):
    """Track AI analysis requests for vulnerabilities"""
    __tablename__ = "ai_analysis_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vulnerability_id = Column(Integer, ForeignKey("vulnerabilities.id"), nullable=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=True)
    analysis_type = Column(String(50), nullable=False)  # 'vulnerability', 'repository', 'general'
    request_content = Column(Text, nullable=False)
    response_content = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # 'pending', 'completed', 'failed'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # AI metrics
    tokens_used = Column(Integer, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    model_used = Column(String(100), nullable=True)
    
    # Quality metrics
    user_rating = Column(Integer, nullable=True)  # 1-5 rating from user
    was_helpful = Column(Boolean, nullable=True)
    
    # Relationships
    user = relationship("User")
    vulnerability = relationship("Vulnerability")
    repository = relationship("Repository")


class AIRecommendation(Base):
    """Store AI-generated security recommendations"""
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=True)
    recommendation_type = Column(String(50), nullable=False)  # 'security', 'compliance', 'best_practice'
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="medium")  # 'critical', 'high', 'medium', 'low'
    category = Column(String(100), nullable=True)  # 'vulnerability_fix', 'process_improvement', etc.
    
    # Implementation details
    implementation_steps = Column(JSON, nullable=True)  # Step-by-step instructions
    estimated_effort = Column(String(20), nullable=True)  # 'easy', 'medium', 'hard'
    resources = Column(JSON, nullable=True)  # Links, documentation, tools
    
    # Status tracking
    status = Column(String(20), default="active")  # 'active', 'implemented', 'dismissed', 'archived'
    implemented_at = Column(DateTime(timezone=True), nullable=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    ai_confidence = Column(Float, nullable=True)  # AI confidence score 0-1
    recommendation_metadata = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User")
    repository = relationship("Repository")


class AIUsageMetrics(Base):
    """Track AI usage for analytics and billing"""
    __tablename__ = "ai_usage_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Usage counters
    chat_messages_sent = Column(Integer, default=0)
    vulnerability_analyses = Column(Integer, default=0)
    recommendations_generated = Column(Integer, default=0)
    commands_executed = Column(Integer, default=0)
    
    # Token usage
    total_tokens_used = Column(Integer, default=0)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    
    # Performance metrics
    avg_response_time_ms = Column(Float, nullable=True)
    total_requests = Column(Integer, default=0)
    failed_requests = Column(Integer, default=0)
    
    # Cost tracking (if applicable)
    estimated_cost = Column(Float, nullable=True)
    
    # Relationships
    user = relationship("User")


class AIFeedback(Base):
    """Store user feedback on AI responses"""
    __tablename__ = "ai_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)
    analysis_request_id = Column(Integer, ForeignKey("ai_analysis_requests.id"), nullable=True)
    
    # Feedback data
    rating = Column(Integer, nullable=False)  # 1-5 stars
    feedback_type = Column(String(50), nullable=False)  # 'helpful', 'not_helpful', 'incorrect', 'incomplete'
    feedback_text = Column(Text, nullable=True)
    was_accurate = Column(Boolean, nullable=True)
    was_helpful = Column(Boolean, nullable=True)
    
    # Context
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    feedback_metadata = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User")
    message = relationship("ChatMessage")
    analysis_request = relationship("AIAnalysisRequest")