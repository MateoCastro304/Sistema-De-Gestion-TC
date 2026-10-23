# Una sola version para el servidor y para el backup: pg_dump no puede
# hacer el dump de un servidor mas nuevo que el.
ARG POSTGRES_VERSION=16

FROM postgres:${POSTGRES_VERSION}-alpine AS server
LABEL maintainer="losnodejantes@gmail.com"
COPY ./init/ /docker-entrypoint-initdb.d/
EXPOSE 5432

# Servicio de backup: el pg_dump de la imagen oficial + cliente de S3.
FROM postgres:${POSTGRES_VERSION}-alpine AS backup
RUN apk add --no-cache aws-cli
# --chmod: ejecutables aunque git no guarde el permiso (archivos creados en Windows).
COPY --chmod=755 ./backup/ /usr/local/bin/
ENTRYPOINT ["sh", "/usr/local/bin/backup-entrypoint.sh"]
