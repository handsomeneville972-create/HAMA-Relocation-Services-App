/**
 * HAMA™ System Configuration
 *
 * Central config for the entire platform's operation mode.
 *
 * MONETIZATION SWITCH:
 * When `earlyAccessMode` is set to false, the platform automatically activates
 * subscription plans, billing workflows, access restrictions, feature entitlements,
 * payment integrations, and upgrade requirements — without code changes.
 *
 * SECURITY: This is a client-side config. In production, these flags would be
 * fetched from a remote config service (e.g., Firebase Remote Config, LaunchDarkly).
 */

export const SYSTEM_SETTINGS = {
  /** Master toggle — Early Access mode ON = all features free, OFF = paid subscriptions active */
  earlyAccessMode: true,
  /** When true, payment workflows are live; when false, modals are shown instead */
  subscriptionsEnabled: false,
  /** When true, payment integrations are active */
  paymentsEnabled: false,
  /** When true, Founding Member Program is active with badges and benefits */
  foundingMemberProgram: true,
} as const;

/**
 * Legacy alias for backward compatibility. Use SYSTEM_SETTINGS directly for new code.
 */
export const EARLY_ACCESS_CONFIG = {
  /** Master toggle for the Early Access Program */
  EARLY_ACCESS_ACTIVE: SYSTEM_SETTINGS.earlyAccessMode,

  /** When true, payment workflows are live; when false, modals are shown instead */
  SUBSCRIPTION_PAYMENT_ENABLED: SYSTEM_SETTINGS.subscriptionsEnabled,



  /** Dashboard welcome card */
  DASHBOARD_WELCOME_CARD: {
    ENABLED: true,
  },

  /** Early Access founding member badge */
  EARLY_ACCESS_BADGE: {
    ENABLED: true,
    /** Badge text */
    TEXT: 'FOUNDING MEMBER' as const,
  },

  /** Founding member badges (enabled — shows badges across the platform) */
  FOUNDING_MEMBER_BADGE: {
    ENABLED: true,
    /** Badge text variants */
    TEXT: 'FOUNDING MEMBER' as const,
    ALT_TEXT: 'EARLY ACCESS MEMBER' as const,
  },

  /** Premium modal display */
  PREMIUM_MODAL: {
    ENABLED: true,
    /** Modal title */
    TITLE: '🚀 Welcome to HAMA™ Early Access',
    /** Modal message */
    MESSAGE: 'As one of our Founding Members, you currently enjoy complimentary access to all premium features across the HAMA™ ecosystem.\n\nExplore advanced AI capabilities, business management tools, automation workflows, analytics, reporting systems, customer engagement tools, and future releases at no cost.\n\nYour feedback helps shape the future of HAMA™.\n\nThank you for joining us early.',
  },

  /** Banner display config */
  BANNER: {
    ENABLED: true,
    DISMISSIBLE: true,
    /** Duration to wait before showing again after dismiss (ms) */
    DISMISS_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    /** Banner text */
    TEXT: '🚀 EARLY ACCESS ACTIVE • ALL PREMIUM FEATURES CURRENTLY INCLUDED • FOUNDING MEMBERS RECEIVE COMPLIMENTARY ACCESS • EXPLORE EVERYTHING • BUILD FASTER • GROW SMARTER • LIMITED-TIME OPPORTUNITY',
  },

  /** Priority Subscriber Waitlist config */
  WAITLIST: {
    ENABLED: true,
    MAX_ENTRIES: 10000,
  },

  /** Referral Program config */
  REFERRAL: {
    ENABLED: true,
    BASE_URL: 'https://hama.app/ref',
  },

  /** Email Capture config */
  EMAIL_CAPTURE: {
    ENABLED: true,
    /** Show in dashboard */
    SHOW_IN_HOME: true,
    /** Show in settings */
    SHOW_IN_SETTINGS: true,
  },
} as const;

/**
 * Helper to check if subscription payments are active.
 * When this returns false, all payment CTAs will show the Early Access modal.
 */
export const isSubscriptionPaymentEnabled = (): boolean =>
  EARLY_ACCESS_CONFIG.SUBSCRIPTION_PAYMENT_ENABLED;

/**
 * Helper to check if Early Access program is active.
 */
export const isEarlyAccessActive = (): boolean =>
  EARLY_ACCESS_CONFIG.EARLY_ACCESS_ACTIVE;

/**
 * Check if the platform is currently in Founding Member Program mode.
 */
export const isFoundingMemberProgramActive = (): boolean =>
  SYSTEM_SETTINGS.foundingMemberProgram;

/**
 * Generate a formatted Founding Member number with zero-padding.
 * Example: 1 → '#000001', 123 → '#000123'
 */
export const formatFoundingMemberNumber = (num: number): string =>
  `#${num.toString().padStart(6, '0')}`;
