import { router } from 'expo-router';

/**
 * Route name to path mapping for expo-router navigation.
 * Single source of truth so route-based navigation logic isn't duplicated
 * across screens with inline if-else chains.
 */
const ROUTE_PATHS: Record<string, string> = {
  About: '/About',
  Favorites: '/Favorites',
  Cart: '/Cart',
  Inbox: '/Inbox',
  Login: '/Login',
  Subscriptions: '/Subscriptions',
  Settings: '/Settings',
  PaymentMethods: '/PaymentMethods',
  BillingHistory: '/BillingHistory',
  WhatsNew: '/WhatsNew',
  Legal: '/Legal',
  Roadmap: '/Roadmap',
  FounderDashboard: '/FounderDashboard',
  Announcements: '/Announcements',
  AdminCenter: '/AdminCenter',
  LandlordOnboarding: '/LandlordOnboarding',
  LandlordDashboard: '/LandlordDashboard',
  ServiceProviderOnboarding: '/ServiceProviderOnboarding',
  ServiceProviderProfile: '/ServiceProviderProfile',
  SellerDashboard: '/SellerDashboard',
  PrivacyPolicy: '/PrivacyPolicy',
  WorkspacePlans: '/WorkspacePlans',
  EditProfile: '/EditProfile',
  MyPosts: '/MyPosts',
};

/**
 * Navigate to a screen by route name.
 * If the route name isn't recognised, does nothing (silent no-op).
 */
export const navigateToRoute = (route: string): void => {
  const path = ROUTE_PATHS[route];
  if (path) {
    router.push(path as any);
  }
};
