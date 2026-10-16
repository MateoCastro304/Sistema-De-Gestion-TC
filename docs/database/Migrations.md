# Migraciones de base de datos con Prisma

Este documento explica cómo gestionamos el esquema de la base de datos PostgreSQL en este proyecto con Prisma Migrate y cómo usar los comandos Make para ejecutar migraciones sin entrar manualmente a la consola del contenedor.

## 1. Por qué usamos esta metodología

Prisma Migrate permite **versionar el esquema de la base de datos** de la misma manera que versionamos el código. Cada cambio en la base de datos (tablas nuevas, columnas, enums, triggers, etc.) se guarda como un archivo SQL dentro de `prisma/migrations/`. Esto nos da:

- Un historial claro de cada cambio realizado en la base de datos.
- El mismo esquema en todos los entornos (local, preproducción, producción).
- La posibilidad de revisar cambios de base de datos en pull requests, igual que cualquier otro cambio de código.

Prisma puede generar SQL automáticamente para los elementos declarados en `schema.prisma` (tablas, columnas, relaciones, enums). Sin embargo, Prisma **no puede** generar SQL para elementos como triggers, funciones o extensiones de PostgreSQL, porque no forman parte de su lenguaje de esquema. En estos casos, creamos una migración vacía y escribimos el SQL manualmente. Este es el enfoque estándar recomendado por Prisma.

La elección de PostgreSQL y de Prisma está registrada en [ADR-002](../decisions/002-data-base.md) y [ADR-003](../decisions/003-orm.md).

## 2. Dos maneras de ejecutar migraciones

| Comando | Cuándo usarlo | Comportamiento |
|---|---|---|
| `migrate dev` | Desarrollo local | Interactivo. Puede detectar diferencias entre esquemas y pedir reiniciar la base de datos. Genera Prisma Client. |
| `migrate deploy` | Preproducción / Producción / CI | No interactivo. Solo aplica las migraciones pendientes. Nunca reinicia ni modifica migraciones existentes. |

Nunca ejecutamos `migrate dev` en producción ni en un proceso automatizado, porque puede reiniciar los datos si detecta una inconsistencia. `migrate deploy` es siempre la opción segura para entornos automatizados.

## 3. Paso a paso: actualizar la base de datos

### Paso 1 — Actualizar el esquema

Abrí `prisma/schema.prisma` y agregá o modificá un modelo, campo o enum.

```prisma
model Order {
  id     String      @id @default(uuid())
  status OrderStatus @default(PENDING)
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
}
```

### Paso 2 — Crear la migración

Si el cambio solo involucra elementos que Prisma entiende (modelos, campos, enums), creá y aplicá la migración directamente:

```
make migrate-dev
```

Esto ejecuta `prisma migrate dev` dentro del contenedor del backend, que:
1. Compara tu esquema con el estado actual de la base de datos.
2. Genera el archivo SQL automáticamente.
3. Lo aplica a la base de datos.
4. Regenera Prisma Client.

### Paso 3 — Agregar SQL personalizado (triggers, funciones, extensiones)

Si necesitás algo que Prisma no puede generar por sí solo (un trigger, una función PostgreSQL, una extensión o un `ALTER TYPE` manual), creá la migración **sin aplicarla**:

```
make migrate-create name=add_updated_at_trigger
```

Esto crea una carpeta de migración vacía dentro de `prisma/migrations/`. Abrí el archivo `migration.sql` generado y agregá tu SQL directo, por ejemplo:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON "Order"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

Luego aplicala ejecutando:

```
make migrate-dev
```

### Paso 4 — Desplegar en preproducción o producción

En cualquier entorno que no sea de desarrollo, las migraciones se aplican con:

```
make migrate-deploy
```

Esto solo aplica las migraciones que todavía no se aplicaron. No hace preguntas ni reinicia la base de datos.

## 4. Reglas importantes

- **Nunca edites un archivo de migración que ya se haya aplicado y compartido con el equipo.** Prisma almacena una suma de verificación de cada migración en la tabla `_prisma_migrations`. Si el archivo cambia después de aplicarse, Prisma detectará una diferencia y fallará. Si necesitás corregir algo, creá una migración nueva.
- **Mantené consistente el orden de las migraciones.** Se ejecutan según las marcas de tiempo de sus carpetas. Si un trigger depende de una tabla, asegurate de que su migración se haya creado después de la migración de la tabla.
- **Los enums declarados en el esquema se manejan automáticamente.** Solo necesitás SQL manual al agregar un valor a un enum *existente* (`ALTER TYPE ... ADD VALUE`), porque PostgreSQL no lo permite dentro de la misma transacción que otras sentencias que usan ese tipo.

## 5. Referencia de comandos Make

```makefile
migrate-deploy: ## Ejecuta migraciones Prisma dentro del contenedor del backend (despliegue/producción)
	$(DC_DEV) exec backend npm run prisma:migrate-deploy

migrate-dev: ## Ejecuta migraciones Prisma dentro del contenedor del backend (desarrollo)
	$(DC_DEV) exec backend npm run prisma:migrate-dev

migrate-create: ## Crea una migración Prisma dentro del contenedor del backend (desarrollo)
	$(DC_DEV) exec backend npx prisma migrate dev --create-only --name $(name)
```

| Comando | Descripción |
|---|---|
| `make migrate-dev` | Aplica todas las migraciones pendientes en la base de datos local. Usalo después de traer cambios de otros desarrolladores o después de crear una migración nueva. |
| `make migrate-create name=<migration_name>` | Crea un archivo de migración vacío sin aplicarlo. Usalo cuando necesites escribir SQL personalizado manualmente (triggers, funciones, extensiones, cambios manuales de enums). |
| `make migrate-deploy` | Aplica migraciones pendientes de manera no interactiva. Usalo en preproducción, producción o procesos de CI/CD. |

Los tres comandos se ejecutan **dentro del contenedor del backend**, por lo que no necesitás abrir una consola manualmente ni instalar Prisma localmente. El contenedor del backend debe estar ejecutándose (`docker compose up`) antes de usar `migrate-dev` o `migrate-create`, ya que estos comandos dependen de `docker compose exec`.

## 6. Ejemplo de flujo habitual

```
# 1. Editar prisma/schema.prisma o definir el SQL personalizado necesario

# 2. Si es un cambio solo de esquema:
make migrate-dev

# 3. Si necesita SQL personalizado:
make migrate-create name=add_order_status_trigger
# → editar el archivo migration.sql generado
make migrate-dev

# 4. Al desplegar:
make migrate-deploy
```
