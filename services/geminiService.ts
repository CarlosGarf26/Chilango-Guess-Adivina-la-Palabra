import { GoogleGenAI, Type } from "@google/genai";
import { WordCard } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchChilangoWords = async (): Promise<WordCard[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera una lista de 20 palabras o frases coloquiales populares de la Ciudad de México (slang chilango/mexicano). 
      
      Deben ser palabras divertidas para un juego de adivinanzas (tipo Charades/Heads Up).
      Incluye palabras como "Chale", "Cámara", "Sepa la bola", "Guajolota", etc.
      
      Devuelve un JSON con el campo 'word' (la palabra) y 'meaning' (una breve explicación o contexto de uso para mostrar al final).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: {
                type: Type.STRING,
                description: "La palabra o frase de jerga mexicana.",
              },
              meaning: {
                type: Type.STRING,
                description: "Significado breve o contexto divertido.",
              },
            },
            required: ["word", "meaning"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as WordCard[];
    }
    return getFallbackWords();
  } catch (error) {
    console.error("Error fetching words from Gemini:", error);
    return getFallbackWords();
  }
};

// Fallback in case API fails or key is missing
const getFallbackWords = (): WordCard[] => [
  { word: "Chale", meaning: "Expresión de decepción o sorpresa." },
  { word: "Cámara", meaning: "Aceptación, despedida o advertencia." },
  { word: "Guajolota", meaning: "Torta de tamal." },
  { word: "Caer el veinte", meaning: "Entender algo de repente." },
  { word: "Hacerse pato", meaning: "Ignorar algo o perder el tiempo." },
  { word: "Aguas", meaning: "¡Cuidado!" },
  { word: "Sepa la bola", meaning: "Nadie sabe." },
  { word: "Fresa", meaning: "Persona presumida o de clase alta." },
  { word: "Godínez", meaning: "Oficinista tradicional." },
  { word: "Chamba", meaning: "Trabajo." }
];