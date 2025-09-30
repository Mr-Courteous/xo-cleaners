#!/bin/bash

# PostgreSQL connection details
DB_NAME="cleanpress"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_PORT="5433"

# Backup directory
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="${BACKUP_DIR}/cleanpress_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Creating backup of PostgreSQL database..."

# Create backup using docker
docker exec $(docker ps -qf "publish=${DB_PORT}") \
    pg_dump -U ${DB_USER} -d ${DB_NAME} > "${BACKUP_PATH}"

if [ $? -eq 0 ]; then
    echo "Backup created successfully at: $BACKUP_PATH"
    
    # Keep only the last 5 backups
    ls -t "$BACKUP_DIR"/cleanpress_*.sql | tail -n +6 | xargs -r rm
    echo "Cleaned up old backups, keeping the 5 most recent"
    
    # Compress the backup
    gzip "$BACKUP_PATH"
    echo "Backup compressed: ${BACKUP_PATH}.gz"
else
    echo "Error: Backup failed"
    exit 1
fi

# List remaining backups
echo -e "\nCurrent backups:"
ls -lh "${BACKUP_DIR}"/*.gz
