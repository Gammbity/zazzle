#!/bin/bash

# Backup script for Zazzle platform

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
MEDIA_BACKUP_FILE="$BACKUP_DIR/media_backup_$TIMESTAMP.tar.gz"

echo "🔄 Starting backup process..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Database backup
echo "📦 Backing up database..."
docker-compose exec -T db pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > $DB_BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Database backup completed: $DB_BACKUP_FILE"
else
    echo "❌ Database backup failed"
    exit 1
fi

# Media files backup
echo "📦 Backing up media files..."
docker run --rm -v zazzle_media_files:/source -v $BACKUP_DIR:/backup alpine tar -czf /backup/media_backup_$TIMESTAMP.tar.gz -C /source .

if [ $? -eq 0 ]; then
    echo "✅ Media files backup completed: $MEDIA_BACKUP_FILE"
else
    echo "❌ Media files backup failed"
    exit 1
fi

# Cleanup old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "db_backup_*.sql" -type f -mtime +7 -delete
find $BACKUP_DIR -name "media_backup_*.tar.gz" -type f -mtime +7 -delete

echo "✅ Backup process completed!"
echo "Database backup: $DB_BACKUP_FILE"
echo "Media backup: $MEDIA_BACKUP_FILE"