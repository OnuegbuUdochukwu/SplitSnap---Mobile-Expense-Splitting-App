#!/usr/bin/env bash
# run-migration-and-verify.sh
# Helper script to apply a single migration file with the Supabase CLI and run verification queries.

set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install: npm install -g supabase"
  exit 1
fi

MIGRATION_FILE="supabase/migrations/20250921165935_delicate_haze.sql"
VERIFY_SQL="scripts/verify-migration.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Migration file not found: $MIGRATION_FILE"
  exit 1
fi

if [ ! -f "$VERIFY_SQL" ]; then
  echo "Verify SQL not found: $VERIFY_SQL"
  exit 1
fi

# Ensure project is linked; prefer automatic detection via supabase/config.toml
if [ -f "supabase/config.toml" ]; then
  echo "Found supabase/config.toml — assuming project is linked."
else
  read -p "supabase/config.toml not found. Have you linked this repo to your Supabase project with 'supabase link --project-ref <ref>'? (y/n) " yn
  case $yn in
    [Yy]*) ;;
    *) echo "Please run 'supabase link --project-ref <ref>' and re-run this script."; exit 1 ;;
  esac
fi

echo "Applying migration: $MIGRATION_FILE"
supabase db push --file "$MIGRATION_FILE"
# Apply migration
echo "Applying migrations from local migrations directory (supabase/migrations/)"
# The Supabase CLI does not accept a single --file for db push. Use `supabase db push` to push local migrations.
supabase db push --yes

echo "Migration applied. Running verification queries (this will open the SQL editor output)."

echo "You can copy the content of $VERIFY_SQL and run in Supabase SQL Editor, or use psql with DATABASE_URL."

echo "----"
cat "$VERIFY_SQL"

echo "----"

echo "Done. If any verification query returned unexpected results, inspect the migration file and policies."
