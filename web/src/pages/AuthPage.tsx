import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../services/api';
import { Target, ArrowRight, ShieldCheck, Mail, Lock, CheckCircle2, KeyRound, Sun, Moon } from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isVerifyToken, setIsVerifyToken] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check URL query parameters for ?token=... on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setLoading(true);
      api.verifyEmail(token)
        .then(() => {
          setSuccessMessage('Email verified successfully! You can now sign in.');
          setIsRegister(false);
          setIsVerifyToken(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Invalid or expired verification token.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isVerifyToken) {
        if (!tokenInput.trim()) {
          throw new Error('Please enter your verification token.');
        }
        await api.verifyEmail(tokenInput.trim());
        setSuccessMessage('Email verified successfully! You can now sign in with your credentials.');
        setIsVerifyToken(false);
        setTokenInput('');
      } else if (isForgotPassword) {
        await api.forgotPassword(email);
        setSuccessMessage('If an account exists with this email, a reset link has been dispatched.');
      } else if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const parsedAge = age.trim() ? parseInt(age.trim(), 10) : undefined;
        if (parsedAge !== undefined && (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120)) {
          throw new Error('Please enter a valid age between 1 and 120');
        }
        const regUser = await register(
          email,
          password,
          confirmPassword,
          fullName.trim() || undefined,
          parsedAge,
          gender || undefined
        );
        if (!regUser.emailVerified) {
          setSuccessMessage('Registration successful! Please check your email for the verification link.');
          setIsRegister(false);
        }
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to resend verification.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.resendVerification(email.trim());
      setSuccessMessage('A fresh verification token has been dispatched.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-zinc-900 dark:text-zinc-100 relative transition-colors duration-200">
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-colors cursor-pointer"
      >
        {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4 text-emerald-600 dark:text-emerald-400">
          <Target className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">LOCKIN</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Consistency over perfection • Private Habit Tracker</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-8 px-6 shadow-xl dark:shadow-2xl backdrop-blur-xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex flex-col gap-2">
              <span>{error}</span>
              {error.toLowerCase().includes('unverified') && (
                <div className="flex items-center gap-2 pt-1 border-t border-rose-500/20">
                  <button
                    type="button"
                    onClick={() => { setIsVerifyToken(true); setError(null); }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Enter Token
                  </button>
                  <span className="text-zinc-400 dark:text-zinc-500">•</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer"
                  >
                    Resend Email
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="space-y-1">
                <p>{successMessage}</p>
                {!isVerifyToken && (
                  <button
                    type="button"
                    onClick={() => { setIsVerifyToken(true); }}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold underline cursor-pointer"
                  >
                    Click here to enter verification token
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isVerifyToken ? (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Verification Token (UUID)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="e.g. b4949a93-9aef-4729-a01e-782062452ec1"
                    className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  In local mode, the token is printed to your server terminal output.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {!isForgotPassword && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {isRegister && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                        Full Name <span className="text-zinc-400 dark:text-zinc-500 text-[10px] normal-case">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                          Age <span className="text-zinc-400 dark:text-zinc-500 text-[10px] normal-case">(optional)</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="26"
                          className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                          Gender <span className="text-zinc-400 dark:text-zinc-500 text-[10px] normal-case">(optional)</span>
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer"
                        >
                          <option value="">Select...</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="NON_BINARY">Non-Binary</option>
                          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-white dark:text-zinc-950 font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm cursor-pointer"
            >
              <span>
                {loading
                  ? 'Processing...'
                  : isVerifyToken
                  ? 'Verify Email Account'
                  : isForgotPassword
                  ? 'Send Reset Link'
                  : isRegister
                  ? 'Create Account'
                  : 'Sign In'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col gap-2.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {isVerifyToken ? (
              <button
                type="button"
                onClick={() => { setIsVerifyToken(false); setError(null); }}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            ) : isForgotPassword ? (
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(null); }}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            ) : isRegister ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(null); }}
                  className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <>
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsRegister(true); setError(null); }}
                    className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(null); }}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={() => { setIsVerifyToken(true); setError(null); }}
                    className="text-emerald-600/80 dark:text-emerald-500/80 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Verify token
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600/80 dark:text-emerald-500/80" />
          <span>Encrypted with BCrypt & HttpOnly Cookies • Private by Default</span>
        </div>
      </div>
    </div>
  );
}
