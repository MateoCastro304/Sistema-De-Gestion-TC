# Database – Support Sprint 1

This document explains two design decisions in `setup_support_sprint1.sql`:

1. The polymorphic foreign keys used by the `file` table.
2. The auto-increment of a composite primary key using a trigger, as done in
   `manager_customer`.

## The `file` table and polymorphic foreign keys

The `file` table stores every uploaded document (request PDFs, blueprints,
reference photos, 3D designs, and so on). A file can belong to different kinds
of entities: a quote request, a part, a quote, or a work order.

Instead of adding one nullable foreign key column per possible owner
(`quote_request_id`, `part_id`, `quote_id`, `work_order_id`), the table uses a
**polymorphic association**. Two columns describe the owner:

| Column        | Meaning                                                        |
| ------------- | ------------------------------------------------------------- |
| `entity_type` | Which table the file belongs to (`entity_type_enum`).         |
| `entity_id`   | The `id` of the row inside that table.                        |

So `(entity_type = 'QUOTE_REQUEST', entity_id = 42)` means "this file belongs to
the row with `id = 42` in the `quote_request` table".

### Why not a normal foreign key

A normal `REFERENCES` constraint can only point to **one** table. Because
`entity_id` may point to several tables depending on `entity_type`, the database
cannot enforce it with a single foreign key. This is the main trade-off of the
polymorphic design:

- **Pro:** one clean table, easy to extend with a new `entity_type` value, no
  forest of nullable columns.
- **Con:** referential integrity is **not** guaranteed by the database. The
  application layer is responsible for making sure `entity_id` really exists in
  the table named by `entity_type`. Deleting an owner row does not automatically
  delete its files.

`document_type` is a separate enum and only classifies the *kind* of document;
it does not affect which entity owns the file.

## Composite primary keys and trigger-based increment

Some tables do not use a single `SERIAL` id. `manager_customer` is identified by
the pair `(factory_id, id)`:

```sql
CONSTRAINT pk_manager_customer PRIMARY KEY (factory_id, id)
```

Here `id` is **not** globally unique. It is a local number that restarts from 1
for each factory. Two different factories can both have a manager with `id = 1`;
the row is only unique when combined with `factory_id`.

`SERIAL` cannot do this, because a sequence is global and does not know about
`factory_id`. To get a "per-parent" counter we use a `BEFORE INSERT` trigger.

### How the trigger works

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

Step by step, for every inserted row:

1. If the caller already provided `id`, the function does nothing and keeps that
   value.
2. If `id` is `NULL`, it looks for the highest `id` that already exists **for the
   same `factory_id`**.
3. `COALESCE(MAX(id), 0)` returns `0` when the factory has no managers yet, so
   the first manager of a factory gets `id = 1`.
4. It adds `1` and writes the result back into `NEW.id` before the row is
   actually stored.

### Limitations

- The count is done with `MAX(id) + 1`, not with a real sequence. Under heavy
  concurrent inserts for the **same** `factory_id`, two transactions could read
  the same `MAX` and collide. The primary key would then reject the second
  insert. For the expected load of this system this is acceptable; a unique
  index plus retry, or a per-factory sequence, would be the stronger option.
- If a manager is deleted, its `id` is not reused (the next value still comes
  from `MAX(id) + 1`).

### Where this pattern is reused

`quote_request` points back to `manager_customer` through the same composite
key:

```sql
CONSTRAINT fk_quote_request_customer
    FOREIGN KEY (manager_customer_id, manager_factory_id)
    REFERENCES manager_customer(id, factory_id)
```

Any table that references a manager must therefore carry **both** columns, not
just a single id.
