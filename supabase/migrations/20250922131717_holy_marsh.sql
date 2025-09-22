/*
  # Complete SplitSnap Database Schema - Phase 1

  1. New Tables
    - `users` - User profiles linked to auth.users
    - `groups` - Expense sharing groups
    - `group_members` - Group membership tracking
    - `bills` - Individual bills/receipts
    - `bill_items` - Items within bills
    - `item_assignments` - User assignments to bill items
    - `ledger_entries` - Financial transaction ledger

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    - Create triggers for automatic profile creation

  3. Functions & Triggers
    - Auto-create user profile on auth signup
    - Update timestamps on record changes
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  payment_customer_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger for users
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  creator_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create policies for groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can read groups they belong to"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can update their groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Enable RLS and create policies for group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read group memberships for their groups"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.group_id = group_members.group_id
      AND groups.creator_id = auth.uid()
    )
  );

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
  bill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(group_id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  receipt_image_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create policies for bills
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create bills"
  ON bills
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can read bills they created or are involved in"
  ON bills
  FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = bills.group_id
      AND group_members.user_id = auth.uid()
    ))
  );

CREATE POLICY "Bill creators can update their bills"
  ON bills
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

-- Add updated_at trigger for bills
CREATE TRIGGER handle_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Bill items table
CREATE TABLE IF NOT EXISTS bill_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(bill_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create policies for bill_items
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read items from accessible bills"
  ON bill_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bills
      WHERE bills.bill_id = bill_items.bill_id
      AND (
        bills.creator_id = auth.uid() OR
        (bills.group_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = bills.group_id
          AND group_members.user_id = auth.uid()
        ))
      )
    )
  );

-- Item assignments table
CREATE TABLE IF NOT EXISTS item_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES bill_items(item_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  share_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (share_percentage > 0 AND share_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, user_id)
);

-- Enable RLS and create policies for item_assignments
ALTER TABLE item_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own assignments"
  ON item_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read assignments for accessible bills"
  ON item_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bill_items
      JOIN bills ON bills.bill_id = bill_items.bill_id
      WHERE bill_items.item_id = item_assignments.item_id
      AND (
        bills.creator_id = auth.uid() OR
        (bills.group_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = bills.group_id
          AND group_members.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can update their own assignments"
  ON item_assignments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own assignments"
  ON item_assignments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Ledger entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
  bill_id UUID REFERENCES bills(bill_id) ON DELETE SET NULL,
  payer_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('expense', 'payment', 'settlement')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create policies for ledger_entries
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read ledger entries for their groups"
  ON ledger_entries
  FOR SELECT
  TO authenticated
  USING (
    payer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = ledger_entries.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_creator_id ON bills(creator_id);
CREATE INDEX IF NOT EXISTS idx_bills_group_id ON bills(group_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_item_assignments_item_id ON item_assignments(item_id);
CREATE INDEX IF NOT EXISTS idx_item_assignments_user_id ON item_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_group_id ON ledger_entries(group_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_payer_id ON ledger_entries(payer_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();