#!/bin/sh
# Arma el JSON de credenciales de SeaweedFS a partir de la plantilla y
# arranca el servidor. Corre como root; el entrypoint de la imagen baja
# despues al usuario seaweed.
set -eu

TEMPLATE=/etc/config/s3.json.template
CONFIG=/etc/seaweedfs/s3.json

# Termina con un mensaje claro si la variable falta o tiene caracteres fuera
# del patron. Un "/" o un "&" rompen el sed; una comilla o una "\" rompen
# el JSON.
check() {
  name=$1
  pattern=$2
  value=$(printenv "$name" || true)
  if [ -z "$value" ]; then
    echo "start.sh: falta $name" >&2
    exit 1
  fi
  if ! printf '%s' "$value" | grep -Eq "^${pattern}\$"; then
    echo "start.sh: $name no cumple ${pattern}" >&2
    exit 1
  fi
}

BUCKETS="S3_BUCKET S3_BUCKET_UPLOADS S3_BUCKET_BACKUPS"
KEYS="S3_BACKEND_ACCESS_KEY S3_BACKEND_SECRET_KEY S3_BACKUP_ACCESS_KEY S3_BACKUP_SECRET_KEY"

for name in $BUCKETS; do
  check "$name" '[a-z0-9][a-z0-9-]{1,61}[a-z0-9]'
done
for name in $KEYS; do
  check "$name" '[A-Za-z0-9]{16,}'
done
check S3_CORS_ORIGINS '[A-Za-z0-9:/.,-]+'

script=""
for name in $BUCKETS $KEYS; do
  script="${script}s/\\\${${name}}/$(printenv "$name")/g;"
done

# Solo root y seaweed pueden leerlo: tiene los secretos resueltos.
umask 077
sed "$script" "$TEMPLATE" > "$CONFIG"
chown seaweed:seaweed "$CONFIG"

# Una ${VARIABLE} de la plantilla que no esta en las listas de arriba.
if grep -q '\${' "$CONFIG"; then
  echo "start.sh: quedaron variables sin reemplazar en $CONFIG" >&2
  exit 1
fi

# exec: weed queda como proceso 1 y recibe el SIGTERM de "docker compose down".
exec /entrypoint.sh mini \
  -dir=/data \
  -s3.config="$CONFIG" \
  -s3.allowedOrigins="$S3_CORS_ORIGINS" \
  -bucket="$S3_BUCKET,$S3_BUCKET_UPLOADS,$S3_BUCKET_BACKUPS"
