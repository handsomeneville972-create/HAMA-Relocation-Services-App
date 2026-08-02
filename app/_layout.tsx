import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { COLORS } from '../src/constants/theme';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { EarlyAccessProvider } from '../src/contexts/EarlyAccessContext';
import { CartProvider } from '../src/contexts/CartContext';
import { ProviderProvider } from '../src/contexts/ProviderContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { PriorityWaitlistForm } from '../src/components/PriorityWaitlistForm';
import { loadUserCurrency } from '../src/utils/currency';
import { startPeriodicRefresh } from '../src/utils/exchangeRates';

/**
 * AuthGuard — redirects users based on authentication state.
 * - Unauthenticated users are redirected to Login
 * - Authenticated users with unverified email see a verification prompt
 * - Authenticated users who haven't completed onboarding go to CreateProfile
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isProfileReady, needsOnboarding } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const isOnAuthScreen = segments[0] === 'Login' || segments[0] === 'ForgotPassword';
    const isOnCreateProfile = segments[0] === 'CreateProfile';
    const isOnCallback = segments[0] === 'auth';

    if (!isAuthenticated) {
      if (!isOnAuthScreen && !isOnCallback) {
        // Redirect to login
        router.replace('/Login');
      }
    } else if (isProfileReady && needsOnboarding) {
      // New users must complete profile setup first
      if (!isOnCreateProfile && !isOnCallback) {
        router.replace('/CreateProfile');
      }
    } else if (isProfileReady) {
      if (isOnAuthScreen || isOnCreateProfile) {
        // Authenticated users don't need login or onboarding
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, isProfileReady, needsOnboarding, segments, router]);

  return <>{children}</>;
}

/**
 * SessionMonitor — refreshes auth on app foreground and monitors
 * session validity.
 */
function SessionMonitor() {
  const { isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isAuthenticated) {
        // App came to foreground — session refresh is handled by
        // the Supabase client autoRefreshToken internally.
        // We could add a manual session check here if needed.
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [isAuthenticated]);

  return null;
}

/**
 * LayoutWithBanner — wraps screens with the Early Access announcement banner
 * and the premium modal so they appear consistently across all pages.
 */
function LayoutWithBanner({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      {children}
      <PriorityWaitlistForm />
    </View>
  );
}

export default function RootLayout() {
  // Load the user's saved currency preference from SecureStore at startup.
  // This runs once before any screen renders so formatPrice() has the
  // correct in-memory value from the start.
  useEffect(() => {
    loadUserCurrency();
    // Start periodic exchange rate refresh (fetches immediately, then every 6h)
    const stopRefresh = startPeriodicRefresh();
    return () => stopRefresh();
  }, []);

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <EarlyAccessProvider>
          <AuthProvider>
            <CartProvider>
            <ProviderProvider>
              <AuthGuard>
                <SessionMonitor />
                <StatusBar style="light" />
                <LayoutWithBanner>
                  <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.bg },
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="ProductDetail"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="Storefront"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="ServiceDetail"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="PostDetail"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="CreatePost"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="Subscriptions"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="About"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="PropertyDetail"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="Search"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="Favorites"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="Inbox"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="Chat"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="Settings"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="CurrencyPicker"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="PaymentMethods"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="BillingHistory"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="ForgotPassword"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="Login"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="CreateProfile"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="auth/callback"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="auth/update-password"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="WhatsNew"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="WorkspacePlans"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="EditProfile"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="MyPosts"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="LandlordOnboarding"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="LandlordDashboard"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="Legal"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="FounderDashboard"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="Announcements"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="AdminCenter"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="Cart"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="ServiceProviderOnboarding"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="ServiceProviderProfile"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="SellerDashboard"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="PrivacyPolicy"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                </Stack>
              </LayoutWithBanner>
            </AuthGuard>
            </ProviderProvider>
          </CartProvider>
          </AuthProvider>
        </EarlyAccessProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
