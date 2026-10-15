# Base de datos – Soporte del Sprint 1

Este documento explica dos decisiones de diseño de `setup_support_sprint1.sql`:

1. Las claves foráneas polimórficas utilizadas por la tabla `file`.
2. El autoincremento de una clave primaria compuesta mediante un trigger, como en
   `manager_customer`.

## La tabla `file` y las claves foráneas polimórficas

La tabla `file` almacena todos los documentos cargados (PDF de solicitudes, planos,
fotos de referencia, diseños 3D, etc.). Un archivo puede pertenecer a distintos tipos
de entidades: una solicitud de cotización, una pieza, una cotización o una orden de trabajo.

En lugar de agregar una columna de clave foránea que admita nulos por cada posible propietario
(`quote_request_id`, `part_id`, `quote_id`, `work_order_id`), la tabla usa una
**asociación polimórfica**. Dos columnas describen al propietario:

| Columna | Significado |
| ------------- | ------------------------------------------------------------- |
| `entity_type` | A qué tabla pertenece el archivo (`entity_type_enum`). |
| `entity_id` | El `id` de la fila dentro de esa tabla. |

Entonces, `(entity_type = 'QUOTE_REQUEST', entity_id = 42)` significa «este archivo pertenece a
la fila con `id = 42` de la tabla `quote_request`».

### Por qué no usar una clave foránea normal

Una restricción `REFERENCES` normal solo puede apuntar a **una** tabla. Como
`entity_id` puede apuntar a varias tablas según `entity_type`, la base de datos
no puede exigirlo mediante una única clave foránea. Este es el principal compromiso del
diseño polimórfico:

- **Ventaja:** una única tabla clara, fácil de extender con un nuevo valor de `entity_type`, sin
  multitud de columnas que admitan nulos.
- **Desventaja:** la integridad referencial **no** está garantizada por la base de datos. La
  capa de aplicación es responsable de asegurar que `entity_id` realmente exista en
  la tabla indicada por `entity_type`. Eliminar la fila propietaria no elimina automáticamente
  sus archivos.

`document_type` es un enum separado y solo clasifica el *tipo* de documento;
no afecta a qué entidad pertenece el archivo.

## Claves primarias compuestas e incremento mediante trigger

Algunas tablas no usan un único id `SERIAL`. `manager_customer` se identifica mediante
el par `(factory_id, id)`:

```sql
CONSTRAINT pk_manager_customer PRIMARY KEY (factory_id, id)
```

Aquí `id` **no** es globalmente único. Es un número local que comienza en 1
para cada fábrica. Dos fábricas diferentes pueden tener un encargado con `id = 1`;
la fila solo es única al combinarlo con `factory_id`.

`SERIAL` no puede hacer esto porque una secuencia es global y no conoce
`factory_id`. Para obtener un contador «por padre» usamos un trigger `BEFORE INSERT`.

### Cómo funciona el trigger

```sql
CREATE OR REPLACE FUNCTION fn_gen_id_manager()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NULL THEN
        SELECT COALESCE(MAX(id), 0) + 1
        INTO NEW.id
        FROM manager_customer
        WHERE factory_id = NEW.factory_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gen_id_manager
BEFORE INSERT ON manager_customer
FOR EACH ROW
EXECUTE FUNCTION fn_gen_id_manager();
```

Paso a paso, para cada fila insertada:

1. Si quien llama ya proporcionó `id`, la función no hace nada y conserva ese
   valor.
2. Si `id` es `NULL`, busca el mayor `id` existente **para el
   mismo `factory_id`**.
3. `COALESCE(MAX(id), 0)` devuelve `0` cuando la fábrica todavía no tiene encargados, por lo que
   el primero recibe `id = 1`.
4. Suma `1` y escribe el resultado en `NEW.id` antes de que la fila
   se almacene realmente.

### Limitaciones

- El cálculo se hace con `MAX(id) + 1`, no con una secuencia real. Con muchas
  inserciones concurrentes para el **mismo** `factory_id`, dos transacciones podrían leer
  el mismo `MAX` y colisionar. La clave primaria rechazaría entonces la segunda
  inserción. Para la carga esperada de este sistema es aceptable; un índice único
  con reintento o una secuencia por fábrica sería una opción más sólida.
- Si se elimina un encargado, su `id` no se reutiliza (el siguiente valor sigue surgiendo
  de `MAX(id) + 1`).

### Dónde se reutiliza este patrón

`quote_request` referencia a `manager_customer` mediante la misma clave
compuesta:

```sql
CONSTRAINT fk_quote_request_customer
    FOREIGN KEY (manager_customer_id, manager_factory_id)
    REFERENCES manager_customer(id, factory_id)
```

Por lo tanto, cualquier tabla que referencie a un encargado debe incluir **ambas** columnas,
no un único id.
