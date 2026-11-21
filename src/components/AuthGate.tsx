import React, { useState } from 'react';
import { apiFetch, setStoredToken } from '../lib/api';
import type { PublicUser } from '../types/studio';

interface AuthGateProps {
  title: string;
  subtitle: string;
  onAuthenticated: (user: PublicUser) => void;
  showInternalQuickSignIn?: boolean;
}

const DEMO_ACCOUNTS = [
  { label: 'Customer (Café Carthage)', email: 'client@carthage.tn', pass: 'Client2026!' },
  { label: 'Administrator', email: 'admin@ganzostudio.tn', pass: 'GanzoAdmin2026!' },
  { label: 'Project Manager', email: 'pm@ganzostudio.tn', pass: 'GanzoPM2026!' },
  { label: 'Graphic Designer (Ines)', email: 'ines@ganzostudio.tn', pass: 'GanzoDesign2026!' },
  { label: 'Production Manager', email: 'prod@ganzostudio.tn', pass: 'GanzoProd2026!' },
  { label: 'Customer Support', email: 'support@ganzostudio.tn', pass: 'GanzoSupport2026!' },
];

export const AuthGate: React.FC<AuthGateProps> = ({
  title,
  subtitle,
  onAuthenticated,
  showInternalQuickSignIn = true,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('Tunis');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { email, password }
          : { name, email, password, phone, companyName, city };

      const res = await apiFetch<{ token: string; user: PublicUser }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: PublicUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });
      setStoredToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white border border-neutral-200 p-8 space-y-6">
          <div>
            <p className="font-mono text-xs text-[#007A87] font-semibold">GANZO STUDIO PORTAL</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111111] mt-1">{title}</h1>
            <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>
          </div>

          <div className="flex border border-neutral-200 p-1 bg-[#F4F4F4]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold cursor-pointer ${
                mode === 'login' ? 'bg-white text-[#111111] shadow-xs' : 'text-neutral-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold cursor-pointer ${
                mode === 'register' ? 'bg-white text-[#111111] shadow-xs' : 'text-neutral-600'
              }`}
            >
              Create Customer Account
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+216 ..."
                      className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Company / Brand</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
              />
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#111111] text-white text-sm font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
            >
              {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to GANZO' : 'Create Customer Account'}
            </button>
          </form>
        </div>

        {/* Instant Role Access for Evaluation */}
        <div className="lg:col-span-5 bg-[#111111] text-white p-7 space-y-5">
          <div>
            <div className="font-mono text-xs text-[#00FFFF]">INSTANT ACCESS ACCOUNTS</div>
            <h2 className="font-display text-lg font-bold mt-1">Explore Customer &amp; Internal Team Roles</h2>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Sign in with one click to test the Customer Dashboard or any of the five internal GANZO STUDIO operational roles.
            </p>
          </div>

          <div className="space-y-2">
            {(showInternalQuickSignIn ? DEMO_ACCOUNTS : DEMO_ACCOUNTS.slice(0, 1)).map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemo(acc.email, acc.pass)}
                className="w-full text-left px-4 py-3 bg-[#18181B] border border-neutral-800 hover:border-[#00FFFF] transition-colors flex items-center justify-between gap-2 cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-white">{acc.label}</div>
                  <div className="font-mono text-[11px] text-neutral-400">{acc.email}</div>
                </div>
                <span className="text-xs font-mono text-[#00FFFF]">Enter →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
