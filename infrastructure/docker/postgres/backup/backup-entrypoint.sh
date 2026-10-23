#!/bin/sh
# Programa backup.sh con crond. crond no les pasa a las tareas las variables
# del contenedor: se guardan en un archivo que la tarea carga antes de correr.
set -eu

umask 077
export -p | grep -E "^export (PG[A-Z]+|AWS_[A-Z_]+|S3_BACKUP_[A-Z_]+|S3_BUCKET_BACKUPS)=" > /run/backup.env

# Hora del contenedor: UTC.
SCHEDULE="${BACKUP_SCHEDULE:-0 3 * * *}"

# La salida va a la del proceso 1, que es la que muestra "docker logs".
echo "$SCHEDULE . /run/backup.env && sh /usr/local/bin/backup.sh auto > /proc/1/fd/1 2> /proc/1/fd/2" \
  > /etc/crontabs/root

echo "backup: programado \"$SCHEDULE\" (UTC)"
exec crond -f -l 8
