#!/bin/bash

# 1. Load variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found."
  exit 1
fi

# 2. Configuration
HOST=$DB_HOST
PORT=$DB_PORT
USER=$DB_USER
DATABASE=$DB_NAME

# 3. Get the backup file path from the command line argument
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore_db.sh <path_to_backup_file>"
  exit 1
fi

# 4. Set Password
export PGPASSWORD="$DB_PASSWORD"

echo "Restoring '$DATABASE' from '$BACKUP_FILE'..."

# 5. THE CORE COMMAND
pg_restore -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" --clean -v "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Restore successful!"
else
  echo "⚠️  Restore finished with warnings/errors."
fi

unset PGPASSWORD