import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../utils/theme';
import { Lang } from '../utils/i18n';
import { requestNotificationPermission } from '../utils/dailyGoal';
import { supabase } from '../services/supabaseClient';

interface UserMenuProps {
  userName: string;
  userEmail: string;
  theme: Theme;
  lang: Lang;
  dailyGoal: number;
  onThemeChange: (t: Theme) => void;
  onLangChange: (l: Lang) => void;
  onDailyGoalChange: (n: number) => void;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  userName, userEmail, theme, lang, dailyGoal,
  onThemeChange, onLangChange, onDailyGoalChange, onLogout,
}) => {
  const [open, setOpen] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isTr = lang === 'tr';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const themeOptions: { value: Theme; icon: string; labelTr: string; labelEn: string }[] = [
    { value: 'light', icon: '☀️', labelTr: 'Açık', labelEn: 'Light' },
    { value: 'dark',  icon: '🌙', labelTr: 'Koyu', labelEn: 'Dark' },
    { value: 'system', icon: '💻', labelTr: 'Sistem', labelEn: 'System' },
  ];

  const handleGoalChange = async (n: number) => {
    if (n > 0) await requestNotificationPermission();
    onDailyGoalChange(n);
  };

  const handleEmailChange = async () => {
    const trimmed = newEmail.trim();
    if (!trimmed) return;
    setAccountMsg(null);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    if (error) {
      setAccountMsg({ text: (isTr ? 'Hata: ' : 'Error: ') + error.message, ok: false });
    } else {
      setAccountMsg({ text: isTr ? 'Onay e-postası gönderildi!' : 'Confirmation email sent!', ok: true });
      setNewEmail('');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      setAccountMsg({ text: isTr ? 'Şifre en az 6 karakter olmalı.' : 'Password must be at least 6 characters.', ok: false });
      return;
    }
    setAccountMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setAccountMsg({ text: (isTr ? 'Hata: ' : 'Error: ') + error.message, ok: false });
    } else {
      setAccountMsg({ text: isTr ? 'Şifre güncellendi!' : 'Password updated!', ok: true });
      setNewPassword('');
    }
  };

  const avatarLetter = userName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-600 text-white font-black text-sm sm:text-base flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all border-2 border-white/30"
        title={userName}
        aria-label="User menu"
      >
        {avatarLetter}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in zoom-in-90 duration-200 origin-top-right">
          {/* User info */}
          <div className="px-5 py-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md shrink-0">
                {avatarLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 truncate text-sm">{userName}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Theme */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {isTr ? 'Tema' : 'Theme'}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {themeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onThemeChange(opt.value)}
                    className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all ${theme === opt.value ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <span className="text-base leading-none">{opt.icon}</span>
                    <span className="text-[10px] font-black mt-1">{isTr ? opt.labelTr : opt.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {isTr ? 'Dil' : 'Language'}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { value: 'tr' as Lang, flag: 'https://flagcdn.com/w40/tr.png', label: 'Türkçe' },
                  { value: 'en' as Lang, flag: 'https://flagcdn.com/w40/us.png', label: 'English' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onLangChange(opt.value)}
                    className={`flex items-center space-x-2 py-2 px-3 rounded-xl transition-all ${lang === opt.value ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <img src={opt.flag} className="w-5 h-auto rounded-sm shrink-0" alt={opt.label} />
                    <span className="text-xs font-black">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Goal */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {isTr ? 'Günlük Hedef' : 'Daily Goal'}
              </p>
              <div className="flex items-center space-x-3 bg-slate-50 rounded-xl p-2 border border-slate-100">
                <button
                  onClick={() => handleGoalChange(Math.max(1, dailyGoal - 1))}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-600 font-black flex items-center justify-center border border-slate-100 shadow-sm transition-all"
                >−</button>
                <div className="flex-1 text-center">
                  <span className="text-xl font-black text-slate-800">{dailyGoal}</span>
                  <span className="text-[10px] text-slate-400 font-bold ml-1.5">
                    {isTr ? 'aktivite/gün' : 'activities/day'}
                  </span>
                </div>
                <button
                  onClick={() => handleGoalChange(Math.min(20, dailyGoal + 1))}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-600 font-black flex items-center justify-center border border-slate-100 shadow-sm transition-all"
                >+</button>
              </div>
            </div>

            {/* Account settings */}
            <div className="border-t border-slate-100 pt-3">
              <button
                onClick={() => { setShowAccount(v => !v); setAccountMsg(null); }}
                className="w-full flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors py-1"
              >
                <span>{isTr ? '🔑 Hesap Ayarları' : '🔑 Account Settings'}</span>
                <span className="text-slate-300">{showAccount ? '▲' : '▼'}</span>
              </button>

              {showAccount && (
                <div className="mt-3 space-y-3">
                  {/* Email change */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      {isTr ? 'E-posta Değiştir' : 'Change Email'}
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder={isTr ? 'Yeni e-posta adresi' : 'New email address'}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-indigo-400 outline-none"
                    />
                    <button
                      onClick={handleEmailChange}
                      className="w-full mt-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[10px] rounded-xl transition-all uppercase tracking-wide"
                    >
                      {isTr ? 'E-postayı Güncelle' : 'Update Email'}
                    </button>
                  </div>

                  {/* Password change */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      {isTr ? 'Şifre Değiştir' : 'Change Password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder={isTr ? 'Yeni şifre (min. 6 karakter)' : 'New password (min. 6 chars)'}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-indigo-400 outline-none"
                    />
                    <button
                      onClick={handlePasswordChange}
                      className="w-full mt-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[10px] rounded-xl transition-all uppercase tracking-wide"
                    >
                      {isTr ? 'Şifreyi Güncelle' : 'Update Password'}
                    </button>
                  </div>

                  {accountMsg && (
                    <p className={`text-[10px] text-center font-bold py-1 px-2 rounded-lg ${accountMsg.ok ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                      {accountMsg.text}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Buy me a coffee */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <a
                href="https://buymeacoffee.com/suattayfuntopak"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 bg-[#FFDD00] text-black px-3 py-2.5 rounded-xl font-bold animate-breathe shadow-md"
              >
                <span className="text-lg">☕</span>
                <span className="font-black text-sm" style={{ fontFamily: "'Cookie', cursive" }}>Buy me a coffee</span>
              </a>

              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-500 font-black text-sm rounded-xl transition-all"
              >
                🚪 {isTr ? 'Çıkış Yap' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
