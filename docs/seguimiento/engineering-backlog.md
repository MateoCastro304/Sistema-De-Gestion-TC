# Backlog de ingeniería — CI/CD, herramientas y calidad de código

Trabajo pendiente sobre el pipeline de entrega, las herramientas y la deuda de calidad de código detectada al configurar la CI. Las funcionalidades de negocio se siguen en Jira; esta lista es para trabajo de ingeniería que todavía no tiene ticket.

**Última actualización:** 2026-10-15. Al terminar un ítem, marcalo y agregá el commit o PR. Al empezar uno, poné tu nombre en **Responsable**. Pasá los ítems a Jira si el equipo prefiere seguirlos ahí.

Prioridad: **P1** = bloquea algo u oculta problemas reales · **P2** = debería hacerse en este sprint · **P3** = mejora, cuando haya tiempo.

---

## 0. Preparación para producción (bloquea el primer despliegue en AWS)

Detectado al preparar el despliegue en EC2. Hacerlos en orden: cada uno es chico y se puede comprobar localmente.

| Hecho | Pri | Ítem | Responsable |
| :--: | :-: | --- | --- |
| [x]  | P1  | **Evitar que el `Makefile` filtre variables de desarrollo a los comandos de producción.** `-include $(ENV_DEV)` + un `export` sin argumentos pone todos los valores de `.env.dev` en el entorno de _cada_ receta, y Compose da prioridad a las variables del shell sobre `--env-file`. Resultado: `make prod-*` interpola `${POSTGRES_USER}`/`${POSTGRES_PASSWORD}` con los valores de desarrollo. Comprobación: ejecutar `docker compose ... config` a través de Make y revisar `DATABASE_URL`. |       |
| [x]  | P1  | **Agregar `restart: unless-stopped` a `web`.** Sin eso, nginx no vuelve a levantarse cuando se reinicia el host, mientras que el backend y la base sí. |       |
| [x]  | P1  | **Apagado ordenado del backend.** Llamar a `app.enableShutdownHooks()` en `main.ts` (hoy `PrismaService.onModuleDestroy` nunca se ejecuta) y agregar `init: true` al servicio, para que Node no sea el PID 1 y `docker stop` no termine en SIGKILL a los 10 s. |       |
| [x]  | P1  | **Health check.** `/health/db` devuelve al cliente el mensaje de error crudo de la base de datos: registrarlo en el log y devolver solo el estado. Agregar a `backend` un `healthcheck` de compose que lo llame, y hacer que `web` dependa de `backend` con `condition: service_healthy`. |       |
| [ ]  | P1  | **Rotar los logs de Docker.** Agregar `logging` (`json-file`, `max-size`, `max-file`) a todos los servicios mediante un ancla `x-logging`. Un disco lleno detiene PostgreSQL. |       |
| [ ]  | P2  | **Registrar `ValidationPipe` una sola vez.** `main.ts` lo registra de nuevo después de que `configureApp()` ya lo hizo. |       |
| [ ]  | P2  | **Usar valores de ejemplo en `infrastructure/docker/.env.example`.** Tiene un secreto JWT con aspecto real, el mismo valor para ambos secretos, y no incluye `JWT_EXPIRATION` / `JWT_REFRESH_EXPIRATION`. |       |
| [ ]  | P1  | **Levantar el stack de producción localmente** (`make prod-build`) cuando estén hechos los ítems anteriores: todos los contenedores sanos, `migrate` terminado con código 0 y `http://localhost` sirviendo la aplicación. |       |

## 1. CI en verde y confiable

La CI está integrada en `develop`, pero el job `backend` está en rojo, por lo que los jobs del Nivel 2 (`backend-integration`, `docker-build`) **nunca llegaron a ejecutarse**. Hasta completar esta sección no es posible un PR a `main` en verde.

| Hecho | Pri | Ítem | Responsable |
| :--: | :-: | --- | --- |
| [x]  | P1  | **Arreglar la compilación rota del backend:** `src/factory/domain/factory.ts` importa `../../shared/domain/cuit`, que no existe (`cuit.ts` está en `suppliers/domain/`). Verificado el 2026-10-15: `cuit.ts` ahora está en `shared/domain/` y `tsc` compila sin errores. |        |
| [ ]  | P1  | **Corregir los errores de lint del backend** (`npm run lint` en `backend/`). Incluye problemas reales: casos de uso de `customers` y `factory` que importan DTO HTTP (violación de capas), import sin usar de `prismaConfig` en `app.module.ts`, `@Transform` que llama a `.trim()` sobre valores que no son strings, `no-base-to-string` en los repositorios Prisma, `Object` en lugar de `object` en los filtros de excepciones. Corregido en `ce302fb`; confirmar que el job `backend` esté en verde en `develop` antes de marcarlo. |        |
| [x]  | P1  | **Formatear el backend** (`npm run format`, 41 archivos). Coordinarlo antes con el equipo: un único commit dedicado y anunciado, para evitar conflictos con las ramas abiertas. Hecho en `141d272`; `format:check` pasa. |        |
| [ ]  | P1  | **Seguir la primera ejecución real del Nivel 2** cuando `backend` esté en verde: confirmar que Testcontainers inicia PostgreSQL en el runner y que ambas imágenes se construyen. |        |
| [ ]  | P1  | **Seleccionar las verificaciones obligatorias en `main`** (Settings → Branches): `frontend`, `backend`, `openapi-contract`, `backend-integration`, `docker-build`. Solo aparecen en la lista después de ejecutarse una vez en un PR. | Castro |
| [ ]  | P2  | **Ejecutar la CI también en los PR a `develop`** (`pull_request: branches: [develop, main]`). Hoy solo la disparan los pushes a `develop` y los PR a `main`, por lo que un PR hacia `develop` no recibe verificaciones. Relacionado: el equipo todavía tiene que definir la regla de revisión para `develop` (I-02). |        |
| [ ]  | P2  | **Cancelar ejecuciones reemplazadas solo en los PR**, no en `develop`. Con pushes directos, cancelar una ejecución deja ese commit sin resultado, y cuando `develop` se pone en rojo no se puede saber qué commit lo rompió. Cambiar a `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`. |        |
| [ ]  | P2  | **Cerrar las pruebas de integración intencionalmente en rojo** (desvíos del backend respecto del contrato OpenAPI, ver `backend/test/README.md`). Bloquean cada publicación en `main`. |        |

## 2. Robustez de la CI

| Hecho | Pri | Ítem | Responsable |
| :--: | :-: | --- | --- |
| [ ]  | P2  | **Agregar Dependabot** (`.github/dependabot.yml`) para `github-actions`, para npm en `frontend/`, `backend/` y `tooling/openapi/`, y para `docker` (imágenes base de los Dockerfiles y archivos compose). Hoy nada avisa cuando una action o una dependencia tiene una corrección de seguridad. |       |
| [ ]  | P3  | **Fijar las actions de terceros a un SHA de commit** en lugar de un tag (`actions/checkout@<sha> # v7`). Los tags pueden moverse; los SHA no. Dependabot mantiene actualizados los SHA. |       |
| [ ]  | P3  | **Cachear las capas Docker** en `docker-build` (Buildx + caché de GitHub Actions). Hoy cada PR reconstruye ambas imágenes desde cero. |       |
| [ ]  | P3  | **Agregar `workflow_dispatch`** para ejecutar la CI manualmente en cualquier rama. |       |
| [ ]  | P3  | **Agregar un badge de estado de la CI** a `README.md`. |       |
| [ ]  | P3  | **Eliminar los pasos de preparación duplicados** (checkout + setup-node repetidos en cada job) con una composite action, si el workflow sigue creciendo. |       |

## 3. Despliegue continuo (rama propia, ADR propio)

Definido a alto nivel en [ADR-009](../decisiones/009-deploy-infrastructure.md) (paso 4). Necesita **ADR-011** antes de implementarse.

| Hecho | Pri | Ítem | Responsable |
| :--: | :-: | --- | --- |
| [ ]  | P2  | **Escribir ADR-011 — Despliegue continuo.** Decisiones: registro de contenedores (GHCR o ECR), etiquetado de imágenes (SHA del commit, sin `latest` en producción), qué dispara un despliegue (merge a `main`, tag, aprobación manual), cómo llega GitHub a EC2 (SSH o SSM), dónde se guardan los secretos, cómo se ejecutan las migraciones (`prisma migrate deploy` antes de que arranque el backend nuevo), estrategia de rollback. |       |
| [ ]  | P2  | **Construir y publicar las imágenes** desde el commit validado en `main`. Las imágenes deben ser `linux/arm64` (la instancia EC2 es una t4g). |       |
| [ ]  | P2  | **Cambiar el compose de producción de `build:` a `image:`** e incluir `nginx.prod.conf` en la imagen web, para que el servidor no necesite ni el código fuente ni el repositorio. |       |
| [ ]  | P2  | **Desplegar en EC2** con `docker-compose.prod.yaml`, descargando las imágenes publicadas. |       |
| [ ]  | P3  | **Validar los archivos compose en la CI** con `docker compose config` (habría detectado la `causas-network` sin definir). Necesita un archivo de entorno ficticio para el compose de producción. |       |

## 4. Frontend

| Hecho | Pri | Ítem | Responsable |
| :--: | :-: | --- | --- |
| [ ]  | P2  | **Completar las pruebas.** Ya hay pruebas E2E con Playwright en `frontend/e2e/`, que corren contra los mocks de MSW (`npm run test:e2e:sprint1` y `test:e2e:sprint2`; ver `frontend/frontend-Documents/TESTING.md`). Falta: pruebas unitarias de la lógica suelta (Vitest + Testing Library es la opción habitual con Vite) y sumar las pruebas al job `frontend` de la CI. |       |
| [ ]  | P2  | **Agregar Prettier** (misma configuración que el backend) y `format:check` a la CI. Hoy el formato es inconsistente (punto y coma e indentación mezclados). Formatear en un único commit dedicado. |       |
| [ ]  | P2  | **Corregir bien las promesas flotantes** (`invalidateQueries`, `navigate`): decidir en cada caso si hacer `await`/devolver la promesa o marcarla con `void`. Devolver `invalidateQueries` desde `onSuccess` cambia el momento en que se resuelve la mutación. |       |
| [ ]  | P3  | **Revisar la dependencia `features/` → `app/providers`.** La configuración de lint la permite como excepción deliberada. La alternativa es mover `ToastContext` a `shared/` (existe una carpeta vacía `shared/components/feedback/` para eso). |       |
| [ ]  | P3  | **Tipar `import.meta.env`** (`ImportMetaEnv` en un `vite-env.d.ts`), para que las variables `VITE_*` no sean `any`. |       |
| [ ]  | P3  | **Dividir el bundle.** El chunk principal supera los 500 kB; cargar las rutas de forma diferida. |       |

## 5. Deuda del backend y de herramientas

| Hecho | Pri | Ítem | Responsable |
| :--: | :-: | --- | --- |
| [ ]  | P2  | **Declarar `dotenv` como dependencia.** `prisma.config.ts` importa `dotenv/config`, pero no está en `package.json`; funciona solo porque lo instala otro paquete. |       |
| [ ]  | P3  | **Alinear las versiones de ESLint** (frontend en la 10, backend en la 9). |       |
| [ ]  | P3  | **Corregir la descripción de `backend-test` en el `Makefile`** (dice pruebas de integración, ejecuta pruebas unitarias). |       |
| [ ]  | P3  | **Quitar la dependencia de desarrollo sin uso `@eslint/eslintrc`** del backend (resto de la plantilla de Nest). |       |

## 6. Documentación

| Hecho | Pri | Ítem | Responsable |
| :--: | :-: | --- | --- |
| [ ]  | P2  | **Traducir al inglés** (regla de `CONTRIBUTING`): `backend/test/README.md`, `docs/pendientes-sprint-1.md`, `docs/decisiones-clientes-fabricas.md`, `docs/inconsistencias-clientes-fabricas.md` (contenido y nombres de archivo). |       |
| [ ]  | P2  | **Actualizar `docs/pendientes-sprint-1.md`:** I-01 (sin CI) está resuelto por ADR-010; I-02 y B-17 están parcialmente atendidos. |       |
| [ ]  | P3  | **Limpiar `README.md`:** quitar el comentario sobrante de la plantilla («Section to paste into the repo's main README.md») y enlazar `CONTRIBUTING`. |       |
| [ ]  | P3  | **Mencionar Node 22 en `SETUP.md`** para ejecutar las verificaciones fuera de Docker. |       |

> El primer ítem contradice la regla vigente de [CONTRIBUTING](../CONTRIBUTING.MD#idioma) (documentación en español), y los archivos `pendientes-sprint-1.md`, `decisiones-clientes-fabricas.md` e `inconsistencias-clientes-fabricas.md` no existen en el repositorio. Ver [DOC-10](inconsistencias-documentales.md#doc-10--ítems-de-documentación-del-backlog-de-ingeniería).

## 7. Robustez de producción (antes de cargar datos reales)

| Hecho | Pri | Ítem | Responsable |
| :--: | :-: | --- | --- |
| [ ]  | P2  | **Endurecer `nginx.prod.conf`:** `server_tokens off`, `client_max_body_size` (el valor por defecto de 1 MB rechazará las cargas con 413), gzip, caché larga para `/assets/` con hash y `no-cache` para `index.html`, encabezados de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`). HSTS solo después de HTTPS. |       |
| [ ]  | P2  | **Fijar las versiones de las imágenes base** (`node`, `nginx`, `postgres`) a una versión menor o a un digest; Dependabot (sección 2) las mantiene actualizadas. |       |
| [ ]  | P2  | **Logging estructurado del backend.** Elegir la biblioteca (logger de Nest, `nestjs-pino`, winston), escribir solo en stdout, agregar un id de solicitud y nunca registrar contraseñas, tokens ni encabezados `Authorization`. |       |
| [ ]  | P1  | **Respaldos de la base de datos.** Acordar el RPO con el cliente (ADR-009 dice semanal). `pg_dump` programado con retención, luego copiado a S3; opcionalmente, snapshots de EBS. Probar una restauración antes de darlo por terminado. |       |

## 8. Entorno de desarrollo y orden del repositorio

| Hecho | Pri | Ítem | Responsable |
| :--: | :-: | --- | --- |
| [ ]  | P3  | **Soporte de WebSocket en `nginx.dev.conf` (I-05).** `location /` necesita `proxy_http_version 1.1` y los encabezados `Upgrade` / `Connection`; de lo contrario, Vite HMR no funciona a través del puerto 80. |       |
| [ ]  | P3  | **Revisar el montaje de `docker.sock` en `docker-compose.dev.yaml`.** Existe para que Testcontainers pueda ejecutarse dentro del contenedor del backend, pero le da a ese contenedor un acceso equivalente a root sobre el host. Alternativa: ejecutar las pruebas de integración desde el host y quitar el montaje y `docker-cli` de la imagen de desarrollo. Decisión del equipo. |       |
| [ ]  | P3  | **Borrar las ramas remotas ya mergeadas (I-04)** y habilitar «Automatically delete head branches» en la configuración del repositorio. Decidir con sus responsables qué hacer con `feat/suppliers-prisma-adapter`, `feature/tests-clients` y `feature/abmc-customers-and-factories` (sin mergear). |       |
| [ ]  | P2  | **Hacer commit de este backlog.** |       |

## 9. Infraestructura AWS

| Hecho | Pri | Ítem | Responsable |
| :--: | :-: | --- | --- |
| [ ]  | P1  | **Configuración base de la cuenta:** MFA en root y en el usuario IAM, presupuesto mensual con alertas (comprobar que no descuente los créditos), región elegida. |       |
| [ ]  | P1  | **Primer despliegue manual en EC2** (t4g.small, Ubuntu 24.04 arm64, puerto 80 abierto solo a las IP del equipo hasta que haya autenticación y HTTPS). Registrar cada elección: se convierte en el código Terraform. |       |
| [ ]  | P2  | **Terraform** para lo creado manualmente, de modo que pueda recrearse en la cuenta del cliente. |       |
| [ ]  | P2  | **S3** para los archivos cargados y los respaldos (reemplaza a MinIO en desarrollo). |       |
| [ ]  | P2  | **Dominio y HTTPS** antes de que el cliente cargue datos reales. |       |
| [ ]  | P3  | **Agente de CloudWatch** para métricas del host y logs de los contenedores. |       |
