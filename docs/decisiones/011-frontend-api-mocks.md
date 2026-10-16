# ADR-011 — Simulación de la API en el frontend con MSW

**Fecha:** 2026-10
**Estado:** Propuesta (en uso desde el Sprint 1; pendiente de aprobación del equipo)
**Responsables de la decisión:** a definir

---

## Contexto y problema

El frontend tiene que poder avanzar sin depender de que el backend esté listo. En el Sprint 2 la situación es completa: el [contrato del Sprint 2](../api-contract/API_CONTRACT_SPRINT_2.md) define dieciocho endpoints nuevos (sesión, empleados, usuarios, tipos de proceso y materiales) que todavía no están implementados, y las pantallas se construyen en paralelo.

Además, las pruebas E2E del frontend ([ADR-012](012-frontend-e2e-tests.md)) necesitan datos conocidos y repetibles en cada prueba, sin levantar una base de datos.

El flujo habitual de desarrollo, descrito en [SETUP.md](../SETUP.md), levanta el frontend, el backend y PostgreSQL con Docker. Ese flujo no resuelve ninguno de los dos casos: no existe backend para los endpoints nuevos, y los datos de la base cambian entre una prueba y otra.

## Decisión

Simular la API en el navegador con **MSW** (Mock Service Worker), instalado en el frontend desde agosto de 2026:

- **Solo en desarrollo.** Los mocks se prenden con `VITE_USE_MOCKS=true` en `.env.local`. Sin esa variable, las peticiones van al backend real. El código de los mocks se carga con un `import()` dinámico que la compilación de producción descarta.
- **Junto a cada feature.** Cada módulo de `features/` tiene sus datos de prueba (`api/<feature>.db.ts`) y sus respuestas simuladas (`api/<feature>.mocks.ts`); `app/mocks/handlers.ts` los reúne.
- **Copian el comportamiento real.** Los del Sprint 1 copian lo que hace hoy el backend: rutas, mensajes, códigos de error y normalizaciones. Los del Sprint 2 copian el contrato. Si el backend o el contrato cambian, el mock se actualiza en el mismo PR.
- **Sesión simulada.** Los mocks reproducen el ingreso, la renovación y el cierre de sesión del Sprint 2, y los usuarios de prueba de cada rol. Los endpoints del Sprint 1 empiezan a exigir sesión cuando el ingreso esté implementado (`SPRINT_1_REQUIRES_SESSION`).

El detalle de uso está en [MOCKS.md](../../frontend/frontend-Documents/MOCKS.md).

## Consecuencias

- Las pantallas del Sprint 2 se pueden construir y probar antes que su backend.
- Las pruebas E2E del frontend corren sin backend, base de datos ni Docker, y cada prueba arranca con los mismos datos.
- **Hay que mantener los mocks al día.** Un mock que no sigue al backend hace que las pruebas pasen aunque la pantalla falle contra el backend real. Pasó con la reorganización del backend del 16/10/2026: la ruta de encargados pasó a `/managers` y cambió el mensaje de la baja de fábricas; las pruebas detectaron el error de la pantalla recién cuando se actualizó el mock.
- Los mocks no prueban el backend ni la integración con él. Eso queda para las pruebas de integración y API del backend y la suite E2E de QA ([estructura de pruebas](../testing/code-structure.md)).

## Referencias y pendientes

- [Arquitectura del frontend](../arquitectura/frontend.md#mocks-de-la-api).
- [ADR-006](006-frontend-stack.md): tecnologías del frontend. MSW no figura entre sus bibliotecas complementarias.
- [ADR-012](012-frontend-e2e-tests.md): pruebas E2E del frontend, que dependen de estos mocks.
