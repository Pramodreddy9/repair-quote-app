import {useEffect, useState, type FormEvent} from 'react';
import type {Session, User} from '@supabase/supabase-js';
import {AlertCircle, CheckCircle2, Mail, X} from 'lucide-react';
import {
  checkEmailConfirmationAndFinish,
  registerCustomerAccount,
  resendGuestEmailConfirmation,
  resendSignupConfirmation,
  setPasswordForVerifiedAccount,
  signInCustomerWithPassword,
  upgradeGuestToCustomer,
  verifyGuestEmailOtpAndSetPassword,
  verifySignupEmailOtp,
} from '../lib/authService';
import type {AuthModalMode} from '../types/quote';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: AuthModalMode;
  isGuest: boolean;
  needsPasswordCompletion: boolean;
  onClose: () => void;
  onContinueAsGuest: () => Promise<void>;
  onSignedInExistingAccount: (session: Session) => Promise<void>;
  onAccountUpgraded: (user: User | null) => Promise<void>;
}

type ModalStep = 'form' | 'confirm_email' | 'complete_password';
type ConfirmFlow = 'guest_link' | 'standard_signup';

export function AuthModal({
  isOpen,
  initialMode,
  isGuest,
  needsPasswordCompletion,
  onClose,
  onContinueAsGuest,
  onSignedInExistingAccount,
  onAccountUpgraded,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [step, setStep] = useState<ModalStep>(
    needsPasswordCompletion ? 'complete_password' : 'form',
  );
  const [confirmFlow, setConfirmFlow] = useState<ConfirmFlow>('guest_link');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [finishPassword, setFinishPassword] = useState('');

  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setMode(initialMode);
    setStep(needsPasswordCompletion ? 'complete_password' : 'form');
    setErrorMsg(null);
    setInfoMsg(null);
  }, [isOpen, initialMode, needsPasswordCompletion]);

  if (!isOpen) {
    return null;
  }

  const switchMode = (nextMode: AuthModalMode) => {
    setMode(nextMode);
    setStep('form');
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (mode === 'signin') {
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }
      setSubmitting(true);
      try {
        const session = await signInCustomerWithPassword({
          email: trimmedEmail,
          password,
        });
        setPassword('');
        await onSignedInExistingAccount(session);
        onClose();
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Unable to sign in.',
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Create account flow
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      if (isGuest) {
        const result = await upgradeGuestToCustomer({
          name: trimmedName,
          email: trimmedEmail,
          password,
        });

        if (result.status === 'completed') {
          setPassword('');
          await onAccountUpgraded(result.user);
          onClose();
          return;
        }

        setPendingEmail(result.email);
        setPendingPassword(password);
        setConfirmFlow('guest_link');
        setStep('confirm_email');
        setInfoMsg(
          'Confirmation email sent. Confirm your email to finish upgrading your guest account.',
        );
      } else {
        const result = await registerCustomerAccount({
          name: trimmedName,
          email: trimmedEmail,
          password,
        });

        if (result.status === 'completed' && result.session) {
          setPassword('');
          await onSignedInExistingAccount(result.session);
          onClose();
          return;
        }

        setPendingEmail(result.email);
        setPendingPassword('');
        setConfirmFlow('standard_signup');
        setStep('confirm_email');
        setInfoMsg(
          'Confirmation email sent. Verify your email address to activate your account.',
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to create account.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedCode = otpCode.trim();
    if (!trimmedCode) {
      setErrorMsg('Enter the verification code from your email.');
      return;
    }

    setSubmitting(true);
    try {
      if (confirmFlow === 'guest_link') {
        const updatedUser = await verifyGuestEmailOtpAndSetPassword({
          email: pendingEmail,
          token: trimmedCode,
          password: pendingPassword,
        });
        setPendingPassword('');
        setPassword('');
        setOtpCode('');
        await onAccountUpgraded(updatedUser);
        onClose();
      } else {
        const session = await verifySignupEmailOtp({
          email: pendingEmail,
          token: trimmedCode,
        });
        setPassword('');
        setOtpCode('');
        await onSignedInExistingAccount(session);
        onClose();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Verification code failed.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckLinkConfirmation = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      if (confirmFlow === 'guest_link') {
        const result = await checkEmailConfirmationAndFinish(
          pendingPassword || undefined,
        );
        if (!result.confirmed) {
          setInfoMsg(
            'Email confirmation is still pending. Click the link in your inbox or enter the verification code below.',
          );
          return;
        }
        if (!pendingPassword) {
          setStep('complete_password');
          return;
        }
        setPendingPassword('');
        setPassword('');
        await onAccountUpgraded(result.user);
        onClose();
      } else {
        const result = await checkEmailConfirmationAndFinish();
        if (!result.confirmed) {
          setInfoMsg(
            'Email confirmation is still pending. Click the link in your inbox, then try Sign in.',
          );
          return;
        }
        await onAccountUpgraded(result.user);
        onClose();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to confirm email status.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setResending(true);
    try {
      if (confirmFlow === 'guest_link') {
        await resendGuestEmailConfirmation(pendingEmail);
      } else {
        await resendSignupConfirmation(pendingEmail);
      }
      setInfoMsg(`A fresh confirmation email was sent to ${pendingEmail}.`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not resend confirmation email.',
      );
    } finally {
      setResending(false);
    }
  };

  const handleFinishPasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    if (finishPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const updatedUser = await setPasswordForVerifiedAccount(finishPassword);
      setFinishPassword('');
      await onAccountUpgraded(updatedUser);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to set password.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueGuestClick = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onContinueAsGuest();
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to continue as guest.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md bg-white border border-[#E2E6EC] rounded-xl shadow-lg overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#EEF1F5] flex items-center justify-between gap-3">
          <h2
            id="auth-modal-title"
            className="text-base font-semibold text-[#111827] tracking-tight"
          >
            {step === 'confirm_email'
              ? 'Confirm your email'
              : step === 'complete_password'
                ? 'Finish setting your password'
                : mode === 'signin'
                  ? 'Sign in to your account'
                  : 'Create customer account'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account dialog"
            className="p-1.5 text-[#64748B] hover:text-[#111827] rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Mode Switcher on Form Step */}
          {step === 'form' && (
            <div
              role="tablist"
              aria-label="Account action"
              className="grid grid-cols-2 p-1 bg-[#F1F5F9] rounded-lg border border-[#E2E6EC]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => switchMode('signin')}
                className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#526071] hover:text-[#111827]'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => switchMode('signup')}
                className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#526071] hover:text-[#111827]'
                }`}
              >
                Create account
              </button>
            </div>
          )}

          {/* Contextual Guidance */}
          {step === 'form' && mode === 'signup' && isGuest && (
            <p className="text-xs text-[#334155] bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-3.5 py-2.5 leading-relaxed">
              Your current guest session will be upgraded so your visitor ID and saved quotes carry over automatically.
            </p>
          )}
          {step === 'form' && mode === 'signin' && isGuest && (
            <p className="text-xs text-[#526071] bg-[#FAFBFD] border border-[#E2E6EC] rounded-lg px-3.5 py-2.5 leading-relaxed">
              Signing into an existing account loads that account’s saved quotes. Your guest quotes remain separate.
            </p>
          )}

          {/* Error & Info Banners */}
          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="break-words">{errorMsg}</p>
                {mode === 'signup' &&
                  errorMsg.toLowerCase().includes('already') && (
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="mt-1.5 font-semibold underline text-[#991B1B] cursor-pointer"
                    >
                      Switch to Sign in instead
                    </button>
                  )}
              </div>
            </div>
          )}

          {infoMsg && (
            <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#1E3A8A]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#1D4ED8]" aria-hidden="true" />
              <p className="leading-relaxed">{infoMsg}</p>
            </div>
          )}

          {/* Step 1: Sign In / Create Account Form */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3.5">
              {mode === 'signup' && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="auth-name"
                    className="text-xs font-medium text-[#334155]"
                  >
                    Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="min-h-[42px] px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="auth-email"
                  className="text-xs font-medium text-[#334155]"
                >
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-h-[42px] px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="auth-password"
                  className="text-xs font-medium text-[#334155]"
                >
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="min-h-[42px] px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 min-h-[44px] px-4 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#CBD5E1] disabled:text-[#475569] rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                {submitting
                  ? mode === 'signin'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>
          )}

          {/* Step 2: Email Confirmation Guidance */}
          {step === 'confirm_email' && (
            <div className="flex flex-col gap-3.5">
              <div className="rounded-lg border border-[#E2E6EC] bg-[#FAFBFD] p-3.5 flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs text-[#334155] leading-relaxed">
                  <p className="font-semibold text-[#111827]">
                    Verify {pendingEmail}
                  </p>
                  <p className="mt-1">
                    Open the email from Supabase Auth. You can either click the confirmation link in the email, or enter the 6-digit verification code below.
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-2.5">
                <label
                  htmlFor="auth-otp"
                  className="text-xs font-medium text-[#334155]"
                >
                  6-digit confirmation code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="auth-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="flex-1 min-w-0 min-h-[42px] px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
                    style={{fontFamily: 'var(--font-mono)'}}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#CBD5E1] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {submitting ? 'Verifying...' : 'Verify code'}
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckLinkConfirmation}
                  disabled={submitting}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-lg transition-colors cursor-pointer"
                >
                  I clicked the confirmation link
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#526071] hover:text-[#111827] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
                >
                  {resending ? 'Sending...' : 'Resend email'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Password Setup After Redirect Confirmation Link */}
          {step === 'complete_password' && (
            <form
              onSubmit={handleFinishPasswordSubmit}
              className="flex flex-col gap-3.5"
            >
              <p className="text-xs text-[#334155] leading-relaxed">
                Your email is now confirmed and your guest quotes are linked. Choose a password to finish setting up your account.
              </p>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="finish-password"
                  className="text-xs font-medium text-[#334155]"
                >
                  Choose password
                </label>
                <input
                  id="finish-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={finishPassword}
                  onChange={(e) => setFinishPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="min-h-[42px] px-3 py-2 text-sm bg-white border border-[#D1D5DB] rounded-lg text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-4 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#CBD5E1] rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Saving password...' : 'Save password'}
              </button>
            </form>
          )}

          {/* Continue as Guest Option */}
          {step !== 'complete_password' && (
            <div className="pt-3 border-t border-[#EEF1F5] flex items-center justify-between gap-3">
              <span className="text-xs text-[#64748B]">
                Prefer not to register now?
              </span>
              <button
                type="button"
                onClick={handleContinueGuestClick}
                disabled={submitting}
                className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#111827] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Continue as guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
