'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-3xl tracking-tight text-[#111111] mb-2">
            northernart11
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 font-sans">
            Admin Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="text-xs text-red-500 font-sans border border-red-200 bg-red-50/50 p-3 text-center">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.15em] text-neutral-500 block font-sans">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 font-sans text-sm"
              placeholder="e.g. artist@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.15em] text-neutral-500 block font-sans">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 font-sans text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111111] hover:bg-neutral-800 text-white py-3 text-xs uppercase tracking-[0.2em] font-sans transition-colors duration-300 disabled:bg-neutral-300"
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="mt-12 text-center">
          <a
            href="/"
            className="text-xs text-neutral-400 hover:text-[#111111] tracking-wider transition-colors duration-300 font-sans"
          >
            ← Return to Gallery
          </a>
        </div>
      </div>
    </div>
  );
}
