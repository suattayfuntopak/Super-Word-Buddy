# Super Word Buddy — Hotfix & Refactor Log

**Tarih:** 2026-06-05

---

## Kritik Düzeltmeler

### 1. Upload / Kelime Analiz Akışı Onarıldı
- `App.tsx` içindeki `onFileSelect` callback'i `/* Logic */` boş placeholderdan tam implementasyona taşındı.
- Yeni `handleFileSelect` fonksiyonu: dosya → `analyzeVocabulary` → mevcut kelimelerle duplicate filtresi → Supabase insert döngüsü → `fetchAllWords` → `'selection'` akışını eksiksiz yürütüyor.
- Hata durumunda kullanıcıya hata mesajı gösteriliyor ve `'upload'` state'ine geri dönülüyor.

### 2. Gemini Model Adı Düzeltildi
- `'gemini-3-flash-preview'` → `'gemini-2.0-flash'` (var olmayan model API'dan 404 hatası alıyordu).
- Tüm fonksiyonlarda tek `GEMINI_MODEL` sabiti kullanılıyor.

### 3. API Key Tutarsızlığı Giderildi
- `analyzeVocabulary` ve `generateTutorMaterial` `process.env.API_KEY` kullanıyordu; `generateQuiz` ise `import.meta.env.VITE_GEMINI_API_KEY` — ikisi aynı değişkeni işaret etmiyordu.
- Birleşik `getApiKey()` fonksiyonu: `VITE_GEMINI_API_KEY || process.env.API_KEY` ile her iki tanımı da destekliyor.

### 4. İstatistikler Sayfası Erişilebilir Hale Getirildi
- Selection menüsüne `📊 İstatistikler` kartı eklendi (violet/purple gradient).
- `state === 'stats'` artık navigasyonla ulaşılabilir.

### 5. Kelime Silme / Düzenleme Eklendi (Ownership Kontrolü ile)
- Liste görünümünde, sadece kelimenin sahibi olan kullanıcıya ✏️ Düzenle ve 🗑️ Sil butonları gösteriliyor.
- Silme: iki adımlı onay ("Sil?" / "Hayır") ile korunuyor.
- Güncelleme: Supabase sorgusuna `.eq('user_id', currentUser.id)` şartı eklendi — başka kullanıcının kelimesi güncellenemiyor.
- `VocabularyItem` tipine `userId?: string` alanı eklendi; `fetchAllWords` bunu dolduruyor.

---

## Hata Düzeltmeleri

### 6. WordShooterGame Stale Closure Düzeltildi
- `useEffect` içindeki `nextLevel()` `questionCount` state değişkenini stale closure olarak okuyordu — her zaman 0 görüyordu.
- `useRef` tabanlı `questionCountRef` ve `targetWordRef` ile gerçek zamanlı değerlere erişim sağlandı.
- `restartGame` fonksiyonu ref'leri de sıfırlıyor.

### 7. MatchGame State Mutasyonu Düzeltildi
- `cards[idx].isFlipped = true` doğrudan state nesnesini mutate ediyordu (`[...cards]` shallow copy objeleri paylaşıyor).
- Tüm state güncellemeleri `prev.map(...)` ile immutable hale getirildi.
- `setTimeout` içindeki kapatmalar fonksiyonel `setCards(prev => ...)` formuna çevrildi.

### 8. ClozeGame Empty Pool Davranışı Düzeltildi
- Boş kelime havuzu artık sonsuz "Yükleniyor..." yerine bilgilendirici mesaj gösteriyor.
- `setupOptions` doğru pool referansı alıyor (stale closure'dan kurtarıldı).

---

## Refactoring

### 9. `speak` Fonksiyonu Tekrardan Kurtarıldı
- 4 dosyada (`App.tsx`, `Quiz.tsx`, `Flashcards.tsx`, `WordWriting.tsx`) birebir kopyalanmış olan `speak` fonksiyonu `utils/speak.ts`'e taşındı.
- Tüm bileşenler bu tek kaynaktan import ediyor.

### 10. TutorView Temizlendi
- Kullanılmayan `vocabItems`, `onAnalyzing`, `onFinish` prop'ları interface ve bileşen imzasından kaldırıldı.
- `App.tsx`'teki `TutorView` çağrısı sadece `onBack` prop'u ile güncellendi.

---

## Yeni Özellikler

### 11. Klavye Kısayolları

**Flashcards:**
- `←` / `→` → önceki / sonraki kart
- `Space` / `Enter` → kartı çevir

**Quiz:**
- `A` `B` `C` `D` `E` → şık seç
- `Enter` / `Space` → sonraki soruya geç (cevap verildikten sonra)

### 12. Dosya Boyutu Limiti
- `FileUpload` bileşenine 10MB üst limit eklendi (Gemini API inline data sınırı gözetilerek).
- Aşım durumunda Türkçe hata mesajı gösteriliyor.
- UI'da "Maks 10MB" etiketi görünüyor.

### 13. Error Boundary
- `components/ErrorBoundary.tsx` oluşturuldu.
- `index.tsx` içinde `<App />` bu boundary ile sarıldı.
- Component crash'leri artık tüm uygulamayı çöküyor değil; kullanıcıya "Sayfayı Yenile" butonlu hata ekranı gösteriliyor.

---

## Temizlik

### 14. `migrated_prompt_history/` Silindi
- Repository'de olmaması gereken eski prompt geçmişi klasörü kaldırıldı.

---

## Etkilenen Dosyalar

| Dosya | İşlem |
|-------|-------|
| `utils/speak.ts` | YENİ |
| `components/ErrorBoundary.tsx` | YENİ |
| `hot.md` | YENİ |
| `types.ts` | GÜNCELLENDİ |
| `services/geminiService.ts` | GÜNCELLENDİ |
| `components/FileUpload.tsx` | GÜNCELLENDİ |
| `components/Flashcards.tsx` | GÜNCELLENDİ |
| `components/Quiz.tsx` | GÜNCELLENDİ |
| `components/WordWriting.tsx` | GÜNCELLENDİ |
| `components/TutorView.tsx` | GÜNCELLENDİ |
| `components/GamesHub.tsx` | GÜNCELLENDİ |
| `App.tsx` | GÜNCELLENDİ |
| `index.tsx` | GÜNCELLENDİ |
| `migrated_prompt_history/` | SİLİNDİ |

---

## Güncelleme — 2026-06-05 (3. Oturum — 5 Yeni Özellik + Session Kalıcılığı)

### 19. PWA — Ana Ekrana Ekle
- `vite-plugin-pwa` kuruldu (`devDependencies`).
- `vite.config.ts`'e `VitePWA` plugin eklendi: `generateSW` stratejisi, uygulama manifest'i, runtime caching.
- **Manifest:** `Super Word Buddy` · indigo theme · portrait standalone.
- **Önbellek:** Tailwind CDN, flagcdn bayrak resimleri, Google Fonts → `CacheFirst` / `StaleWhileRevalidate`.
- **İkonlar:** `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (Node.js ile üretildi — pure PNG, 79·70·229 indigo gradient).
- `index.html`'e meta etiketleri eklendi: `theme-color`, `apple-mobile-web-app-*`, `apple-touch-icon`.
- Vercel'de canlıya alındıktan sonra Chrome/Android'de "Ana Ekrana Ekle" butonu görünür; iOS'ta Safari → Paylaş → Ana Ekrana Ekle çalışır.

### 20. Session Kalıcılığı (Nerede Kaldıysan Orada Kal)
- **Sorun:** Token yenileme veya uygulama arka plana geçince kullanıcı ana sayfaya düşüyordu.
- **Çözüm:** `localStorage` üzerinde `swb_state_{userId}` anahtarıyla son aktif sayfa kaydediliyor.
- Korunan durumlar: `selection`, `list`, `learning`, `writing`, `stats`, `tutor`, `games`.
- Korunmayanlar: `quiz`, `analyzing`, `upload` (in-progress durumlar — yeniden başlatmak daha doğru).
- Auth yenilendiğinde (`getSession` + `onAuthStateChange`) kayıtlı durum restore ediliyor.

### 21. Kelime Zorluk Seviyesi & Akıllı Tekrar (Spaced Repetition)
- Yeni `utils/wordDifficulty.ts`: `localStorage` tabanlı zorluk puanı (1–5, varsayılan 3).
  - Doğru yanıt: `max(1, puan − 1)` · Yanlış yanıt: `min(5, puan + 2)`.
- Quiz bitiminde tüm sorular değerlendirilir; kelime puanları güncellenir.
- Flashcard sıralaması: En zor kelimeler (yüksek puan) öne gelir.
- `generateLocalQuiz`: Ağırlıklı örnekleme — zor kelimeler havuza birden fazla kez girer, dolayısıyla seçilme olasılığı yüksektir.

### 22. Kelime Favorileme
- Yeni `utils/favorites.ts`: `localStorage` tabanlı favori seti (`swb_favorites_{userId}`).
- Kelime listesinde her karta 🤍/❤️ butonu eklendi.
- Liste görünümünde `❤️ Favoriler` filtre butonu: sadece favori kelimeleri göster/gizle.
- Favoriler localStorage'da saklandığından hesap kapatıp açılsa bile korunur.

### 23. Quiz Sonuç Ekranında Yanlış Kelimeler
- Quiz biterken "Gözden Geçirilecekler" bölümü gösteriliyor.
- Her yanlış kelime: İngilizce · Türkçe anlam · 🇬🇧 🇺🇸 telaffuz butonları.
- Liste max 44px yükseklik + `overflow-y-auto` ile kart aşımını önler.
- `Quiz.onClose` imzası: `(score, total, wrongWordStrings[])` → `App.tsx` difficulty güncelleme pipeline'ına aktarılıyor.

### 24. Streak Sayacı & Günlük İlerleme
- Statistics sayfasına 4 yeni metrik kartı eklendi:
  - 🔥 **Günlük Seri** — arka arkaya kaç gün çalışıldığı (today → sıfır).
  - 📅 **Bugünkü Aktivite** — bugün kaç oturum yapıldığı.
  - ⚡ **Toplam Aktivite** — tüm zamanlar.
  - 🎯 **Genel Başarı** — Quiz + Yazma birleşik başarı %.
- `calculateStreak()`: `activityLogs` üzerinden geriye doğru ardışık günleri sayar.
- `todayActivityCount()`: `created_at` ile bugünü eşleştirir.

---

## Güncelleme — 2026-06-05 (5. Oturum — Browser Geçmişi, Quiz Kalıcılığı, Tam Çeviri, Trend Grafik, Auto-Pronounce)

### 31. Browser Geri/İleri Tuşu Desteği
- **Sorun:** Browser geri tuşuna basınca SPA durumu kaybolup boş sayfa açılıyordu.
- **Çözüm:** `window.history.pushState` + `popstate` event listener entegrasyonu.
- `HISTORY_STATES`: `selection`, `list`, `learning`, `writing`, `stats`, `tutor`, `games`, `quiz` — her geçişte history stack'e ekleniyor.
- `isPopStateNav` ref ile double-push döngüsü önleniyor (popstate'den gelen setState yeniden pushState yapmıyor).
- Back/forward tuşlarıyla uygulama içinde gezinme çalışıyor; history bitmişse 'selection'/'home'a yönlendiriyor.

### 32. Quiz Kalıcılığı (Başka Uygulamaya Geçince Quiz Devam Ediyor)
- **Sorun:** Quiz sırasında başka uygulamaya geçilince geri dönünce test kapanıp ana ekran görünüyordu.
- **Çözüm:** `'quiz'` PERSISTABLE_STATES listesine eklendi.
- Otomatik quiz üretimi: `state === 'quiz' && quizQuestions.length === 0 && vocabItems.length >= 5` koşulu gerçekleşince `generateLocalQuiz` çalışıyor.
- Akış: Token yenileme → `'quiz'` state restore → Quiz bileşeni spinner gösteriyor → Vocab yüklenince sorular otomatik üretiliyor → Quiz başlıyor.

### 33. "Common Academic Knowledge" → "Global Word Pool"
- İngilizce: `homeTitle` ve `subtitle` → **"Global Word Pool"**
- Türkçe: `homeTitle` → **"Küresel Kelime Havuzu"**, `subtitle` → **"Global Kelime Havuzu"**
- App.tsx'te h2 başlığı da `t.homeTitle` ile güncellendi.

### 34. Tam TR/EN Çeviri (Flashcards, Quiz, Statistics)
- **Flashcards.tsx:** `T.tr` / `T.en` çeviri objesi eklendi; kart etiketi, telaffuz, gezinme, flip ipucu, otomatik sesli etiketi çevrildi.
- **Quiz.tsx:** `T.tr` / `T.en` eklendi; soru/skor etiketleri, klavye ipucu, anlam/kapat, ileri/sonuç butonları, sonuç mesajları, gözden geçirilecekler başlığı çevrildi.
- **Statistics.tsx:** `ST.tr` / `ST.en` eklendi; tüm kart başlıkları, birimler, durum mesajları çevrildi.
- `lang` prop tüm bu bileşenlere aktarılıyor (`App.tsx`'ten).

### 35. 7 Günlük Aktivite Trend Grafiği (Statistics)
- Son 7 günün aktivite sayısını gösteren bar grafik eklendi.
- CSS tabanlı (SVG/canvas yok), `activityLogs` verisi üzerinden anlık hesaplanıyor.
- Bugün: indigo gradient bar; önceki günler: slate bar.
- Bar yüksekliği: `(count / maxCount) * 100%`, sıfır gün: 4px görünür çizgi.

### 36. Otomatik Telaffuz Toogle (Flashcards)
- Flashcards'a "🔊 Otomatik Sesli / Auto Pronounce" toggle eklendi.
- Aktifken: her yeni karta geçildiğinde İngilizce kelime otomatik UK aksanıyla okunuyor.
- State: bileşen içinde `autoPronounce` boolean; toggle butonu header'da gösteriliyor.

---

## Güncellenen Dosyalar (5. Oturum)

| Dosya | İşlem |
|-------|-------|
| `utils/i18n.ts` | GÜNCELLENDİ — homeTitle, subtitle düzeltildi |
| `App.tsx` | GÜNCELLENDİ — history pushState/popstate, quiz kalıcılığı, lang→components |
| `components/Flashcards.tsx` | GÜNCELLENDİ — lang prop, tam çeviri, auto-pronounce toggle |
| `components/Quiz.tsx` | GÜNCELLENDİ — lang prop, tam çeviri |
| `components/Statistics.tsx` | GÜNCELLENDİ — lang prop, tam çeviri, 7 günlük trend grafik |

---

## Güncelleme — 2026-06-05 (4. Oturum — Tema, Dil, Kullanıcı Menüsü, 3 Yeni Özellik)

### 25. Dark / Light / System Tema
- `utils/theme.ts` eklendi: `getStoredTheme`, `storeTheme`, `applyTheme`, `resolveTheme` yardımcıları.
- `index.html`'e `tailwind.config = { darkMode: 'class' }` eklendi (CDN öncesi).
- `index.html` `<style>` bloğuna kapsamlı dark mode CSS override'ları eklendi: bg, text, border, shadow, input, header/footer, scrollbar.
- `html.dark` sınıfı `applyTheme()` ile toggle ediliyor; sistem tercihi değişince otomatik güncelleniyor.
- Tercih `localStorage` üzerinde `swb_theme` anahtarında saklanıyor.

### 26. TR / EN Dil Desteği
- `utils/i18n.ts` eklendi: `translations.tr` ve `translations.en` nesneleri (50+ anahtar).
- `App.tsx`'teki tüm sabit metinler `t.xxx` referansına taşındı.
- Dil değişimi anında tüm arayüz güncelleniyor (React state).
- Tercih `localStorage` üzerinde `swb_lang` anahtarında saklanıyor.

### 27. Sağ Üst Köşe Kullanıcı Menüsü
- `components/UserMenu.tsx` oluşturuldu.
- Header'daki kullanıcı adı + Çıkış butonu → tek avatar butonu (baş harfi) ile değiştirildi.
- Dropdown içeriği:
  - Kullanıcı adı + e-posta (avatar + gradient header)
  - 🎨 **Tema seçici**: ☀️ Açık / 🌙 Koyu / 💻 Sistem (3 buton, aktif indigo)
  - 🌍 **Dil seçici**: 🇹🇷 Türkçe / 🇺🇸 English (flagcdn bayrakları)
  - 🎯 **Günlük hedef ayarı**: −/+ ile 1-20 arası aktivite/gün (bildirim izni isteniyor)
  - 🚪 Çıkış Yap butonu
- Dışarı tıklanınca kapanıyor (`useEffect` + `mousedown` listener).

### 28. Favori Kelime Çalışma Modu (Öneri A)
- Seçim grid'ine tam genişlik `❤️ Favori Kelimelerim` kartı eklendi (7. kart, `col-span-full`).
- Kartın sağ köşesinde kaç favori olduğu gösteriliyor.
- Tıklanınca modal açılıyor: **📚 Flashcards** veya **🎓 Quiz** seçimi.
- Flashcard: tüm favoriler + zorluk sıralı. Quiz: en az 5 favori gerekli, ağırlıklı örnekleme.
- Favori yoksa hata mesajı gösteriliyor.

### 29. Kelime Etiketleme / Gruplama (Öneri B)
- `utils/wordTags.ts` eklendi: localStorage tabanlı `swb_tags_{userId}` = `{wordId: string[]}`.
- Kelime listesinde her kartta 🏷️ butonu eklendi.
- Tıklanınca inline etiket editörü açılıyor:
  - Mevcut etiketler chip olarak + `×` kaldırma butonu.
  - Hızlı ekleme: IELTS, TOEFL, Academic, Business, Chapter 1/2, Daily, Advanced.
  - Özel etiket: text input + Enter ile ekle.
- Etiketler her kart altında indigo chip olarak görünüyor.
- Liste başında yatay kaydırmalı **etiket filtresi** çubuğu: "Tümü" + kullanıcının oluşturduğu tüm etiketler.
- `filteredVocab` hesaplamasına `activeTagFilter` eklendi.

### 30. Günlük Hedef & Tarayıcı Bildirimleri (Öneri C)
- `utils/dailyGoal.ts` eklendi: `getDailyGoal`, `setDailyGoal`, `requestNotificationPermission`, `sendGoalNotification`.
- Kullanıcı menüsünden günlük hedef (1-20) ayarlanabiliyor; ilk ayarlamada bildirim izni isteniyor.
- Her aktivite kaydından sonra `checkDailyGoal()` çalışıyor:
  - Bugünkü aktivite sayısı hedefe ulaştığında: tarayıcı bildirimi (`Notification API`) gönderiliyor.
  - Uygulama açıksa 6 saniyelik animasyonlu "hedefe ulaştın" toast'u gösteriliyor.
- **İstatistikler** sayfasına günlük hedef progress bar eklendi: bugün/hedef + renk çubuğu.

---

## Güncellenen / Eklenen Dosyalar (4. Oturum)

| Dosya | İşlem |
|-------|-------|
| `utils/theme.ts` | YENİ — tema yönetimi |
| `utils/i18n.ts` | YENİ — TR/EN çeviriler |
| `utils/wordTags.ts` | YENİ — localStorage etiket sistemi |
| `utils/dailyGoal.ts` | YENİ — günlük hedef + bildirim |
| `components/UserMenu.tsx` | YENİ — kullanıcı dropdown menüsü |
| `index.html` | GÜNCELLENDİ — Tailwind dark config + dark mode CSS |
| `App.tsx` | GÜNCELLENDİ — tema/dil/hedef state, favori mod, etiketleme, UserMenu |
| `components/Statistics.tsx` | GÜNCELLENDİ — günlük hedef progress bar, lang/dailyGoal prop |

---

## Güncelleme — 2026-06-05 (2. Oturum)

### 15. Quiz Anlık Yükleme (Gemini → Yerel Üretim)
- **Sorun:** `generateQuiz` Gemini API'yi çağırıyordu → yavaş yükleme, ağ hatasında sonsuz "hazırlanıyor" spinner.
- **Çözüm:** Gemini çağrısı kaldırıldı, `generateLocalQuiz` fonksiyonu eklendi.
  - Kelime havuzundan 20 kelime rastgele seçilir.
  - Örnek cümle varsa cloze (boşluk doldurma) formatı kullanılır: `"The student was ______ about the results"`.
  - Yoksa `"[Türkçe anlam] anlamına gelen İngilizce kelime?"` sorusu oluşturulur.
  - 5 şık: 1 doğru + 4 rastgele yanlış kelime.
- `startQuiz` artık `async` değil; sorular state'e yazılıp quiz anında başlıyor.

### 16. İstatistikler Header'a Taşındı
- Seçim ızgarasındaki `📊 İstatistikler` kartı kaldırıldı (ızgara 7→6 kart).
- Header navigasyonuna 🏠 ile Yükle arasına `📊` ikon butonu eklendi (her zaman erişilebilir).
- `Statistics` bileşenine `onBack` prop'u ve "← Geri Dön" butonu eklendi.

### 17. Flashcards Mobil Responsive Düzeltmesi
- Kart yüksekliği: `h-[380px]` → `h-[430px]` / `sm:h-[450px]` → `sm:h-[500px]` (taşma eşiği yükseltildi).
- Ön yüz kelime boyutu: `text-4xl sm:text-6xl` → `text-3xl sm:text-5xl`; uzun kelimelerde `break-all` eklendi.
- Arka yüz padding: `p-6` → `p-4` (mobil).
- Arka yüz anlam: `text-3xl sm:text-5xl` → `text-2xl sm:text-4xl`.
- Arka yüz örnek cümle konteyneri: `p-4` → `p-3` / `space-y-4` → `space-y-2` (mobil).
- Örnek cümle metin boyutu: `text-lg sm:text-xl` → `text-sm sm:text-xl`.
- Sonuç: İçerik 430px karta sığıyor, mobilde scroll zorunluluğu ortadan kalktı.

### 18. Quiz Şık Metni Okunabilirlik Düzeltmesi
- Şık metni: `text-xs sm:text-lg` → `text-sm sm:text-lg`.
- Mobilde 12px olan metin 14px'e çıktı; özellikle uzun İngilizce kelimeler mobilde okunabilir hale geldi.

---

## Güncellenen Dosyalar (2. Oturum)

| Dosya | İşlem |
|-------|-------|
| `App.tsx` | GÜNCELLENDİ — yerel quiz, header 📊, stats kartı kaldırıldı |
| `components/Statistics.tsx` | GÜNCELLENDİ — onBack prop, geri dön butonu |
| `components/Flashcards.tsx` | GÜNCELLENDİ — responsive yükseklik ve font düzeltmeleri |
| `components/Quiz.tsx` | GÜNCELLENDİ — şık metin boyutu düzeltmesi |

---

## Güncellenen / Eklenen Dosyalar (3. Oturum)

| Dosya | İşlem |
|-------|-------|
| `utils/wordDifficulty.ts` | YENİ — localStorage spaced repetition |
| `utils/favorites.ts` | YENİ — localStorage favori sistemi |

---

## Güncelleme — 2026-06-05 (6. Oturum — Dark Mode Düzeltme, Supabase Senkron, Çeviriler, Header/Footer Akıllı Gizleme)

### 37. Dark Mode Ana Hata Düzeltildi (Kritik)
- **Root Cause:** `index.html` dark mode CSS'inde `bg-\[#fdfbf7\]` seçicisindeki `#` karakteri escape edilmemişti. Tarayıcı bunu CSS ID seçici olarak yorumluyordu, kural hiç çalışmıyordu.
- **Sonuç:** Uygulamanın ana arka planı (`#fdfbf7` krem rengi) dark modda değişmiyordu; bu yüzden `text-slate-800` üzerine uygulanan `#e2e8f0` (beyaz) override'ı krem arka plan üzerinde görünmez hale geliyordu.
- **Fix:** `bg-\[#fdfbf7\]` → `bg-\[\#fdfbf7\]` (doğru escape).
- **İkinci Fix:** `text-slate-300 { color: #334155 }` ve `text-slate-400 { color: #475569 }` override'ları kaldırıldı — bu koyu renkler dark bg üzerinde görünmez hale geliyordu. `text-slate-500` da `#94a3b8`'e yükseltildi.
- **Etkilenen ve düzelen alanlar:** Play Game başlığı, Global Kelime Havuzu başlığı, Quiz klavye ipucu, Flashcards flip ipucu, Quiz A/B/C/D/E şık etiketleri, WordWriting kelime türü etiketleri ve Harf Sil butonu, kelime listesindeki (NOUN) etiketleri.

### 38. İstatistikler Supabase Hata Yönetimi
- `user_activities` tablosu yoksa (code `42P01`) Statistics sayfasında **kullanıcıya görünen uyarı banner**'ı gösteriliyor.
- Banner içinde: SQL kurulum kodu görüntüleme butonu + 📋 panoya kopyala.
- `logActivity` fonksiyonu da tablonun olmadığını tespit edince kullanıcıya `setError` ile görünür hata mesajı gösteriyor.

### 39. Supabase Senkronizasyonu — Favoriler & Etiketler (Öneri B)
- `utils/favorites.ts`: `loadFavoritesFromDB` (login'de DB'den yükle + localStorage cache) ve `toggleFavoriteDB` (localStorage'a anında yaz, arkaplanda Supabase'e sync) eklendi.
- `utils/wordTags.ts`: `loadTagsFromDB` ve `setWordTagsDB` (aynı optimistic pattern) eklendi.
- `App.tsx`: login'de `loadFavoritesFromDB` / `loadTagsFromDB` çağrısı; toggle/add/remove operasyonları async DB versiyonlarını kullanıyor.
- Tablo yoksa localStorage'a fallback — uygulama her koşulda çalışıyor.
- **Gerekli SQL:** `supabase/schema.sql` dosyası oluşturuldu — Supabase SQL editöründe bir kez çalıştırılmalı.

### 40. En Zor Kelimeler Listesi (Öneri C) — İstatistikler
- `utils/wordDifficulty.ts`'e `getDifficultiesMap` eklendi.
- Statistics sayfasında "En Zor Kelimeler / Hardest Words" bölümü eklendi: spaced repetition puanı ≥ 4 olan kelimeler, yüksekten düşüğe sıralı, max 10, 🔥 ateş ikonu göstergesiyle.
- TR/EN desteği (sıfır veri durumu, başlık, altyazı).

### 41. TR/EN Çeviri — WordWriting (Öneri A)
- `lang?: 'tr' | 'en'` prop eklendi.
- Çevrilen metinler: `TÜRKÇE ANLAMI / TURKISH MEANING`, `Harf Sil / Delete`, `Cevabı Gör ✨ / Reveal ✨`, `Kampı Bitir ✨ / Finish Camp ✨`, `Sıradaki Kelime 🚀 / Next Word 🚀`, `Kapat ✖ / Close ✖`.
- Dark mode uyumluluğu: `text-slate-200` → `text-slate-300` (kullanılmış harf butonları) düzeltildi.

### 42. TR/EN Çeviri — GamesHub (Öneri A)
- `lang?: 'tr' | 'en'` prop eklendi; tüm alt oyunlara (`WordShooterGame`, `MatchGame`, `ClozeGame`) aktarılıyor.
- Merkezi `T = { tr, en }` objesi: menü başlıkları, oyun adları, açıklamalar, geri butonu, oyun içi etiketler (SKOR/SCORE, SORU/QUESTION), bitiş ekranı metinleri, hata metinleri.

### 43. Header & Footer Akıllı Gizleme (btw — Scroll + Aktivite Bazlı)
- **Aktivite girişinde otomatik gizleme:** `learning`, `quiz`, `writing`, `games`, `tutor` state'lerine girilince header ve footer kaybolur.
- **Scroll-based:** Aşağı kaydırma (> 80px) → gizle; yukarı kaydırma → göster.
- **Animasyon:** Header `transition-transform -translate-y-full` (yukarı kayar); footer `max-h-0 opacity-0` (aşağıya çekilir); her ikisi `duration-300 ease-in-out`.
- State değişiminde scroll pozisyonu ve görünürlük state sıfırlanıyor.

---

## Güncellenen Dosyalar (6. Oturum)

| Dosya | İşlem |
|-------|-------|
| `index.html` | GÜNCELLENDİ — dark mode CSS escape düzeltmesi, slate-300/400 override kaldırıldı |
| `utils/wordDifficulty.ts` | GÜNCELLENDİ — `getDifficultiesMap` eklendi |
| `utils/favorites.ts` | GÜNCELLENDİ — Supabase sync: `loadFavoritesFromDB`, `toggleFavoriteDB` |
| `utils/wordTags.ts` | GÜNCELLENDİ — Supabase sync: `loadTagsFromDB`, `setWordTagsDB` |
| `components/Statistics.tsx` | GÜNCELLENDİ — hata yönetimi, SQL kurulum banner, en zor kelimeler bölümü |
| `components/WordWriting.tsx` | GÜNCELLENDİ — `lang` prop, tam TR/EN çeviri |
| `components/GamesHub.tsx` | GÜNCELLENDİ — `lang` prop, tüm alt oyunlar tam TR/EN çeviri |
| `App.tsx` | GÜNCELLENDİ — header/footer akıllı gizleme, async favori/etiket, logActivity hata görünürlüğü |
| `supabase/schema.sql` | YENİ — tüm tablo tanımları ve RLS politikaları |

---

---

## Güncelleme — 2026-06-06 (7. Oturum — Quiz Düzeltme, Çeviriler, Footer Temizleme, Hesap Ayarları)

### 44. Quiz Popup Overflow Düzeltildi
- Soru kartı padding'i `p-6 sm:p-10 md:p-14` → `p-4 sm:p-8` olarak azaltıldı.
- Şık butonları daha kompakt: `p-3 sm:p-4 border-2 rounded-2xl`.
- Metin alanı overflow: `pr-10 sm:pr-20` (eskiden `pr-16 sm:pr-32`).
- Sonuç ekranı padding'i de azaltıldı; tüm içerik viewport'a sığıyor.
- "Sıradaki Soru" sabit bar nedeniyle `pb-24` ile son şık görünür hale getirildi.

### 45. Quiz Otomatik Seslendir (Amerikan İngilizcesi)
- 🔊 Sesli toggle butonu eklendi (Flashcards'taki gibi).
- Aktifken: her yeni soruya geçildiğinde soru metni Amerikan İngilizcesiyle 150ms gecikmeli okunuyor.
- Boşluk yerine "bla bla" okunuyor (eski davranışa dönüldü).

### 46. Quiz Boşluk Okuma "Blank" → "bla bla"
- `speakQuestion` ve auto-speak ikisi de `replace(/_+/g, 'bla bla')` kullanıyor.

### 47. Çeviri Güncellemeleri (TR)
- `flashcards`: 'Kelime Kartları', `flashcardsSub`: 'Hızlıca Kelime Öğren'
- `pool`: 'Kelime Bankası' (Global Kelime Havuzu kartı yeniden adlandırıldı)
- `tutor`: 'Kelime Antrenörü', `games`: 'Oyunlar'
- `writingSub`: 'Yazım Pratiği', `homeTitle`: 'Global Kelime Havuzu'
- EN: `flashcardsSub`: 'Learn Words Fast'

### 48. TutorView Metin Düzeltmeleri
- Başlık: "Auto Word Trainer" → "Kelime Antrenörü"
- Alt başlık: "Sana Özel Otomatik Eğitmen" → "Sana Özel Kelime Antrenörü"
- Not metninin font boyutu `text-[10px] sm:text-xs` → `text-xs sm:text-sm`

### 49. Flashcards Otomatik Seslendir → Amerikan İngilizcesi
- `speak(current.word, 'en-GB')` → `speak(current.word, 'en-US')`

### 50. Footer Temizlendi
- "Belki bir kahve ısmarlarsın" metni ve Buy me a coffee butonu footer'dan kaldırıldı.
- Footer'da yalnızca "DESIGNED BY SUAT TAYFUN TOPAK" küçük yazı kaldı.
- `max-h-0` yerine `opacity-0 pointer-events-none` kullanıldı → layout jump yok.

### 51. Scroll Jump Düzeltildi
- Scroll handler'a `currentY <= 10` koşulu eklendi: sayfanın en üstünde header her zaman görünür.

### 52. UserMenu — Hesap Ayarları (E-posta & Şifre Değiştirme)
- "🔑 Hesap Ayarları" toggle section eklendi.
- E-posta değiştirme: `supabase.auth.updateUser({ email })` — Supabase onay maili gönderir.
- Şifre değiştirme: `supabase.auth.updateUser({ password })` — min 6 karakter kontrolü.
- Başarı/hata mesajı inline gösteriliyor.

### 53. UserMenu — Coffee Butonu (Nefes Animasyonlu)
- Buy me a coffee butonu user menüye (çıkışın üstüne) taşındı.
- `animate-breathe` sınıfı: `@keyframes breathe` ile scale 1→1.04 + glow efekti, 2.5s döngü.
- index.html style bloğuna `@keyframes breathe` ve `.animate-breathe` CSS eklendi.

### 54. MatchGame Dark Mode Düzeltildi
- Açık kart: `dark:bg-slate-700 dark:border-slate-600` — görünür arka plan.
- Çevrilmiş kart: `dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-white` — beyaz metin.
- Kart font boyutu: `text-[10px] sm:text-sm` → `text-xs sm:text-base`

### 55. Statistics Supabase Schema Cache Hatası Düzeltildi
- Hata tespiti: `'schema cache'` ve `'could not find'` içeren mesajlar da `table_missing` olarak tanınıyor.
- 🔄 **Tekrar Dene** butonu eklendi — SQL çalıştırdıktan sonra sayfayı yenilemeden tekrar deneyebilirsiniz.

---

## Güncellenen Dosyalar (7. Oturum)

| Dosya | İşlem |
|-------|-------|
| `utils/i18n.ts` | GÜNCELLENDİ — 7 çeviri anahtarı güncellendi |
| `components/TutorView.tsx` | GÜNCELLENDİ — başlık, altyazı, not font boyutu |
| `App.tsx` | GÜNCELLENDİ — footer basitleştirildi, scroll jump fix |
| `components/UserMenu.tsx` | GÜNCELLENDİ — hesap ayarları, coffee butonu breathe animasyon |
| `components/Quiz.tsx` | GÜNCELLENDİ — kompakt layout, bla bla, auto-speak toggle |
| `components/Flashcards.tsx` | GÜNCELLENDİ — auto-speak varsayılan en-US |
| `components/GamesHub.tsx` | GÜNCELLENDİ — MatchGame dark mode kart metni |
| `components/Statistics.tsx` | GÜNCELLENDİ — schema cache hata tespiti + Tekrar Dene butonu |
| `index.html` | GÜNCELLENDİ — @keyframes breathe animasyonu |

---

---

## Güncelleme — 2026-06-06 (8. Oturum — Öneriler Hayata Geçirildi)

### 56. Ses Tercihi Kalıcılığı (Quiz + Flashcards)
- `Quiz.tsx`: `autoSpeak` state'i artık `localStorage.getItem('swb_quiz_autoSpeak')` ile başlatılıyor; toggle edilince kaydediliyor.
- `Flashcards.tsx`: `autoPronounce` aynı şekilde `swb_flash_autoSpeak` anahtarıyla kalıcı hale getirildi.
- Kullanıcı sesli modu bir kez açınca her girişte o tercih korunuyor.

### 57. Quiz Sonucu — "Yanlış Kelimeleri Flashcard'la Çalış"
- `Quiz.tsx`'e `onPracticeWrong?: (score, total, wrongWords) => void` prop eklendi.
- Sonuç ekranında yanlış kelime varsa turuncu "🔁 Yanlışları Flashcard'la Çalış" butonu görünüyor.
- `App.tsx`: `onPracticeWrong` callback'i — aktiviteyi loglar, zorluk skorlarını günceller, yanlış kelimeleri flashcard moduna besler.
- Akış: Quiz → Sonuç → Tek tuş → Yanlış kelimeler Flashcard'da.

### 58. İstatistikler — Görsel Kelime Zorluk Barları
- "En Zor Kelimeler" bölümü tamamen yenilendi.
- Her kelime için: sıra numarası, isim/anlam, yüzde göstergesi (score/5 × 100), gradyan yatay progress bar, 🔥 ikon skoru.
- Bar rengi skora göre: kırmızı (≥4), turuncu (≥3), sarı (daha az).
- Görsel hiyerarşi çok daha belirgin.

### 59. İstatistikler — Schema Cache Hata Ayrımı (Kritik Fix)
- `PGRST200` kodu ile mesaj içindeki `'schema cache'` / `'could not find'` ayrı tip olarak tanımlandı: `type: 'schema_cache'`.
- Schema cache hatasında farklı UI: 🔄 ikonu, açıklama metni, `NOTIFY pgrst, 'reload schema';` komutu tek satırda seçilebilir gösteriliyor.
- Gerçek tablo eksikliğinde (42P01): eski davranış — SQL banner, kopyala butonu.
- Her iki durumda da altta "🔄 Tekrar Dene" butonu var.

### 60. Kelime Seti Paylaşımı (Etiket Bazlı)
- Kelime listesinde bir etiket filtresi aktif olduğunda tag bar'a "📤 Paylaş" butonu eklendi.
- Tıklanınca filtrelenmiş kelime listesi (`"<TAG>" Kelime Listesi — Super Word Buddy\n\n1. word — anlam\n...`) panoya kopyalanıyor.
- TR/EN desteği. Kopyalama sonrası buton 2.5 saniye "✓ Kopyalandı!" gösteriyor.

### 61. Profil Fotoğrafı (Supabase Storage Avatar)
- `types.ts`'e `User.avatarUrl?: string` eklendi.
- `UserMenu.tsx`: `userId`, `avatarUrl`, `onAvatarChange?` prop'ları eklendi.
- Hesap Ayarları bölümüne "📷 Fotoğraf Yükle" dosya seçici eklendi.
- Yükleme: `supabase.storage.from('avatars').upload(userId/avatar.ext, file, {upsert:true})` → public URL → `updateUser({ data: { avatar_url } })`.
- Header butonu ve dropdown header: avatarUrl varsa `<img>` gösteriyor, yoksa harf fallback.
- `App.tsx`: `onAvatarChange` → `setCurrentUser({ ...prev, avatarUrl: url })` ile anlık güncelleme.
- **Not:** Supabase Dashboard'da `avatars` adlı public bucket oluşturulmalı.

### 62. Favoriler Kalıcılık Düzeltmesi (Kritik Fix)
- **Sorun:** DB insert'ler schema cache hatası nedeniyle sessizce başarısız oluyordu → sayfa yenilenince `loadFavoritesFromDB` boş DB döndürüyor → localStorage üzerine boş set yazıyordu → favoriler kayboluyor.
- **Fix:** `favorites.ts`'te `loadFavoritesFromDB` yeniden yazıldı:
  - DB veri döndürürse → DB kaynaklı: localStorage'ı güncelle, DB'yi döndür.
  - DB boş ama localStorage dolu → localStorage'ı DB'ye push et (`upsert ignoreDuplicates`), localStorage döndür.
  - DB hata verirse → localStorage'a fallback (önceki davranış).
- Sonuç: Schema cache stale olsa bile favoriler korunur; DB hazır olduğunda otomatik senkronize olur.

---

## Güncellenen Dosyalar (8. Oturum)

| Dosya | İşlem |
|-------|-------|
| `types.ts` | GÜNCELLENDİ — `User.avatarUrl?: string` eklendi |
| `utils/favorites.ts` | GÜNCELLENDİ — `loadFavoritesFromDB` merge/push mantığı, kalıcılık fix |
| `components/Flashcards.tsx` | GÜNCELLENDİ — autoPronounce localStorage kalıcılığı |
| `components/Quiz.tsx` | GÜNCELLENDİ — autoSpeak localStorage kalıcılığı, `onPracticeWrong` prop, "Tekrar Çalış" butonu |
| `components/Statistics.tsx` | GÜNCELLENDİ — schema_cache/table_missing ayrımı, görsel hardWords barları |
| `components/UserMenu.tsx` | GÜNCELLENDİ — avatar upload, `userId`/`avatarUrl`/`onAvatarChange` prop |
| `App.tsx` | GÜNCELLENDİ — avatarUrl state, `onPracticeWrong`, tag paylaşımı, UserMenu yeni proplar |

---

---

## Güncelleme — 2026-06-06 (9. Oturum — Schema Fix + Öğrenme Takvimi)

### 63. Schema.sql İdempotent Hale Getirildi (Kritik Fix)
- **Sorun:** `CREATE POLICY` politika zaten varsa `42710: policy already exists` hatası veriyordu.
- **Fix:** Her `CREATE POLICY` öncesine `DROP POLICY IF EXISTS "..." ON ...;` eklendi.
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` zaten idempotent — problem değildi.
- Son satıra `NOTIFY pgrst, 'reload schema';` eklendi — SQL çalıştırıldığında PostgREST önbelleği otomatik yenileniyor.
- Dosya artık istenen kadar yeniden çalıştırılabilir, hata vermez.

### 64. Öğrenme Takvimi — Haftalık Plan
- `utils/weeklySchedule.ts` oluşturuldu: `getWeeklySchedule`, `setWeeklySchedule`, `getTodayGoal`, `isRestDay`.
- localStorage `swb_weekly_{userId}` anahtarında `{ [dayIndex]: hedef }` formatında saklanıyor (0=Paz).
- Değer semantiği: `undefined` = global hedefe bağlı, `0` = dinlenme günü, `1-5` = o güne özgü hedef.
- **UserMenu — Haftalık Plan Bölümü:** "📅 Haftalık Plan" toggle section eklendi (Günlük Hedef altında).
  - 7 günlük grid: Paz, Pzt, Sal, Çar, Per, Cum, Cmt (TR/EN çevrili).
  - Her güne tıklayarak 0→1→2→3→4→5→0 döngüsüyle hedef ayarlanıyor.
  - `·` = global hedefe bağlı (ayarlanmamış), `💤` = dinlenme günü.
  - Bugün: indigo border ile vurgulanan; aktif günler: yeşil tonda.
- **App.tsx:** `getTodayGoal(userId, dailyGoalValue)` ile günlük hedef dinamik hesaplanıyor.
  - `checkDailyGoal`: haftalık plandan bugünün hedefini alıyor; dinlenme günü → bildirim gönderilmiyor.
  - Statistics prop: `dailyGoal={getTodayGoal(currentUser?.id || '', dailyGoalValue)}` — bugünün gerçek hedefini alıyor.
- **Statistics.tsx:** `dailyGoal === 0` (dinlenme günü) durumunda progress bar yerine "💤 Bugün dinlenme günü" metni gösteriliyor.

---

## Güncellenen Dosyalar (9. Oturum)

| Dosya | İşlem |
|-------|-------|
| `supabase/schema.sql` | GÜNCELLENDİ — `DROP POLICY IF EXISTS` + `NOTIFY pgrst` eklendi, tekrar çalıştırılabilir |
| `utils/weeklySchedule.ts` | YENİ — haftalık plan utility |
| `components/UserMenu.tsx` | GÜNCELLENDİ — Haftalık Plan bölümü |
| `App.tsx` | GÜNCELLENDİ — `getTodayGoal` entegrasyonu |
| `components/Statistics.tsx` | GÜNCELLENDİ — dinlenme günü UI |

---

---

## Güncelleme — 2026-06-06 (10. Oturum — Avatar Bucket, Kelime Analitik DB, Push Notification SW)

### 65. Avatar Bucket — Schema.sql'e Eklendi
- `storage.buckets` tablosuna `avatars` bucket'ı otomatik oluşturma SQL'i eklendi (`ON CONFLICT DO NOTHING` ile idempotent).
- Storage RLS politikaları eklendi: upload/select/update/delete — kullanıcı sadece kendi `userId/` klasörüne erişebiliyor.
- Artık Supabase Dashboard'a gitmeye gerek yok — `schema.sql` çalıştırınca bucket da oluşuyor.

### 66. Kelime Bazlı DB Analitik (Quiz word-level analytics)
- `user_word_stats` tablosu eklendi: `(user_id, word_id)` primary key, `correct` / `wrong` sayaçları.
- `upsert_word_stat(p_user_id, p_word_id, p_correct, p_wrong)` PostgreSQL fonksiyonu: atomik increment ile `INSERT ... ON CONFLICT DO UPDATE`.
- `utils/wordStats.ts` oluşturuldu: `logWordResults` (quiz bitişinde toplu upsert) ve `loadWordStats` fonksiyonları.
- `App.tsx`: Quiz `onClose` ve `onPracticeWrong` callback'lerinde her soru için kelime sonuçları DB'ye gönderiliyor.
- `Statistics.tsx`: "📊 DB Kelime Analizi" yeni bölümü — en çok yanlış yapılan kelimeler, yanlış oranı, doğru/yanlış sayısı gösteriliyor. Tüm cihazlarda birikmiş veri.

### 67. Push Notification — Service Worker Notification Click
- `vite.config.ts`: `generateSW` → `injectManifest` stratejisine geçildi (SW kaynağı özelleştirilebilir hale geldi).
- `sw.ts` oluşturuldu: workbox precache + runtime caching (tailwind CDN, flagcdn, Google Fonts) + `notificationclick` event handler.
  - Tıklama: açık pencereyi focus'lar + `postMessage({ type: 'NOTIFICATION_CLICK', action })` gönderir.
  - Pencere yoksa `clients.openWindow('/')` ile uygulamayı açar.
- `utils/dailyGoal.ts` yeniden yazıldı:
  - `showNotificationViaSW`: SW `reg.showNotification()` kullanıyor (actions + vibrate + badge desteği).
  - `sendGoalNotification`: async, vibrate `[200,100,200]`, badge, `actions: [{action:'stats', title:'📊 ...'}]`.
  - `sendStreakNotification`: yeni — 3/7/14/30/60/100 günlük seri milestone'larında tetikleniyor.
- `App.tsx`:
  - `checkDailyGoal`: await eklenidi; hedef tamamlanınca streak hesaplanıyor, milestone'da `sendStreakNotification` tetikleniyor.
  - SW message listener eklendi: `NOTIFICATION_CLICK` mesajında uygulama `'stats'` state'ine geçiyor.

---

## Güncellenen Dosyalar (10. Oturum)

| Dosya | İşlem |
|-------|-------|
| `supabase/schema.sql` | GÜNCELLENDİ — `user_word_stats` tablosu, `upsert_word_stat` fonksiyonu, avatar bucket + policies |
| `utils/wordStats.ts` | YENİ — `logWordResults`, `loadWordStats` |
| `sw.ts` | YENİ — custom service worker (precache + runtimeCache + notificationclick) |
| `vite.config.ts` | GÜNCELLENDİ — `injectManifest` stratejisi |
| `utils/dailyGoal.ts` | GÜNCELLENDİ — SW notification, streak milestone bildirim |
| `App.tsx` | GÜNCELLENDİ — logWordResults, streak check, SW message listener |
| `components/Statistics.tsx` | GÜNCELLENDİ — DB kelime analizi bölümü |

---

---

## Güncelleme — 2026-06-06 (11. Oturum — Statistics TR Düzeltmeleri + Favoriler Çapraz Cihaz Senkron Fix)

### 68. Statistics TR Metin Düzeltmeleri
- `globalPool`: 'Global Havuz Durumu' → **'Global Kelime Havuzu'**
- `subtitle`: 'Senin Başarı Panelin' → **kaldırıldı** (render'da `{t.subtitle && ...}` ile koşullu)
- `quizWriting`: 'Quiz + Yazma' → **'Sınav & Yazma'**
- `flashcards`: 'Flashcard Görüntüleme' → **'Kelime Kartı Çalışması'**
- `quizRate`: 'Test Başarı Oranı' → **'Sınav Başarı Oranı'**
- `hardWordsSub`: 'Spaced repetition — hata sayısına göre sıralı' → **'Aralıklı tekrar — hata puanına göre sıralı'**
- `hardWordsNone`: '...quiz ve yazma alıştırmaları...' → **'...sınav ve yazma egzersizleri...'**

### 69. Favoriler Çapraz Cihaz Senkron Hatası Düzeltildi (Kritik)
- **Sorun:** Mobilde 16 favori, masaüstünde 3 görünüyordu. DB'de 3 kayıt varken `loadFavoritesFromDB` DB'yi kayıtsız şartsız kaynak olarak alıyor, local 16'yı 3 ile eziyordu.
- **Root cause:** `if (dbIds.size > 0) → localStorage = dbIds` — local fazlalıklar kayboluyordu.
- **Fix:** DB + local **merge (union)** mantığına geçildi:
  - `merged = union(dbIds, localIds)` — iki tarafın tamamı korunuyor.
  - DB'de olmayan local kayıtlar (extras) `upsert ignoreDuplicates` ile DB'ye push ediliyor.
  - Sonuç: bir cihazda 16 favori eklenirse, diğer cihazlar da 16 görür; hiçbir kayıt kaybolmaz.

---

## Güncellenen Dosyalar (11. Oturum)

| Dosya | İşlem |
|-------|-------|
| `components/Statistics.tsx` | GÜNCELLENDİ — TR metin düzeltmeleri, subtitle kaldırıldı |
| `utils/favorites.ts` | GÜNCELLENDİ — DB+local merge, recovery push ile çapraz cihaz senkron |

---

## Önerilen Sonraki Adımlar

1. **schema.sql yeniden çalıştır:** Avatar bucket ve `user_word_stats` tablosu için güncellenmiş `schema.sql`'i Supabase SQL Editörü'nde çalıştır.
2. **Progress export:** İstatistikleri CSV olarak dışa aktarma butonu.
3. **Writing word stats:** Yazma alıştırmalarında da `logWordResults` çağrısı eklenerek kelime analizi genişletilir.
| `public/icons/icon-192.png` | YENİ — PWA ikonu |
| `public/icons/icon-512.png` | YENİ — PWA ikonu |
| `public/icons/apple-touch-icon.png` | YENİ — iOS ikonu |
| `vite.config.ts` | GÜNCELLENDİ — VitePWA plugin |
| `index.html` | GÜNCELLENDİ — PWA meta etiketleri |
| `App.tsx` | GÜNCELLENDİ — session kalıcılığı, favoriler, difficulty, liste filtreleme |
| `components/Quiz.tsx` | GÜNCELLENDİ — yanlış kelime takibi, sonuç ekranı |
| `components/Statistics.tsx` | GÜNCELLENDİ — streak, günlük sayaç, genel başarı |
