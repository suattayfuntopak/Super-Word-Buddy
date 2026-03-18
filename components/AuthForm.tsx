
import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onAuthSuccess: (user: User) => void;
  onToggleMode: (newMode: 'login' | 'signup') => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onAuthSuccess, onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });

        if (authError) throw authError;

        if (data.user) {
          onAuthSuccess({
            id: data.user.id,
            email: data.user.email!,
            name: name
          });
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (data.user) {
          onAuthSuccess({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata.name || 'Arkadaşım'
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu. 🍭');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full animate-in fade-in zoom-in-95 duration-500 px-4">
      <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.08)] border-4 border-white">
        <div className="text-center mb-8 sm:mb-10 flex flex-col items-center">
          <div 
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mb-4 sm:mb-6 ring-4 ring-slate-50 shadow-lg relative overflow-hidden animate-bounce"
            style={{ background: 'conic-gradient(#ff5f5f 0deg 90deg, #ffdc5f 90deg 180deg, #5f99ff 180deg 270deg, #ffffff 270deg 360deg)' }}
          >
            <div className="absolute top-[20%] left-[20%] w-4 h-3 sm:w-6 sm:h-4 bg-white/30 rounded-full blur-sm -rotate-45"></div>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">
            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </h2>
          <p className="text-slate-400 font-medium mt-2 text-sm sm:text-base">
            {mode === 'login' ? 'Kelimelerine tekrar kavuş!' : 'Arkadaşınla tanışmak için bilgileri gir.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs sm:text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {mode === 'signup' && (
            <div className="space-y-1 sm:space-y-2">
              <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Adın</label>
              <input 
                required
                type="text"
                className="w-full bg-slate-50 border-4 border-transparent rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 focus:border-blue-100 focus:bg-white outline-none text-base sm:text-lg font-bold text-slate-700 transition-all"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Örn: Ela"
              />
            </div>
          )}

          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-4">E-posta</label>
            <input 
              required
              type="email"
              className="w-full bg-slate-50 border-4 border-transparent rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 focus:border-blue-100 focus:bg-white outline-none text-base sm:text-lg font-bold text-slate-700 transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ela@örnek.com"
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Şifre</label>
            <input 
              required
              type="password"
              className="w-full bg-slate-50 border-4 border-transparent rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 focus:border-blue-100 focus:bg-white outline-none text-base sm:text-lg font-bold text-slate-700 transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 sm:py-6 bg-blue-500 hover:bg-blue-600 text-white rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-xl sm:text-2xl shadow-2xl shadow-blue-100 transition-all mt-4 sm:mt-6 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Yükleniyor...' : (mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 text-center">
          {mode === 'login' ? (
            <p className="text-slate-400 font-bold text-sm sm:text-base">
              Hesabın yok mu?{' '}
              <button 
                onClick={() => onToggleMode('signup')}
                className="text-blue-500 hover:underline decoration-2 underline-offset-4"
              >
                Kayıt Ol!
              </button>
            </p>
          ) : (
            <p className="text-slate-400 font-bold text-sm sm:text-base">
              Zaten hesabın var mı?{' '}
              <button 
                onClick={() => onToggleMode('login')}
                className="text-blue-500 hover:underline decoration-2 underline-offset-4"
              >
                Giriş Yap!
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
