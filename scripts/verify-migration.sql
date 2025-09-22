-- verify-migration.sql
-- Run these queries after applying the migrations to confirm schema, triggers, and RLS.

-- 1) Confirm expected tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users','groups','group_members','bills','bill_items');

-- 2) Confirm users table primary key and columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users';

-- 3) Confirm trigger for auth user creation exists (name may vary)
SELECT tgname, tgrelid::regclass::text AS table_name
FROM pg_trigger
WHERE tgname ILIKE '%auth_user_created%' OR tgname ILIKE '%on_auth_user_created%';

-- 4) Confirm RLS enabled on critical tables
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('users','groups','group_members','bills','bill_items');

-- 5) Sample a users row by a placeholder (replace with a real user_id when available)
-- SELECT * FROM users WHERE user_id = '<replace-with-test-user-uuid>' LIMIT 1;

-- 6) Confirm necessary extensions (e.g., pgcrypto) if used in migrations
SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto','uuid-ossp');
