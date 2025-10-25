import psycopg2
from app.core.settings import settings

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
db_url = settings.DATABASE_URL
print(f"Connecting to: {db_url}")

try:
    # Connect to database
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    # Add the column
    print("Adding github_token column...")
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS github_token VARCHAR(255);")
    conn.commit()
    
    print("✅ Successfully added github_token column!")
    
    # Verify it was added
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'github_token';
    """)
    result = cursor.fetchone()
    
    if result:
        print(f"✅ Verified: {result[0]} column exists!")
    else:
        print("❌ Column not found after adding")
    
except Exception as e:
    print(f"❌ Error: {e}")
    
finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()