# ADR-010 — Pipeline de integración continua

**Fecha:** 2026-10
**Estado:** Aceptado (implementado parcialmente, ver [Estado de implementación](#estado-de-implementación))
**Responsables de la decisión:** Equipo Dev-Ops

---

## Contexto y problema

[ADR-009](./009-deploy-infrastructure.md) establece GitHub Actions para CI/CD, pero no define qué verifica la CI, cuándo ni con qué rigor. Este ADR cubre ese vacío.

Los hechos relevantes sobre cómo trabaja hoy el equipo:

- **`develop` recibe pushes directos, sin pull requests.** La CI es la única verificación automática que reciben esos cambios, por lo que tiene que dar resultados en pocos minutos o deja de mirarse.
- **`main` es la rama estable** y solo recibe pull requests. Es el lugar adecuado para verificaciones más lentas y costosas.
- **La suite de integración del backend** (`backend/test/`) inicia un PostgreSQL real con Testcontainers, aplica todas las migraciones y se ejecuta en serie (`maxWorkers: 1`). Es la verificación más sólida que tenemos, pero también la más lenta.
- **Las imágenes Docker se construyen con los mismos comandos** (`npm ci`, `npm run build`) que la CI ejecuta directamente, por lo que construir imágenes en cada push repetiría trabajo sin aportar mucha detección temprana.

La pregunta era cómo repartir las verificaciones entre «respuesta rápida en cada push» y «validación exhaustiva antes de llegar a `main`».

## Decisión

Un único workflow (`.github/workflows/ci.yaml`) con **dos niveles de verificación**.

### Nivel 1 — Verificaciones rápidas: cada push a `develop` y cada PR a `main`

Cada job se ejecuta en paralelo, en `ubuntu-latest` con Node 22.

| Job                | Pasos                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend`         | `npm ci` → `npm run lint` → `npm run build` (incluye `tsc -b`, la única verificación de tipos del frontend)                             |
| `backend`          | `npm ci` → `npx prisma generate` → `npm run lint` → `npm run format:check` → `npm run build` → `npm test` (pruebas unitarias, `src/**/*.spec.ts`) |
| `openapi-contract` | En `tooling/openapi`: `npm ci` → `npm run validate` (Redocly lint + Spectral lint de `docs/openapi/openapi.yaml`)                       |

El job del contrato verifica que la especificación OpenAPI esté **bien formada** (esquema válido, sin `$ref` rotos, campos obligatorios presentes). No verifica que el backend la implemente: esa es la función de las pruebas de integración (Nivel 2).

### Nivel 2 — Verificaciones de acceso: solo en PR a `main`

| Job                   | Qué verifica                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `backend-integration` | `npm run test:int`: HTTP → caso de uso → Prisma → PostgreSQL real, contra el contrato OpenAPI           |
| Docker build          | Que las imágenes de producción se construyan desde sus Dockerfiles (detecta Dockerfiles o `.dockerignore` rotos) |

`backend-integration` declara `needs: backend`: solo se ejecuta si pasó el job rápido del backend. No tiene sentido gastar minutos en la suite de integración cuando el código no pasa el lint o no compila. Cuando `backend` falla, este job aparece como **skipped** (omitido), no como aprobado.

### Reglas para todos los jobs

- **El lint es binario.** Una advertencia que nadie lee no es una verificación, por lo que cada regla es `error` u `off`:
  - ESLint: los scripts se ejecutan con `--max-warnings 0`.
  - Redocly: extiende `recommended-strict` (las advertencias del preset pasan a ser errores).
  - Spectral: se ejecuta con `--fail-severity=warn`.

  Desactivar una regla requiere un comentario en la configuración que explique por qué (por ejemplo, `no-server-example.com` en `tooling/openapi/redocly.yaml`: el único servidor es el backend local usado por Swagger UI hasta que exista un host de producción).
- **La CI nunca corrige código.** `lint` no usa `--fix`; la corrección se hace localmente con `lint:fix` / `format`.
- **El formato es responsabilidad de Prettier, no de ESLint** (backend: `format:check`).
- **Misma instalación que producción:** `npm ci` a partir del `package-lock.json` versionado, nunca `npm install`.
- **Versión de Node:** `22`, fijada en el workflow. Debe coincidir con la imagen base `node:22-alpine` de ambos Dockerfiles; cambiar una exige cambiar la otra.
- **`prisma generate` necesita `DATABASE_URL`** para cargar `prisma.config.ts`, aunque no se conecta a una base de datos. La CI provee una URL ficticia, la misma que usa el Dockerfile del backend.

## Alternativas consideradas

### Dónde ejecutar las pruebas de integración del backend

| Opción                    | Decisión     | Motivo                                                                                                     |
| ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| En cada push a `develop`  | Rechazada    | La red de seguridad más sólida, pero agrega minutos a cada push y va contra la respuesta rápida en `develop` |
| **Solo en PR a `main`**   | **Seleccionada** | Mantiene `develop` rápido; todo se valida igualmente antes de llegar a `main`                          |
| Solo localmente (`make test-int`) | Rechazada | Depende de la disciplina; nada garantiza que se haya ejecutado                                          |

### Si la CI construye imágenes Docker

| Opción                                    | Decisión      | Motivo                                                                                        |
| ----------------------------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| Solo npm; imágenes construidas al desplegar | Rechazada   | Un Dockerfile roto recién se detectaría al desplegar                                          |
| `docker build` en cada push               | Rechazada     | Más lento, duplica `npm ci` / build y necesita configuración adicional de caché para ser utilizable |
| **npm en cada push + `docker build` en PR a `main`** | **Seleccionada** | Respuesta rápida en `develop`, y el artefacto real se valida antes de llegar a `main` |

### Cuándo aplicar lint al contrato OpenAPI

| Opción                                                    | Decisión     | Motivo                                                                                                                                       |
| --------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Job en `ci.yaml`, en cada push**                        | **Seleccionada** | Se ejecuta en paralelo, por lo que no agrega espera; mismo patrón que los demás jobs                                                     |
| Workflow separado, solo cuando cambia `docs/openapi/**`   | Rechazada    | Ahorra algunos minutos de runner, pero una verificación filtrada por ruta que es obligatoria en `main` queda pendiente para siempre en los PR que no tocan el contrato |

## Consecuencias

### Positivas

- Respuesta en `develop` en pocos minutos, con el paso que falla claramente identificado.
- Nada llega a `main` sin pasar la suite de integración y construir sus imágenes.
- Lint y formato se aplican igual para todos, en lugar de depender de cada editor.
- Frontend y backend se ejecutan en paralelo y fallan de forma independiente.

### Negativas

- **Los problemas que solo cubre el Nivel 2 se descubren tarde:** una migración rota, un endpoint que se aparta del contrato o un Dockerfile roto aparecen al abrir el PR a `main`, no en el push a `develop`. Mitigación: ejecutar `make test-int` localmente al modificar migraciones, repositorios o controladores.
- **Las pruebas de integración intencionalmente en rojo bloquean `main`.** Por convención (ver [`backend/test/README.md`](../../backend/test/README.md)), una prueba queda en rojo cuando el backend se aparta del contrato OpenAPI. Esas brechas deben cerrarse antes de hacer merge a `main`.
- **La versión de Node está duplicada** en el workflow y en los Dockerfiles.
- La CI solo advierte hasta que `main` esté protegida (ver más abajo).

## Estado de implementación

| Elemento                                                    | Estado      |
| ----------------------------------------------------------- | ----------- |
| Job `frontend` (Nivel 1)                                    | Implementado |
| Job `backend` (Nivel 1)                                     | Implementado |
| Job `openapi-contract` (Nivel 1)                            | Implementado |
| Job `backend-integration` en PR a `main` (Nivel 2)          | Implementado |
| Job `docker-build` en PR a `main` (Nivel 2)                 | Implementado |
| Protección de `main` que exige pasar las verificaciones de CI | En curso (protección habilitada; las verificaciones obligatorias se seleccionarán después de su primera ejecución) |

## Evolución futura

- Agregar pruebas del frontend e incluirlas en el Nivel 1.
- Despliegue continuo ([ADR-009](./009-deploy-infrastructure.md), paso 4): publicar las imágenes validadas por el Nivel 2 y desplegarlas en EC2.
- Revisar el reparto si los fallos del Nivel 2 se vuelven frecuentes; la primera opción es mover las pruebas de integración a cada push a `develop`.
