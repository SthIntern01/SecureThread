from app.core.database import engine, Base
from app.models.user import User
from app.models.repository import Repository
from app.models.ai_chat import ChatSession, ChatMessage, AIAnalysisRequest, AIRecommendation, AIUsageMetrics, AIFeedback  # Add this import

# Create all tables
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")