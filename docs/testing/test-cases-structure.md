# Casos de prueba — Propósito, estructura y trazabilidad

Este documento explica cómo se gestionan los casos de prueba en el sistema de
gestión de Tornería Castro SRL: **por qué existen**, **dónde están** y **cómo cada uno
mantiene su vínculo** desde la especificación de negocio hasta el código que
lo comprueba en CI. Complementa a `estrategia-qa.md` (archivo citado, ausente en este repositorio), que
define la *estrategia* de pruebas (la pirámide, las herramientas, los invariantes); este
documento define su *registro y organización* (los artefactos y cómo se conectan).

> La organización de la suite se describe en [Estructura de pruebas de QA](code-structure.md). Sus diferencias con el [README de la suite](../../backend/test/README.md) están registradas en [inconsistencias documentales](../seguimiento/inconsistencias-documentales.md).

---

## 1. Propósito de los casos de prueba

Un **caso de prueba** es la afirmación verificable más pequeña sobre lo que el sistema debe
hacer. En este proyecto, cada caso de prueba existe para responder una pregunta con evidencia:
*«¿realmente se cumple esta regla de la ERS?»*

Los casos de prueba sirven a dos públicos diferentes a la vez y por eso existen en
dos formas:

- **Como especificaciones legibles para el negocio.** Cada caso describe, en lenguaje
  sencillo, una condición previa, los pasos, los datos de entrada y el resultado esperado.
  Esto es lo que una persona que no desarrolla —el cliente, el docente, alguien de QA
  que revisa— lee para confirmar que el sistema cubre el comportamiento real del
  taller. Se deriva directamente de los casos de uso y las reglas de negocio de la
  ERS: el curso normal de un caso de uso se convierte en el caso de prueba positivo
  (recorrido satisfactorio), y **cada curso alternativo se convierte en un caso negativo o límite**.

- **Como comprobaciones ejecutables.** Ese mismo caso se implementa como una
  prueba automatizada que se ejecuta en CI (GitHub Actions, según
  [ADR-009](../decisiones/009-deploy-infrastructure.md)). Si un cambio de código
  incumple la regla, la compilación falla.

El principio rector es el mismo que gobierna toda la arquitectura:
**complejidad adecuada, sin sobrediseño.** No perseguimos un porcentaje arbitrario
de cobertura. Un caso de prueba justifica su lugar solo si puede vincularse
con un caso de uso, una regla de negocio o uno de los cinco invariantes del sistema definidos en
`estrategia-qa.md` (inmutabilidad de precios, número correlativo de cotización, el taller
nunca ve dinero, máquinas de estados cerradas, trazabilidad completa). Si una prueba no puede
vincularse con ninguno de ellos, no pertenece a la suite.

Cada caso de prueba tiene un identificador estable: **`CP-NN`** (Caso de Prueba). Ese
id es el hilo que conecta los tres artefactos que se describen a continuación.

---

## 2. Estructura elegida

Los casos de prueba tienen **dos ubicaciones**, cada una con una única responsabilidad
sin superposición. No se duplica nada: nunca se mantiene el mismo contenido en
dos lugares.

### 2.1 El catálogo formal — `docs/testing/casos-de-prueba/`

La definición formal de cada caso de prueba destinada a las personas está aquí, con un documento
por módulo:

```
docs/testing/
├── estrategia-qa.md                 # estrategia de pruebas (pirámide, herramientas, invariantes)
└── casos-de-prueba/                 # catálogo formal de casos de prueba, un archivo por módulo
    ├── Clientes.docx
    ├── Fabricas.docx
    ├── Cotizaciones.docx
    ├── Ordenes-de-Trabajo.docx
    └── ...
```

Cada documento usa la tabla clásica de plan de pruebas: **ID, condición previa, pasos,
datos de prueba, resultado esperado, resultado real y estado**. Este es el entregable que
lee quien revisa y la fuente de verdad sobre *qué* debe probarse. Está escrito
en lenguaje de negocio y no presupone conocimientos del código.

#### Formato de la tabla de casos de prueba

Cada caso del catálogo se registra exactamente con estos campos:

| Campo | Significado |
|-------|---------|
| **ID** | Identificador estable `CP-NN`. Vínculo entre catálogo, README y código. |
| **Caso de uso / regla** | Caso de uso o regla de negocio de la ERS de donde deriva el caso (por ejemplo, CU-1, RN *Gestión de clientes*). |
| **Tipo** | Positivo (curso normal) o Negativo / Límite (curso alternativo). |
| **Condición previa** | Estado del sistema requerido antes de ejecutar los pasos. |
| **Pasos** | Acciones ordenadas que realiza el actor. |
| **Datos de prueba** | Valores concretos de entrada utilizados. |
| **Resultado esperado** | Resultado observable que hace que el caso pase. |
| **Resultado real** | Se completa al ejecutar. |
| **Estado** | Sin ejecutar · Aprobado · Fallido (por ejecución). |

Plantilla vacía (una fila por caso):

| ID | Caso de uso / regla | Tipo | Condición previa | Pasos | Datos de prueba | Resultado esperado | Resultado real | Estado |
|----|-----------------|------|--------------|-------|-----------|-----------------|---------------|--------|
| CP-NN | CU-x / RN-y | Positivo \| Negativo | … | 1. … 2. … | … | … | *(ejecución)* | *(ejecución)* |

Ejemplo desarrollado:

| ID | Caso de uso / regla | Tipo | Condición previa | Pasos | Datos de prueba | Resultado esperado | Resultado real | Estado |
|----|-----------------|------|--------------|-------|-----------|-----------------|---------------|--------|
| CP-01 | CU-1 Registrar cliente | Positivo | ERP autenticado; existe la fábrica EDASA. | 1. Abrir «Registrar cliente». 2. Ingresar datos de contacto. 3. Seleccionar la fábrica EDASA. 4. Confirmar. | Nombre «Juan», apellido «Pérez», DNI 30.111.222, correo juan.perez@edasa.com; fábrica EDASA. | El cliente se guarda como Activo, vinculado a EDASA y disponible para solicitudes de cotización. | — | Sin ejecutar |
| CP-05 | CU-1 Registrar cliente | Negativo | ERP autenticado; ya existe un cliente con DNI 30.111.222. | 1. Abrir «Registrar cliente». 2. Ingresar DNI 30.111.222. 3. Confirmar. | DNI 30.111.222 (duplicado). | El sistema informa que el cliente ya existe, ofrece abrir su ficha y no crea un duplicado. | — | Sin ejecutar |

> Nota: `.docx` es un formato binario, por lo que Git no mostrará diferencias significativas por
> pull request. Es un compromiso aceptado porque aquí se prioriza el documento
> formal y presentable. Si la visibilidad de cambios por PR se vuelve más
> importante que el formato del documento, pueden pasarse a `.md` sin
> cambiar nada más de este esquema.

### 2.2 La suite ejecutable — `backend/test/` y `e2e/`

La suite a cargo de QA se divide en dos raíces físicas, por nivel:

- **Integración + API** están en `backend/test/modules/<module>/`, junto al
  backend que las ejecuta.
- **E2E** está en `e2e/<module>/`, en la raíz del repositorio, junto a
  `backend/` y `frontend/`.

Cada carpeta de módulo es un «capítulo» autónomo, uno por nivel:

```
backend/test/
├── modules/
│   └── clientes/
│       ├── README.md                # capítulo del módulo → TRAZABILIDAD (ver §3)
│       ├── int/                     # pruebas profundas: endpoint → Guard → Prisma → Postgres
│       │   ├── clientes-unicidad.int.spec.ts
│       │   └── clientes-baja-logica.int.spec.ts
│       └── api/                     # pruebas de interfaz HTTP: CRUD, validación, RBAC
│           └── clientes.api.spec.ts
├── shared/
│   ├── harness/                     # preparación/limpieza global de Testcontainers + aplicación de prueba NestJS
│   ├── factories/                   # constructores de datos: unCliente(), unaFabrica()
│   ├── fixtures/                    # archivos reales: plano.pdf, pieza-patron.png
│   └── auth/                        # loginComo(role) + tokens precargados por rol
└── README.md                        # cómo funciona la suite de integración + API

e2e/
├── README.md                        # cómo funciona la suite E2E
├── shared/                          # datos de prueba de navegador + auxiliares de autenticación
└── clientes/                        # solo existe para módulos que necesitan cobertura E2E
    └── ...
```

Cada caso de prueba del catálogo se convierte en una prueba con nombre:

```ts
// backend/test/modules/clientes/api/clientes.api.spec.ts
it('CP-01 registra un cliente correctamente', ...)
it('CP-03 rechaza la creación con campos obligatorios faltantes', ...)

// backend/test/modules/clientes/int/clientes-unicidad.int.spec.ts
it('CP-05 rechaza un documento duplicado (409)', ...)
```

La separación entre carpetas sigue una regla:

- **`int/`** — un caso que comprueba una regla de la **base de datos o del
  circuito Guard → Prisma** (unicidad, baja lógica que conserva el
  historial, relación cliente↔fábrica). Se ejecuta contra un Postgres real
  iniciado una vez por ejecución mediante Testcontainers y aislado para ella.
- **`api/`** — un caso que comprueba el **comportamiento de la interfaz HTTP** (códigos de estado,
  validación de datos, filtros de listados, «solo el rol ERP puede operar sobre
  clientes»). Las pruebas exhaustivas de RBAC están en el módulo transversal `auth-rbac/`; cada
  módulo conserva solo una comprobación representativa de rol.
- **`e2e/<module>/`** — recorridos completos de usuario, agregados solo para los módulos que
  los necesitan. Un módulo CRUD simple (como Clientes) **no** tiene una carpeta `e2e/`
  para su módulo.

### 2.3 Qué queda deliberadamente *fuera* de `backend/test/` y `e2e/`

Esas dos raíces cubren únicamente integración + API + E2E. Dos tipos de prueba no
pertenecen allí:

- **Pruebas unitarias** (lógica pura de dominio y validación de esquemas, por ejemplo, el esquema Zod
  de un cliente o el formato DNI/CUIT) están junto al código que prueban, en
  `backend/src/<module>/*.spec.ts`, y se ejecutan con una **base de datos simulada**.
- **Pruebas de frontend** (comportamiento de componentes y cualquier caso puramente de interfaz como
  «cancelar descarta el formulario») están en `frontend/` con Vitest + React Testing
  Library.

Esos casos siguen registrados en el `.docx` (para que la visión de negocio esté
completa) y conservan un id `CP-NN`; solo su *implementación* está
en otro lugar.

---

## 3. Trazabilidad — el `README.md` del módulo

El catálogo dice *qué* se prueba. Las pruebas *lo demuestran*. El **`README.md`
del módulo es el puente entre ambos**: contiene únicamente la matriz de trazabilidad
para que cualquiera pueda responder «¿CP-05 está cubierto y dónde?» sin leer
el `.docx` ni el TypeScript.

Como integración/API y E2E están en raíces diferentes, cada una tiene su propio
README de módulo cuando corresponde:

- `backend/test/modules/clientes/README.md` — capítulo de integración + API.
- `e2e/clientes/README.md` — capítulo E2E, solo si el módulo tiene cobertura E2E.

`backend/test/modules/clientes/README.md` contiene:

1. Un propósito de una línea y un enlace al catálogo formal:
   `../../../../docs/testing/casos-de-prueba/Clientes.docx`.
2. Las referencias de la ERS que cubre el módulo (por ejemplo, CU-1…CU-4 y la regla de negocio
   *Gestión de clientes*).
3. La siguiente tabla de trazabilidad: una fila por caso de prueba.

| CP (ver `Clientes.docx`) | Nivel | Archivo · prueba | Invariante | Estado |
|--------------------------|-------|-------------|-----------|--------|
| CP-01 Creación exitosa | API | `api/clientes.api.spec.ts` · `it('CP-01…')` | — | ⬜ |
| CP-03 Campos obligatorios faltantes | API | `api/clientes.api.spec.ts` · `it('CP-03…')` | — | ⬜ |
| CP-05 Documento duplicado | Integración | `int/clientes-unicidad.int.spec.ts` · `it('CP-05…')` | Unicidad | ⬜ |
| CP-24 La baja lógica conserva el historial | Integración | `int/clientes-baja-logica.int.spec.ts` · `it('CP-24…')` | Trazabilidad | ⬜ |
| CP-06 Cancelar descarta el formulario | Frontend (fuera de `backend/test/` y `e2e/`) | `frontend/.../ClienteForm.test.tsx` | — | ⬜ |

Leyenda de estados: ⬜ pendiente · ✅ automatizado y correcto · 🟡 documentado, todavía sin automatizar.

### Cómo se mantienen sincronizados los tres artefactos

El id `CP-NN` es el único vínculo entre las tres capas:

```
Clientes.docx          →  define CP-05 (pasos, datos, resultado esperado)
        │  (mismo id)
README.md del módulo  →  vincula CP-05 con su archivo y estado
        │  (mismo id)
*.int.spec.ts          →  it('CP-05 …') lo comprueba en CI
```

Como el id es idéntico en todos los lugares, buscar `CP-05` en el repositorio
devuelve la fila del README y el `it()` que lo implementa, y el id
remite a la definición completa del catálogo. Un caso nunca puede
quedar desalineado silenciosamente entre capas: si el README lista un `CP` sin un `it()` correspondiente,
se ve que todavía no está automatizado; si una prueba referencia un `CP` ausente del
catálogo, el catálogo está desactualizado.

### Flujo para agregar o cambiar un caso de prueba

1. Escribir o actualizar el caso en el `.docx` del módulo (primero la definición).
2. Agregar su fila a la tabla de trazabilidad del `README.md` del módulo.
3. Implementarlo como un `it('CP-NN …')` en la ubicación correcta de `int/`, `api/`,
   `frontend/` o `backend/src`.
4. Cambiar el estado del README a ✅ una vez automatizado y correcto en CI.

Cada error de producción se convierte en un nuevo `CP` antes de cerrarse: se registra,
se vincula y se agrega como prueba de regresión en el mismo pull request.
