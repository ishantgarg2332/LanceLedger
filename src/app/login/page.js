"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Layers, Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validations for signup
    if (!isLogin) {
      if (!firstName.trim() || !lastName.trim()) {
        setError("First name and last name are required.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim()
            }
          }
        });
        if (error) throw error;
        setError("Success! Please check your email and click the verification link to confirm your account.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 glass-panel p-8 flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent tracking-tight">
              Lance<span className="text-primary">Ledger</span>
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-4 text-center">
            {isLogin ? '' : 'Start managing your freelance business'}
          </h1>
          <p className="text-foreground/60 text-sm mt-2 text-center max-w-sm">
            {isLogin
              ? 'Enter your credentials to access your dashboard, invoices, and expenses.'
              : 'Create a free account to generate premium invoices, track your clients, and monitor your revenue.'}
          </p>
        </div>

        {error && (
          <div className={`w-full p-3 rounded-lg text-sm mb-6 flex items-start gap-2 ${error.includes('Success') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
          {!isLogin && (
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className="text-sm font-medium text-foreground/80">First name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                    required={!isLogin}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className="text-sm font-medium text-foreground/80">Last name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                    required={!isLogin}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/80">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground/80">Password</label>
              {isLogin && (
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                required
                minLength={6}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground/80">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                  required={!isLogin}
                  minLength={6}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm transition-colors mt-2 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                {isLogin ? 'Sign in' : 'Sign up'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-foreground/60 p-2">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setFirstName('');
              setLastName('');
              setConfirmPassword('');
              setPassword('');
              setEmail('');
            }}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
