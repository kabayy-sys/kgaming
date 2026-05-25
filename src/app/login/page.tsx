'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { LogIn, Eye, EyeOff, User, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use staff_profiles table for auth
      const { data, error: fetchError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setError('Invalid username or password');
        setIsLoading(false);
        return;
      }

      // Simple PIN validation (in production, use proper auth)
      if (data.role === 'owner') {
        if (password !== 'owner123') {
          setError('Invalid username or password');
          setIsLoading(false);
          return;
        }
      } else {
        if (password !== '123456') {
          setError('Invalid username or password');
          setIsLoading(false);
          return;
        }
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        action: 'user_login',
        actor_id: data.id,
        actor_name: data.display_name,
        target_type: 'staff',
        target_id: data.id,
        details: { role: data.role, shift: data.shift },
      });

      setUser(data);
      router.push('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gaming-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mb-4 text-5xl">🎮</div>
          <h1 className="text-2xl font-bold tracking-wider text-gaming-50" style={{ fontFamily: 'var(--font-display)' }}>
            K Gaming <span className="text-neon-cyan">XCafe</span>
          </h1>
          <p className="mt-2 text-sm text-gaming-500">Staff & Owner Login</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gaming-300">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gaming-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="pagi01 / malam01 / owner"
                className="input-field pl-10"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gaming-300">
              Password / PIN
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gaming-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your PIN"
                className="input-field pl-10 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gaming-400 hover:text-gaming-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-center text-xs text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className={cn(
              'btn w-full',
              isLoading || !username || !password
                ? 'cursor-not-allowed bg-gaming-700/50 text-gaming-500'
                : 'btn-primary'
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gaming-900 border-t-transparent" />
                Logging in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </span>
            )}
          </button>

          <p className="text-center text-xs text-gaming-600">
            Staff: pagi01 / 123456 • Owner: owner / owner123
          </p>
        </form>

        {/* Back to Home */}
        <button
          onClick={() => router.push('/')}
          className="mt-6 w-full text-center text-xs text-gaming-500 hover:text-gaming-300"
        >
          ← Back to Device Monitor
        </button>
      </div>
    </main>
  );
}