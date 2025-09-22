import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Handle OAuth deep linking
    const handleDeepLink = async (url: string) => {
      if (url.includes('auth/callback')) {
        console.debug('[app/_layout] handling deep link URL=', url);
        // Using dynamic access to avoid TS mismatch between supabase client versions
        const fn = (supabase.auth as any).getSessionFromUrl;
        if (typeof fn === 'function') {
          const { data, error } = await fn.call(supabase.auth, { url });
          console.debug('[app/_layout] getSessionFromUrl result', {
            data,
            error,
          });
          if (error) {
            console.error('[app/_layout] OAuth callback error:', error);
          } else {
            console.debug('[app/_layout] OAuth callback parsed session=', data);
          }
        } else {
          console.warn(
            '[app/_layout] supabase.auth.getSessionFromUrl not available on this client'
          );
        }
      }
    };

    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle subsequent deep links (app already open)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
