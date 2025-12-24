#!/bin/bash

# 1. Load variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found."
  exit 1
fi

# 2. Configuration
# Ensure these variable names match what is inside your .env file
HOST=$DB_HOST
PORT=$DB_PORT
USER=$DB_USER
DATABASE=$DB_NAME
BACKUP_DIR="./backups"

# 3. Create backup folder if missing
mkdir -p "$BACKUP_DIR"

# 4. Create a filename with today's date
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DATABASE}_backup_$DATE.dump"

# 5. Set Password temporarily
export PGPASSWORD="$DB_PASSWORD"

echo "Backing up database '$DATABASE'..."

# 6. THE CORE COMMAND
pg_dump -h "$HOST" -p "$PORT" -U "$USER" -F c -b -v -f "$BACKUP_FILE" "$DATABASE"

if [ $? -eq 0 ]; then
  echo "✅ Backup successful: $BACKUP_FILE"
else
  echo "❌ Backup failed."
  exit 1
fi

# 7. Clean up password
unset PGPASSWORD