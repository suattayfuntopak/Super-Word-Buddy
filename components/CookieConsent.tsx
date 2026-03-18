
import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true
    functional: true,
    analytical: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      essential: true,
      functional: true,
      analytical: true,
      marketing: true,
    }));
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleDeclineAll = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      essential: true,
      functional: false,
      analytical: false,
      marketing: false,
    }));
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setIsVisible(false);
    setShowSettings(false);
  };

  if (!isVisible && !showSettings && !showPolicy) return null;

  return (
    <>
      {/* Detaylı Ayarlar Modalı */}
      {showSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-3xl p-6 sm:p-8 border-4 border-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">Çerez Tercihleri 🛠️</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1 pr-4">
                  <h4 className="font-black text-slate-700 text-sm sm:text-base">Zorunlu Çerezler</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium italic">Sitenin çalışması için teknik olarak gereklidir.</p>
                </div>
                <div className="w-10 h-5 sm:w-12 sm:h-6 bg-indigo-600 rounded-full relative shrink-0">
                  <div className="absolute right-1 top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1 pr-4">
                  <h4 className="font-black text-slate-700 text-sm sm:text-base">İşlevsel Çerezler</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium italic">Dil ve tercihlerinizi hatırlar.</p>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, functional: !preferences.functional})}
                  className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-colors shrink-0 ${preferences.functional ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.functional ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1 pr-4">
                  <h4 className="font-black text-slate-700 text-sm sm:text-base">Analitik Çerezler</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium italic">Sitemizi nasıl kullandığınızı anlamamıza yardımcı olur.</p>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, analytical: !preferences.analytical})}
                  className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-colors shrink-0 ${preferences.analytical ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.analytical ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1 pr-4">
                  <h4 className="font-black text-slate-700 text-sm sm:text-base">Pazarlama Çerezleri</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium italic">İlgi alanlarınıza yönelik reklamlar gösterir.</p>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, marketing: !preferences.marketing})}
                  className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-colors shrink-0 ${preferences.marketing ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.marketing ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
              <button onClick={handleDeclineAll} className="flex-1 py-3 sm:py-4 bg-slate-100 text-slate-600 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase">Tümünü Reddet</button>
              <button onClick={handleSaveSettings} className="flex-1 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase shadow-lg">Ayarları Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Politika Modalı */}
      {showPolicy && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] sm:rounded-[3rem] shadow-3xl p-6 sm:p-10 border-4 border-white max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">Çerez Aydınlatma Metni 📄</h2>
              <button onClick={() => setShowPolicy(false)} className="bg-slate-50 text-slate-400 p-2 sm:p-3 rounded-full hover:bg-slate-100">✕</button>
            </div>
            <div className="prose prose-slate max-w-none text-slate-600 text-[10px] sm:text-sm space-y-3 sm:space-y-4 font-medium leading-relaxed">
              <p>Super Word Buddy olarak, kullanıcılarımızın kişisel verilerinin korunmasına ve gizliliğine büyük önem veriyoruz. 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla, internet sitemiz üzerinden toplanan çerezler (cookies) hakkında sizi bilgilendirmek isteriz.</p>
              <h3 className="text-base sm:text-lg font-black text-slate-800">1. Çerez Nedir?</h3>
              <p>Çerezler, bir internet sitesini ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza kaydedilen küçük veri dosyalarıdır. Sitemizin işlevselliğini artırmak, kullanıcı tercihlerini hatırlamak ve sitemizi geliştirmek için kullanılır.</p>
              <h3 className="text-base sm:text-lg font-black text-slate-800">2. Kullanılan Çerez Türleri</h3>
              <ul className="list-disc pl-5 space-y-1 sm:space-y-2">
                <li><strong>Zorunlu Çerezler:</strong> Sitenin temel işlevlerini yerine getirmesi için zorunludur.</li>
                <li><strong>İşlevsel Çerezler:</strong> Dil tercihi gibi ayarları hatırlamak için kullanılır.</li>
                <li><strong>Analitik Çerezler:</strong> Ziyaretçi sayılarını ve sitemizin nasıl kullanıldığını analiz etmemizi sağlar.</li>
                <li><strong>Reklam Çerezleri:</strong> Size özel kampanya ve reklam içerikleri sunmak amacıyla kullanılır.</li>
              </ul>
              <h3 className="text-base sm:text-lg font-black text-slate-800">3. Çerezlerin Kontrolü</h3>
              <p>Tarayıcı ayarlarınız üzerinden çerezleri dilediğiniz zaman silebilir veya engelleyebilirsiniz. Ancak bazı teknik çerezlerin engellenmesi sitemizin bazı özelliklerinin çalışmamasına neden olabilir.</p>
            </div>
          </div>
        </div>
      )}

      {/* Ana Onay Bandı */}
      {isVisible && !showSettings && !showPolicy && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-black text-white p-4 sm:p-6 shadow-2xl animate-in slide-in-from-bottom duration-500 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
              <div className="bg-white/10 p-2 rounded-full shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
              <p className="text-[10px] sm:text-sm leading-relaxed opacity-90">
                Sitemizin içeriğinin sağlanması ve belli fonksiyonların çalışması için zorunlu çerezler kullanmaktayız. Açık rızanızla deneyiminizin iyileştirilmesi, size özel pazarlama faaliyetlerinin gerçekleştirilmesi, sitenin işlevsel kılınması ve performansın analizi amacıyla isteğe bağlı çerezler kullanılabilir. Zorunlu olmayan çerezler onay vermediğinizde kullanılmayacaktır. Tercihlerinizi yönetmek için ayarlar seçeneğine tıklayabilir, detaylı bilgi için <button onClick={() => setShowPolicy(true)} className="underline decoration-1 underline-offset-4 hover:text-indigo-400 transition-colors">çerez aydınlatma metni</button>'ni inceleyebilirsiniz.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0 w-full lg:w-auto justify-center">
              <button onClick={handleDeclineAll} className="text-[10px] sm:text-sm font-bold hover:text-red-400 transition-colors px-2 py-1">Reddet</button>
              <button onClick={() => setShowSettings(true)} className="border border-white/30 px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold hover:bg-white/10 transition-colors uppercase tracking-widest bg-white/5">Ayarlar</button>
              <button onClick={handleAcceptAll} className="bg-white text-black px-6 py-1.5 sm:px-8 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-black hover:bg-gray-200 transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-white/10">Kabul Et</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
