import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types - Updated for PRD v3.0 Schema
export interface User {
  user_id: string;
  full_name: string;
  payment_customer_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Group {
  group_id: string;
  name: string;
  creator_id: string;
  created_at?: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at?: string;
}

export interface Bill {
  bill_id: string;
  creator_id: string;
  group_id?: string;
  total_amount: number;
  receipt_image_url?: string;
  status: 'pending' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface BillItem {
  item_id: string;
  bill_id: string;
  name: string;
  price: number;
  quantity: number;
  created_at?: string;
}

export interface ItemAssignment {
  assignment_id: string;
  item_id: string;
  user_id: string;
  share_percentage: number;
  created_at?: string;
}

export interface LedgerEntry {
  entry_id: string;
  group_id: string;
  bill_id?: string;
  payer_id: string;
  amount: number;
  description: string;
  entry_type: 'expense' | 'payment' | 'settlement';
  created_at?: string;
}

// Authentication Types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}