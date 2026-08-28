import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Coffee3D from '../components/Coffee3D';
import { Loader2, Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !passwordConfirmation) {
      setError('Mohon lengkapi semua kolom.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate('/diagnosis');
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10"
      style={{ background: '#f2f2ed', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* Main Container Card */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ─── LEFT: REGISTER FORM (6 Cols) ─── */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Top Brand Logo */}
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="font-black text-xl tracking-tight text-gray-950 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
                CaffiSense
              </Link>
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                Buat Akun
              </span>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight mb-2 flex items-center gap-2">
                <span>Mulai Perjalanan Sehatmu</span>
                <Sparkles className="w-6 h-6 text-orange-500" />
              </h1>
              <p className="text-sm text-gray-500">
                Daftar akun CaffiSense untuk menyimpan riwayat analisis dan progres kualitas tidurmu.
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
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Alex Pratama"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-950 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-950 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-11 py-3 text-sm text-gray-800 outline-none focus:border-gray-950 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-950 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 bg-gray-950 text-white py-4 rounded-full font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar & Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Login Link */}
          <div className="pt-6 mt-6 border-t border-gray-100 text-center text-xs text-gray-500">
            Sudah punya akun CaffiSense?{' '}
            <Link to="/login" className="font-bold text-gray-950 hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>

        {/* ─── RIGHT: 3D COFFEE INTERACTIVE SHOWCASE (6 Cols) ─── */}
        <div
          className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden"
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
              Kenikmatan Kopi, Kualitas Tidur Terjaga
            </div>
            <p className="text-sm font-medium text-zinc-200 leading-relaxed">
              "Nikmati secangkir kopimu tanpa khawatir insomnia. Pantau ritme tubuhmu bersama CaffiSense."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
