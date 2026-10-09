#!/bin/bash
# Backup Script for FireGuard AI (MySQL & MinIO)
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

echo "=== [1/2] Backing up MySQL database ==="
# Read environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

DB_NAME=${MYSQL_DATABASE:-fireguard_db}
DB_USER=${MYSQL_USER:-fireguard_user}
DB_PASS=${MYSQL_PASSWORD:-devpassword}

docker exec fireguard_mysql_prod mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
echo "Database backup completed: $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

echo "=== [2/2] Backing up MinIO Object Storage ==="
# We archive the Docker volume mount directory or copy it from the container
docker run --rm --volumes-from fireguard_minio_prod -v "$(pwd)/$BACKUP_DIR:/backup" alpine tar czf "/backup/minio_backup_$TIMESTAMP.tar.gz" -C /data .
echo "MinIO backup completed: $BACKUP_DIR/minio_backup_$TIMESTAMP.tar.gz"

echo "=== Backup Process Completed Successfully ==="
