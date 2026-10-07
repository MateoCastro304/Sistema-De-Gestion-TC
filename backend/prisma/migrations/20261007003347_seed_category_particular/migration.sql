-- Rubro "Particular": para clientes que no son empresa.
INSERT INTO "category" ("name", "is_active", "created_at", "updated_at")
SELECT 'Particular', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "category" WHERE LOWER("name") = 'particular');
