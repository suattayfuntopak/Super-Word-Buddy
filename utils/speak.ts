
export const speak = (text: string, lang: 'en-GB' | 'en-US'): void => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  const preferredVoice =
    voices.find(v => {
      const matchesLang = v.lang.includes(lang);
      if (lang === 'en-GB') {
        return matchesLang && (v.name.includes('Male') || v.name.includes('George') || v.name.includes('Arthur'));
      }
      return matchesLang && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Susan'));
    }) || voices.find(v => v.lang.includes(lang));

  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.lang = lang;
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
};
