
export type Accent = 'en-GB' | 'en-US';

const ACCENT_KEY = 'swb_accent';

export const getAccent = (): Accent =>
  (localStorage.getItem(ACCENT_KEY) as Accent) ?? 'en-US';

export const setAccent = (accent: Accent): void =>
  localStorage.setItem(ACCENT_KEY, accent);

export const speak = (text: string, lang?: Accent): void => {
  const accent = lang ?? getAccent();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  const preferredVoice =
    voices.find(v => {
      const matchesLang = v.lang.includes(accent);
      if (accent === 'en-GB') {
        return matchesLang && (v.name.includes('Male') || v.name.includes('George') || v.name.includes('Arthur'));
      }
      return matchesLang && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Susan'));
    }) || voices.find(v => v.lang.includes(accent));

  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.lang = accent;
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
};
