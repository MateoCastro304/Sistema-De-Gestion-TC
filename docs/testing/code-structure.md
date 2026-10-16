# Estructura de pruebas de QA — Organización por módulos

**Proyecto:** Tornería Castro SRL — Sistema de gestión
**Alcance de este documento:** cómo se organizan y ejecutan las pruebas unitarias, de integración, de API y de extremo a extremo.
**Destinatarios:** cualquier desarrollador o tester que se incorpore al proyecto.

---

> **Discrepancia abierta.** Esta guía separa las pruebas de integración y de API, mientras el [README de la suite](../../backend/test/README.md) documenta tests de integración que verifican contrato y base en el mismo test. El momento de ejecución en CI (§3.2) también difiere de [ADR-010](../decisiones/010-continuous-integration.md). Ver [inconsistencias documentales](../seguimiento/inconsistencias-documentales.md).

## 1. Propósito y alcance

Este documento describe cómo se estructura la suite de pruebas para que cualquier persona pueda abrir el repositorio y comprender dónde está cada prueba, cómo se nombra y cómo ejecutarla.

El límite de responsabilidades es fijo:

- **Pruebas unitarias → desarrolladores.** La lógica de negocio pura (cálculo de costos, actualizaciones del tipo de cambio del dólar, validaciones Zod) se prueba junto al código fuente, en `backend/src/<module>/`, con una **base de datos simulada**.
- **Pruebas de integración, API y E2E → QA.** Todo lo que requiere una base de datos real, la interfaz HTTP o un navegador real es responsabilidad de QA, que también lo mantiene.

QA **no** vuelve a probar los cálculos que ya cubre una prueba unitaria. QA comprueba que, una vez que una solicitud atraviesa el endpoint, el guard, el servicio y Postgres, se cumplan las garantías del sistema.

---

## 2. Organización de la suite

### 2.1 Principio de organización

**Un módulo de negocio = una carpeta por nivel de prueba.** Las pruebas de cada módulo se distribuyen en tres ubicaciones físicas, una por nivel, reflejando los módulos del backend uno a uno para que quien conoce el dominio ya sepa dónde buscar:

| Nivel | Ubicación |
|-------|----------|
| Unitario | `backend/src/<module>/` (junto al código) |
| Integración + API | `backend/test/modules/<module>/` |
| E2E | `e2e/<module>/` (raíz del repositorio) |

---

### 2.2 Estructura de carpetas

```
backend/
├── src/
│   └── <module>/
│       ├── ...                       # controlador, servicio, dominio, dto
│       └── *.spec.ts                 # pruebas unitarias: lógica de negocio, BD simulada
└── test/
    ├── modules/
    │   ├── cotizaciones/              # cotizaciones
    │   │   ├── int/
    │   │   │   ├── registrar-cotizacion.int.spec.ts
    │   │   │   ├── precio-inmutable.int.spec.ts
    │   │   │   └── adjudicacion.int.spec.ts
    │   │   └── api/
    │   │       └── cotizaciones.api.spec.ts
    │   ├── ordenes-trabajo/           { int/ · api/ }   # órdenes de trabajo
    │   ├── auth-rbac/                 { int/ }          # transversal
    │   ├── tipos-proceso/             { int/ · api/ }   # tipos de proceso
    │   ├── clientes/                  { int/ · api/ }   # clientes
    │   ├── piezas/                    { int/ · api/ }   # piezas
    │   ├── reportes/                  { int/ · api/ }   # reportes
    │   ├── pdf/                       { int/ }           # servicio PDF
    │   └── scheduler/                 { int/ }           # tareas programadas
    ├── shared/
    │   ├── harness/                    # preparación/limpieza global de Testcontainers + aplicación de prueba NestJS
    │   ├── factories/                  # constructores de datos: unaCotizacionAdjudicable(), unTipoProceso()
    │   ├── fixtures/                   # archivos reales: plano.pdf, pieza-patron.png, diseno.stp
    │   └── auth/                       # loginComo(role) y tokens precargados por rol
    ├── jest-integration.config.ts
    ├── jest-api.config.ts
    └── README.md                       # cómo funciona la suite de integración + API

e2e/                                     # raíz del repositorio, junto a backend/ y frontend/
├── README.md                            # cómo funciona la suite E2E
├── playwright.config.ts
├── shared/                              # datos de prueba y auxiliares de autenticación específicos de los recorridos E2E
└── <module>/
    └── camino-de-la-pieza.e2e.spec.ts
```

Dos decisiones de diseño que conviene fijar desde el comienzo:

- **Los aspectos transversales tienen su propio módulo.** RBAC y JWT están en `auth-rbac/` para no duplicarlos, pero el capítulo de cada módulo referencia qué filas de la matriz RBAC le corresponden.
- **Las conexiones entre módulos se documentan en ambos lados.** La adjudicación (registro de la orden de compra) está en `cotizaciones/` porque actúa sobre la cotización, mientras que el ciclo de vida de la orden de trabajo está en `ordenes-trabajo/`. Ambos capítulos nombran explícitamente esa conexión para que la transición no se pruebe dos veces ni quede sin responsable.

---

### 2.3 Convenciones de nombres

**Nombres de archivos:** `<topic>.<level>.spec.ts`, donde el nivel es `int`, `api` o `e2e` (`.spec.ts` sin sufijo de nivel para las pruebas unitarias junto al código). Así, un patrón selecciona una capa completa (`**/*.int.spec.ts`) y el nivel se reconoce a simple vista.

**Etiquetas en bloques `describe`:** cada suite comienza con los identificadores de la ERS que cubre, entre corchetes, para poder filtrar las pruebas y vincularlas con los requisitos:

```ts
describe('[CU-23][INV-1] Registrar orden de compra', () => { ... })
```

Esto permite ejecutar todo lo relacionado con el invariante de precio mediante `jest -t "INV-1"`.

---

### 2.4 Definición de los niveles de prueba

La convención más importante: qué significa cada nivel en este proyecto. Esto evita que se confundan las pruebas «unitarias», «de API» y «de integración».

| Nivel | Ubicación | Qué ejercita | Qué verifica | Herramientas |
|-------|----------|--------------------|---------------------|---------|
| **Unitario** | `backend/src/<module>/*.spec.ts` | lógica de negocio pura de forma aislada | reglas de negocio que no necesitan una base de datos real: cálculo de costos, transiciones de máquinas de estados, validaciones Zod | Jest, base de datos simulada |
| **Integración** | `backend/test/modules/<module>/int/` | endpoint → guard → servicio → Prisma → **Postgres real** | reglas de negocio e invariantes que solo se cumplen de extremo a extremo (la mayor parte de la suite de QA) | Jest + Supertest + Testcontainers, un contenedor de base de datos iniciado por ejecución y aislado para ella |
| **API / contrato** | `backend/test/modules/<module>/api/` | la interfaz HTTP | códigos de estado, estructura de respuesta (contra OpenAPI), validación de entrada, filtros y paginación; **no** reglas profundas de negocio | Jest + Supertest (misma aplicación de prueba que integración) |
| **E2E** | `e2e/<module>/` | un navegador real contra el conjunto de servicios `docker-compose` | recorridos críticos completos de usuario | Playwright |

Regla práctica:

- Comprobar *«el descuento se calcula correctamente dada una tarifa y una cantidad»* → **unitario**.
- Comprobar *«el precio no cambia una vez adjudicado»* → **integración**.
- Comprobar *«devuelve 400 cuando falta la moneda»* → **API**.
- Comprobar *«el usuario puede completar la cotización»* → **E2E**.

---

## 3. Ejecución e infraestructura

### 3.1 Infraestructura compartida y archivos de prueba

`backend/test/shared/harness/` inicia un Postgres efímero mediante Testcontainers **una vez por ejecución** (`global-setup.ts`/`global-teardown.ts`) —todos los archivos de pruebas de integración y API de esa ejecución comparten un único contenedor de base de datos, en lugar de uno por archivo— e inicia la aplicación de prueba NestJS contra él; la limpieza elimina ambos al finalizar. Los constructores de `backend/test/shared/factories/` generan datos legibles (`unaCotizacionAdjudicable(100000)`) para que las pruebas cuenten una historia en lugar de armar objetos manualmente. `backend/test/shared/fixtures/` contiene archivos reales de ejemplo (un plano PDF, un PNG de una pieza patrón, un archivo STEP 3D) para escenarios de carga, y `backend/test/shared/auth/` expone `loginComo(role)` junto con tokens precargados para cada rol, de modo que las comprobaciones RBAC ocupen una línea.

`e2e/` no usa la infraestructura de Testcontainers: E2E ejecuta Playwright contra el conjunto real de servicios `docker-compose`, por lo que `e2e/shared/` solo contiene datos de prueba de navegador y auxiliares de autenticación (por ejemplo, sesiones/cookies precargadas), sin infraestructura de base de datos.

---

### 3.2 Integración con CI

En **GitHub Actions**, la etapa *Pruebas y validación* ejecuta `test:int` y `test:api` desde `backend/` en cada push, y `test:e2e` desde `e2e/` en pull requests a `main`. Como cada módulo es autónomo, la suite puede paralelizarse por módulo a medida que crece, y un desarrollador que solo modifica `ordenes-trabajo` ejecuta únicamente ese capítulo para obtener resultados en segundos. Todo error encontrado en QA o producción entra a la suite como prueba de regresión —etiquetada con su CU e invariante— antes de cerrar la incidencia.

---

## 4. Documentación y trazabilidad por módulo

### 4.1 Archivos README principales (`backend/test/README.md` y `e2e/README.md`)

No hay un único README general de QA: la suite de integración/API y la suite E2E están en raíces diferentes (`backend/` y la raíz del repositorio), por lo que cada una tiene su propio punto de entrada.

**`backend/test/README.md`** — lo primero que se lee antes de modificar una prueba de integración o API:

1. **Propósito y alcance** — integración y API, y el límite con las pruebas unitarias de `backend/src/`.
2. **Cómo se organiza** — por módulos; un mapa de los módulos dentro de `test/modules/`.
3. **Convenciones** — nombres de archivos, etiquetas y definición de cada nivel (la tabla de §2.4).
4. **Infraestructura y datos de prueba** — cómo se inicia la base de datos de Testcontainers una vez por ejecución (`shared/harness/`) y dónde están los constructores de datos y archivos de prueba.
5. **Cómo ejecutar** — localmente (`npm run test:int`, `npm run test:api`, `npm run test:module -- <module>`) y en CI.
6. **Cómo agregar una prueba y reportar un error** — el ciclo de trabajo.
7. **Índice de módulos** — enlaces al capítulo de cada módulo en `test/modules/<module>/`.
8. **Glosario mínimo** — roles (JT, EC, ERP…).

**`e2e/README.md`** — punto de entrada para recorridos de navegador:

1. **Propósito y alcance** — qué módulos tienen cobertura E2E y por qué (no todos la necesitan; un módulo CRUD simple puede no tenerla).
2. **Cómo se organiza** — una carpeta por módulo en `e2e/<module>/`.
3. **Cómo ejecutar** — localmente contra `docker compose up` y en CI (pull requests a `main`).
4. **Datos de prueba y auxiliares de autenticación** — `e2e/shared/`.
5. **Índice de módulos** — enlaces a los recorridos de cada módulo.

---

### 4.2 Plantilla del capítulo de un módulo

La trazabilidad de cada módulo está cerca de sus pruebas en lugar de concentrarse en un documento enorme:

- `backend/test/modules/<module>/README.md` — cubre el capítulo de **integración + API** del módulo.
- `e2e/<module>/README.md` — cubre el capítulo **E2E** del módulo, solo para los que lo tienen.

Cada capítulo tiene la misma forma, de modo que conocer uno permite leerlos todos:

1. **Propósito** (una línea) y módulo del backend que cubre.
2. **Casos de uso cubiertos** — tabla CU → estado.
3. **Invariantes y reglas de negocio involucrados.**
4. **Límite con los desarrolladores** — qué prueba QA aquí y qué queda del lado unitario (`backend/src/<module>/*.spec.ts`).
5. **Escenarios por nivel** — integración / API (o E2E en el capítulo de `e2e/`), cada uno con un criterio de aceptación resumido.
6. **Matriz de trazabilidad del módulo** — CU/RN → nivel → archivo → estado.
7. **Datos de prueba y condiciones previas.**
8. **Cómo ejecutar solo este módulo.**
9. **Riesgos abiertos / pendientes.**

---

### 4.3 Ejemplo de capítulo completo — Cotizaciones

Un capítulo completamente desarrollado siguiendo la plantilla anterior. Está en `backend/test/modules/cotizaciones/README.md` (el capítulo E2E de este módulo, si existiera, estaría en `e2e/cotizaciones/README.md`).

**1. Propósito.** Verifica la creación, consulta y adjudicación de cotizaciones. Cubre el módulo `cotizaciones` del backend.

**2. Casos de uso cubiertos.**

| CU | Nombre | Estado |
|----|------|--------|
| CU-14 | Registrar cotización | ✅ |
| CU-15 | Consultar cotizaciones | ✅ |
| CU-16 | Consultar el historial de cotizaciones de una pieza | ⬜ |
| CU-17 | Generar cotización a partir de una anterior | ⬜ |
| CU-18 | Aplicar descuento | ✅ |
| CU-20 | Generar informe de cotización | 🔗 (ver módulo `pdf`) |
| CU-23 | Registrar orden de compra | ✅ |

**3. Invariantes involucrados.** INV-1 inmutabilidad del precio después de adjudicar · INV-2 número correlativo único · INV-4 máquina de estados de cotización (`Pendiente → Cotizada → {Vencida | Adjudicada totalmente | Adjudicada parcialmente}`) · INV-5 trazabilidad de cambios previos a la adjudicación.

**4. Límite con los desarrolladores.** El cálculo de costos (patrón Composite), las actualizaciones del tipo de cambio del dólar y la validación Zod son **pruebas unitarias de los desarrolladores**, en `backend/src/cotizaciones/*.spec.ts`. QA no vuelve a probar los cálculos; comprueba que —pasando por el endpoint con Postgres real— el correlativo nunca se repita, el precio se congele al adjudicar, los descuentos se rechacen una vez adjudicada y las órdenes de trabajo se generen correctamente.

**5. Escenarios por nivel.**

*Integración* — Número correlativo único ante N creaciones concurrentes (INV-2) · Precio congelado al registrar la orden de compra y modificación posterior rechazada (INV-1) · Descuento rechazado sobre una cotización adjudicada (CU-18) · Adjudicación parcial de 2 de 3 ítems genera 2 órdenes de trabajo independientes (CU-23, INV-4) · Cada cambio previo a adjudicar se registra en el historial (INV-5).

*API* — `POST /cotizaciones` con moneda inválida → 400 · valor del dólar faltante → 400 · `GET /cotizaciones?cliente=&estado=&desde=&hasta=` devuelve la estructura paginada del contrato OpenAPI · `GET /cotizaciones/:id` para un id inexistente → 404.

*E2E* (`e2e/cotizaciones/`) — Flujo satisfactorio del «camino de la pieza» (ERP registra la solicitud → EC cotiza un conjunto → informe PDF → ERP adjudica parcialmente), como recorrido completo de navegador.

**6. Matriz de trazabilidad del módulo.**

| CU / RN | Invariante | Nivel | Archivo | Estado |
|---------|-----------|-------|------|--------|
| CU-14 | — | Integración + E2E | `backend/test/modules/cotizaciones/int/registrar-cotizacion.int.spec.ts` + `e2e/cotizaciones/camino-de-la-pieza.e2e.spec.ts` | ✅ |
| RN correlativo | INV-2 | Integración | `backend/test/modules/cotizaciones/int/registrar-cotizacion.int.spec.ts` | ✅ |
| CU-23 | INV-1, INV-4 | Integración | `backend/test/modules/cotizaciones/int/adjudicacion.int.spec.ts` | ✅ |
| RN inmutabilidad de precio | INV-1 | Integración | `backend/test/modules/cotizaciones/int/precio-inmutable.int.spec.ts` | ✅ |
| CU-18 | INV-1 | Integración | `backend/test/modules/cotizaciones/int/adjudicacion.int.spec.ts` | ✅ |
| CU-15 | — | API | `backend/test/modules/cotizaciones/api/cotizaciones.api.spec.ts` | ✅ |

**7. Datos de prueba.** Constructores: `unaCotizacionCotizada()`, `unaCotizacionAdjudicable(price)`, `unaCotizacionVencida()`. Archivos de prueba: `plano.pdf`. Roles usados: EC, ERP.

**8. Cómo ejecutar.** `npm run test:module -- cotizaciones` (desde `backend/`, ejecuta integración + API del módulo) · `npm run test:e2e -- cotizaciones` (desde `e2e/`).

**9. Riesgos abiertos.** CU-16/17 (historial y recotización) todavía sin cobertura. Falta acordar con desarrollo: ¿qué ocurre al adjudicar una cotización **Vencida**: se bloquea o se revalida? (afecta al escenario de `adjudicacion.int.spec.ts`).

---

## 5. Ciclo de trabajo

- **Un caso de uso se vuelve comprobable** cuando se escriben sus criterios de aceptación (Dado/Cuando/Entonces). QA los escribe con el desarrollador antes o durante la construcción del código.
- **Cuando un caso de uso está terminado:** primero pruebas manuales exploratorias para *descubrir*; luego, el curso normal y los casos límite se convierten en pruebas automatizadas de regresión para *proteger*.
- **Cada prueba se vincula** con un CU, una regla de negocio o un invariante mediante su etiqueta entre corchetes y su fila en la matriz del módulo.
