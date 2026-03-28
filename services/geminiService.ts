
import { GoogleGenAI, Type } from "@google/genai";
import { VocabularyItem, QuizQuestion, TutorMaterial } from "../types";

const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const cleanJsonResponse = (text: string): string => {
  if (!text) return "[]";
  let cleaned = text.replace(/```json\s?|```/g, "").trim();
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx === -1 && cleaned.indexOf('{') !== -1) {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  } else if (startIdx !== -1 && endIdx !== -1) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return cleaned;
};

export const analyzeVocabulary = async (base64Data: string, mimeType: string): Promise<VocabularyItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Sen bir akademik İngilizce uzmanısın. Dokümanı analiz et ve 40-50 akademik kelime seç.
    KRİTİK: meaning KESİNLİKLE TÜRKÇE olsun.
    Yanıtı JSON ARRAY formatında döndür.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              meaning: { type: Type.STRING },
              wordTypeEn: { type: Type.STRING },
              wordTypeTr: { type: Type.STRING },
              exampleSentence: { type: Type.STRING },
              exampleSentenceTurkish: { type: Type.STRING }
            },
            required: ["word", "meaning", "wordTypeEn", "wordTypeTr", "exampleSentence", "exampleSentenceTurkish"]
          }
        }
      }
    });

    const text = response.text;
    const cleanText = cleanJsonResponse(text);
    return JSON.parse(cleanText) as VocabularyItem[];
  } catch (error) {
    console.error("Gemini Analiz Hatası:", error);
    throw new Error("Analiz sırasında teknik bir sorun oluştu.");
  }
};

export const generateQuiz = async (words: VocabularyItem[]): Promise<QuizQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const basketSubset = [...words].sort(() => Math.random() - 0.5).slice(0, 20);
  
  const prompt = `Sen bir İngilizce öğretmenisin. Aşağıdaki kelimelerden 10 soruluk bir test hazırla. 
  SORU SEVİYESİ: Soruların zorluk derecesi A2 ile B2 seviyeleri arasında dengeli ve KARIŞIK olmalı (bazıları A2, bazıları B1, bazıları B2).
  ŞIKLAR: Her soru için 5 şık (A, B, C, D, E) hazırla. Yanlış şıkları da listeden veya benzer akademik seviyedeki kelimelerden seç.
  JSON formatında döndür: ${JSON.stringify(basketSubset)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    wordTypeEn: { type: Type.STRING },
                    wordTypeTr: { type: Type.STRING }
                  }
                }, 
                minItems: 5, 
                maxItems: 5 
              },
              correctAnswer: { type: Type.STRING },
              word: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "word"]
          }
        }
      }
    });
    
    const cleanText = cleanJsonResponse(response.text || "[]");
    const questions: QuizQuestion[] = JSON.parse(cleanText);
    
    return questions.map(q => ({
      ...q,
      options: shuffle(q.options)
    }));
  } catch (error) {
    console.error("Quiz üretim hatası:", error);
    return [];
  }
};

export const generateTutorMaterial = async (base64Data: string, mimeType: string): Promise<TutorMaterial> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Sen bir akademik İngilizce öğretmenisin. Ekteki dokümanı analiz et.
    HIZLI ve ETKİLİ bir çalışma materyali hazırla:
    1. "summary": Dokümanın ana konusunun özeti (Türkçe).
    2. "keyVocabulary": En önemli 10 kelime (anlam, eş anlamlı, zıt anlamlı).
    3. "questions": 5 adet çoktan seçmeli soru ve açıklaması.
    
    Sadece JSON döndür.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyVocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  synonym: { type: Type.STRING },
                  antonym: { type: Type.STRING }
                }
              }
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const cleanText = cleanJsonResponse(response.text || "{}");
    return JSON.parse(cleanText) as TutorMaterial;
  } catch (error) {
    console.error("Tutor Analiz Hatası:", error);
    throw new Error("Ders materyali işlenirken bir sorun oluştu.");
  }
};
