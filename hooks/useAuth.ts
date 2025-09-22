import { useEffect, useState, useCallback } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: {
    user_id: string;
    full_name: string;
    payment_customer_id?: string;
  } | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

// Simple in-module cache to avoid refetching profile repeatedly during short-lived navigations
let profileCache: AuthState['user'] | null = null;

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthState['user']>(profileCache);
  const [loading, setLoading] = useState<boolean>(!profileCache);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (id?: string) => {
    if (!id) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', id)
        .single();

      if (error) throw error;
      profileCache = data as AuthState['user'];
      setUser(data as AuthState['user']);
      return data as AuthState['user'];
    } catch (err: any) {
      console.warn('Failed to fetch profile', err);
      setError(err?.message || String(err));
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;

        if (sessionUser && mounted) {
          // fetch profile from users table
          await fetchProfile(sessionUser.id);
        }
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // event: 'SIGNED_IN' | 'SIGNED_OUT' | etc.
        setLoading(true);
        setError(null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          profileCache = null;
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const redirectTo = Linking.createURL('auth/callback');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const redirectTo = Linking.createURL('auth/callback');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } catch (err: any) {
        setError(err?.message || String(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, fullName: string) => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;

        // If Supabase created the user and session, fetch profile
        const userId = data?.user?.id;
        if (userId) {
          await fetchProfile(userId);
        }
      } catch (err: any) {
        setError(err?.message || String(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile]
  );

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      profileCache = null;
      setUser(null);
    } catch (err: any) {
      setError(err?.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}

export default useAuth;
