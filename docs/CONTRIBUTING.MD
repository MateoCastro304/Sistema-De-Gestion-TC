# Contribuir a Tornería Castro

Este documento define las convenciones que sigue el equipo al trabajar en este monorepositorio. El objetivo es mantener un historial legible, evitar conflictos y asegurar que los cambios en contratos compartidos (OpenAPI, variables de entorno) no rompan silenciosamente el trabajo de otra persona.

## Idioma

Usamos inglés para todo el código y commits, los comentarios y la documentación en español. Esto facilita la incorporación de nuevos integrantes al equipo y evita confusiones al buscar ayuda en línea.

## Ramas

Los nombres de las ramas siguen este patrón:

```
<type>/-<short-description>
```

Donde `<type>` es uno de: `feature`, `fix`, `chore`, `docs`, `ci`.

Ejemplos:

```
feature/openapi-schema-quotes
fix/quote-expiration-job
chore/eslint-config
```

Mantené la descripción breve (3 a 5 palabras), en minúsculas y con guiones en lugar de espacios.

## Mensajes de commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>
```

Tipos: `feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `test`.

Ejemplos:

```
feat(backend): add quote expiration scheduler
fix(openapi): correct required fields in QuoteItem schema
refactor(frontend): move useToast to shared
ci: add docker build job
docs: add ADR-010 continuous integration
```

Esto va más allá del estilo: permite generar registros de cambios automáticamente en el futuro y hace que `git log` sea útil al depurar.

## Pull requests

Cada PR se utilizar al subir cambios a main y debe:

- Referenciar su ticket de Jira.
- Usar la plantilla de PR (`.github/PULL_REQUEST_TEMPLATE.md`): no elimines la lista de verificación.
- Ser revisado y aprobado por al menos otro integrante del equipo antes de fusionarse.
- Centrarse en un solo tema. Si encontrás algo que corregir que no está relacionado, abrí otro PR.

## La regla de las variables de entorno

**Si tu PR introduce una variable de entorno nueva, debe actualizar el `.env.example` que corresponda en el mismo commit**: `infrastructure/docker/.env.example` (el que usa Docker) y `backend/.env.example` si es del backend, o `frontend/.env.example` si es del frontend. Si es del backend, también tiene que agregarse a `backend/src/config/env.validation.ts`.

Esta es la causa más común de errores de «en mi máquina funciona» cuando trabajan varios desarrolladores: alguien agrega una variable localmente, se olvida de avisar al equipo y el `docker compose up` de la siguiente persona falla con un error confuso.

El backend valida sus variables al arrancar, así que una variable obligatoria que falta hace fallar el arranque con un mensaje claro. Pero la validación no sabe si `.env.example` está al día: eso se sigue exigiendo en la revisión de PR. Quienes revisan deben rechazar un PR que agregue configuración sin modificar `.env.example`, y los valores de ejemplo tienen que pasar la validación, para que una copia recién hecha de `.env.example` funcione sin cambios.

## Primero el contrato: cambios en la especificación OpenAPI

Si tu cambio afecta algún endpoint de la API (ruta nueva, esquema modificado o respuesta modificada), actualizá el archivo correspondiente en `openapi/` en el mismo PR que el cambio del backend. El contrato OpenAPI es la fuente de verdad: el backend lo implementa, y no al revés.

## Expectativas de la revisión de código

- No apruebes un PR que no hayas leído realmente.
- Si no estás seguro de que algo sea correcto, preguntá: una pregunta durante la revisión cuesta menos que un error en producción.
- Se prefieren PR pequeños y frecuentes frente a otros grandes que sean difíciles de revisar en profundidad.

## Decisiones de arquitectura

Documentá siempre las decisiones de arquitectura en ADR (registros de decisiones de arquitectura) dentro de `docs/decisiones/`. Si estás tomando una decisión que afecta la arquitectura del sistema, escribí un ADR antes de implementarla. Esto ayuda al equipo a comprender por qué se tomó una decisión y facilita revisarla más adelante.

También revisá los ADR existentes antes de tomar una decisión: si ya se tomó una similar, quizás no necesites escribir uno nuevo.

## Preguntas

Si una convención no encaja con una situación que enfrentás, plantealo al equipo en lugar de eludirla sin avisar: las convenciones deben EVOLUCIONAR cuando dejan de tener sentido, en vez de ignorarse.
