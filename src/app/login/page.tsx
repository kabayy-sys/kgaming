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
      const { data, error: fetchError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setError('Username atau password salah');
        setIsLoading(false);
        return;
      }

      const expectedPassword = data.role === 'owner' ? 'owner123' : '123456';
      if (password !== expectedPassword) {
        setError('Username atau password salah');
        setIsLoading(false);
        return;
      }

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
      setError('Login gagal. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gaming-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-2 text-3xl">🎮</div>
          <h1 className="text-xl font-bold text-gaming-100 tracking-tight">
            K Gaming <span className="text-emerald-400">XCafe</span>
          </h1>
          <p className="text-sm text-gaming-500 mt-1">Staff & Owner Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gaming-400 mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gaming-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="pagi01 / malam01 / owner"
                className="input pl-10"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gaming-400 mb-1.5">Password / PIN</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gaming-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan PIN"
                className="input pl-10 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gaming-500 hover:text-gaming-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-center text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className={cn(
              'btn w-full',
              isLoading || !username || !password
                ? 'opacity-50 cursor-not-allowed bg-gaming-800 text-gaming-500'
                : 'btn-primary'
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                Masuk...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Masuk
              </span>
            )}
          </button>

          <p className="text-center text-xs text-gaming-600">
            Staff: pagi01 / 123456 • Owner: owner / owner123
          </p>
        </form>

        <button
          onClick={() => router.push('/')}
          className="mt-6 w-full text-center text-xs text-gaming-500 hover:text-gaming-300 transition-colors"
        >
          ← Kembali ke Device Monitor
        </button>
      </div>
    </main>
  );
}