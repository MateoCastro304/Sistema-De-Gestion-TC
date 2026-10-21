-- ── Unicidad que Prisma no expresa ──────────────────────────────
CREATE UNIQUE INDEX "category_name_lower_key"
    ON "category" (LOWER("name"));

CREATE UNIQUE INDEX "refresh_token_session_active_key"
    ON "refresh_token" ("session_id")
    WHERE "revoked_at" IS NULL;

-- ── file (S1-2) ─────────────────────────────────────────────────
ALTER TABLE "file"
    ADD CONSTRAINT "ck_file_size_positive" CHECK ("size_bytes" > 0);

-- ── employee ────────────────────────────────────────────────────
ALTER TABLE "employee"
    ADD CONSTRAINT "ck_employee_dni_format"
        CHECK ("dni" ~ '^[0-9]{7,8}$'),
    ADD CONSTRAINT "ck_employee_names_trimmed"
        CHECK ("first_name" = btrim("first_name") AND "first_name" <> ''
           AND "last_name"  = btrim("last_name")  AND "last_name"  <> ''),
    ADD CONSTRAINT "ck_employee_optional_trimmed"
        CHECK (("address" IS NULL OR ("address" = btrim("address") AND "address" <> ''))
           AND ("email"   IS NULL OR ("email"   = btrim("email")   AND "email"   <> ''))
           AND ("phone"   IS NULL OR ("phone"   = btrim("phone")   AND "phone"   <> ''))),
    ADD CONSTRAINT "ck_employee_email_format"
        CHECK ("email" IS NULL OR "email" ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    ADD CONSTRAINT "ck_employee_search_key_not_empty"
        CHECK ("search_key" <> '');

-- ── app_user ────────────────────────────────────────────────────
ALTER TABLE "app_user"
    ADD CONSTRAINT "ck_app_user_username_lower"
        CHECK ("username" = lower(btrim("username")) AND "username" <> ''),
    ADD CONSTRAINT "ck_app_user_failed_attempts"
        CHECK ("failed_login_attempts" >= 0);

-- ── user_session ────────────────────────────────────────────────
ALTER TABLE "user_session"
    ADD CONSTRAINT "ck_user_session_expires_after_start"
        CHECK ("expires_at" > "started_at"),
    ADD CONSTRAINT "ck_user_session_activity_after_start"
        CHECK ("last_activity_at" >= "started_at"),
    ADD CONSTRAINT "ck_user_session_end_complete"
        CHECK (("ended_at" IS NULL) = ("end_reason" IS NULL)),
    ADD CONSTRAINT "ck_user_session_end_after_start"
        CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at");

-- ── refresh_token ───────────────────────────────────────────────
ALTER TABLE "refresh_token"
    ADD CONSTRAINT "ck_refresh_token_replaced_is_revoked"
        CHECK ("replaced_by" IS NULL OR "revoked_at" IS NOT NULL),
    ADD CONSTRAINT "ck_refresh_token_not_self"
        CHECK ("replaced_by" IS NULL OR "replaced_by" <> "id");

-- ── process_type ────────────────────────────────────────────────
ALTER TABLE "process_type"
    ADD CONSTRAINT "ck_process_type_rates_positive"
        CHECK ("hourly_rate_ars" > 0 AND "hourly_rate_usd" > 0 AND "exchange_rate" > 0),
    ADD CONSTRAINT "ck_process_type_name_trimmed"
        CHECK ("name" = btrim("name") AND "name" <> '' AND "name_key" <> ''),
    ADD CONSTRAINT "ck_process_type_description_trimmed"
        CHECK ("description" IS NULL OR ("description" = btrim("description") AND "description" <> ''));

-- ── process_type_price_history ──────────────────────────────────
ALTER TABLE "process_type_price_history"
    ADD CONSTRAINT "ck_price_history_values_positive"
        CHECK ("exchange_rate" > 0 AND "previous_value_usd" > 0 AND "new_value_usd" > 0);

-- ── material ────────────────────────────────────────────────────
ALTER TABLE "material"
    ADD CONSTRAINT "ck_material_trimmed"
        CHECK ("name" = btrim("name") AND "name" <> ''
           AND "quality" = btrim("quality") AND "quality" <> ''
           AND "name_key" <> '' AND "quality_key" <> '');

-- ── exchange_rate ───────────────────────────────────────────────
ALTER TABLE "exchange_rate"
    ADD CONSTRAINT "ck_exchange_rate_single_row" CHECK ("id" = 1),
    ADD CONSTRAINT "ck_exchange_rate_positive"   CHECK ("rate" > 0);