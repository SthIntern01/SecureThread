from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("UPDATE alembic_version SET version_num = '1408d55e1378'"))
    conn.commit()
    print("Alembic version updated successfully")