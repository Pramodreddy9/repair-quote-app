import type {EmailOtpType, Session, User} from '@supabase/supabase-js';
import {isSupabaseConfigured, supabase} from './supabase';

export const PENDING_PASSWORD_SETUP_KEY = 'rqd_pending_password_setup';

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    );
  }
  return supabase;
}

export function getCustomerDisplayName(user: User | null): string {
  if (!user) {
    return '';
  }
  const meta = user.user_metadata as
    | {full_name?: unknown; name?: unknown}
    | undefined;
  if (typeof meta?.full_name === 'string' && meta.full_name.trim()) {
    return meta.full_name.trim();
  }
  if (typeof meta?.name === 'string' && meta.name.trim()) {
    return meta.name.trim();
  }
  return 'Customer';
}

export function isGuestUser(user: User | null): boolean {
  return Boolean(user?.is_anonymous);
}

export function isRegisteredCustomer(user: User | null): boolean {
  return Boolean(user && !user.is_anonymous && user.email);
}

export function hasPendingPasswordSetup(): boolean {
  try {
    return window.sessionStorage.getItem(PENDING_PASSWORD_SETUP_KEY) === '1';
  } catch {
    return false;
  }
}

export function setPendingPasswordSetupFlag(active: boolean): void {
  try {
    if (active) {
      window.sessionStorage.setItem(PENDING_PASSWORD_SETUP_KEY, '1');
    } else {
      window.sessionStorage.removeItem(PENDING_PASSWORD_SETUP_KEY);
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
}

/**
 * Handles redirect query parameters (?token_hash=...&type=email_change|signup)
 * when a customer clicks an email confirmation link.
 */
export async function consumeUrlConfirmationIfPresent(): Promise<{
  verifiedType: EmailOtpType | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured || !supabase || typeof window === 'undefined') {
    return {verifiedType: null, error: null};
  }

  const url = new URL(window.location.href);
  const tokenHash = url.searchParams.get('token_hash');
  const typeParam = url.searchParams.get('type') as EmailOtpType | null;

  if (!tokenHash || !typeParam) {
    return {verifiedType: null, error: null};
  }

  const {error} = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: typeParam,
  });

  // Remove one-time token params from the address bar regardless of outcome
  url.searchParams.delete('token_hash');
  url.searchParams.delete('type');
  url.searchParams.delete('redirect_to');
  window.history.replaceState({}, '', url.toString());

  if (error) {
    return {verifiedType: null, error: error.message};
  }

  return {verifiedType: typeParam, error: null};
}

export interface UpgradeGuestResult {
  status: 'completed' | 'needs_email_confirmation';
  user: User | null;
  email: string;
}

/**
 * Upgrades an anonymous guest user via Supabase's identity-linking flow:
 * 1. Links email and stores name in Auth profile metadata via updateUser.
 * 2. If email confirmation is disabled and email is immediately verified, sets password right away.
 * 3. If email confirmation is required, returns 'needs_email_confirmation' so the UI guides the customer.
 */
export async function upgradeGuestToCustomer(params: {
  name: string;
  email: string;
  password: string;
}): Promise<UpgradeGuestResult> {
  const client = requireSupabase();
  const trimmedName = params.name.trim();
  const trimmedEmail = params.email.trim();

  const {data, error} = await client.auth.updateUser(
    {
      email: trimmedEmail,
      data: {
        full_name: trimmedName,
        name: trimmedName,
      },
    },
    {
      emailRedirectTo:
        typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  const updatedUser = data.user;
  const isImmediatelyVerified =
    Boolean(updatedUser) &&
    !updatedUser.is_anonymous &&
    updatedUser.email?.toLowerCase() === trimmedEmail.toLowerCase() &&
    !updatedUser.new_email;

  if (!isImmediatelyVerified) {
    setPendingPasswordSetupFlag(true);
    return {
      status: 'needs_email_confirmation',
      user: updatedUser,
      email: trimmedEmail,
    };
  }

  const {data: pwdData, error: pwdError} = await client.auth.updateUser({
    password: params.password,
  });

  if (pwdError) {
    setPendingPasswordSetupFlag(true);
    throw new Error(
      `Email linked, but setting your password failed: ${pwdError.message}`,
    );
  }

  setPendingPasswordSetupFlag(false);
  return {
    status: 'completed',
    user: pwdData.user,
    email: trimmedEmail,
  };
}

export async function verifyGuestEmailOtpAndSetPassword(params: {
  email: string;
  token: string;
  password: string;
}): Promise<User | null> {
  const client = requireSupabase();
  const trimmedEmail = params.email.trim();
  const trimmedToken = params.token.trim();

  const {data: otpData, error: otpError} = await client.auth.verifyOtp({
    email: trimmedEmail,
    token: trimmedToken,
    type: 'email_change',
  });

  if (otpError) {
    throw new Error(otpError.message);
  }

  if (!otpData.user || otpData.user.is_anonymous) {
    throw new Error(
      'Confirmation is still pending. Please enter the latest code from your email.',
    );
  }

  const {data: pwdData, error: pwdError} = await client.auth.updateUser({
    password: params.password,
  });

  if (pwdError) {
    setPendingPasswordSetupFlag(true);
    throw new Error(
      `Email confirmed, but setting your password failed: ${pwdError.message}`,
    );
  }

  setPendingPasswordSetupFlag(false);
  return pwdData.user;
}

export async function setPasswordForVerifiedAccount(
  password: string,
): Promise<User | null> {
  const client = requireSupabase();
  const {data, error} = await client.auth.updateUser({password});
  if (error) {
    throw new Error(error.message);
  }
  setPendingPasswordSetupFlag(false);
  return data.user;
}

export async function checkEmailConfirmationAndFinish(
  password?: string,
): Promise<{confirmed: boolean; user: User | null}> {
  const client = requireSupabase();
  const {data: refreshData} = await client.auth.refreshSession();
  const {data: userData, error: userError} = await client.auth.getUser();

  if (userError && !refreshData.user) {
    throw new Error(userError.message);
  }

  const latestUser = userData.user ?? refreshData.user ?? null;
  if (!latestUser || latestUser.is_anonymous || latestUser.new_email) {
    return {confirmed: false, user: latestUser};
  }

  if (password) {
    const {data: pwdData, error: pwdError} = await client.auth.updateUser({
      password,
    });
    if (pwdError) {
      setPendingPasswordSetupFlag(true);
      throw new Error(
        `Email confirmed, but setting your password failed: ${pwdError.message}`,
      );
    }
    setPendingPasswordSetupFlag(false);
    return {confirmed: true, user: pwdData.user};
  }

  return {confirmed: true, user: latestUser};
}

export async function resendGuestEmailConfirmation(email: string): Promise<void> {
  const client = requireSupabase();
  const trimmedEmail = email.trim();
  const {error} = await client.auth.resend({
    type: 'email_change',
    email: trimmedEmail,
    options: {
      emailRedirectTo:
        typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });

  if (error) {
    // Fallback to re-triggering email update if resend is unsupported for email_change
    const {error: fallbackError} = await client.auth.updateUser(
      {email: trimmedEmail},
      {
        emailRedirectTo:
          typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    );
    if (fallbackError) {
      throw new Error(fallbackError.message);
    }
  }
}

export interface SignUpResult {
  status: 'completed' | 'needs_email_confirmation';
  session: Session | null;
  user: User | null;
  email: string;
}

/**
 * Standard account creation when no guest session is active (e.g., after signing out).
 */
export async function registerCustomerAccount(params: {
  name: string;
  email: string;
  password: string;
}): Promise<SignUpResult> {
  const client = requireSupabase();
  const trimmedName = params.name.trim();
  const trimmedEmail = params.email.trim();

  const {data, error} = await client.auth.signUp({
    email: trimmedEmail,
    password: params.password,
    options: {
      data: {
        full_name: trimmedName,
        name: trimmedName,
      },
      emailRedirectTo:
        typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.session && data.user) {
    return {
      status: 'completed',
      session: data.session,
      user: data.user,
      email: trimmedEmail,
    };
  }

  return {
    status: 'needs_email_confirmation',
    session: null,
    user: data.user,
    email: trimmedEmail,
  };
}

export async function verifySignupEmailOtp(params: {
  email: string;
  token: string;
}): Promise<Session> {
  const client = requireSupabase();
  const {data, error} = await client.auth.verifyOtp({
    email: params.email.trim(),
    token: params.token.trim(),
    type: 'signup',
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.session) {
    throw new Error('Verification succeeded, but no active session was returned.');
  }
  return data.session;
}

export async function resendSignupConfirmation(email: string): Promise<void> {
  const client = requireSupabase();
  const {error} = await client.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: {
      emailRedirectTo:
        typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function signInCustomerWithPassword(params: {
  email: string;
  password: string;
}): Promise<Session> {
  const client = requireSupabase();
  const {data, error} = await client.auth.signInWithPassword({
    email: params.email.trim(),
    password: params.password,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.session) {
    throw new Error('Sign in did not return an active session.');
  }
  setPendingPasswordSetupFlag(false);
  return data.session;
}

export async function startGuestSession(): Promise<Session> {
  const client = requireSupabase();
  const {data: current} = await client.auth.getSession();
  if (current.session) {
    return current.session;
  }

  const {data, error} = await client.auth.signInAnonymously();
  if (error) {
    throw new Error(`Unable to start guest session: ${error.message}`);
  }
  if (!data.session) {
    throw new Error('Anonymous guest sign-in did not return an active session.');
  }
  return data.session;
}

export async function signOutCustomer(): Promise<void> {
  const client = requireSupabase();
  setPendingPasswordSetupFlag(false);
  const {error} = await client.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}
