from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL"))
    conn.commit()
    print("Email constraint removed successfully")