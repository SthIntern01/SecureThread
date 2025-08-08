from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None
    session_metadata: Optional[Dict[str, Any]] = None


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: int
    title: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    is_active: bool
    message_count: int


class ChatMessageCreate(BaseModel):
    session_id: Optional[int] = None
    content: str
    message_type: str = "text"
    context_data: Optional[Dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: int
    role: str
    content: str
    message_type: str
    created_at: datetime
    tokens_used: Optional[int]
    model_used: Optional[str]
    response_time_ms: Optional[int]


class AIAnalysisRequestCreate(BaseModel):
    vulnerability_id: Optional[int] = None
    repository_id: Optional[int] = None
    analysis_type: str
    request_content: str


class AIAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: int
    analysis_type: str
    request_content: str
    response_content: Optional[str]
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    tokens_used: Optional[int]
    processing_time_ms: Optional[int]
    model_used: Optional[str]


class AIRecommendationCreate(BaseModel):
    repository_id: Optional[int] = None
    recommendation_type: str
    title: str
    description: str
    priority: str = "medium"
    category: Optional[str] = None
    implementation_steps: Optional[List[str]] = None
    estimated_effort: Optional[str] = None
    resources: Optional[List[str]] = None


class AIRecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: int
    recommendation_type: str
    title: str
    description: str
    priority: str
    category: Optional[str]
    implementation_steps: Optional[List[str]]
    estimated_effort: Optional[str]
    resources: Optional[List[str]]
    status: str
    created_at: datetime
    ai_confidence: Optional[float]


class AIFeedbackCreate(BaseModel):
    message_id: Optional[int] = None
    analysis_request_id: Optional[int] = None
    rating: int  # 1-5
    feedback_type: str
    feedback_text: Optional[str] = None
    was_accurate: Optional[bool] = None
    was_helpful: Optional[bool] = None


class AIUsageMetricsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    date: datetime
    chat_messages_sent: int
    vulnerability_analyses: int
    recommendations_generated: int
    commands_executed: int
    total_tokens_used: int
    avg_response_time_ms: Optional[float]
    total_requests: int
    failed_requests: int
    estimated_cost: Optional[float]