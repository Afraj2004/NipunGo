const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini with your API Key
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Use Gemini 3 Flash for the best balance of speed and "Quick Commerce" feel
const model = genAI.getGenerativeModel({ 
  model: "gemini-3-flash",
  systemInstruction: `You are the NipunGo Home Expert. 
  1. Diagnose user problems (e.g., if a pipe is leaking, you need a Plumber).
  2. You must identify: Service Type, Severity, and Urgency.
  3. If you have enough info, respond with a JSON block at the end: {"action": "BOOKING_SUGGESTION", "service": "Plumber", "price": 499}.
  4. Always speak in a mix of Hindi and English (Hinglish) to keep it friendly.`
});

module.exports = model;