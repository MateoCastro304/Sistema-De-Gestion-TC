#!/bin/sh
# Hace un dump de la DB y lo sube al bucket de backups.
# Uso: backup.sh [auto|manual]   (cron pasa auto; a mano, manual)
set -eu

origin="${1:-manual}"
case "$origin" in
  auto | manual) ;;
  *)
    echo "backup.sh: origen invalido '$origin' (auto o manual)" >&2
    exit 1
    ;;
esac

: "${PGHOST:?backup.sh: falta PGHOST}"
: "${PGUSER:?backup.sh: falta PGUSER}"
: "${PGPASSWORD:?backup.sh: falta PGPASSWORD}"
: "${PGDATABASE:?backup.sh: falta PGDATABASE}"
: "${S3_BUCKET_BACKUPS:?backup.sh: falta S3_BUCKET_BACKUPS}"
: "${S3_BACKUP_ACCESS_KEY:?backup.sh: falta S3_BACKUP_ACCESS_KEY}"
: "${S3_BACKUP_SECRET_KEY:?backup.sh: falta S3_BACKUP_SECRET_KEY}"

export AWS_ACCESS_KEY_ID="$S3_BACKUP_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$S3_BACKUP_SECRET_KEY"

# ISO 8601 en UTC, de la unidad mas grande a la mas chica: el orden
# alfabetico del listado es el cronologico. Guiones en vez de ":" porque
# Windows no los acepta en nombres de archivo.
key="db-$(date -u +%Y-%m-%dT%H-%M-%SZ)-${origin}.dump"
file="/tmp/$key"
trap 'rm -f "$file"' EXIT

# Formato custom: comprimido, y pg_restore puede restaurar solo una parte.
# Sin pipe: si pg_dump falla, set -e corta aca y no se sube nada.
pg_dump --format=custom --file="$file"

if [ ! -s "$file" ]; then
  echo "backup.sh: el dump quedo vacio, no se sube" >&2
  exit 1
fi

aws s3 cp "$file" "s3://$S3_BUCKET_BACKUPS/$key" --only-show-errors

echo "backup.sh: subido $key ($(wc -c < "$file") bytes)"
