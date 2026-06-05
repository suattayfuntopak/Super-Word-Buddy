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
