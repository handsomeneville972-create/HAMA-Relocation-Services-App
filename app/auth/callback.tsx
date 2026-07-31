import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/utils/supabaseClient';
import { COLORS } from '../../src/constants/theme';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Verification failed. Please try again.');
          return;
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setStatus('error');
            setMessage('Failed to verify email. The link may have expired.');
            return;
          }
        } else {
          setStatus('error');
          setMessage('No verification code found. Please use the link from your email.');
          return;
        }

        setStatus('success');
        setMessage('Email verified! Redirecting...');

        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1500);
      } catch {
        setStatus('error');
        setMessage('Something went wrong. Please try signing in.');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.title}>Verifying...</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}
        {status === 'success' && (
          <>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.title}>Email Verified!</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}
        {status === 'error' && (
          <>
            <Ionicons name="close-circle" size={64} color={COLORS.error} />
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
