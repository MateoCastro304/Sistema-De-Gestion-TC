-- =============================================
-- Trigger for manager's primary key
-- =============================================

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
