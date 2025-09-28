import { useEffect, useState, useCallback } from 'react';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
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

      if (error) {
        // If profile doesn't exist, it might still be creating via trigger
        if (error.code === 'PGRST116') {
          console.log('Profile not found, may still be creating...');
          return null;
        }
        throw error;
      }

      profileCache = data as AuthState['user'];
      setUser(data as AuthState['user']);
      return data as AuthState['user'];
    } catch (err: any) {
      console.warn('Failed to fetch profile', err);
      // Don't set error for profile fetch failures during auth flow
      if (!err?.message?.includes('not found')) {
        setError(err?.message || String(err));
      }
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        // During development, forcibly clear any existing session so the login screen shows
        // This makes it easier to test auth flows in the simulator/dev client.
        // Only runs in dev to avoid affecting production.
        // @ts-ignore
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          try {
            await supabase.auth.signOut();
            console.debug('[useAuth] forced signOut in __DEV__');
          } catch (e) {
            console.debug('[useAuth] forced signOut failed', e);
          }
        }
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[useAuth] init supabase session:', sessionData);
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
        console.log('[useAuth] onAuthStateChange', event, session);
        // event: 'SIGNED_IN' | 'SIGNED_OUT' | etc.
        setLoading(true);
        setError(null);

        if (session?.user) {
          // Retry profile fetch with delay for new users
          let retries = 3;
          let profile = null;

          while (retries > 0 && !profile) {
            profile = await fetchProfile(session.user.id);
            if (!profile) {
              retries--;
              if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
          }

          if (!profile) {
            console.warn('Profile creation may have failed');
          }
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
      console.log('[useAuth] signInWithGoogle redirectTo=', redirectTo);
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      console.debug('[useAuth] signInWithGoogle result=', result);
      if (result.error) throw result.error;
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      setError(errorMessage);
      Alert.alert('Sign In Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const redirectTo = Linking.createURL('auth/callback');
      console.log('[useAuth] signInWithApple redirectTo=', redirectTo);
      const result = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo },
      });
      console.debug('[useAuth] signInWithApple result=', result);
      if (result.error) throw result.error;
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      setError(errorMessage);
      Alert.alert('Sign In Error', errorMessage);
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

        // If Supabase created the user, wait for profile creation
        const userId = data?.user?.id;
        if (userId) {
          // Give the database trigger time to create the profile
          setTimeout(async () => {
            await fetchProfile(userId);
          }, 1500);
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
