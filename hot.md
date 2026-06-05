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
| `public/icons/icon-192.png` | YENİ — PWA ikonu |
| `public/icons/icon-512.png` | YENİ — PWA ikonu |
| `public/icons/apple-touch-icon.png` | YENİ — iOS ikonu |
| `vite.config.ts` | GÜNCELLENDİ — VitePWA plugin |
| `index.html` | GÜNCELLENDİ — PWA meta etiketleri |
| `App.tsx` | GÜNCELLENDİ — session kalıcılığı, favoriler, difficulty, liste filtreleme |
| `components/Quiz.tsx` | GÜNCELLENDİ — yanlış kelime takibi, sonuç ekranı |
| `components/Statistics.tsx` | GÜNCELLENDİ — streak, günlük sayaç, genel başarı |
