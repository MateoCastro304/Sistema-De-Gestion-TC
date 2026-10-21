# ADR-012 — Pruebas E2E del frontend con Playwright

**Fecha:** 2026-10
**Estado:** Propuesta (en uso desde octubre de 2026; pendiente de aprobación del equipo)
**Responsables de la decisión:** a definir

---

## Contexto y problema

Hasta octubre de 2026 el frontend no tenía pruebas ([backlog de ingeniería](../seguimiento/engineering-backlog.md#4-frontend)). Cada historia de Jira define criterios de aceptación que se ven en pantalla: validaciones de formularios, mensajes de error, registros que no se pueden repetir, bajas bloqueadas y acceso según el rol. Hacía falta una forma de comprobarlos que no dependiera de probar a mano.

Las [guías de testing](../testing/code-structure.md) reparten las pruebas así: unitarias junto al código, de integración y API en `backend/test/`, y E2E en `e2e/`, en la raíz del repositorio, a cargo de QA y contra los servicios de `docker-compose`. Para el frontend prevén Vitest + React Testing Library ([organización de casos de prueba](../testing/test-cases-structure.md)). Ninguna de esas suites existía para el frontend.

## Alternativas consideradas

- **Vitest + React Testing Library** (prevista en las guías de testing y en el backlog). Prueba componentes aislados en un navegador simulado. Sirve para la lógica de un formulario o un componente, pero no recorre la aplicación como un usuario: navegación, rutas, menú por rol, avisos.
- **La suite E2E de QA en `e2e/`**, contra el backend real con `docker-compose`. Prueba el sistema completo, pero necesita que el backend de cada historia exista, y los datos de la base cambian entre pruebas. Todavía no existe.

## Decisión

Probar el frontend con **Playwright**, en `frontend/e2e/`, contra la aplicación en modo desarrollo con la API simulada ([ADR-011](011-frontend-api-mocks.md)):

- Un archivo por feature, con la misma estructura que `src/features/`.
- Cada grupo de pruebas se identifica con sus casos de uso y su historia (`[DTC-33][CU-53]`) y una etiqueta de sprint (`@sprint1`, `@sprint2`). Cada sprint se corre por separado. Las pruebas del Sprint 1 tienen que estar siempre en verde.
- Las pruebas buscan los elementos por su rol y su rótulo, como un usuario, y no por clases CSS.
- Cada prueba arranca con los datos iniciales de los mocks, así que son independientes y corren en paralelo.
- Las pruebas de una historia se escriben antes que su pantalla: primero fallan porque la pantalla no existe, y la historia está terminada cuando pasan.

Esta suite **no reemplaza** a la E2E de QA: prueba el frontend (pantallas, navegación, validaciones y cómo se muestran las respuestas de la API), no la integración con el backend real. El detalle está en [TESTING.md](../../frontend/frontend-Documents/TESTING.md).

## Consecuencias

- Los criterios de aceptación de cada historia quedan cubiertos por pruebas que corren sin backend, base de datos ni Docker.
- Los recorridos, el acceso por rol y los mensajes que ve el usuario se prueban en un navegador real.
- Exigir rótulos accesibles en las pruebas obliga a que las pantallas los tengan.
- **Las pruebas valen lo que valen los mocks.** Si un mock no sigue al backend, una prueba puede pasar con una pantalla que falla contra el backend real (ver [ADR-011](011-frontend-api-mocks.md#consecuencias)).
- Cada máquina necesita instalar el navegador de Playwright una vez (`npx playwright install chromium`).

## Referencias y pendientes

- **No corren en la CI.** El job `frontend` de [ADR-010](010-continuous-integration.md) solo ejecuta lint y compilación.
- **Faltan pruebas unitarias** de la lógica suelta (validación de CUIT, teléfonos, esquemas de formularios), para las que sigue prevista Vitest.
- **Diferencia con las guías de testing:** no contemplan esta suite y prevén Vitest para el frontend. Ver [inconsistencias documentales](../seguimiento/inconsistencias-documentales.md#doc-06--organización-y-ejecución-de-las-pruebas).
- [Arquitectura del frontend](../arquitectura/frontend.md#pruebas).
