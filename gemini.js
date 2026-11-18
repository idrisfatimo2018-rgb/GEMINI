import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.6-flash";

function isUnavailableError(error) {
  if (!(error instanceof Error)) return false;

  try {
    const response = JSON.parse(error.message);
    return (
      response?.error?.code === 503 ||
      response?.error?.status === "UNAVAILABLE"
    );
  } catch (parseError) {
    if (!(parseError instanceof SyntaxError)) throw parseError;
    return false;
  }
}

async function askModel(client, model, prompt, history) {
  const chat = client.chats.create({
    model,
    history: history.map(({ role, text }) => ({
      role: role === "user" ? "user" : "model",
      parts: [{ text }],
    })),
    config: { temperature: 0.7 },
  });
  const response = await chat.sendMessage({ message: prompt });
  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response. Please try again.");
  }
  return text;
}

export async function sendToGemini(prompt, history = []) {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_GEMINI_API_KEY. Add it to the .env file and restart Expo."
    );
  }

  const client = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 45000,
      retryOptions: { attempts: 1 },
    },
  });

  try {
    return await askModel(client, MODEL, prompt, history);
  } catch (error) {
    if (!isUnavailableError(error)) throw error;
    return askModel(client, FALLBACK_MODEL, prompt, history);
  }
}