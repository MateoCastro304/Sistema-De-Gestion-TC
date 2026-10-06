# Decisiones: Clientes y Fábricas (frontend, backend y base de datos)

Fecha: 6 de octubre de 2026. Rama: `feature/backend-customers-and-factories`.

Este documento reemplaza a `docs/inconsistencias-clientes-fabricas.md`, que quedó desactualizado: ahí se tomaba la base de datos como fuente de verdad, y para las fábricas el requisito es la historia de usuario (CU-58).

## 1. Criterios aplicados

| Tema | Decisión |
|---|---|
| Fuente de verdad | Para fábricas, la historia de usuario CU-58. La base se adapta a la historia, no al revés. Para clientes, el contrato del frontend (`docs/openapi/customers.yaml`) y las columnas que existen en la base. |
| Nombres en el JSON | Los del frontend: `firstName`, `isActive`, `payMethod`. El dominio y la base mantienen sus nombres (`name`, `active`, `paymentDescription`); el mapeo está en los DTOs de respuesta y de entrada. |
| Rubro = `category` | El rubro se llama **`category` / `categoryId`** en la base, el backend y el JSON. **No se renombra a `industry`.** El frontend cambia su campo `industryId` por `categoryId`. Sus nombres internos (`Industry`, `useIndustries`, `industryName`) no viajan en el JSON y pueden quedar. |
| Ids | El backend devuelve los ids como string (`"3"`), como los tipa el frontend. Los pedidos los siguen recibiendo como número en la URL. |
| Campos opcionales vacíos | El frontend manda `''`; el backend lo guarda como `null`. Al devolver, `null` sale como `''`. |
| Listados de catálogos | El frontend pide una página grande y filtra del lado del cliente: hasta 1000 fábricas y 100 rubros. |
| Rutas de la API | Todas en inglés (`/customers`, `/factories`, `/categories`). |
| Rutas de pantallas del frontend | Siguen en español (`/catalogos/encargados`, `/catalogos/fabricas`). Las cambió el equipo de frontend a propósito. No se tocan. |

## 2. Fábricas (`factory_customer`)

| Campo | Historia (CU-58) | Decisión | Base de datos |
|---|---|---|---|
| Nombre (razón social) | Obligatorio | Obligatorio, máx. 100 | `name` NOT NULL (sin cambios) |
| CUIT | Obligatorio, único, con dígito verificador | **Obligatorio y único**. Se valida prefijo y dígito verificador; el dígito calculado 10 se rechaza, igual que en el backend. | **Cambia:** NOT NULL + UNIQUE |
| Dirección | Opcional | Opcional, máx. 255 | `address` nullable (sin cambios) |
| Rubro | Obligatorio, FK a rubro activo | **Obligatorio**, debe existir y estar activo | **Cambia:** `categorie_id` NOT NULL; la FK pasa de `ON DELETE SET NULL` a `ON DELETE RESTRICT` |
| Formas de pago | Obligatorio, 1..* | **Opcional**, texto libre, máx. 255 | `pay_method` nullable (sin cambios) |
| Código de fábrica | Obligatorio, único, 2 a 4 caracteres | **No se implementa por ahora** (ver sección 5) | No existe la columna |

Cambios en el JSON de fábricas:

- Se envía: `name`, `cuit`, `address`, `payMethod`, `categoryId`.
- Se recibe: `id`, `name`, `cuit`, `address`, `payMethod`, `categoryId`, `isActive`.
- `categoryId` es el id del rubro (categoría).

## 3. Clientes / encargados (`manager_customer`)

| Campo | Decisión | Base de datos |
|---|---|---|
| Nombre | `firstName`, obligatorio, máx. 50 | `name` NOT NULL |
| Apellido | Opcional, máx. 50 | `last_name` nullable |
| Teléfono | Opcional, máx. 50 | `phone` nullable |
| Mail | Opcional, formato válido, máx. 120 | `mail` nullable (255) |
| Regla de contacto | **Al menos uno entre teléfono y mail.** Es una regla de negocio (el informe se envía por mail o teléfono), no una restricción de la base. | — |
| Fábrica | Va en la URL (`/factories/{factoryId}/customers`), no en el cuerpo. No se puede cambiar: es parte de la clave primaria. | `factory_id` |
| WhatsApp y observaciones | **Se sacan del frontend**: no existen en la base ni en el backend. | No existen las columnas |

- Mail único dentro de la fábrica.
- La baja y la reactivación responden 204 sin cuerpo.

Cambios en el JSON de clientes:

- Se envía: `firstName`, `lastName`, `phone`, `mail`.
- Se recibe: `id`, `firstName`, `lastName`, `phone`, `mail`, `factoryId`, `isActive`.

## 4. Cambios en la base de datos

Los aplica quien maneja la base, desde `backend/prisma/schema.prisma`.

### 4.1 Antes de migrar: chequeos

La migración falla si hay filas que no cumplen. Revisar:

```sql
-- Fábricas sin CUIT o sin rubro (no pueden pasar a NOT NULL)
SELECT id, name FROM factory_customer WHERE cuit IS NULL OR categorie_id IS NULL;

-- CUIT repetidos (no pueden pasar a UNIQUE)
SELECT cuit, COUNT(*) FROM factory_customer GROUP BY cuit HAVING COUNT(*) > 1;
```

### 4.2 `schema.prisma`: modelo `Factory`

```prisma
/// Fabrica / empresa cliente (tabla `factory_customer`)
///
/// PENDIENTE: falta `code` (codigo de fabrica, unico, obligatorio, 2-4 caracteres).
/// Ver docs/decisiones-clientes-fabricas.md, seccion 5.
model Factory {
  id         Int      @id @default(autoincrement())
  name       String   @db.VarChar(100)
  address    String?  @db.VarChar(255)
  cuit       String   @unique @db.VarChar(50)
  payMethod  String?  @map("pay_method") @db.VarChar(255)
  categoryId Int      @map("categorie_id")
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  category Category   @relation(fields: [categoryId], references: [id])
  managers Customer[]

  @@map("factory_customer")
}
```

### 4.3 Migración

Desde `backend/`:

```
npx prisma migrate dev --name factory_cuit_unique_category_required
npx prisma generate
```

La migración generada debería ser equivalente a:

```sql
-- DropForeignKey
ALTER TABLE "factory_customer" DROP CONSTRAINT "factory_customer_categorie_id_fkey";

-- AlterTable
ALTER TABLE "factory_customer" ALTER COLUMN "cuit" SET NOT NULL,
ALTER COLUMN "categorie_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "factory_customer_cuit_key" ON "factory_customer"("cuit");

-- AddForeignKey
ALTER TABLE "factory_customer" ADD CONSTRAINT "factory_customer_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

## 5. Pendiente / ignorado

### 5.1 Código de fábrica (`code`): pendiente

La historia CU-58 lo pide obligatorio y único, y no está implementado en ninguna capa. Se decidió ignorarlo por ahora y dejarlo para más adelante. El frontend ya lo tenía armado (campo, columna y validación) y se sacó para que front y back puedan correr: el backend rechaza las propiedades que no declara.

Para implementarlo hace falta:

- **Base:** columna `code VARCHAR(4) NOT NULL UNIQUE` en `factory_customer`, y decidir qué código se les asigna a las fábricas existentes.
- **Backend:** agregarlo al dominio `Factory`, a `CreateFactoryDto`, a `FactoryResponseDto`, a `CreateFactory`/`UpdateFactory` (validar único, 409 indicando cuál chocó: CUIT o código) y al repositorio de Prisma.
- **Frontend:** devolver el campo a `types/factory.ts`, `schemas/factory.schema.ts`, `FactoryForm.tsx`, `FactoriesTable.tsx`, `FactoryDetailPage.tsx` y `customers.mocks.ts`.
- **Definir el largo:** la historia dice 2 a 4 caracteres y el frontend validaba 3 a 4.
- **Para qué sirve:** es el prefijo del identificador interno secuencial de las piezas que llegan sin número de plano (ERS §2.3), por ejemplo `OC-001` para OxyCAM.

### 5.2 Otras decisiones

| Tema | Estado |
|---|---|
| Mail en fábricas (escenario 3 de la historia) | **Se ignora**: la fábrica no tiene mail; es un error de la historia, copiado de la de clientes. |
| "Nombre único junto con el CUIT" | Sin resolver. Como el CUIT ya es único por sí solo, no agrega nada. Hay que preguntar qué quisieron decir. |
| Formas de pago "1..*" | Se resolvió como **texto libre y opcional**. Si más adelante son opciones fijas y combinables, habría que modelarlas en una tabla aparte. |
| "+ Nuevo rubro" desde el selector de la fábrica (escenario 4) | No implementado. El rubro tiene su propio ABMC y el frontend lo consume solo en lectura. |
| Rubros en memoria | Hoy `CategoriesModule` usa un repositorio en memoria. Hasta que use Prisma, crear una fábrica real choca con la FK a `category`: hay que cargar el rubro también en la tabla. |
| CUIT modificable | Se puede editar. La spec `docs/openapi/paths/factories@{id}.yaml` dice que es inmutable. Sin resolver. |
| CUIT con dígito calculado 10 | El frontend lo rechaza (antes lo aceptaba como 9), igual que el backend. |
| Duplicados simultáneos | Con el índice único, dos altas simultáneas del mismo CUIT hoy darían un 500 en vez de un 409. Se puede mejorar capturando el error `P2002` de Prisma. |
| Límites del frontend | Ve hasta 1000 fábricas y 100 rubros. Si hay más, hace falta paginar en pantalla. |
| Fábrica sin rubro en la base | Con la migración deja de ser posible. Antes de migrar hay que corregir las filas existentes (sección 4.1). |

## 6. Archivos modificados

**Backend**

- `src/factory/domain/factory.ts` y `factory.spec.ts`
- `src/factory/http/dto/create-factory.dto.ts` y `factory-response.dto.ts`
- `src/factory/application/create-factory.use-case.ts` y `update-factory.use-case.ts`
- `src/factory/infrastructure/factory-prisma.repository.ts`
- `src/factory/factory-module-wiring.spec.ts`
- `src/categories/application/categories-factory-integration.spec.ts`
- `src/customers/domain/customer.ts` y `customer.spec.ts`
- `src/customers/http/dto/create-customer.dto.ts` y `customer-response.dto.ts`
- `src/customers/application/create-customer.use-case.ts` y `update-customer.use-case.ts`
- `src/customers/infrastructure/customers-prisma.repository.ts` y `customers.repository.ts`
- `prisma/schema.prisma` y una migración nueva

**Frontend** (`src/features/catalogs/customers/`)

- `types/customer.ts` y `types/factory.ts`
- `schemas/customer.schema.ts` y `schemas/factory.schema.ts`
- `api/customers.api.ts` y `api/customers.mocks.ts`
- `components/CustomerForm.tsx`, `CustomersTable.tsx`, `FactoriesTable.tsx` y `FactoryForm.tsx`
- `pages/CustomerDetailPage.tsx` y `FactoryDetailPage.tsx`

## 7. Orden de aplicación y verificación

1. Chequeos de la sección 4.1 y migración (4.2 y 4.3). Sin esto, el backend de fábricas no compila.
2. Backend: aplicar los cambios y correr `npx tsc --noEmit` y `npm test`.
3. Frontend: aplicar los cambios y correr `npm run build`.
4. Probar con `VITE_USE_MOCKS=false`, el backend y Postgres levantados.
