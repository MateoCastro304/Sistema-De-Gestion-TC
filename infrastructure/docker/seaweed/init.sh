#!/bin/sh
# Configura los buckets despues de que arranca SeaweedFS. Se puede correr
# las veces que haga falta: cada regla se pisa con el mismo valor.
set -eu

export AWS_ACCESS_KEY_ID="$S3_ADMIN_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$S3_ADMIN_SECRET_KEY"

# El healthcheck da OK apenas levanta el S3, y -bucket crea los buckets un
# momento despues.
tries=0
until aws s3api head-bucket --bucket "$S3_BUCKET_UPLOADS" 2>/dev/null; do
  tries=$((tries + 1))
  if [ "$tries" -ge 15 ]; then
    echo "init.sh: no existe el bucket $S3_BUCKET_UPLOADS" >&2
    exit 1
  fi
  sleep 1
done

# Las subidas sin confirmar se borran solas al dia: asi no quedan huerfanos
# y nadie necesita permiso de borrar.
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$S3_BUCKET_UPLOADS" \
  --lifecycle-configuration file:///etc/config/lifecycle-subidas.json

echo "init.sh: expiracion configurada en $S3_BUCKET_UPLOADS"
