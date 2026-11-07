const { GoogleGenAI } = require('@google/genai');
const { SERVICE_PRICES } = require('./services');

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

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
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Gemini sometimes answers 429/503 under load — those are worth retrying
const isRetryable = (err) => {
  const code = err.status || err.code;
  return code === 429 || code === 500 || code === 503 || /UNAVAILABLE|high demand|fetch failed|ECONNRESET|ETIMEDOUT/i.test(err.message);
};

// history: [{ role: 'user' | 'model', parts: [{ text }] }]
const sendChatMessage = async (message, history = []) => {
  const MAX_ATTEMPTS = 4;
  for (let attempt = 1; ; attempt++) {
    try {
      const chat = getClient().chats.create({
        model: MODEL,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
        history,
      });
      const response = await chat.sendMessage({ message });
      return response.text;
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS || !isRetryable(err)) throw err;
      await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s, 4s
    }
  }
};

module.exports = { sendChatMessage };
