/**
 * HAMA™ Analytics Utility
 *
 * Lightweight analytics for tracking user behavior during the Early Access Program.
 * In production, replace the `logEvent` implementation with your analytics SDK
 * (e.g., Amplitude, Mixpanel, PostHog, Segment).
 *
 * All tracking events are fire-and-forget — no impact on user experience.
 */

type AnalyticsEventCategory =
  | 'early_access'
  | 'subscription'
  | 'pricing'
  | 'feature_engagement'
  | 'banner'
  | 'retention'
  | 'navigation'
  | 'freemium'
  | 'waitlist'
  | 'email_capture'
  | 'feature_request';

type AnalyticsEvent =
  // Early Access
  | 'early_access_modal_viewed'
  | 'early_access_continue_exploring'
  | 'early_access_learn_more'
  | 'early_access_view_premium_features'
  // Freemium Mode
  | 'freemium_badge_viewed'
  | 'freemium_upgrade_clicked'
  | 'freemium_plan_viewed'
  // Subscription / Upgrade CTAs
  | 'upgrade_cta_clicked'
  | 'pricing_plan_selected'
  | 'pricing_plan_viewed'
  | 'subscribe_cta_clicked'
  // Banner
  | 'banner_dismissed'
  | 'banner_displayed'
  | 'banner_auto_scrolled'
  // Dashboard
  | 'dashboard_welcome_card_viewed'
  | 'dashboard_welcome_card_dismissed'
  // Feature
  | 'premium_feature_viewed'
  | 'premium_feature_engaged'
  // Retention
  | 'user_session_start'
  | 'user_session_end'
  | 'feature_used'
  // Waitlist
  | 'waitlist_modal_viewed'
  | 'waitlist_submitted'
  | 'waitlist_cancelled'
  // Email Capture
  | 'email_capture_viewed'
  | 'email_capture_subscribed'
  | 'email_capture_dismissed'
  // Feature Request
  | 'feature_request_portal_viewed'
  | 'feature_request_submitted'
  | 'feature_request_voted'
  | 'feature_request_cancelled'
  // Feedback
  | 'feedback_submitted'
  // Subscription Interest Tracking
  | 'subscription_interest_tracked'
  // Engagement Prompts
  | 'engagement_prompt_dismissed'
  | 'engagement_prompt_acted';

interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined | null;
}

/**
 * Log an analytics event.
 *
 * @param event - The event name
 * @param properties - Optional properties to attach
 */
export const logEvent = (
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
): void => {
  // TODO: Replace with your analytics SDK
  // e.g., Amplitude.logEvent(event, properties);
  // e.g., mixpanel.track(event, properties);
  // e.g., posthog.capture(event, properties);

  if (__DEV__) {
    console.log(`[Analytics] ${event}`, properties ?? '');
  }
};

/**
 * Track a pricing or upgrade CTA click.
 */
export const trackUpgradeClick = (source: string): void => {
  logEvent('upgrade_cta_clicked', { source });
};

/**
 * Track a pricing plan selection.
 */
export const trackPricingPlanSelected = (planTier: string, userType: string): void => {
  logEvent('pricing_plan_selected', { plan_tier: planTier, user_type: userType });
};

/**
 * Track premium feature engagement.
 */
export const trackPremiumFeatureEngaged = (feature: string): void => {
  logEvent('premium_feature_engaged', { feature });
};

/**
 * Track banner interactions.
 */
export const trackBannerDismissed = (): void => {
  logEvent('banner_dismissed');
};

/**
 * Track freemium badge impressions.
 */
export const trackFreemiumBadgeViewed = (location: string): void => {
  logEvent('freemium_badge_viewed', { location });
};

/**
 * Track freemium upgrade clicks (users trying to access premium features).
 */
export const trackFreemiumUpgradeClicked = (source: string, planTier?: string): void => {
  logEvent('freemium_upgrade_clicked', { source, plan_tier: planTier ?? 'unknown' });
};

/**
 * Track which plans users are viewing during early access.
 */
export const trackFreemiumPlanViewed = (planTier: string, userType: string): void => {
  logEvent('freemium_plan_viewed', { plan_tier: planTier, user_type: userType });
};

/**
 * Track premium feature engagement during early access.
 */
export const trackEarlyAccessFeatureUsed = (feature: string, category: string): void => {
  logEvent('premium_feature_engaged', { feature, category, source: 'early_access' });
};

// ---------- Waitlist Analytics ----------

/** Track waitlist modal viewed */
export const trackWaitlistViewed = (): void => {
  logEvent('waitlist_modal_viewed');
};

/** Track waitlist submission */
export const trackWaitlistSubmitted = (plan: string): void => {
  logEvent('waitlist_submitted', { preferred_plan: plan });
};

/** Track waitlist cancellation */
export const trackWaitlistCancelled = (): void => {
  logEvent('waitlist_cancelled');
};

// ---------- Email Capture Analytics ----------

/** Track email capture form viewed */
export const trackEmailCaptureViewed = (): void => {
  logEvent('email_capture_viewed');
};

/** Track email subscription */
export const trackEmailSubscribed = (): void => {
  logEvent('email_capture_subscribed');
};

/** Track email capture dismissed */
export const trackEmailDismissed = (): void => {
  logEvent('email_capture_dismissed');
};

// ---------- Feature Request Analytics ----------

/** Track feature request portal viewed */
export const trackFeatureRequestViewed = (source: string): void => {
  logEvent('feature_request_portal_viewed', { source });
};

/** Track feature request submitted */
export const trackFeatureRequestSubmitted = (category: string, priority: string): void => {
  logEvent('feature_request_submitted', { category, priority });
};

/** Track feature request vote */
export const trackFeatureRequestVoted = (requestId: string): void => {
  logEvent('feature_request_voted', { request_id: requestId });
};

/** Track feature request cancellation */
export const trackFeatureRequestCancelled = (): void => {
  logEvent('feature_request_cancelled');
};

// ---------- Subscription Interest Tracking ----------

/** Track subscription interest when user clicks a plan */
export const trackSubscriptionInterest = (planTier: string, userType: string, userId?: string): void => {
  logEvent('subscription_interest_tracked', {
    plan_tier: planTier,
    user_type: userType,
    user_id: userId ?? 'anonymous',
    timestamp: new Date().toISOString(),
  });
};

// ---------- Feedback Analytics ----------

/** Track feedback submission */
export const trackFeedbackSubmitted = (rating: number): void => {
  logEvent('feedback_submitted', { rating });
};
