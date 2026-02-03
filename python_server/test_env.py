"""
Quick test to verify .env file is being loaded correctly
Run this to check if BLOB_READ_WRITE_TOKEN is accessible
"""

import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Check if token exists
token = os.getenv("BLOB_READ_WRITE_TOKEN")

print("=" * 60)
print("Environment Variable Test")
print("=" * 60)

if token:
    print(f"✅ SUCCESS! BLOB_READ_WRITE_TOKEN is loaded")
    print(f"   Token preview: {token[:30]}...")
    print(f"   Token length: {len(token)} characters")
else:
    print("❌ ERROR! BLOB_READ_WRITE_TOKEN not found")
    print("   Make sure .env file exists in the same directory")
    print("   and contains: BLOB_READ_WRITE_TOKEN=\"your_token_here\"")

print("=" * 60)

# Also check DATABASE_URL
db_url = os.getenv("DATABASE_URL")
if db_url:
    print(f"✅ DATABASE_URL is also loaded")
else:
    print("⚠️  DATABASE_URL not found (this might be okay)")

print("=" * 60)
