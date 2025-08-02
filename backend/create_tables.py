from app.core.database import engine, Base
from app.models.user import User
from app.models.repository import Repository

# Create all tables
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")