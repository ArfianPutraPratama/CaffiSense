import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Coffee3D from '../components/Coffee3D';
import { Loader2, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Mohon isi email dan password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login({ email, password });
      navigate('/diagnosis');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa email dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10"
      style={{ background: '#f2f2ed', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* Main Split Container Card */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ─── LEFT: FORM (6 Cols) ─── */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Top Brand Logo */}
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="font-black text-xl tracking-tight text-gray-950 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
                CaffiSense
              </Link>
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                v2.0 OS
              </span>
            </div>

            {/* Title */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight mb-2 flex items-center gap-2">
                <span>Selamat Datang Kembali</span>
                <Sparkles className="w-6 h-6 text-orange-500" />
              </h1>
              <p className="text-sm text-gray-500">
                Masuk untuk memantau metabolisme kafein dan menjaga kualitas tidur nyenyakmu.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-medium leading-relaxed flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-800 outline-none focus:border-gray-950 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-11 py-3.5 text-sm text-gray-800 outline-none focus:border-gray-950 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-gray-300 text-gray-950 focus:ring-0"
                  />
                  <span className="text-xs text-gray-500 font-medium">Ingat Saya</span>
                </label>
                <span className="text-xs text-gray-400 cursor-not-allowed">Lupa kata sandi?</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gray-950 text-white py-4 rounded-full font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Register Link */}
          <div className="pt-6 mt-6 border-t border-gray-100 text-center text-xs text-gray-500">
            Belum punya akun CaffiSense?{' '}
            <Link to="/register" className="font-bold text-gray-950 hover:underline">
              Daftar Sekarang
            </Link>
          </div>
        </div>

        {/* ─── RIGHT: 3D COFFEE INTERACTIVE SHOWCASE (6 Cols) ─── */}
        <div
          className="hidden lg:flex lg:col-span-6 p-8 sm:p-12 flex-col justify-between relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)' }}
        >
          {/* Subtle Background Glow */}
          <div
            className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: '#f97316' }}
          />

          {/* Top Badge */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-white">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-medium">3D Interactive Canvas</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Move mouse to tilt</span>
          </div>

          {/* 3D Coffee Canvas */}
          <div className="my-auto h-[320px] w-full flex items-center justify-center z-10 relative">
            <Coffee3D />
          </div>

          {/* Bottom Quote & Insight */}
          <div className="z-10 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-white">
            <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">
              Smart Metabolism Tracker
            </div>
            <p className="text-sm font-medium text-zinc-200 leading-relaxed">
              "Kafein memiliki waktu paruh 5 jam di dalam tubuh. Kenali ambang batas amanmu dan capai fase tidur nyenyak."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
