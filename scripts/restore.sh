#!/bin/bash
# Restore Script for FireGuard AI (MySQL & MinIO)
set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <db_backup_file.sql.gz> <minio_backup_file.tar.gz>"
    exit 1
fi

DB_BACKUP=$1
MINIO_BACKUP=$2

echo "=== [1/2] Restoring MySQL Database ==="
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

DB_NAME=${MYSQL_DATABASE:-fireguard_db}
DB_USER=${MYSQL_USER:-fireguard_user}
DB_PASS=${MYSQL_PASSWORD:-devpassword}

gunzip -c "$DB_BACKUP" | docker exec -i fireguard_mysql_prod mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME"
echo "Database restore completed."

echo "=== [2/2] Restoring MinIO Object Storage ==="
docker run --rm --volumes-from fireguard_minio_prod -v "$(pwd):/backup" alpine sh -c "rm -rf /data/* && tar xzf /backup/$MINIO_BACKUP -C /data"
echo "MinIO restore completed."

echo "=== Restore Process Completed Successfully ==="
