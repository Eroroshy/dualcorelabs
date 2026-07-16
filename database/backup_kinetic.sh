#!/bin/bash
# ============================================================
#  KINETIC – Rutina de respaldo de la base de datos
#  Uso: ./backup_kinetic.sh
#  Pensado para ejecutarse vía cron contra el pooler de
#  Supabase (puerto 6543), tal como el resto de conexiones
#  del proyecto desde PgAdmin.
# ============================================================
set -euo pipefail

# --- Configuración (usar variables de entorno / secrets, nunca hardcodear) ---
DB_HOST="${KINETIC_DB_HOST:-aws-0-us-east-1.pooler.supabase.com}"
DB_PORT="${KINETIC_DB_PORT:-6543}"
DB_NAME="${KINETIC_DB_NAME:-postgres}"
DB_USER="${KINETIC_DB_USER:-kinetic_admin}"
BACKUP_DIR="${KINETIC_BACKUP_DIR:-./backups}"
FECHA=$(date +"%Y-%m-%d_%H%M%S")
RETENCION_DIAS=14

mkdir -p "$BACKUP_DIR"

# --- 1. Respaldo completo (esquema + datos), formato custom (comprimido) ---
ARCHIVO="$BACKUP_DIR/kinetic_backup_${FECHA}.dump"
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$ARCHIVO"

echo "Respaldo generado: $ARCHIVO"

# --- 2. Respaldo adicional solo de esquema (DDL), útil para revisar en Git ---
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_DIR/kinetic_schema_${FECHA}.sql"

# --- 3. Purga de respaldos con más de RETENCION_DIAS días ---
find "$BACKUP_DIR" -type f -name "kinetic_backup_*.dump" -mtime +"$RETENCION_DIAS" -delete
find "$BACKUP_DIR" -type f -name "kinetic_schema_*.sql"  -mtime +"$RETENCION_DIAS" -delete

echo "Rutina de respaldo finalizada correctamente ($FECHA)."

# ============================================================
# Restauración (referencia):
#   pg_restore --host=$DB_HOST --port=$DB_PORT --username=$DB_USER \
#              --dbname=$DB_NAME --clean --if-exists kinetic_backup_FECHA.dump
# ============================================================
