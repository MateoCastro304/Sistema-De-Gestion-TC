DROP TABLE IF EXISTS file;
DROP TABLE IF EXISTS quote_request;
DROP TABLE IF EXISTS manager_customer;
DROP TABLE IF EXISTS factory_customer;
DROP TABLE IF EXISTS industry;
DROP TABLE IF EXISTS supplier;
DROP TYPE IF EXISTS entity_type_enum;
DROP TYPE IF EXISTS document_type_enum;
DROP TYPE IF EXISTS supplier_type_enum;
-- =============================================
-- Files Management
-- =============================================

-- ENUM: EntityType
-- Identifies which table entity_id refers to (polymorphic FK)
CREATE TYPE entity_type_enum AS ENUM (
	'QUOTE_REQUEST', 'PART', 'QUOTE', 'WORK_ORDER'
);

-- ENUM: DocumentType
-- Identifies the kind of document being stored
CREATE TYPE document_type_enum AS ENUM (
  'REQUEST_PDF', 'BLUEPRINT','REFERENCE_PART_PHOTO','DESIGN_3D','OTHER'
);


CREATE TABLE file (
	id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	-- S3 storage
	s3_bucket           VARCHAR(255) NOT NULL,
	s3_key              VARCHAR(1024) NOT NULL UNIQUE,
	-- File metadata
	original_name       VARCHAR(255) NOT NULL,
	extension           VARCHAR(10)  NOT NULL,
	mime_type           VARCHAR(100) NOT NULL,
	size_bytes          BIGINT       NOT NULL CHECK (size_bytes > 0),
	-- Classification
	document_type       document_type_enum NOT NULL,
	-- Polymorphic association (current owner)
	entity_type         entity_type_enum NOT NULL,
	entity_id           INTEGER NOT NULL,
	-- Audit
	-- uploaded_by         UUID NOT NULL REFERENCES "user"(id),
	uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- CUSTOMER Management
-- =============================================

CREATE TABLE industry  (
	id  	SERIAL,
	name  	VARCHAR(120),

	CONSTRAINT pk_industry PRIMARY KEY (id)
);

CREATE TABLE factory_customer  (
	id  		SERIAL,
	name  		VARCHAR(100) NOT NULL,
	address  	VARCHAR(255),
	cuit 		VARCHAR(50),
	pay_method 	VARCHAR(255),
	industry_id	INTEGER,

	CONSTRAINT pk_factory_customer PRIMARY KEY (id),

	CONSTRAINT fk_factory_customer_industry
        FOREIGN KEY (industry_id) REFERENCES industry(id)
);

CREATE TABLE manager_customer  (
	id  		INTEGER,
	factory_id  	INTEGER NOT NULL,
	name  		VARCHAR(150) NOT NULL,
	phone  		VARCHAR(50),
	mail  		VARCHAR(255),

	CONSTRAINT pk_manager_customer PRIMARY KEY (factory_id, id),

	CONSTRAINT fk_manager_customer_factory_customer
        FOREIGN KEY (factory_id) REFERENCES factory_customer(id)
);


-- =============================================
-- Supplier Management
-- =============================================
CREATE TYPE supplier_type_enum AS ENUM (
	'PROCESS', 'REPLACEMENT', 'MATERIAL', 'PAINT'
);

CREATE TABLE supplier (
	id  		SERIAL,
	type  		supplier_type_enum NOT NULL,
	name  		VARCHAR(150),
	address  	VARCHAR(255),
	phone  		VARCHAR(50),
	descp  		VARCHAR(255),
	observation	VARCHAR(255),

	CONSTRAINT pk_supplier PRIMARY KEY (id)
);

-- =============================================
-- Quote Management
-- =============================================
CREATE TABLE quote_request  (
	id 					SERIAL,
  	manager_customer_id INTEGER NOT NULL,
  	manager_factory_id 	INTEGER NOT NULL,
  	descp 				VARCHAR(200),
  	req_date			DATE NOT NULL,
  	order_number 		VARCHAR(50),

	CONSTRAINT pk_quote_request PRIMARY KEY (id),

	CONSTRAINT fk_quote_request_customer
        FOREIGN KEY (manager_customer_id, manager_factory_id) REFERENCES manager_customer(id, factory_id)
);

-- =============================================
-- Triggers for Composites primary keys
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
