from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.settings import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # ✅ detects dead/stale connections and reconnects
    pool_recycle=1800,    # ✅ recycle connections to avoid idle timeouts (30 min)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()