Phase 1: Authentication & Core — Completed

Summary
- Applied Phase 1 DB schema and RLS migrations to hosted Supabase.
- Fixed recursive RLS issue on `group_members` by applying a safe, idempotent policy.
- Verified session persistence, profile creation trigger, and RLS behavior via e2e smoke tests.

What changed
- Edited: `supabase/migrations/20250922131717_holy_marsh.sql` (made policy/trigger blocks idempotent)
- Added: `supabase/migrations/20250926120000_fix_group_members_policy.sql` (idempotent migration)
- Added: `supabase/sql/fix_group_members_policy.sql` (convenience SQL)
- Added: `scripts/test-group-members.js` (temporary test script used locally)
- Edited: `package.json` (added helper script placeholder)

Verification performed
- `supabase db push` applied migrations successfully (existing objects skipped where appropriate).
- `npm run e2e-auth` completed: signup/signin succeeded and `users` profile row was created.
- `node scripts/test-group-members.js` returned `{ data: [], error: null }` when querying `group_members` as the test user (no RLS recursion errors).

Notes
- The `.env` file contains your project URL and anon key for local testing. Do not commit secrets to source control.
- Consider adding a CI job that runs `npm run e2e-auth` against a staging project to prevent regressions.

Date: 2025-09-26
