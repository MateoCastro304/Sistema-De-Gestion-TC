# Configuración del proyecto — Tornería Castro

Guía de incorporación: cómo poner en funcionamiento el proyecto localmente desde cero.

---

## 1. Requisitos previos

| Herramienta | Notas |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Docker** + **Docker Compose** | `docker --version` / `docker compose version` |
| **make** | Preinstalado en Linux/Mac. En Windows: usar WSL o Git Bash con `make` instalado (`choco install make`). |
| **Node.js** | Solo es necesario si planeás ejecutar herramientas del backend o frontend fuera de Docker, por ejemplo el frontend sin backend o sus pruebas E2E (ver [sección 6](#frontend-sin-backend-y-sus-pruebas)). No es necesario para el flujo habitual. |

> El flujo habitual de desarrollo ejecuta el **backend, frontend y PostgreSQL** dentro de Docker. No es necesario instalar Node.js localmente, salvo que quieras ejecutar herramientas del proyecto directamente en tu máquina.

---

## 2. Inicio rápido

Para un desarrollador que ya tiene Docker y `make` instalados, el camino más corto hacia un entorno de desarrollo funcional es:

```bash
cp infrastructure/docker/.env.example infrastructure/docker/.env.dev
```

Configurá los valores requeridos en `.env.dev` (ver [sección 3](#3-clonar-el-repositorio-y-configurar-variables-de-entorno)) y luego:

```bash
make dev-build
make migrate-dev
make seed
```

Después de eso, el entorno de desarrollo está listo.
Usá:

```bash
make ps
```

para comprobar los contenedores y:

```bash
make dev-logs
```

para inspeccionar los registros.

Las secciones siguientes explican cada paso en detalle.

---

## 3. Clonar el repositorio y configurar variables de entorno

Cloná el repositorio:

```bash
git clone <repo-url>
cd torneria-castro
```

Completá los archivos de entorno de Docker (no están versionados; cada desarrollador crea los suyos a partir de `.env.example`):

```bash
cp infrastructure/docker/.env.example infrastructure/docker/.env.dev
```

Editá `infrastructure/docker/.env.dev` con los valores requeridos para desarrollo:

```env
POSTGRES_USER=torneria_dev
POSTGRES_PASSWORD=<elegir uno>
POSTGRES_DB=torneria_castro_dev
POSTGRES_PORT=5432

JWT_SECRET=<generar con el comando de abajo>
JWT_REFRESH_SECRET=<generar con el comando de abajo>
```

Los secretos JWT deben tener al menos 32 caracteres (lo exige `env.validation.ts` al iniciar). Generalos así:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ejecutá este comando dos veces: una para `JWT_SECRET` y otra para `JWT_REFRESH_SECRET`.

**No reutilices el mismo valor para ambos secretos.**

Agregá también los orígenes CORS que acepta el backend:

```env
ALLOWED_ORIGINS=http://localhost:8081
```

`ALLOWED_ORIGINS` es opcional y recibe una lista separada por comas. En desarrollo debe incluir `http://localhost:8081` para que Swagger UI pueda enviar solicitudes al backend. Dejalo sin definir en producción: el frontend accede al backend mediante Nginx desde el mismo origen, por lo que CORS permanece deshabilitado.

> Regla del proyecto: si agregás una variable de entorno nueva, actualizá `.env.example` en el mismo commit (ver [CONTRIBUTING.MD](CONTRIBUTING.MD)).

---

## 4. Iniciar el entorno de desarrollo con Docker

El entorno de desarrollo está compuesto por tres servicios principales:

- **Backend** — API NestJS.
- **Frontend** — Aplicación React/Vite.
- **PostgreSQL** — Base de datos de desarrollo.

> Además de estos tres, un servicio auxiliar `openapi-docs` sirve la documentación del contrato de la API de forma independiente: ver [Verificar la documentación OpenAPI](#verificar-la-documentación-openapi).

Con el `Makefile` de la raíz del repositorio, todo el flujo de desarrollo se maneja mediante comandos breves.

Iniciá todos los servicios en segundo plano:

```bash
make dev-up
```

Consultá el estado de los contenedores:

```bash
make ps
```

Seguí los registros de todos los servicios:

```bash
make dev-logs
```

Para ver todos los comandos disponibles:

```bash
make help
```

---

## 5. Primeros pasos después de iniciar

### Ejecutar migraciones Prisma

Una vez que los contenedores estén ejecutándose, aplicá las migraciones de la base de datos:

```bash
make migrate-dev
```

El procedimiento completo de migraciones se explica en [Migraciones de base de datos con Prisma](uso-ORM-DB/Migrations.md).

### Cargar datos de prueba

Ejecutá la carga inicial de datos de Prisma:

```bash
make seed
```

### Verificar el backend

La API del backend está disponible en:

```text
http://localhost:3000
```

### Verificar el frontend

El frontend está disponible en:

```text
http://localhost:5173
```

> El frontend se ejecuta dentro de su propio contenedor Docker. Su código fuente se monta dentro del contenedor durante el desarrollo, lo que permite reflejar cambios sin reconstruir la imagen en el flujo habitual de desarrollo.

### Verificar la documentación OpenAPI

Swagger UI sirve el contrato de la API (`docs/openapi/`) en:

```text
http://localhost:8081
```

Se ejecuta en su propio contenedor (`openapi-docs`), separado del backend, por lo que el contrato sigue siendo legible incluso si el backend está detenido o falla.

«Try it out» envía solicitudes desde tu navegador directamente a `http://localhost:3000` (la entrada `servers` de `openapi.yaml`), sin pasar por Nginx. Como la página se encuentra en un origen diferente (`:8081`), el backend debe permitirlo mediante CORS: ver `ALLOWED_ORIGINS` en la [sección 3](#3-clonar-el-repositorio-y-configurar-variables-de-entorno).

Después de editar el contrato, ejecutá `make openapi-docs-build` y recargá la página con `Ctrl+F5`. No hace falta reiniciar `openapi-docs`: lee `build/openapi.yaml` en cada carga.

### Acceder al conjunto de servicios mediante Nginx

Además de acceder directamente a cada servicio por su propio puerto, el
entorno de desarrollo incluye un **proxy inverso Nginx**, expuesto en:

    http://localhost

Nginx dirige las solicitudes entrantes según la ruta de la URL:

| Ruta | Destino |
| -------- | -------------------------------- |
| `/` | `frontend-dev` (servidor de desarrollo Vite) |
| `/api/*` | `backend` (API) |

**Por qué existe:** permite acceder al frontend y al backend mediante un
único origen, exactamente como en producción. Esto evita configurar CORS
en desarrollo y detecta problemas de enrutamiento de forma temprana, antes de que
aparezcan por primera vez en un despliegue de producción.

**Puertos directos y Nginx — cuándo usar cada uno:**

- Usá `localhost:3000` / `localhost:5173` directamente cuando depures un
  servicio de forma aislada (por ejemplo, al comprobar las respuestas directas del backend o usar
  las herramientas de desarrollo de Vite sin el proxy de por medio).
- Usá `localhost` (puerto 80, mediante Nginx) para verificar que el enrutamiento entre
  frontend y backend se comporte como en producción.

Ambos funcionan al mismo tiempo: Nginx no reemplaza los puertos directos;
es una forma adicional de acceder a los mismos servicios.

> Si `http://localhost` devuelve `502 Bad Gateway`, Nginx está ejecutándose, pero el
> servicio al que dirige la solicitud (backend o frontend-dev) todavía no responde:
> comprobalo con `make ps` y el comando `*-logs` correspondiente.
> En cambio, un `404` desde `/api/*` significa que la solicitud llegó al
> backend correctamente: el proxy funciona, pero la ruta o endpoint
> todavía no existe.

### Acceder a los contenedores para depurar

Backend:

```bash
make backend-shell
```

Frontend:

```bash
make frontend-shell
```

PostgreSQL:

```bash
make db-shell
```

---

## 6. Flujo de desarrollo

La configuración Docker Compose de desarrollo está diseñada para ofrecer un ciclo rápido de retroalimentación.

Los directorios de código fuente del backend y frontend se montan en sus respectivos contenedores mediante **montajes de enlace (bind mounts)**. Esto significa que los archivos editados en la máquina anfitriona están disponibles directamente dentro del contenedor correspondiente.

Como resultado:

- Los cambios de código del backend pueden detectarse sin reconstruir la imagen Docker.
- Los cambios de código del frontend pueden detectarse mediante el servidor de desarrollo Vite.
- Las dependencias y el entorno del contenedor permanecen aislados dentro de Docker.
- Los datos de PostgreSQL se almacenan en un volumen Docker y persisten entre reinicios normales del contenedor.

### Cuándo reconstruir

Un cambio normal de código **no** requiere reconstruir la imagen.

Por ejemplo:

```bash
make backend-restart
```

o:

```bash
make frontend-restart
```

pueden usarse cuando un servicio específico necesita reiniciarse.

Reconstruí la imagen afectada cuando cambies su Dockerfile o sus dependencias:

```bash
make backend-build
make frontend-build
```

O reconstruí todo:

```bash
make dev-build
```

### Reiniciar la base de datos de desarrollo

Si necesitás reiniciar completamente la base de datos PostgreSQL local, usá:

```bash
make dev-down-v
```

Esto detiene los contenedores de desarrollo y elimina sus volúmenes Docker.

**Advertencia:** esto elimina los datos locales de PostgreSQL.

Después de reiniciar, volvé a iniciar el entorno:

```bash
make dev-up
```

Luego ejecutá:

```bash
make migrate-dev
make seed
```

para recrear el esquema de la base de datos y cargar los datos de desarrollo.

### Frontend sin backend y sus pruebas

El frontend también puede ejecutarse **fuera de Docker y sin backend**, con la API simulada en el navegador ([ADR-011](decisiones/011-frontend-api-mocks.md)). Sirve para trabajar en pantallas cuyo endpoint todavía no existe y es lo que usan las pruebas E2E del frontend. Requiere Node.js 20 o superior.

Desde `frontend/`, con `VITE_USE_MOCKS=true` en `frontend/.env.local`:

```bash
npm install
npm run dev
```

Las peticiones a `/api` las responden los mocks, con datos de prueba que vuelven a su estado inicial al recargar la página. Sin esa variable, o con `false`, van al backend real. Los usuarios de prueba y el detalle de los mocks están en [MOCKS.md](../frontend/frontend-Documents/MOCKS.md).

Para las pruebas E2E del frontend ([ADR-012](decisiones/012-frontend-e2e-tests.md)), la primera vez hay que instalar el navegador de Playwright:

```bash
npx playwright install chromium
```

Después, desde `frontend/`:

```bash
npm run test:e2e:sprint1
```

Las pruebas levantan solas el frontend con los mocks en el puerto 5180: no hace falta tener nada corriendo. Las del Sprint 1 tienen que pasar siempre; las del Sprint 2 (`npm run test:e2e:sprint2`) fallan hasta que existan sus pantallas. Más opciones en [TESTING.md](../frontend/frontend-Documents/TESTING.md).

---

## 7. Producción

Iniciá el entorno de producción:

```bash
make prod-up
```

Si cambiaron los Dockerfile o las dependencias, reconstruí las imágenes de producción:

```bash
make prod-build
```

Seguí los registros de producción:

```bash
make prod-logs
```

Detené el entorno de producción:

```bash
make prod-down
```

El entorno de producción usa:

```text
infrastructure/docker/docker-compose.prod.yaml
```

y:

```text
infrastructure/docker/.env.prod
```

El entorno de producción difiere del de desarrollo en varios aspectos importantes:

- El backend usa la **etapa de producción** de su Dockerfile.
- El código de la aplicación se compila antes de ejecutarse.
- No se usan los montajes de enlace de desarrollo.
- PostgreSQL no se expone directamente a la máquina anfitriona.
- PostgreSQL usa un volumen Docker persistente para sus datos.
- Los servicios están configurados para producción, en lugar de flujos de desarrollo.

Los valores reales de producción van en:

```text
infrastructure/docker/.env.prod
```

Nunca incluyas este archivo en un commit del repositorio.

---

## 8. Problemas frecuentes

| Síntoma | Causa probable / solución |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `port is already allocated` | Otro proceso usa uno de los puertos requeridos por los servicios. Revisá la configuración Docker Compose y los valores correspondientes de `.env.dev`. |
| El backend no puede conectarse a la base de datos | `DATABASE_URL` debe usar `postgres` como host (el nombre del servicio en la red Docker), no `localhost`. |
| Falla la validación de entorno al iniciar | Comprobá que estén definidas **todas** las variables requeridas por `env.validation.ts` (`NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`) y que los secretos tengan 32 caracteres o más. |
| Error de Prisma porque no encuentra `schema.prisma` | Reconstruí la imagen del backend con `make backend-build` o `make dev-build` si la imagen Docker contiene una compilación desactualizada o incompleta. |
| Los cambios de código no se reflejan en el backend | Confirmá que el montaje de enlace del backend esté activo en la configuración Compose de desarrollo. |
| Los cambios de código no se reflejan en el frontend | Confirmá que el montaje de enlace del frontend y el servidor de desarrollo Vite se ejecuten correctamente dentro del contenedor del frontend. |
| Los cambios de dependencias no se reflejan | Reconstruí la imagen afectada con `make backend-build` o `make frontend-build`. |
| Todas las pruebas E2E del frontend fallan en milisegundos con `Executable doesn't exist` | Falta el navegador de Playwright: ejecutá `npx playwright install chromium` desde `frontend/`. Pasa la primera vez y cada vez que se actualiza Playwright. |
| `npm run lint` del frontend falla en archivos de `e2e/.report/` | Quedó el reporte de una prueba fallida y ESLint no ignora esa carpeta. Borrá `frontend/e2e/.report` y `frontend/e2e/.results`. |
| Desaparecieron los datos de la base de datos | `make dev-down-v` o `make clean` pueden haber eliminado el volumen Docker que contiene la base de datos de desarrollo. |
| Swagger UI no refleja un cambio del contrato | Ejecutá `make openapi-docs-build` y recargá con `Ctrl+F5`. Swagger lee `build/openapi.yaml`, que solo regenera `openapi-build`. |
| «Try it out» de Swagger falla con un error de CORS | `ALLOWED_ORIGINS` en `.env.dev` debe incluir `http://localhost:8081`. Recreá el contenedor del backend después de cambiarlo. |
| «Try it out» de Swagger devuelve `404` | La solicitud llegó al backend, pero la ruta no existe. Comprobá que la URL `servers` de `openapi.yaml` no tenga el prefijo `/api` (ese prefijo solo existe en Nginx). |

---

## 9. Referencia de comandos

### Para todo el entorno

| Comando | Qué hace |
| ----------------- | -------------------------------------------------------------------------------- |
| `make dev-up` | Inicia backend + frontend + postgres (desarrollo) |
| `make dev-build` | Reconstruye todas las imágenes e inicia los servicios (usar después de cambiar un Dockerfile o dependencias) |
| `make dev-down` | Detiene los contenedores |
| `make dev-down-v` | Detiene los contenedores **y elimina los datos de Postgres** (reinicio completo) |
| `make dev-logs` | Registros en vivo de todos los servicios |
| `make ps` | Estado de los contenedores |
| `make clean` | Detiene todo, elimina volúmenes e imágenes/contenedores huérfanos |
| `make prod-up` | Inicia el entorno de producción |
| `make prod-build` | Reconstruye todas las imágenes de producción e inicia el entorno de producción |
| `make prod-logs` | Registros en vivo de producción |
| `make prod-down` | Detiene el entorno de producción |

### Para el backend

| Comando | Qué hace |
| ---------------------- | ---------------------------------- |
| `make backend-restart` | Reinicia solo el contenedor del backend |
| `make backend-logs` | Registros en vivo solo del backend |
| `make backend-shell` | Consola dentro del contenedor del backend |
| `make backend-build` | Reconstruye solo la imagen del backend |
| `make migrate-dev` | Ejecuta migraciones Prisma |
| `make seed` | Carga datos de prueba |

### Para la documentación OpenAPI

| Comando | Qué hace |
| ------------------------- | -------------------------------------------------------------------- |
| `make openapi-docs-build` | Valida y vuelve a empaquetar el contrato OpenAPI (luego `Ctrl+F5` en Swagger) |
| `make openapi-docs-logs` | Registros en vivo del servicio Swagger UI |

### Para el frontend

| Comando | Qué hace |
| ----------------------- | ----------------------------------- |
| `make frontend-restart` | Reinicia solo el contenedor del frontend |
| `make frontend-logs` | Registros en vivo solo del frontend |
| `make frontend-shell` | Consola dentro del contenedor del frontend |
| `make frontend-build` | Reconstruye solo la imagen del frontend |

### Para la base de datos

| Comando | Qué hace |
| --------------- | -------------------- |
| `make db-shell` | psql dentro de Postgres |

---

## 10. Convenciones relacionadas

- Ramas, commits (Conventional Commits) y PR: ver [CONTRIBUTING.MD](CONTRIBUTING.MD).
- Decisiones de arquitectura: ver los ADR en [`docs/decisiones/`](decisiones/).
- Organización de infraestructura Docker: ver [`infrastructure/docker/README.md`](../infrastructure/docker/README.md).
- Las configuraciones Docker Compose se encuentran en `infrastructure/docker/`.
- Las variables de entorno de desarrollo se almacenan en `infrastructure/docker/.env.dev`.
- Las variables de entorno de producción se almacenan en `infrastructure/docker/.env.prod`.
