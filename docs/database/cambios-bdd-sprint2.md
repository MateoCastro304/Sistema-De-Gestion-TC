# Cambios en la base de datos para el Sprint 2

| Campo       | Valor                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| Estado      | Aplicado en `schema.prisma` (20/10/2026). Migraciones pendientes (§8). Desvíos respecto de la propuesta en §10  |
| Fecha       | 19/10/2026 (actualizado 20/10/2026)                                                                             |
| Fuentes     | [API Contract Sprint 2](../api-contract/API_CONTRACT_SPRINT_2.md), [modelo de dominio](../dominio/05-modelo-de-dominio.md), `backend/prisma/schema.prisma` y sus migraciones |
| Referencia  | `schema.prisma` del backend de VZ Causas (tablas `User` y `RefreshToken`)                                       |
| Diagrama    | [DER Sprint 1 y 2](der-sprint-1-2.md)                                                                           |

## Índice

1. [Criterios del diseño](#1-criterios-del-diseño)
2. [Evaluación del schema del Sprint 1](#2-evaluación-del-schema-del-sprint-1)
3. [Qué se reutiliza de VZ Causas](#3-qué-se-reutiliza-de-vz-causas)
4. [Tablas nuevas del Sprint 2](#4-tablas-nuevas-del-sprint-2)
5. [Restricciones](#5-restricciones)
6. [Comparación de textos sin extensiones](#6-comparación-de-textos-sin-extensiones)
7. [Reglas que quedan en la aplicación](#7-reglas-que-quedan-en-la-aplicación)
8. [Plan de migraciones](#8-plan-de-migraciones)
9. [Decisiones pendientes](#9-decisiones-pendientes)
10. [Desvíos aplicados respecto de la propuesta](#10-desvíos-aplicados-respecto-de-la-propuesta)

---

## 1. Criterios del diseño

- **La base garantiza invariantes declarativos; la aplicación ejecuta las reglas
  de negocio.** Se usan claves primarias y foráneas, `UNIQUE`, `NOT NULL` y
  `CHECK`. **No se agregan triggers, funciones ni extensiones de PostgreSQL.**
  Las reglas con efectos (historial, bajas en cascada, bloqueo) las ejecutan los
  casos de uso dentro de una transacción (§7). Así el comportamiento es el mismo
  con los repositorios Prisma y con los repositorios en memoria que usan los
  tests.
- **Convenciones del Sprint 1:** tablas en singular y `snake_case`, enums con
  sufijo `_enum`, identificadores enteros autoincrementales, baja lógica con
  `is_active`. `user` es palabra reservada en PostgreSQL, por eso la tabla de
  usuarios se llama `app_user`.
- **Tipos:**
  - Fechas y horas en `TIMESTAMPTZ(6)`: el contrato exige UTC, y un `TIMESTAMP`
    sin zona depende de la zona horaria de la conexión para interpretarse.
  - Montos y tipo de cambio en `NUMERIC(12,2)`: el punto flotante binario
    (IEEE 754) no representa exactamente valores como `1.13`, y el contrato y
    RNF11 piden decimales exactos de dos posiciones.
- **Lo que Prisma no expresa** (índices por expresión o parciales, `CHECK`) va en
  una migración creada con `--create-only`, como ya se hace en el Sprint 1 (ver
  [migraciones](Prisma/Migrations.md)).

---

## 2. Evaluación del schema del Sprint 1

| #   | Hallazgo | Impacto | Corrección propuesta |
| --- | -------- | ------- | -------------------- |
| S1-1 | `category.name` admite `NULL` y **no tiene índice único**. | `CATEGORY_NAME_TAKEN` y `CATEGORY_NAME_TAKEN_BY_INACTIVE` solo los controla el código: dos altas simultáneas pueden duplicar un rubro. Según el contrato, el nombre no se repite entre ningún rubro, activo o inactivo. | `NOT NULL` y `UNIQUE (lower(name))`. Antes de migrar, verificar que no haya nulos ni duplicados. |
| S1-2 | El comentario de `File` anuncia `CHECK (size_bytes > 0)`, pero **ninguna migración lo crea**. | La regla está documentada y no se aplica. | Agregar el `CHECK`. |
| S1-3 | `created_at` y `updated_at` son `TIMESTAMP(3)` **sin zona horaria**; `file.uploaded_at` es `TIMESTAMPTZ(6)`. | Tipos mezclados. El valor depende de la zona de la conexión. | `ALTER COLUMN ... TYPE timestamptz(6) USING col AT TIME ZONE 'UTC'` en las seis tablas del Sprint 1. |
| S1-4 | `updated_at` es `NOT NULL` sin `DEFAULT`. | Todo `INSERT` en SQL crudo tiene que escribirlo a mano (lo hizo la migración que carga el rubro "Particular"). | `DEFAULT now()`. `@updatedAt` lo sigue actualizando desde Prisma. |
| S1-5 | Las claves foráneas no tienen índice: `factory_customer.categorie_id` y `quote_request (manager_factory_id, manager_customer_id)`. | PostgreSQL no indexa las FK automáticamente. La regla "rubro con fábricas activas" recorre la tabla entera. | `INDEX (category_id)` (simple, no parcial: ver §10) e `INDEX (manager_factory_id, manager_customer_id)`. |
| S1-6 | La columna sigue escrita `categorie_id`. | Arrastra el error del script original. | `ALTER TABLE ... RENAME COLUMN categorie_id TO category_id` (escrito a mano: Prisma lo genera como `DROP` + `ADD` y pierde los datos) y actualizar `@map`. |
| S1-7 | Comentarios desactualizados en `schema.prisma`: citan `docs/database/setup_support_sprint1.sql` (borrado) y el trigger `fn_gen_id_manager` (eliminado en `20261008000000_customers_factories_rules`). | Confunden a quien lea el schema. | Actualizarlos junto con las migraciones de este documento. |
| S1-8 | El CUIT es `VARCHAR(50)` sin `CHECK` de formato, en `factory_customer` y en `supplier`. El seed arma un formato con guiones (`cuitDashed`, comentado como el de proveedores) y otro sin ellos (`cuitDigits`). | Si conviven dos formatos, `30-11111111-1` y `30111111111` no colisionan en los índices únicos. | Definir un formato canónico y agregar su `CHECK` (decisión pendiente, §9). |
| S1-9 | `file.entity_id` es una FK polimórfica sin integridad referencial. | Puede haber archivos huérfanos. | No es de este sprint. A futuro: una FK nullable por entidad y `CHECK (num_nonnulls(...) = 1)`. |

Lo que está bien resuelto y se mantiene:

- Los índices únicos parciales y por expresión de fábricas, encargados y
  proveedores.
- El `max + 1` con reintento ante `P2002` para el id correlativo de los
  encargados: la PK compuesta garantiza que no se repita.

---

## 3. Qué se reutiliza de VZ Causas

| Tabla en VZ | Decisión | Fundamento |
| ----------- | -------- | ---------- |
| `User` (`users`) | **Se adapta** como `app_user`. Se quitan `email`, `firstName`, `lastName`, `lawyerId`, `deletedAt` y `lastLoginAt`. Se agregan `employee_id`, `failed_login_attempts` y `blocked_at`. | D-19: nombre y apellido salen del empleado. D-27: el último acceso se calcula a partir de las sesiones. La baja es `is_active`, como en el resto del sistema. |
| `RefreshToken` (`refresh_tokens`) | **Se reutiliza** como `refresh_token`. `family_id` pasa a ser `session_id`, una FK a `user_session`. Se quitan `user_id` y `expires_at`. | La "familia" de rotación es la sesión del servidor que pide el contrato (D-04). El vencimiento es de la sesión, porque la rotación no lo extiende (D-44): repetirlo en cada token rompe la tercera forma normal. Lo mismo `user_id`, que se obtiene de la sesión. |
| `Role`, `Permission`, `UserRole`, `RolePermission` | **Solo se toma la idea de `UserRole`**, con el rol como enum. | RN44: los roles son un catálogo cerrado y no se administran. ADR-005: RBAC por rol, sin permisos granulares. Un enum impide guardar un rol que el código no conoce, y en PostgreSQL su orden es el de declaración, que da gratis "los roles en el orden del prototipo" (§2 del contrato). |
| `LoginAttempt` | **No se reutiliza.** | En VZ se cuentan también usuarios inexistentes y el bloqueo dura un tiempo. En Tornería solo cuentan los fallos de usuarios existentes y activos, y el bloqueo es permanente hasta que lo levanta el Administrador (D-06, D-49): es estado del usuario. |

---

## 4. Tablas nuevas del Sprint 2

### 4.1 Resumen

| Tabla | Para qué | CU / decisiones |
| ----- | -------- | --------------- |
| `employee` | Personal de la empresa, con o sin usuario | CU-45, CU-47, D-14 a D-18 |
| `app_user` | Cuenta de acceso de un empleado | CU-05, CU-07, CU-53, D-19 a D-28 |
| `user_role` | Roles de cada usuario (1..*) | RN44, D-11 |
| `user_session` | Sesión del servidor: inicio, actividad, vencimiento y cierre | CU-52, CU-53, RNF08, D-04, D-44, D-46 |
| `refresh_token` | Cadena de rotación de refresh tokens de cada sesión | D-45, D-47 |
| `process_type` | Catálogo de tipos de proceso con su precio hora | CU-09, CU-10, CU-11, RN16 a RN18, D-29, D-34 |
| `process_type_price_history` | Historial inmutable de cambios de precio | RNF10, D-32, D-52 |
| `material` | Catálogo de materiales (nombre + calidad) | CU-37, CU-39, D-36 a D-38 |
| `exchange_rate` | Último tipo de cambio obtenido de la API externa | D-30, D-48 |

### 4.2 Modelos Prisma propuestos

```prisma
// ─────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────

/// Orden de declaración = orden del prototipo (PostgreSQL ordena los enums así).
enum Role {
  JT
  ERP
  EC
  ER
  AT
  AS

  @@map("role_enum")
}

enum EmployeePosition {
  ADMINISTRATION
  WORKSHOP_HEAD
  HEAD
  EMPLOYEE

  @@map("employee_position_enum")
}

enum SessionEndReason {
  MANUAL
  INACTIVITY
  EXPIRED
  REVOKED

  @@map("session_end_reason_enum")
}

// ─────────────────────────────────────────────────────────────
// Personal y acceso
// ─────────────────────────────────────────────────────────────

model Employee {
  id              Int              @id @default(autoincrement())
  firstName       String           @map("first_name") @db.VarChar(100)
  lastName        String           @map("last_name") @db.VarChar(100)
  /// Único entre todos los empleados, incluidos los dados de baja (D-15).
  dni             String           @unique @db.VarChar(8)
  position        EmployeePosition
  address         String?          @db.VarChar(200)
  email           String?          @db.VarChar(120)
  phone           String?          @db.VarChar(50)
  /// "nombre apellido" normalizado por la aplicación (§6). Sin el DNI (§10).
  searchKey       String           @map("search_key") @db.VarChar(201)
  isActive        Boolean          @default(true) @map("is_active")
  /// Trazabilidad, no se expone (D-43). NULL en el empleado del seed inicial.
  createdByUserId Int?             @map("created_by_user_id")
  createdAt       DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime         @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  user      User? @relation("UserEmployee")
  createdBy User? @relation("EmployeeCreatedBy", fields: [createdByUserId], references: [id], onDelete: Restrict)

  /// Orden del listado (apellido, nombre).
  @@index([lastName, firstName])
  @@map("employee")
}

model User {
  id                  Int       @id @default(autoincrement())
  /// Máximo un usuario por empleado, incluidos los dados de baja (D-20).
  employeeId          Int       @unique @map("employee_id")
  /// Se guarda en minúsculas (CHECK): único sin distinguir mayúsculas,
  /// incluidos los dados de baja (D-22).
  username            String    @unique @db.VarChar(30)
  /// bcrypt (RNF08). Nunca se devuelve.
  passwordHash        String    @map("password_hash") @db.VarChar(255)
  failedLoginAttempts Int       @default(0) @map("failed_login_attempts")
  /// NULL = no bloqueado. Se desbloquea en CU-06 (D-49).
  blockedAt           DateTime? @map("blocked_at") @db.Timestamptz(6)
  isActive            Boolean   @default(true) @map("is_active")
  createdByUserId     Int?      @map("created_by_user_id")
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  employee  Employee      @relation("UserEmployee", fields: [employeeId], references: [id], onDelete: Restrict)
  createdBy User?         @relation("UserCreatedBy", fields: [createdByUserId], references: [id], onDelete: Restrict)
  roles     UserRole[]
  sessions  UserSession[]

  createdUsers        User[]                    @relation("UserCreatedBy")
  createdEmployees    Employee[]                @relation("EmployeeCreatedBy")
  createdProcessTypes ProcessType[]             @relation("ProcessTypeCreatedBy")
  createdMaterials    Material[]                @relation("MaterialCreatedBy")
  priceChanges        ProcessTypePriceHistory[]

  @@map("app_user")
}

model UserRole {
  userId     Int      @map("user_id")
  role       Role
  assignedAt DateTime @default(now()) @map("assigned_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  /// La PK compuesta impide repetir un rol.
  @@id([userId, role])
  /// Filtro GET /users?role=
  @@index([role])
  @@map("user_role")
}

model UserSession {
  /// UUID: viaja en el accessToken (claim `sid`) y no tiene que ser enumerable.
  id             String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         Int               @map("user_id")
  startedAt      DateTime          @default(now()) @map("started_at") @db.Timestamptz(6)
  /// Sin índice a propósito (ver §7.3).
  lastActivityAt DateTime          @default(now()) @map("last_activity_at") @db.Timestamptz(6)
  /// Inicio + 7 días (D-44). Es también el vencimiento de todos sus refresh tokens.
  expiresAt      DateTime          @map("expires_at") @db.Timestamptz(6)
  endedAt        DateTime?         @map("ended_at") @db.Timestamptz(6)
  endReason      SessionEndReason? @map("end_reason")

  user          User           @relation(fields: [userId], references: [id], onDelete: Restrict)
  refreshTokens RefreshToken[]

  /// lastAccessAt = started_at de la sesión más reciente (D-27).
  @@index([userId, startedAt(sort: Desc)])
  /// Limpieza periódica.
  @@index([expiresAt])
  @@map("user_session")
}

model RefreshToken {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  /// SHA-256 en hexadecimal. Es un valor aleatorio de alta entropía: no necesita
  /// sal ni un hash lento, y un hash determinístico permite buscarlo por índice.
  tokenHash  String    @unique @map("token_hash") @db.Char(64)
  sessionId  String    @map("session_id") @db.Uuid
  /// Token que lo reemplazó al rotar. @unique: la cadena es lineal.
  replacedBy String?   @unique @map("replaced_by") @db.Uuid
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  /// Momento de la rotación o de la revocación. Margen de reuso de D-47:
  /// revoked_at > now() - 30 segundos.
  revokedAt  DateTime? @map("revoked_at") @db.Timestamptz(6)

  session  UserSession   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  replaced RefreshToken? @relation("TokenRotation", fields: [replacedBy], references: [id], onDelete: SetNull)
  previous RefreshToken? @relation("TokenRotation")

  @@index([sessionId])
  @@map("refresh_token")
}

// ─────────────────────────────────────────────────────────────
// Catálogos técnicos
// ─────────────────────────────────────────────────────────────

model ProcessType {
  /// No cambia aunque se renombre el tipo.
  id              Int      @id @default(autoincrement())
  name            String   @db.VarChar(100)
  /// Nombre normalizado por la aplicación (§6). Único (D-34).
  nameKey         String   @unique @map("name_key") @db.VarChar(100)
  description     String?  @db.VarChar(500)
  /// Los dos precios se guardan tal como llegan, sin recalcular (D-29).
  hourlyRateArs   Decimal  @map("hourly_rate_ars") @db.Decimal(12, 2)
  hourlyRateUsd   Decimal  @map("hourly_rate_usd") @db.Decimal(12, 2)
  /// Tipo de cambio de la última modificación de precios (D-52).
  exchangeRate    Decimal  @map("exchange_rate") @db.Decimal(12, 2)
  /// Previsto para la baja (CU-12, otro sprint).
  isActive        Boolean  @default(true) @map("is_active")
  createdByUserId Int?     @map("created_by_user_id")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  createdBy    User?                     @relation("ProcessTypeCreatedBy", fields: [createdByUserId], references: [id], onDelete: Restrict)
  priceHistory ProcessTypePriceHistory[]

  @@map("process_type")
}

/// Un registro por modificación que cambia algún precio hora (D-32).
/// Solo el tipo de cambio y los valores en dólares: el valor en pesos se
/// obtiene multiplicando por el tipo de cambio del registro.
/// Inmutable (RNF10): no hay operación de escritura después del INSERT (§7.1).
model ProcessTypePriceHistory {
  id               Int      @id @default(autoincrement())
  processTypeId    Int      @map("process_type_id")
  changedAt        DateTime @default(now()) @map("changed_at") @db.Timestamptz(6)
  changedByUserId  Int      @map("changed_by_user_id")
  exchangeRate     Decimal  @map("exchange_rate") @db.Decimal(12, 2)
  previousValueUsd Decimal  @map("previous_value_usd") @db.Decimal(12, 2)
  newValueUsd      Decimal  @map("new_value_usd") @db.Decimal(12, 2)

  processType ProcessType @relation(fields: [processTypeId], references: [id], onDelete: Restrict)
  changedBy   User        @relation(fields: [changedByUserId], references: [id], onDelete: Restrict)

  /// Del más reciente al más antiguo.
  @@index([processTypeId, changedAt(sort: Desc), id(sort: Desc)])
  @@map("process_type_price_history")
}

model Material {
  id              Int      @id @default(autoincrement())
  /// Con la grafía del primer material de ese nombre (D-37).
  name            String   @db.VarChar(60)
  quality         String   @db.VarChar(60)
  /// Nombre y calidad normalizados por la aplicación (§6).
  nameKey         String   @map("name_key") @db.VarChar(60)
  qualityKey      String   @map("quality_key") @db.VarChar(60)
  /// Previsto para la baja (CU-40, otro sprint).
  isActive        Boolean  @default(true) @map("is_active")
  createdByUserId Int?     @map("created_by_user_id")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  createdBy User? @relation("MaterialCreatedBy", fields: [createdByUserId], references: [id], onDelete: Restrict)

  /// Nombre + calidad no se repiten (D-36). Al empezar por name_key, el mismo
  /// índice sirve para el filtro ?name= y para GET /materials/names.
  @@unique([nameKey, qualityKey])
  @@map("material")
}

/// Último tipo de cambio obtenido de la API externa (D-48). Una sola fila.
model ExchangeRate {
  id        Int      @id @default(1) @db.SmallInt
  rate      Decimal  @db.Decimal(12, 2)
  /// Momento de la cotización informado por la fuente: el `updatedAt` del contrato.
  quotedAt  DateTime @map("quoted_at") @db.Timestamptz(6)
  /// Proveedor de la cotización. Cambiarlo no cambia el endpoint.
  source    String   @db.VarChar(50)
  /// Cuándo la obtuvo el backend.
  fetchedAt DateTime @default(now()) @updatedAt @map("fetched_at") @db.Timestamptz(6)

  @@map("exchange_rate")
}
```

### 4.3 Decisiones por tabla

**`employee`**

- `dni` es `UNIQUE` simple y no parcial: el contrato lo exige único también entre
  los dados de baja (D-15).
- No hay `UNIQUE` sobre nombre y apellido: se admiten homónimos (D-18).
- La referencia circular `employee.created_by_user_id → app_user` y
  `app_user.employee_id → employee` se resuelve con `created_by_user_id`
  nullable: el primer empleado y su usuario (el `AS` del seed) no tienen quién
  los haya creado.

**`app_user`**

- `employee_id UNIQUE` modela la multiplicidad `Usuario → 1 Empleado` del dominio
  y la regla "un empleado tiene como máximo un usuario" (D-20).
- `username` se guarda en minúsculas y es `@unique`, en lugar de un índice sobre
  `lower(username)`: la unicidad queda visible para Prisma (sin deriva de schema
  y con `findUnique`). Es el criterio que VZ aplica a `email`.
- **El estado (`UserStatus`) no se guarda: se calcula** (D-26): `INACTIVE` si
  `is_active = false` (o el empleado está inactivo); si no, `BLOCKED` si
  `blocked_at IS NOT NULL`; si no, `ACTIVE`. Guardarlo duplicaría información que
  ya está en otras columnas y podría quedar inconsistente.
- `blocked_at` y no un booleano: registra cuándo se bloqueó, sin costo extra.

**`user_session` y `refresh_token`**

- La sesión del servidor es la que exige el contrato (D-04): una fila por
  ingreso, con inicio, última actividad, vencimiento, fin y motivo.
- Se guarda **un token por rotación** y no solo el hash actual y el anterior en
  la sesión: así se detecta el reuso de **cualquier** token ya rotado, no solo
  del inmediato anterior (D-47).
- `refresh_token` se borra en cascada con su sesión (`onDelete: Cascade`) porque
  depende de ella. La sesión, en cambio, es `Restrict` respecto del usuario: las
  bajas son lógicas.
- `lastAccessAt` (D-27) no se guarda en el usuario: se obtiene con
  `MAX(started_at)`, que el índice `(user_id, started_at DESC)` resuelve como una
  búsqueda puntual. Hay una sola fuente de verdad.

**`process_type` y `process_type_price_history`**

- El catálogo guarda los dos precios hora (RN18), porque el contrato los recibe y
  los devuelve.
- El historial guarda **solo el tipo de cambio y los valores en dólares**
  (`previous_value_usd`, `new_value_usd`). Es lo que muestra la tabla "Historial
  de precios" (D-32). El valor en pesos de cada registro se reconstruye como
  `new_value_usd × exchange_rate`.
- `changed_by_user_id` es `NOT NULL` y `Restrict`: todo cambio tiene responsable
  (RNF10), y un usuario con historial no se puede borrar físicamente.
- No hay `CHECK` que obligue a que el valor nuevo difiera del anterior: un cambio
  del precio en pesos puede dejar igual el valor en dólares por el redondeo, y
  aun así es un cambio de precio que se registra.

**`material`**

- Nombre y calidad son las dos columnas de negocio. `name_key` y `quality_key`
  existen solo para la unicidad y las búsquedas (§6).
- `GET /materials/names` sale de
  `SELECT DISTINCT ON (name_key) name ... ORDER BY name_key`: la grafía es la
  misma en todos los materiales de un nombre (D-37), así que cualquiera sirve.
- **Orden natural de la calidad** ("SAE 9" antes que "SAE 10", "1010" antes
  que "1045"): lo aplica el repositorio con
  `Intl.Collator('es', { numeric: true })`, no la base (§10). `quality_key`
  usa la collation por defecto.

**`exchange_rate`**

- Una sola fila (`CHECK id = 1`) que se actualiza con `upsert`. Alcanza para
  D-48 ("conserva el último valor") y para el `502` del contrato, que se responde
  cuando la fila no existe.
- No se guarda la historia de cotizaciones: cada cotización comercial va a
  guardar su propio `precioDolar` (modelo de dominio), y el tipo de cambio de
  cada cambio de precio ya queda en el historial.

---

## 5. Restricciones

### 5.1 Unicidad

| Tabla | Restricción | Dónde se declara | Regla |
| ----- | ----------- | ---------------- | ----- |
| `employee` | `UNIQUE (dni)` | `schema.prisma` | D-15 |
| `app_user` | `UNIQUE (employee_id)` | `schema.prisma` | D-20 |
| `app_user` | `UNIQUE (username)` | `schema.prisma` | D-22 |
| `user_role` | `PRIMARY KEY (user_id, role)` | `schema.prisma` | Sin roles repetidos |
| `refresh_token` | `UNIQUE (token_hash)`, `UNIQUE (replaced_by)` | `schema.prisma` | Búsqueda por hash; cadena lineal |
| `refresh_token` | `UNIQUE (session_id) WHERE revoked_at IS NULL` | SQL manual | Un único token vigente por sesión |
| `process_type` | `UNIQUE (name_key)` | `schema.prisma` | D-34 |
| `material` | `UNIQUE (name_key, quality_key)` | `schema.prisma` | D-36 |
| `category` (Sprint 1) | `UNIQUE (lower(name))` | SQL manual | Corrección S1-1 |

### 5.2 CHECK (SQL manual)

| Tabla | Nombre sugerido | Condición |
| ----- | --------------- | --------- |
| `employee` | `ck_employee_dni_format` | `dni ~ '^[0-9]{7,8}$'` |
| `employee` | `ck_employee_names_trimmed` | `first_name = btrim(first_name) AND first_name <> ''`, ídem `last_name` |
| `employee` | `ck_employee_optional_trimmed` | `address IS NULL OR (address = btrim(address) AND address <> '')`, ídem `email` y `phone` (el contrato guarda `""` como `NULL`) |
| `employee` | `ck_employee_email_format` | `email IS NULL OR email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'` (control mínimo; la validación completa es del DTO) |
| `app_user` | `ck_app_user_username_lower` | `username = lower(btrim(username)) AND username <> ''` |
| `app_user` | `ck_app_user_failed_attempts` | `failed_login_attempts >= 0` |
| `user_session` | `ck_user_session_expires_after_start` | `expires_at > started_at` |
| `user_session` | `ck_user_session_activity_after_start` | `last_activity_at >= started_at` |
| `user_session` | `ck_user_session_end_complete` | `(ended_at IS NULL) = (end_reason IS NULL)` |
| `user_session` | `ck_user_session_end_after_start` | `ended_at IS NULL OR ended_at >= started_at` |
| `refresh_token` | `ck_refresh_token_replaced_is_revoked` | `replaced_by IS NULL OR revoked_at IS NOT NULL` |
| `refresh_token` | `ck_refresh_token_not_self` | `replaced_by IS NULL OR replaced_by <> id` |
| `process_type` | `ck_process_type_rates_positive` | `hourly_rate_ars > 0 AND hourly_rate_usd > 0 AND exchange_rate > 0` |
| `process_type` | `ck_process_type_name_trimmed` | `name = btrim(name) AND name <> ''` |
| `process_type` | `ck_process_type_description_trimmed` | `description IS NULL OR (description = btrim(description) AND description <> '')` |
| `process_type_price_history` | `ck_price_history_values_positive` | `exchange_rate > 0 AND previous_value_usd > 0 AND new_value_usd > 0` |
| `material` | `ck_material_trimmed` | `name = btrim(name) AND name <> ''`, ídem `quality` |
| `exchange_rate` | `ck_exchange_rate_single_row` | `id = 1` |
| `exchange_rate` | `ck_exchange_rate_positive` | `rate > 0` |
| `file` (Sprint 1) | `ck_file_size_positive` | `size_bytes > 0` (corrección S1-2) |

Los `CHECK` no generan deriva con Prisma (Prisma los ignora). El índice parcial
de `refresh_token` y el de `category`, sí: si una migración generada después
trae un `DROP INDEX` de alguno, hay que quitarlo a mano, como con los índices
parciales del Sprint 1.

### 5.3 Claves foráneas

| Desde | Hacia | `ON DELETE` | Motivo |
| ----- | ----- | ----------- | ------ |
| `app_user.employee_id` | `employee` | `RESTRICT` | Baja lógica: un borrado físico no debería ocurrir |
| `user_role.user_id` | `app_user` | `CASCADE` | El rol no existe sin su usuario |
| `user_session.user_id` | `app_user` | `RESTRICT` | Las sesiones son el registro de accesos del usuario |
| `refresh_token.session_id` | `user_session` | `CASCADE` | La limpieza de sesiones viejas arrastra sus tokens |
| `refresh_token.replaced_by` | `refresh_token` | `SET NULL` | Borrar un token no invalida al anterior |
| `process_type_price_history.process_type_id` | `process_type` | `RESTRICT` | El historial no se pierde |
| `process_type_price_history.changed_by_user_id` | `app_user` | `RESTRICT` | Responsable del cambio (RNF10) |
| `*.created_by_user_id` | `app_user` | `RESTRICT` | Trazabilidad (D-43) |

### 5.4 Índices no únicos

| Tabla | Índice | Consulta que sirve |
| ----- | ------ | ------------------ |
| `employee` | `(last_name, first_name)` | Orden de `GET /employees` |
| `user_role` | `(role)` | `GET /users?role=` |
| `user_session` | `(user_id, started_at DESC)` | `lastAccessAt` |
| `user_session` | `(expires_at)` | Limpieza periódica |
| `refresh_token` | `(session_id)` | Tokens de una sesión |
| `process_type_price_history` | `(process_type_id, changed_at DESC, id DESC)` | `GET /process-types/{id}/history` |

Las tablas de este sprint tienen decenas de filas. Las búsquedas por "contiene"
(`LIKE '%texto%'`) recorren la tabla entera sin problema a ese volumen, así que
no se proponen índices para ellas.

---

## 6. Comparación de textos sin extensiones

El contrato compara textos "sin distinguir mayúsculas, acentos ni espacios
repetidos" (§4, "Comparación de textos"). Sin la extensión `unaccent` ni
funciones propias, la base no puede quitar acentos. Se resuelve con
**columnas normalizadas que calcula la aplicación** al escribir:

| Tabla | Columna | Contenido | Uso |
| ----- | ------- | --------- | --- |
| `process_type` | `name_key` | `name` normalizado | `UNIQUE` (D-34) y `search` |
| `material` | `name_key`, `quality_key` | `name` y `quality` normalizados | `UNIQUE` compuesto (D-36), filtro `name`, búsqueda `quality`, grafía (D-37) |
| `employee` | `search_key` | `first_name` y `last_name` normalizados y unidos por un espacio (sin el DNI, §10) | `search` de `GET /employees` y de `GET /users` |

- **Normalización:** minúsculas, sin acentos (Unicode NFD sin marcas
  diacríticas), sin espacios en los extremos y con un solo espacio entre
  palabras. Vive en **un único componente del dominio** (por ejemplo,
  `shared/domain/text-key.ts`) con tests unitarios. La usan los repositorios al
  escribir y al armar los filtros de búsqueda, así que el criterio es el mismo
  para guardar y para buscar.
- **La unicidad la garantiza la base** con un `UNIQUE` sobre la columna
  normalizada, que Prisma ve. El caso de uso consulta antes para responder con el
  mensaje correcto, y el repositorio traduce el `P2002` a `409` por si dos altas
  llegan a la vez.
- **Al modificar** el nombre de un tipo de proceso, o los datos de un empleado
  (CU-46, otro sprint), el repositorio recalcula su columna en la misma
  escritura.
- **DNI en la búsqueda de empleados:** `OR dni LIKE %texto%`. El DNI son solo
  dígitos, así que no necesita normalización.
- **Puesto en la búsqueda de empleados:** el rótulo del puesto ("Jefe de
  taller") no está en la base. La aplicación normaliza el texto buscado, busca
  los puestos cuyo rótulo lo contiene y suma `OR position IN (...)` a la
  condición sobre `search_key`.
- **Búsqueda de usuarios:** `username LIKE %texto%` (ya está en minúsculas) o
  `employee.search_key LIKE %texto%`. No busca por DNI: el contrato limita
  `GET /users?search` a usuario, nombre y apellido.

Las columnas normalizadas son una desnormalización controlada: dependen
funcionalmente de las columnas de negocio. Se aceptan porque son la única forma
de que la base garantice la unicidad sin funciones. Si en el futuro se habilita
`unaccent`, se pueden reemplazar por índices por expresión.

---

## 7. Reglas que quedan en la aplicación

Ninguna de estas reglas usa triggers ni funciones de la base. Cada una indica
dónde se ejecuta y qué la protege de la concurrencia.

### 7.1 Historial de precios (RNF10, D-32, D-52)

- `UpdateProcessTypeUseCase` compara los valores recibidos con los guardados.
- **Si cambió algún precio hora:** en **una sola** transacción
  (`prisma.$transaction`), actualiza `process_type` (precios, `exchange_rate`,
  `updated_at`) e inserta el registro del historial con el usuario de la sesión.
- **Si llega `exchange_rate` sin cambio de precio:** se ignora (D-52).
- **Si no cambió nada:** no ejecuta ningún `UPDATE` (D-31). `@updatedAt`
  actualiza `updated_at` en cualquier `update()` de Prisma, aunque no cambie
  ningún valor, así que la comparación previa es obligatoria.
- **Inmutabilidad:** ni el repositorio ni la API exponen operaciones de
  modificación o borrado del historial. Si en producción el backend se conecta
  con un rol de base de datos propio, se puede reforzar con
  `REVOKE UPDATE, DELETE, TRUNCATE ON process_type_price_history` a ese rol. Es
  un permiso, no una función.

### 7.2 Inicio de sesión y bloqueo (RNF08, D-06)

- El intento fallido se registra con **un solo `UPDATE`** que incrementa y
  bloquea a la vez:

  ```sql
  UPDATE app_user
     SET failed_login_attempts = failed_login_attempts + 1,
         blocked_at = CASE WHEN failed_login_attempts + 1 >= 5 THEN now() END
   WHERE id = $1 AND blocked_at IS NULL AND is_active
  RETURNING failed_login_attempts, blocked_at;
  ```

  Leer el contador, calcular y escribir en pasos separados produce un *lost
  update* en `READ COMMITTED`: dos intentos simultáneos leen 4 y ninguno
  bloquea. El `UPDATE` toma el lock de la fila y serializa los intentos.
- Ingreso correcto: en una transacción, `failed_login_attempts = 0` e
  `INSERT` de la sesión con su primer refresh token.

### 7.3 Sesión en cada petición (D-04, D-46)

- El guard busca la sesión por PK (`sid` del accessToken) cruzada con
  `app_user` y verifica:
  - `ended_at IS NULL`;
  - `expires_at > now()`;
  - `last_activity_at > now() - 30 minutos`;
  - usuario activo y no bloqueado.
- **Bloqueos y bajas se evalúan al leer.** Si el usuario quedó bloqueado o
  inactivo, la petición siguiente responde `401` sin haber cerrado antes sus
  sesiones.
- **Inactividad y vencimiento también se evalúan al leer.** Cuando se detectan,
  se cierra la sesión con `INACTIVITY` o `EXPIRED`. No hace falta un proceso
  programado para que la regla se cumpla.
- **La actividad se actualiza con un umbral:**
  `UPDATE user_session SET last_activity_at = now() WHERE id = $1 AND last_activity_at < now() - interval '1 minute'`.
  Por MVCC, cada `UPDATE` genera una versión nueva de la fila. Con el umbral
  hay como máximo una escritura por minuto por sesión, y como
  `last_activity_at` no está indexada, PostgreSQL puede hacer actualizaciones
  HOT (sin tocar índices). Un minuto de precisión no afecta a los 30 minutos de
  inactividad.
- `POST /auth/refresh` no actualiza `last_activity_at` (D-46).

### 7.4 Rotación del refresh token (D-47)

- Se busca el token por `token_hash`. En una transacción:
  1. Se inserta el token nuevo.
  2. Se marca el anterior con `revoked_at = now()` y `replaced_by = <nuevo>`.
- **Reuso:** si llega un token ya revocado con
  `revoked_at < now() - 30 segundos`, se cierra la sesión con `REVOKED`.
- **Limpieza periódica:** se borran las sesiones terminadas o vencidas hace más
  de N días; sus tokens se borran en cascada.

### 7.5 Usuario y roles (RN44, D-20, D-21)

- `CreateUserUseCase` inserta el usuario y sus roles en una sola transacción.
  Que tenga **al menos un rol** lo garantizan el DTO y el caso de uso: la base no
  lo puede expresar sin un trigger.
- "Empleado activo y sin usuario" se valida en el caso de uso (`422`, `409`). El
  `UNIQUE (employee_id)` cubre la carrera entre dos altas simultáneas.
- **RN44 (CU-48, próximo sprint):** el caso de uso que da de baja al empleado
  desactiva su usuario en la misma transacción.

### 7.6 Grafía del material (D-37)

- `CreateMaterialUseCase` busca un material con el mismo `name_key`. Si existe,
  usa su `name`.
- Dos altas simultáneas con un nombre nuevo escrito distinto ("Bronce" y
  "bronce") y calidades distintas podrían guardar las dos grafías. Con dos o tres
  usuarios AT/EC el riesgo es despreciable. Si se quisiera garantizarlo en la
  base, habría que llevar los nombres a una tabla propia con
  `UNIQUE (name_key)`.

---

## 8. Plan de migraciones

| Orden | Migración | Tipo | Contenido |
| ----- | --------- | ---- | --------- |
| 1 | `sprint1_fixes` | Manual (`--create-only`) | S1-1 a S1-6: `category.name NOT NULL` y su índice único, `CHECK` de `file`, `timestamptz` y `DEFAULT now()` en las tablas del Sprint 1, índices de las FK, `RENAME COLUMN categorie_id`. Antes, consultar si hay nulos o duplicados en `category.name`. |
| 2 | `sprint2_identity_and_catalogs` | Generada por Prisma | Enums y las nueve tablas nuevas, con sus `UNIQUE`, índices y FK declarados en `schema.prisma`. |
| 3 | `sprint2_manual_constraints` | Manual (`--create-only`) | Los `CHECK` de §5.2, el índice parcial de `refresh_token` y el índice por expresión de `category` (§5.1). |
| 4 | `prisma/seed.ts` | Seed | Primer empleado y usuario `AS`, con la contraseña tomada de una variable de entorno (no va en una migración, para no versionar el hash). Opcional: datos de ejemplo de tipos de proceso y materiales. |

La migración 1 va separada para revisarla y revertirla sin mezclarla con las
tablas nuevas. El renombre de la columna obliga a actualizar el `@map` de
`Factory.categoryId` en la misma rama.

---

## 9. Decisiones pendientes

| ID | Tema | Opciones |
| -- | ---- | -------- |
| BD-01 | Formato canónico del CUIT (S1-8) | Solo dígitos (`^[0-9]{11}$`) o con guiones (`^[0-9]{2}-[0-9]{8}-[0-9]$`) en fábricas y proveedores. Requiere normalizar los datos existentes antes del `CHECK`. |
| BD-02 | Unicidad del nombre de tipo de proceso tras la baja (CU-12) | Mantenerla global (como hoy) o pasarla a parcial `WHERE is_active`, como en proveedores. |
| BD-03 | Unicidad de material tras la baja (CU-40) | Igual que BD-02. |
| BD-04 | Agregar `created_by_user_id` a las tablas del Sprint 1 | Ahora que hay usuarios, D-43 lo justifica. Sería nullable para las filas existentes. |
| BD-05 | Retención de sesiones terminadas | Cuántos días se conservan antes de la limpieza (§7.4). Afecta a la auditoría de accesos. |

---

## 10. Desvíos aplicados respecto de la propuesta

Al pasar este diseño a `schema.prisma` (20/10/2026) se validó contra el
[API Contract Sprint 2](../api-contract/API_CONTRACT_SPRINT_2.md) y las
migraciones del Sprint 1. Las secciones anteriores ya reflejan estos cambios.

| # | Propuesta original | Aplicado | Motivo |
| - | ------------------ | -------- | ------ |
| DV-1 | `employee.search_key` con nombre, apellido **y DNI** (`VARCHAR(220)`) | Solo nombre y apellido (`VARCHAR(201)`). El DNI se busca con `dni LIKE %texto%` en `GET /employees` | `GET /users?search` busca en usuario, nombre y apellido. Con el DNI dentro del `search_key`, buscar "2011" devolvería usuarios por su DNI |
| DV-2 | Índice parcial `user_session (user_id) WHERE ended_at IS NULL` | Se omite | Ninguna consulta del sprint lo usa: bloqueos y bajas se evalúan al leer (§7.3) y el logout cierra por PK. `(user_id, started_at DESC)` ya cubre las búsquedas por usuario |
| DV-3 | `INDEX (categorie_id) WHERE is_active` | `INDEX (category_id)` simple, declarado en `schema.prisma` | Prisma lo ve, así que no hay deriva ni SQL manual. Con este volumen, el parcial no aporta |
| DV-4 | Sin definir | Orden natural de la calidad del material en el repositorio (`Intl.Collator('es', { numeric: true })`) | `GET /materials` pide "SAE 62" antes que "SAE 65" y "1010" antes que "1045". Se descartó una collation ICU en la base para no sumar objetos fuera de Prisma; el catálogo tiene decenas de filas |
