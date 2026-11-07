const { GoogleGenAI } = require('@google/genai');

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

const SYSTEM_INSTRUCTION = `You are the NipunGo Home Expert.
1. Diagnose user problems (e.g., if a pipe is leaking, you need a Plumber).
2. You must identify: Service Type, Severity, and Urgency.
3. If you have enough info, respond with a JSON block at the end: {"action": "BOOKING_SUGGESTION", "service": "Plumber", "price": 499}.
4. Always speak in a mix of Hindi and English (Hinglish) to keep it friendly.`;

let client = null;

// Created lazily so the server still boots when GEMINI_API_KEY is missing
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

// history: [{ role: 'user' | 'model', parts: [{ text }] }]
const sendChatMessage = async (message, history = []) => {
  const chat = getClient().chats.create({
    model: MODEL,
    config: { systemInstruction: SYSTEM_INSTRUCTION },
    history,
  });
  const response = await chat.sendMessage({ message });
  return response.text;
};

module.exports = { sendChatMessage };
