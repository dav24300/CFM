#!/usr/bin/env bash
# Sauvegarde quotidienne CFM — JSON local et/ou PostgreSQL
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

if [ -f "data/store.json" ]; then
  cp "data/store.json" "$BACKUP_DIR/store-$STAMP.json"
  echo "✓ JSON: $BACKUP_DIR/store-$STAMP.json"
fi

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" -Fc -f "$BACKUP_DIR/cfm-db-$STAMP.dump"
  echo "✓ PostgreSQL: $BACKUP_DIR/cfm-db-$STAMP.dump"
fi

# Rétention 14 jours
find "$BACKUP_DIR" -type f -mtime +14 -delete 2>/dev/null || true
