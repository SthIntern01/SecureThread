import psycopg2

# Update these with your actual database credentials
conn = psycopg2.connect(
    dbname="securethread",
    user="postgres",
    password="your_password",  # UPDATE THIS
    host="localhost",
    port="5432"
)

cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS github_token VARCHAR(255);")
    conn.commit()
    print("✅ Successfully added github_token column!")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    cursor.close()
    conn.close()