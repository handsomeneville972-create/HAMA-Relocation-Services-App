// ============ USER TYPES ============

/** All possible user roles in the HAMA platform */
export type UserRole = 'seeker' | 'landlord' | 'seller' | 'service_provider' | 'hamisha_squad' | 'admin';

/** Verification status levels for users */
export type VerificationLevel = 'unverified' | 'email' | 'phone' | 'id' | 'business' | 'full';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  avatar: string;
  role: UserRole;
  /** Legacy simple verified flag */
  verified: boolean;
  /** Detailed verification levels */
  verificationLevel: VerificationLevel;
  joinDate: string;
  /** ISO date of last login */
  lastLoginAt?: string;

  // ===== Profile Info =====
  /** Unique @handle username */
  username?: string;
  /** Short bio (max 80 chars) */
  bio?: string;
  /** External website URL */
  website?: string;
  /** Whether the user has completed the first-login profile setup */
  onboardingCompleted?: boolean;

  // ===== Business & Profile Info =====
  /** Business name (for landlords, sellers, service providers) */
  businessName?: string;
  /** Type of business */
  businessType?: string;
  /** User's country */
  country?: string;

  // ===== Engagement =====
  /** Premium usage score (0-100) based on feature adoption */
  premiumUsageScore?: number;
  /** Subscription interest level */
  subscriptionInterestLevel?: 'low' | 'medium' | 'high';

  // ===== Activity Metrics =====
  /** Total login count */
  loginCount?: number;
  /** Number of features used */
  featureUsageCount?: number;
  /** Total session duration in minutes */
  sessionDurationMinutes?: number;
  /** Most used tools (comma-separated) */
  mostUsedTools?: string[];
}

// ============ VERIFICATION TYPES ============

export interface VerificationBadge {
  type: VerificationLevel;
  label: string;
  icon: string;
  grantedAt: string;
}

// ============ AUDIT LOG TYPES ============

export type AuditEventType =
  | 'login.success'
  | 'login.failure'
  | 'logout'
  | 'signup'
  | 'password.reset_requested'
  | 'password.reset_completed'
  | 'password.changed'
  | 'email.verified'
  | 'phone.verified'
  | 'profile.updated'
  | 'account.deleted'
  | 'account.data_exported'
  | 'property.created'
  | 'property.updated'
  | 'subscription.purchased'
  | 'subscription.cancelled'
  | 'session.revoked_all';

export interface AuditLogEntry {
  id: string;
  event_type: AuditEventType;
  user_id?: string;
  email?: string;
  ip_address?: string;
  metadata?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

// ============ LANDLORD VERIFICATION ============

export interface LandlordVerification {
  id: string;
  userId: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  nationalIdVerified: boolean;
  businessVerified: boolean;
  documentsUrl?: string[];
  verifiedAt?: string;
  expiresAt?: string;
}

// ============ MARKETPLACE TYPES ============

export type ProductCategory = 
  | 'Furniture'
  | 'Appliances'
  | 'Electronics'
  | 'Home Essentials'
  | 'Household Items'
  | 'Utilities'
  | 'Student Starter Packs';

export type ProductSubcategory =
  // Furniture
  | 'Sofas' | 'Beds' | 'Mattresses' | 'Wardrobes' | 'Dining Tables' | 'Office Desks' | 'Office Furniture'
  // Appliances
  | 'TVs' | 'Refrigerators' | 'Cookers' | 'Microwaves' | 'Washing Machines' | 'Water Dispensers' | 'Air Conditioners'
  // Electronics
  | 'Computers' | 'Laptops' | 'Printers' | 'Networking Devices' | 'Routers' | 'CCTV'
  // Home Essentials
  | 'Curtains' | 'Carpets' | 'Utensils' | 'Storage Boxes' | 'Bedding' | 'Kitchenware'
  // Utilities
  | 'Water Tanks' | 'Solar Systems' | 'Inverters' | 'Generators'
  // Student Starter Packs
  | 'Starter Kits' | 'Dorm Essentials';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: ProductCategory;
  subcategory: ProductSubcategory;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  seller: Seller;
  rating: number;
  reviewCount: number;
  location: string;
  featured: boolean;
  createdAt: string;
}

export interface Seller {
  id: string;
  name: string;
  logo: string;
  banner: string;
  description: string;
  location: string;
  contact: string;
  rating: number;
  reviewCount: number;
  followers: number;
  joinedDate: string;
  verified: boolean;
  products: Product[];
}

// ============ CART TYPES ============

export interface CartItem {
  productId: string;
  quantity: number;
  selected: boolean;
  savedForLater: boolean;
  addedAt: string;
}

export interface CartCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minSubtotal: number;
  description: string;
}

export interface CartTotals {
  subtotal: number;
  savings: number;
  delivery: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
}

// ============ SERVICE PROVIDER PROFILE TYPES ============

export type ProviderPlanTier = 'House Seeker' | 'Standard' | 'Premium';

export interface ProviderService {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUnit: 'per job' | 'per hour' | 'per day' | 'per session' | 'quote';
  duration: string;
  warranty: string;
  emergencyAvailable: boolean;
  active: boolean;
}

export interface ProviderDayHours {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  open: string;
  close: string;
  closed: boolean;
}

export interface ProviderPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface ProviderPortfolioItem {
  id: string;
  type: 'photo' | 'video';
  uri: string;
  title: string;
  description: string;
}

export interface ProviderCertification {
  id: string;
  name: string;
  issuer: string;
  year: number;
  verified: boolean;
}

export interface ProviderDocument {
  id: string;
  name: string;
  uri: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface ProviderSocialLink {
  platform: string;
  handle: string;
}

export interface ProviderBankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface ProviderReview {
  id: string;
  customerName: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  service: string;
  media?: string[];
  reply?: { text: string; date: string };
}

export interface ProviderTeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface ProviderProfile {
  id: string;
  businessName: string;
  logo: string;
  coverImage: string;
  description: string;
  yearsInBusiness: number;
  teamSize: number;
  phone: string;
  email: string;
  website: string;
  socialMedia: ProviderSocialLink[];
  address: string;
  county: string;
  town: string;
  gps: { lat: number; lng: number } | null;
  category: ServiceCategory;
  subcategory: ServiceSubcategory;
  services: ProviderService[];
  serviceAreas: { counties: string[]; towns: string[]; neighborhoods: string[]; radiusKm: number };
  businessHours: ProviderDayHours[];
  open247: boolean;
  callOutFee: number;
  consultationFee: number;
  packages: ProviderPackage[];
  portfolio: ProviderPortfolioItem[];
  certifications: ProviderCertification[];
  documents: ProviderDocument[];
  paymentMethods: string[];
  mpesaNumber: string;
  bankAccount: ProviderBankAccount | null;
  branding: { accentColor: string; tagline: string; promoVideo: string | null };
  languages: string[];
  isEmergencyProvider: boolean;
  warranty: string;
  team: ProviderTeamMember[];
  reviews: ProviderReview[];
  faqs: { id: string; question: string; answer: string }[];
  promotions: { id: string; title: string; discount: string; active: boolean }[];
  status: 'draft' | 'pending_review' | 'active';
  plan: ProviderPlanTier;
  subscriptionExpiry: string | null;
  completedSteps: string[];
  keywords: string[];
  searchScore: number;
  onboardingComplete: boolean;
  responseTime: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  totalRevenue: number;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderStepValidation {
  valid: boolean;
  message?: string;
}

export interface ProfileCompletionBreakdown {
  total: number;
  sections: { key: string; label: string; done: number; total: number }[];
}

export interface RankedProvider {
  profile: ProviderProfile;
  score: number;
  breakdown: {
    categoryRelevance: number;
    locationProximity: number;
    serviceMatching: number;
    ratings: number;
    reviewQuality: number;
    verification: number;
    profileCompleteness: number;
    responseTime: number;
    recentActivity: number;
    subscriptionBoost: number;
  };
}

export interface KpiMetric {
  key: string;
  label: string;
  value: number;
  change: number;
  format?: 'number' | 'currency' | 'percent' | 'rating';
}

export interface EngagementSeries {
  label: string;
  profileViews: number;
  impressions: number;
  clicks: number;
  calls: number;
  chats: number;
  whatsapp: number;
}

export interface QuoteRequest {
  id: string;
  customerName: string;
  avatar: string;
  service: string;
  budget: number;
  location: string;
  status: 'new' | 'quoted' | 'accepted' | 'declined';
  date: string;
  notes: string;
}

export interface JobItem {
  id: string;
  customerName: string;
  avatar: string;
  service: string;
  status: 'new' | 'in_progress' | 'completed';
  amount: number;
  date: string;
  location: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  totalSpent: number;
  bookings: number;
  lastService: string;
  lastVisit: string;
}

export interface WalletTransaction {
  id: string;
  type: 'payout' | 'payment' | 'fee';
  amount: number;
  description: string;
  date: string;
}

// ============ HOME SERVICES TYPES ============

export type ServiceCategory = 
  | 'Relocation'
  | 'Home Maintenance'
  | 'Cleaning'
  | 'Technology'
  | 'Construction'
  | 'Home Improvement'
  | 'Household';

export type ServiceSubcategory =
  // Relocation
  | 'Hamisha Squad' | 'Movers' | 'Packers'
  // Home Maintenance
  | 'Plumbers' | 'Electricians' | 'Painters' | 'Carpenters' | 'Handymen' | 'Welders'
  // Cleaning
  | 'House Cleaners' | 'Deep Cleaning' | 'Laundry Services' | 'Pest Control'
  // Technology
  | 'WiFi Installation' | 'CCTV Installers' | 'Smart Home Setup' | 'Internet Installers'
  // Construction
  | 'Contractors' | 'Architects'
  // Home Improvement
  | 'Interior Designers' | 'Renovators'
  // Household
  | 'Nannies' | 'Gardeners' | 'Security Guards';

export interface ServiceProvider {
  id: string;
  name: string;
  logo: string;
  banner: string;
  description: string;
  category: ServiceCategory;
  subcategory: ServiceSubcategory;
  location: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  pricing: string;
  responseTime: string;
  availability: string;
  phone: string;
  email: string;
}

// ============ COMMUNITY TYPES ============

export type PostType = 'photo' | 'video' | 'tip' | 'review' | 'experience' | 'neighborhood' | 'advice';

export interface CommunityPost {
  id: string;
  user: User;
  type: PostType;
  content: string;
  image?: string;
  video?: string;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  views: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  tags: string[];
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// ============ PROPERTY TYPES ============

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  size: number;
  location: string;
  landlord: Landlord;
  rating: number;
  reviewCount: number;
  amenities: string[];
  furnished: boolean;
  available: boolean;
}

export interface Landlord {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  responseRate: string;
  properties: number;
}

export interface PropertyReview {
  id: string;
  propertyId: string;
  user: User;
  rating: number;
  security: number;
  cleanliness: number;
  accessibility: number;
  amenities: number;
  valueForMoney: number;
  content: string;
  createdAt: string;
  helpful: number;
}

// ============ NEIGHBORHOOD TYPES ============

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  description: string;
  image: string;
  rating: number;
  security: number;
  amenities: number;
  transport: number;
  avgRent: number;
  propertyCount: number;
  reviews: number;
}

// ============ CURRENCY TYPES ============

/** Supported currency codes — KSh for MVP, expanded in v2 */
export type CurrencyCode = 'KSh' | 'USD' | 'EUR' | 'GBP' | 'UGX' | 'TZS';

/** Static info about each supported currency */
export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  /** Exchange rate relative to KSh (MVP base) */
  rateToKSh: number;
  /** Number of decimal places for display */
  decimals: number;
}

/**
 * CURRENCIES map — MVP: KSh only; v2 adds USD, EUR, GBP, UGX, TZS.
 * When v2 arrives, update CurrencyCode above and uncomment entries here.
 */
export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  KSh: { code: 'KSh', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE', rateToKSh: 1, decimals: 0 },
  USD: { code: 'USD', symbol: '$',    name: 'US Dollar',          locale: 'en-US', rateToKSh: 0.0077, decimals: 2 },
  EUR: { code: 'EUR', symbol: '€',    name: 'Euro',              locale: 'de-DE', rateToKSh: 0.0071, decimals: 2 },
  GBP: { code: 'GBP', symbol: '£',    name: 'British Pound',     locale: 'en-GB', rateToKSh: 0.0061, decimals: 2 },
  UGX: { code: 'UGX', symbol: 'USh',  name: 'Ugandan Shilling',  locale: 'en-UG', rateToKSh: 28.5,   decimals: 0 },
  TZS: { code: 'TZS', symbol: 'TSh',  name: 'Tanzanian Shilling',locale: 'en-TZ', rateToKSh: 18.0,   decimals: 0 },
};

// ============ SUBSCRIPTION TYPES ============

export type SubscriptionTier = 'Free' | 'Basic' | 'Premium' | 'Pro';
export type UserType = 'seeker' | 'landlord' | 'seller' | 'service_provider';

// ============ CHAT / MESSAGING TYPES ============

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  messages: Message[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface SubscriptionPlan {
  id: string;
  userType: UserType;
  tier: SubscriptionTier;
  price: number;
  currency: CurrencyCode;
  features: string[];
  highlighted?: boolean;
}

// ============ NOTIFICATION TYPES ============

export interface Notification {
  id: string;
  type: 'property' | 'marketplace' | 'discount' | 'message' | 'student' | 'follow' | 'review' | 'booking';
  title: string;
  message: string;
  icon: string;
  read: boolean;
  createdAt: string;
  action?: string;
}

// ============ AI ASSISTANT TYPES ============

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ============ PAYMENT / BILLING TYPES ============

/** Supported card brands */
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover';

/** A saved payment method */
export interface SavedPaymentMethod {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  createdAt: string;
}

/** Billing history entry */
export interface BillingEntry {
  id: string;
  date: string;
  description: string;
  planName: string;
  amount: number;
  currency: CurrencyCode;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: 'mpesa' | 'card' | 'paystack';
  receiptUrl?: string;
  mpesaReceipt?: string;
  paystackReference?: string;
}

// ============ WAITLIST TYPES ============

/** Preferred subscription plans for waitlist */
export type PreferredPlan = 'Free' | 'Premium' | 'Pro' | 'Enterprise' | 'Undecided';

/** Intent level tags for waitlist entries */
export type WaitlistIntent = 'high' | 'medium' | 'low';

/** Priority Subscriber Waitlist entry */
export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferredPlan: PreferredPlan;
  businessSize?: string;
  businessType?: string;
  intent: WaitlistIntent;
  createdAt: string;
  userId?: string;
}

// ============ EMAIL CAPTURE TYPES ============

export interface EmailSubscription {
  id: string;
  email: string;
  name?: string;
  userId?: string;
  subscribedAt: string;
  topics?: string[];
}

// ============ FEATURE REQUEST TYPES ============

/** Priority levels for feature requests */
export type FeatureRequestPriority = 'low' | 'medium' | 'high' | 'critical';

/** Categories for feature requests */
export type FeatureRequestCategory =
  | 'ai'
  | 'analytics'
  | 'automation'
  | 'business'
  | 'marketplace'
  | 'community'
  | 'payments'
  | 'mobile'
  | 'other';

/** Status lifecycle for feature requests */
export type FeatureRequestStatus = 'planned' | 'in_development' | 'testing' | 'released' | 'declined';

/** Lookup data for feature request categories */
export const FEATURE_REQUEST_CATEGORIES: { key: FeatureRequestCategory; label: string; icon: string }[] = [
  { key: 'ai', label: 'AI & Intelligence', icon: 'sparkles' },
  { key: 'analytics', label: 'Analytics & Reporting', icon: 'analytics' },
  { key: 'automation', label: 'Automation & Workflows', icon: 'cog' },
  { key: 'business', label: 'Business Management', icon: 'briefcase' },
  { key: 'marketplace', label: 'Marketplace & Listings', icon: 'cart' },
  { key: 'community', label: 'Community & Social', icon: 'people' },
  { key: 'payments', label: 'Payments & Billing', icon: 'card' },
  { key: 'mobile', label: 'Mobile & UX', icon: 'phone-portrait' },
  { key: 'other', label: 'Other', icon: 'add-circle' },
];

/** Lookup data for feature request priorities */
export const FEATURE_REQUEST_PRIORITIES: { key: FeatureRequestPriority; label: string; color: string }[] = [
  { key: 'low', label: 'Nice to Have', color: '#8E8E93' },
  { key: 'medium', label: 'Important', color: '#FFB84D' },
  { key: 'high', label: 'Very Important', color: '#FF6B00' },
  { key: 'critical', label: 'Critical', color: '#FF4D6A' },
];

/** Lookup data for feature request statuses */
export const FEATURE_REQUEST_STATUSES: { key: FeatureRequestStatus; label: string; color: string }[] = [
  { key: 'planned', label: 'Planned', color: '#FF8A33' },
  { key: 'in_development', label: 'In Development', color: '#FFB84D' },
  { key: 'testing', label: 'Testing', color: '#00D4AA' },
  { key: 'released', label: 'Released', color: '#00D4AA' },
  { key: 'declined', label: 'Declined', color: '#8E8E93' },
];

/** A feature request submitted by a user */
export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  priority: FeatureRequestPriority;
  category: FeatureRequestCategory;
  userId?: string;
  userName?: string;
  userEmail?: string;
  votes: number;
  voterIds: string[];
  status: FeatureRequestStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============ SUPER ADMIN TYPES ============

/** Admin role levels for the Super Admin Control Center */
export type AdminRole = 'super_admin' | 'platform_admin' | 'support_manager' | 'marketing_manager' | 'content_manager' | 'analyst';

/** Admin role permission flags */
export interface AdminPermissions {
  canManageUsers: boolean;
  canManageBusinesses: boolean;
  canManageSubscriptions: boolean;
  canManageFeatureFlags: boolean;
  canManageAnnouncements: boolean;
  canManageSupport: boolean;
  canManageContent: boolean;
  canViewAnalytics: boolean;
  canManageSecurity: boolean;
  canViewAuditLogs: boolean;
  canExportData: boolean;
}

/** Mapping of admin roles to their permissions */
export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: {
    canManageUsers: true,
    canManageBusinesses: true,
    canManageSubscriptions: true,
    canManageFeatureFlags: true,
    canManageAnnouncements: true,
    canManageSupport: true,
    canManageContent: true,
    canViewAnalytics: true,
    canManageSecurity: true,
    canViewAuditLogs: true,
    canExportData: true,
  },
  platform_admin: {
    canManageUsers: true,
    canManageBusinesses: true,
    canManageSubscriptions: true,
    canManageFeatureFlags: false,
    canManageAnnouncements: true,
    canManageSupport: true,
    canManageContent: true,
    canViewAnalytics: true,
    canManageSecurity: false,
    canViewAuditLogs: true,
    canExportData: true,
  },
  support_manager: {
    canManageUsers: false,
    canManageBusinesses: false,
    canManageSubscriptions: false,
    canManageFeatureFlags: false,
    canManageAnnouncements: false,
    canManageSupport: true,
    canManageContent: false,
    canViewAnalytics: false,
    canManageSecurity: false,
    canViewAuditLogs: false,
    canExportData: false,
  },
  marketing_manager: {
    canManageUsers: false,
    canManageBusinesses: false,
    canManageSubscriptions: false,
    canManageFeatureFlags: false,
    canManageAnnouncements: true,
    canManageSupport: false,
    canManageContent: true,
    canViewAnalytics: true,
    canManageSecurity: false,
    canViewAuditLogs: false,
    canExportData: true,
  },
  content_manager: {
    canManageUsers: false,
    canManageBusinesses: false,
    canManageSubscriptions: false,
    canManageFeatureFlags: false,
    canManageAnnouncements: true,
    canManageSupport: false,
    canManageContent: true,
    canViewAnalytics: false,
    canManageSecurity: false,
    canViewAuditLogs: false,
    canExportData: false,
  },
  analyst: {
    canManageUsers: false,
    canManageBusinesses: false,
    canManageSubscriptions: false,
    canManageFeatureFlags: false,
    canManageAnnouncements: false,
    canManageSupport: false,
    canManageContent: false,
    canViewAnalytics: true,
    canManageSecurity: false,
    canViewAuditLogs: false,
    canExportData: true,
  },
};

/** Platform feature flag toggles for the admin panel */
export interface FeatureFlags {
  aiAssistant: boolean;
  marketplace: boolean;
  analytics: boolean;
  inventory: boolean;
  crm: boolean;
  waitlist: boolean;
  betaFeatures: boolean;
  earlyAccessMode: boolean;
  subscriptionsEnabled: boolean;
  paymentsEnabled: boolean;
}

/** Platform health status indicators */
export interface PlatformHealth {
  database: 'healthy' | 'warning' | 'critical';
  api: 'healthy' | 'warning' | 'critical';
  authentication: 'healthy' | 'warning' | 'critical';
  emailService: 'healthy' | 'warning' | 'critical';
  aiService: 'healthy' | 'warning' | 'critical';
  storageUsage: number;
  serverResponseTime: number;
  errorRate: number;
}

/** Support ticket category */
export type SupportTicketCategory = 'technical' | 'billing' | 'feature_request' | 'general' | 'bug_report';

/** Support ticket status */
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/** Support ticket */
export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  subject: string;
  description: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

/** Admin action record for audit logs */
export interface AdminAction {
  id: string;
  adminUserId: string;
  adminName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

/** Announcement for the in-app announcement center */
export interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  body?: string;
  category: 'updates' | 'features' | 'releases' | 'founder' | 'community';
  targetAudience: 'all' | 'premium_users' | 'new_users';
  published: boolean;
  scheduledAt?: string;
  createdAt: string;
  createdBy: string;
}

// ============ NAVIGATION TYPES ============

export type RootTabParamList = {
  Home: undefined;
  Marketplace: undefined;
  Services: undefined;
  Community: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  ProductDetail: { productId: string };
  Storefront: { sellerId: string };
  ServiceDetail: { providerId: string };
  PostDetail: { postId: string };
  PropertyDetail: { propertyId: string };
  Subscriptions: undefined;
  Chat: { conversationId: string };
  Inbox: undefined;
  Search: undefined;
  Favorites: undefined;
  Cart: undefined;
  Settings: undefined;
  CurrencyPicker: undefined;
  PaymentMethods: undefined;
  ServiceProviderOnboarding: { plan: ProviderPlanTier } | undefined;
  ServiceProviderProfile: { providerId?: string };
  SellerDashboard: undefined;
};
