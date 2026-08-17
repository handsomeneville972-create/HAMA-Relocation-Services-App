import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface PaystackWebViewProps {
  visible: boolean;
  authorizationUrl: string;
  reference: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
  onClose: () => void;
}

/**
 * Paystack WebView Checkout Modal
 *
 * Loads the Paystack standard checkout URL in a WebView
 * and monitors navigation to detect:
 *   - Success: redirect to callback URL with reference
 *   - Cancel: redirect to close URL
 *   - Error: any navigation error
 */
export const PaystackWebView: React.FC<PaystackWebViewProps> = ({
  visible,
  authorizationUrl,
  reference,
  onSuccess,
  onCancel,
  onError,
  onClose,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleNavigationStateChange = (navState: { url: string }) => {
    const { url } = navState;

    // Success: callback URL includes reference or trxref
    if (
      url.includes('paystack/callback') ||
      url.includes('trxref=') ||
      url.includes('reference=')
    ) {
      setLoading(false);
      onSuccess(reference);
      return;
    }

    // Cancelled: Paystack close URL
    if (url.includes('standard.paystack.co/close')) {
      setLoading(false);
      onCancel();
      return;
    }
  };

  const handleError = () => {
    setError('Failed to load payment page. Please check your connection and try again.');
    onError('WebView failed to load');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.98)', 'rgba(0,0,0,0.99)']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Pay with Paystack</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            Secure payment via card or M-Pesa
          </Text>
        </LinearGradient>

        {/* WebView */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onClose}>
              <Text style={styles.retryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <WebView
              ref={webViewRef}
              source={{ uri: authorizationUrl }}
              style={styles.webview}
              onNavigationStateChange={handleNavigationStateChange}
              onError={handleError}
              onLoadEnd={() => setLoading(false)}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>
                    Loading secure payment page...
                  </Text>
                </View>
              )}
            />

            {/* Loading overlay (shown until page loads) */}
            {loading && (
              <View style={styles.initialLoading}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.98)']}
                  style={styles.initialLoadingContent}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.initialLoadingTitle}>
                    Connecting to Paystack...
                  </Text>
                  <Text style={styles.initialLoadingSubtitle}>
                    Secure payment gateway
                  </Text>
                </LinearGradient>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 50, // Status bar offset
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h3,
    color: colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  initialLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  initialLoadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  initialLoadingTitle: {
    ...FONTS.h3,
    color: colors.text,
  },
  initialLoadingSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: 16,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
