import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, KeyRound, Library, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User, UserRole } from '../types';
import { capabilityPillars } from '../lib/brief';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState<{
    disclaimer: string;
    default_password: string;
    accounts: { username: string; role: string; full_name: string }[];
  }>({ disclaimer: '', default_password: '', accounts: [] });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/demo-accounts');
        if (res.ok) {
          setDemo(await res.json());
        }
      } catch {
        // Demo accounts are optional presentation data.
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Authentication failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      setTimeout(() => {
        onLogin({
          id: data.id,
          name: data.name,
          role: data.role as UserRole,
          avatar: data.avatar,
        });
      }, 300);
    } catch {
      setError('Unable to connect to the secure warehouse gateway.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-wash)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(209,115,76,0.16),transparent_35%)]" />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:flex flex-col justify-between px-12 xl:px-16 py-12 text-white bg-slate-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(48,103,140,0.35),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(209,115,76,0.22),transparent_35%)]" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-[24px] bg-[var(--accent-copper)] flex items-center justify-center shadow-[0_18px_45px_rgba(209,115,76,0.28)]">
                <Library className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/55">CT6049 Assignment 2</p>
                <h1 className="text-3xl font-serif">Library Warehouse Application</h1>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-2xl">
            <p className="eyebrow text-white/60">Decision-support Platform</p>
            <h2 className="mt-4 text-6xl leading-[1.02] font-serif">
              From operational
              <br />
              data to executive
              <br />
              intelligence.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/72 max-w-xl">
              This application demonstrates the full assignment flow: operational source tables, ETL loading,
              dimensional warehousing, secure authentication, and decision-maker reporting.
            </p>

            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              {capabilityPillars.slice(0, 4).map(pillar => (
                <div key={pillar.title} className="rounded-[28px] border border-white/10 bg-white/5 px-5 py-5">
                  <p className="eyebrow text-white/45">{pillar.title}</p>
                  <p className="mt-3 text-sm leading-6 text-white/78">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-sm text-white/70">
            <ShieldCheck className="h-5 w-5 text-[var(--accent-copper)]" />
            Restricted to role-based decision-maker accounts
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 lg:px-12">
          <div className="w-full max-w-xl surface-strong rounded-[36px] p-6 sm:p-8 lg:p-10">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-[20px] bg-[var(--accent-copper)] flex items-center justify-center text-white">
                <Library className="h-6 w-6" />
              </div>
              <div>
                <p className="eyebrow">CT6049 Assignment 2</p>
                <h1 className="text-2xl font-serif text-slate-950">LibWare Decision Studio</h1>
              </div>
            </div>

            <div>
              <p className="eyebrow">Secure Access</p>
              <h2 className="mt-2 text-4xl font-serif text-slate-950">Sign in to the warehouse</h2>
              <p className="mt-3 text-slate-600 leading-7">
                Use one of the demo decision-maker accounts to open the command center, analytics studio, and control
                evidence views.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <div className="relative">
                  <UserIcon className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full rounded-[22px] border border-slate-200 bg-white px-12 py-4 text-slate-900 outline-none transition focus:border-[var(--accent-teal)] focus:ring-4 focus:ring-[rgba(15,118,110,0.12)]"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <KeyRound className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-[22px] border border-slate-200 bg-white px-12 py-4 text-slate-900 outline-none transition focus:border-[var(--accent-teal)] focus:ring-4 focus:ring-[rgba(15,118,110,0.12)]"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-4 rounded-[22px] justify-center">
                {loading ? 'Authenticating...' : 'Enter Command Center'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {demo.accounts.length > 0 && (
              <div className="mt-8 rounded-[28px] border border-slate-200 bg-white/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">Demo Accounts</p>
                    <p className="mt-2 text-sm text-slate-600">{demo.disclaimer}</p>
                  </div>
                  <span className="chip shrink-0">Password: {demo.default_password}</span>
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-3">
                  {demo.accounts.map(account => (
                    <button
                      key={account.username}
                      type="button"
                      onClick={() => {
                        setUsername(account.username);
                        setPassword(demo.default_password);
                      }}
                      className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-left hover:border-[var(--accent-teal)] hover:bg-[rgba(15,118,110,0.03)] transition"
                    >
                      <p className="eyebrow">{account.role}</p>
                      <p className="mt-2 font-semibold text-slate-900">{account.full_name}</p>
                      <p className="mt-2 text-sm text-[var(--accent-teal)] font-medium">@{account.username}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200 text-xs uppercase tracking-[0.24em] text-slate-400">
              Secure gateway • warehouse analytics • audit-ready
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
