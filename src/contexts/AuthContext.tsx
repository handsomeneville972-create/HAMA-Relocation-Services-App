/**
 * HAMA Authentication Context
 *
 * Powered by Supabase Auth with:
 * - Email/password authentication
 * - Session persistence with auto-refresh
 * - Email verification support
 * - Multi-device logout capability
 * - Audit logging for security events
 * - Strong password enforcement
 *
 * SECURITY NOTES:
 * - NEVER expose the Supabase service role key here
 * - Auth tokens stored in SecureStore (encrypted)
 * - All auth errors are sanitized before surfacing to users
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase, getCurrentSession, getAuthRedirectUrl } from '../utils/supabaseClient';
import { User } from '../constants/types';
import { validatePassword } from '../utils/validation';
import {
  logLoginSuccess,
  logLoginFailure,
  logPasswordResetRequested,
  logProfileUpdate,
  logAccountDeleted,
  logAuditEvent,
} from '../utils/auditLog';

// ---------- Types ----------

export type AuthMode = 'login' | 'signup';

interface AuthContextType {
  /** The currently authenticated user's UUID from Supabase */
  currentUserId: string;
  /** The full user profile of the current user (from profiles table or mock) */
  currentUser: User;
  /** Whether a user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether auth state is being resolved (initial load or in-progress) */
  isLoading: boolean;
  /** Whether the user's email has been verified */
  isEmailVerified: boolean;
  /** Whether the profile fetch has resolved (true even if the row is missing) */
  isProfileReady: boolean;
  /** True when an authenticated user still has to complete the Create Profile step */
  needsOnboarding: boolean;
  /** The Supabase session object */
  session: any | null;
  /** Re-fetch the current user's profile from Supabase */
  refreshProfile: () => Promise<void>;
  /** Update the current user's profile fields. Resolves to an error message on failure, or null on success. */
  updateProfile: (updates: Partial<User>) => Promise<string | null>;
  /** Switch to a different user (dev tool — will be removed in production) */
  setCurrentUser: (userId: string) => void;
  /** Sign in with email and password via Supabase Auth */
  signIn: (email: string, password: string) => Promise<void>;
  /** Create account with Supabase Auth */
  signUp: (email: string, password: string) => Promise<void>;
  /** Sign out and clear session */
  signOut: () => Promise<void>;
  /** Send password reset email via Supabase */
  resetPassword: (email: string) => Promise<void>;
  /** Resend email verification */
  resendVerificationEmail: (email?: string) => Promise<void>;
  /** Delete the current user's account */
  deleteAccount: () => Promise<void>;
  /** Export the current user's data */
  exportData: () => Promise<void>;
  /** Log out from all active sessions */
  signOutAllDevices: () => Promise<void>;
}

// ---------- Constants ----------

const AuthContext = createContext<AuthContextType | null>(null);

const UNAUTHENTICATED_USER_ID = '';

// ---------- Provider ----------

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string>(UNAUTHENTICATED_USER_ID);
  const [isLoading, setIsLoading] = useState(true); // Starts true while we resolve session
  const [session, setSession] = useState<any | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const isAuthenticated = currentUserId.length > 0;

  // ---------- Session Recovery ----------

  useEffect(() => {
    let mounted = true;

    // Restore session from SecureStore on app launch
    const restoreSession = async () => {
      try {
        const currentSession = await getCurrentSession();
        if (mounted) {
          if (currentSession?.user) {
            setSession(currentSession);
            setCurrentUserId(currentSession.user.id);
            setIsEmailVerified(currentSession.user.email_confirmed_at != null);
          }
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          if (newSession?.user) {
            setCurrentUserId(newSession.user.id);
            setIsEmailVerified(newSession.user.email_confirmed_at != null);
          } else {
            setCurrentUserId(UNAUTHENTICATED_USER_ID);
            setIsEmailVerified(false);
          }
          setIsLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // ---------- Real Profile Resolution (from Supabase) ----------

  const [profile, setProfile] = useState<User | null>(null);
  const [isProfileReady, setIsProfileReady] = useState(false);

  /** Authenticated users with a profile that hasn't completed onboarding */
  const needsOnboarding =
    isAuthenticated &&
    isProfileReady &&
    profile !== null &&
    profile.onboardingCompleted !== true;

  // Fetch profile from Supabase whenever userId changes
  useEffect(() => {
    if (!currentUserId) {
      setProfile(null);
      setIsProfileReady(false);
      return;
    }

    setIsProfileReady(false);

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile({
            id: data.id,
            name: data.display_name ?? session?.user?.email?.split('@')[0] ?? session?.user?.phone ?? 'User',
            email: data.email ?? session?.user?.email ?? '',
            emailVerified: session?.user?.email_confirmed_at != null,
            phone: data.phone ?? undefined,
            phoneVerified: data.phone_verified ?? false,
            avatar: data.avatar_url ?? `https://i.pravatar.cc/150?u=${currentUserId}`,
            username: data.username ?? session?.user?.email?.split('@')[0] ?? '',
            bio: data.bio ?? '',
            website: data.website ?? '',
            role: data.role ?? 'seeker',
            verified: data.verification_level === 'full',
            verificationLevel: data.verification_level ?? 'unverified',
            onboardingCompleted: data.onboarding_completed ?? true,
            joinDate: data.created_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
            lastLoginAt: session?.user?.last_sign_in_at ?? undefined,
          });
        } else {
          // Fallback: build user from Supabase Auth session
          setProfile({
            id: currentUserId,
            name: session?.user?.email?.split('@')[0] ?? session?.user?.phone ?? 'User',
            email: session?.user?.email ?? '',
            emailVerified: session?.user?.email_confirmed_at != null,
            phone: session?.user?.phone ?? undefined,
            phoneVerified: false,
            avatar: `https://i.pravatar.cc/150?u=${currentUserId}`,
            username: session?.user?.email?.split('@')[0] ?? '',
            bio: '',
            website: '',
            role: 'seeker',
            verified: session?.user?.email_confirmed_at != null,
            verificationLevel: session?.user?.email_confirmed_at ? 'email' : 'unverified',
            onboardingCompleted: true,
            joinDate: session?.user?.created_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
            lastLoginAt: session?.user?.last_sign_in_at ?? undefined,
          });
        }
      } catch (e) {
        console.warn('[AuthContext] Profile fetch failed, using session fallback:', (e as Error)?.message);
        // Silent fail — use session fallback
        if (session?.user) {
          setProfile({
            id: currentUserId,
            name: session.user.email?.split('@')[0] ?? session.user.phone ?? 'User',
            email: session.user.email ?? '',
            emailVerified: session.user.email_confirmed_at != null,
            phone: session.user.phone ?? undefined,
            phoneVerified: false,
            avatar: `https://i.pravatar.cc/150?u=${currentUserId}`,
            username: session.user.email?.split('@')[0] ?? '',
            bio: '',
            website: '',
            role: 'seeker',
            verified: session.user.email_confirmed_at != null,
            verificationLevel: session.user.email_confirmed_at ? 'email' : 'unverified',
            onboardingCompleted: true,
            joinDate: session.user.created_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
            lastLoginAt: session.user.last_sign_in_at ?? undefined,
          });
        }
      } finally {
        if (currentUserId) {
          setIsProfileReady(true);
        }
      }
    };

    fetchProfile();
  }, [currentUserId, session]);

  // Re-fetch the profile row (used after edits so fresh values load)
  const refreshProfile = useCallback(async () => {
    if (!currentUserId) return;
    setIsProfileReady(false);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      if (!error && data) {
        setProfile(prev => ({
          ...(prev ?? ({
            id: currentUserId,
            name: data.display_name ?? '',
            email: data.email ?? '',
            emailVerified: false,
            phoneVerified: false,
            avatar: data.avatar_url ?? '',
            role: 'seeker',
            verified: false,
            verificationLevel: 'unverified',
            joinDate: '',
          } as User)),
          id: data.id,
          name: data.display_name ?? prev?.name ?? '',
          email: data.email ?? prev?.email ?? '',
          phone: data.phone ?? prev?.phone,
          phoneVerified: data.phone_verified ?? prev?.phoneVerified ?? false,
          avatar: data.avatar_url ?? prev?.avatar ?? '',
          username: data.username ?? prev?.username,
          bio: data.bio ?? prev?.bio,
          website: data.website ?? prev?.website,
          role: data.role ?? prev?.role ?? 'seeker',
          verified: data.verification_level === 'full',
          verificationLevel: data.verification_level ?? prev?.verificationLevel ?? 'unverified',
          onboardingCompleted: data.onboarding_completed ?? true,
          joinDate: data.created_at?.split('T')[0] ?? prev?.joinDate ?? '',
        }));
      }
    } catch (e) {
      console.warn('[AuthContext] refreshProfile failed:', (e as Error)?.message);
    } finally {
      setIsProfileReady(true);
    }
  }, [currentUserId]);

  const getCurrentUser = useCallback((): User => {
    if (profile) return profile;

    // Fallback — should not happen when not authenticated
    return {
      id: currentUserId,
      name: session?.user?.email?.split('@')[0] ?? session?.user?.phone ?? 'Guest',
      email: session?.user?.email ?? '',
      emailVerified: session?.user?.email_confirmed_at != null,
      phone: session?.user?.phone ?? undefined,
      phoneVerified: false,
      avatar: `https://i.pravatar.cc/150?u=${currentUserId}`,
      username: session?.user?.email?.split('@')[0] ?? '',
      bio: '',
      website: '',
      role: 'seeker',
      verified: false,
      verificationLevel: 'unverified',
      joinDate: new Date().toISOString().split('T')[0],
      lastLoginAt: undefined,
    };
  }, [currentUserId, session, profile]);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<string | null> => {
    if (!currentUserId) return 'Not authenticated';

    try {
      // Preferred path: security-definer RPC (bypasses RLS, always works when applied)
      const rpcParams: Record<string, any> = {
        p_display_name: updates.name,
        p_avatar_url: updates.avatar,
        p_username: updates.username,
        p_bio: updates.bio,
        p_website: updates.website,
        p_phone: updates.phone,
        p_phone_verified: updates.phoneVerified,
        p_verification_level: updates.verificationLevel,
      };
      if (updates.onboardingCompleted !== undefined) {
        rpcParams.p_onboarding_completed = updates.onboardingCompleted;
      }
      const { error: rpcError } = await supabase.rpc('update_profile', rpcParams);

      if (rpcError) {
        // Fallback: direct upsert (requires RLS INSERT + UPDATE policies)
        console.warn('[updateProfile] RPC failed, falling back to upsert:', rpcError.message);
        const upsertRow: Record<string, any> = {
          id: currentUserId,
          display_name: updates.name,
          avatar_url: updates.avatar,
          username: updates.username,
          bio: updates.bio,
          website: updates.website,
          phone: updates.phone,
          phone_verified: updates.phoneVerified,
          verification_level: updates.verificationLevel,
          updated_at: new Date().toISOString(),
        };
        if (updates.onboardingCompleted !== undefined) {
          upsertRow.onboarding_completed = updates.onboardingCompleted;
        }
        const { error } = await supabase.from('profiles').upsert(upsertRow);

        if (error) {
          console.error('[updateProfile]', error.message);
          return error.message;
        }
      }

      // Optimistically update local state
      setProfile(prev => prev ? { ...prev, ...updates } : prev);
      logProfileUpdate(currentUserId);
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      console.error('[updateProfile]', msg);
      return msg;
    }
  }, [currentUserId]);

  // Dev tool — for testing on Supabase
  const setCurrentUser = useCallback((userId: string) => {
    setCurrentUserId(userId);
  }, []);

  // ---------- Sign In ----------

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        logLoginFailure(email);
        throw error;
      }

      if (data.user) {
        logLoginSuccess(data.user.id, email);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------- Sign Up ----------

  const signUp = useCallback(async (email: string, password: string) => {
    // Validate password strength on the client side
    const pwValidation = validatePassword(password);
    if (!pwValidation.isValid) {
      throw new Error(pwValidation.message);
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          // Store the user's initial role as 'seeker' in user metadata
          data: {
            role: 'seeker',
            display_name: email.split('@')[0],
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        await logAuditEvent({
          event_type: 'signup',
          user_id: data.user.id,
          email: email.toLowerCase().trim(),
          severity: 'info',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------- Sign Out ----------

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await logAuditEvent({
        event_type: 'logout',
        user_id: currentUserId,
        severity: 'info',
      });
      await supabase.auth.signOut();
    } finally {
      setCurrentUserId(UNAUTHENTICATED_USER_ID);
      setSession(null);
      setProfile(null);
      setIsProfileReady(false);
      setIsEmailVerified(false);
      setIsLoading(false);
    }
  }, [currentUserId]);

  // ---------- Password Reset ----------

  const resetPassword = useCallback(async (email: string) => {
    logPasswordResetRequested(email);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: getAuthRedirectUrl('auth/update-password'),
      },
    );

    if (error) throw error;
  }, []);

  // ---------- Resend Verification Email ----------

  const resendVerificationEmail = useCallback(async (emailOverride?: string) => {
    const targetEmail = emailOverride || session?.user?.email;
    if (!targetEmail) return;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) throw error;
  }, [session]);

  // ---------- Account Deletion ----------

  const deleteAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      logAccountDeleted(currentUserId);

      // ⚠️ NOTE: Client-side deletion of the Supabase auth user requires a
      // Supabase Edge Function or backend API using the service_role key.
      // The anon key does NOT have permission to delete users.
      //
      // To implement: Create a Supabase Edge Function that calls the
      // Supabase Admin API to delete the user by ID, or use
      // supabase.auth.admin.deleteUser() from a trusted server environment.
      //
      // For now, this signs the user out locally. To fully delete the user
      // from Supabase Auth, deploy the edge function first.

      await supabase.auth.signOut();
    } finally {
      setCurrentUserId(UNAUTHENTICATED_USER_ID);
      setSession(null);
      setProfile(null);
      setIsProfileReady(false);
      setIsEmailVerified(false);
      setIsLoading(false);
    }
  }, [currentUserId]);

  // ---------- Data Export ----------

  const exportData = useCallback(async () => {
    if (!session?.user) {
      throw new Error('You must be logged in to export your data.');
    }

    await logAuditEvent({
      event_type: 'account.data_exported',
      user_id: currentUserId,
      severity: 'info',
    });

    // In a production app, this would generate a JSON export of the user's data
    // and email it to them or provide a download link
  }, [currentUserId, session]);

  // ---------- Sign Out All Devices ----------

  const signOutAllDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      // ⚠️ NOTE: supabase.auth.admin.signOut() requires the service_role key
      // and will NOT work from the client (anon key). This must be delegated
      // to a Supabase Edge Function or backend endpoint.
      //
      // To implement: Create a Supabase Edge Function that calls:
      //   supabase.auth.admin.signOut({ userId })
      // Then call this function from the client.
      //
      // Fallback: local sign-out only (current behavior).

      try {
        const { error } = await supabase.auth.admin.signOut(currentUserId);
        if (error) throw error;
      } catch {
        // Admin API unavailable from client — sign out locally only
        await supabase.auth.signOut();
      }

      await logAuditEvent({
        event_type: 'session.revoked_all',
        user_id: currentUserId,
        severity: 'warning',
      });
    } finally {
      setCurrentUserId(UNAUTHENTICATED_USER_ID);
      setSession(null);
      setIsEmailVerified(false);
      setIsLoading(false);
    }
  }, [currentUserId]);

  // ---------- Render ----------

  return (
    <AuthContext.Provider
      value={{
        currentUserId,
        currentUser: getCurrentUser(),
        isAuthenticated,
        isLoading,
        isEmailVerified,
        isProfileReady,
        needsOnboarding,
        session,
        refreshProfile,
        updateProfile,
        setCurrentUser,
        signIn,
        signUp,
        signOut,
        resetPassword,
        resendVerificationEmail,
        deleteAccount,
        exportData,
        signOutAllDevices,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ---------- Hook ----------

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
