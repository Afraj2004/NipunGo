const { GoogleGenAI } = require('@google/genai');
const { SERVICE_PRICES } = require('./services');

// Tried in order; a model that is overloaded, slow or retired falls through to the next.
// GEMINI_MODEL (env) overrides the first choice.
const MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
].filter(Boolean);
const ATTEMPT_TIMEOUT_MS = 15000;

const SERVICES = Object.keys(SERVICE_PRICES).join(', ');

const SYSTEM_INSTRUCTION = `You are the NipunGo Home Expert.
1. Diagnose user problems (e.g., if a pipe is leaking, you need a Plumber).
2. You must identify: Service Type, Severity, and Urgency.
3. The ONLY services NipunGo offers are: ${SERVICES}. Never suggest anything else.
4. As soon as you know which service is needed, keep your reply short and end with exactly one JSON block: {"action": "BOOKING_SUGGESTION", "service": "<one service name from the list above, spelled exactly>"}. Do not mention prices; the app shows them.
5. Ask at most one short clarifying question if the problem is unclear; otherwise suggest the booking right away.
6. Always speak in a mix of Hindi and English (Hinglish) to keep it friendly. Keep replies brief.`;

let client = null;

// Created lazily so the server still boots when GEMINI_API_KEY is missing
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      // Fail a stuck attempt quickly so retries (or the error message) arrive in time
      httpOptions: { timeout: ATTEMPT_TIMEOUT_MS },
    });
  }
  return client;
};

// history: [{ role: 'user' | 'model', parts: [{ text }] }]
const sendChatMessage = async (message, history = []) => {
  const ai = getClient(); // throws if GEMINI_API_KEY is missing
  let lastError;

  for (const model of [...new Set(MODELS)]) {
    try {
      const chat = ai.chats.create({
        model,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
        history,
      });
      const response = await chat.sendMessage({ message });
      return response.text;
    } catch (err) {
      lastError = err;
      console.warn(`Gemini ${model} failed: ${String(err.message).slice(0, 120)}`);
    }
  }
  throw lastError;
};

module.exports = { sendChatMessage };
