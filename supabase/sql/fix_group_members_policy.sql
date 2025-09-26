-- Safe, idempotent replacement for group_members SELECT policy
-- Run with: supabase db push --file supabase/sql/fix_group_members_policy.sql

DROP POLICY IF EXISTS "Users can read group memberships for their groups" ON public.group_members;

CREATE POLICY "Users can read group memberships for their groups"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
