-- Migration: make group_members SELECT policy non-recursive (idempotent)
-- Run: supabase db push

DROP POLICY IF EXISTS "Users can read group memberships for their groups" ON public.group_members;

CREATE POLICY "Users can read group memberships for their groups"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
