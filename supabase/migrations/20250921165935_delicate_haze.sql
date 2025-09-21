/*
  # Initial SplitSnap Database Schema
  
  This migration creates the complete database schema for SplitSnap as specified in PRD v3.0.
  
  ## Tables Created:
  1. **users** - Public user profiles linked to auth.users
  2. **groups** - Expense groups for ongoing shared costs
  3. **group_members** - Many-to-many relationship between users and groups
  4. **bills** - Individual bills/receipts
  5. **bill_items** - Line items from bills
  6. **item_assignments** - User claims on bill items
  7. **ledger_entries** - Financial transaction records
  
  ## Security:
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access their own data
  - Automatic user profile creation via database trigger
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (public profile data)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    payment_customer_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    creator_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members junction table
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
    bill_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(group_id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    receipt_image_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill items table
CREATE TABLE IF NOT EXISTS bill_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES bills(bill_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item assignments table (who claimed what)
CREATE TABLE IF NOT EXISTS item_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES bill_items(item_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    share_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (share_percentage > 0 AND share_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(item_id, user_id)
);

-- Ledger entries table (financial transactions)
CREATE TABLE IF NOT EXISTS ledger_entries (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
    bill_id UUID REFERENCES bills(bill_id) ON DELETE SET NULL,
    payer_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('expense', 'payment', 'settlement')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
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

-- RLS Policies for groups table
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

CREATE POLICY "Users can create groups"
    ON groups
    FOR INSERT
    TO authenticated
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Group creators can update their groups"
    ON groups
    FOR UPDATE
    TO authenticated
    USING (creator_id = auth.uid());

-- RLS Policies for group_members table
CREATE POLICY "Users can read their group memberships"
    ON group_members
    FOR SELECT
    TO authenticated
    USING (
        -- Only allow a user to read their own membership rows. We avoid referencing
        -- the `groups` table here to prevent recursive RLS evaluation between
        -- `groups` and `group_members` policies which can cause "infinite recursion".
        user_id = auth.uid()
    );

CREATE POLICY "Users can join groups"
    ON group_members
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- RLS Policies for bills table
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

CREATE POLICY "Users can create bills"
    ON bills
    FOR INSERT
    TO authenticated
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Bill creators can update their bills"
    ON bills
    FOR UPDATE
    TO authenticated
    USING (creator_id = auth.uid());

-- RLS Policies for bill_items table
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

-- RLS Policies for item_assignments table
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

CREATE POLICY "Users can create their own assignments"
    ON item_assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

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

-- RLS Policies for ledger_entries table
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

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_bills_creator_id ON bills(creator_id);
CREATE INDEX IF NOT EXISTS idx_bills_group_id ON bills(group_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_item_assignments_item_id ON item_assignments(item_id);
CREATE INDEX IF NOT EXISTS idx_item_assignments_user_id ON item_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_group_id ON ledger_entries(group_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_payer_id ON ledger_entries(payer_id);