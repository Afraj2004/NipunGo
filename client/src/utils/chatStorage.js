// Persistence + expiry rules for the Nipun AI chat.
// A chat belongs to one logged-in user and is kept in localStorage so it
// survives page navigation and reloads. After CHAT_EXPIRY_MS without any
// activity the chat is deleted and the user starts a fresh one.

import { TILES } from '../data/chatKnowledge';

export const CHAT_EXPIRY_MINUTES =
  Number(process.env.REACT_APP_CHAT_EXPIRY_MINUTES) || 30;
export const CHAT_EXPIRY_MS = CHAT_EXPIRY_MINUTES * 60 * 1000;

export const GREETING = {
  role: 'bot',
  text: 'Namaste! Main Nipun AI hoon. 🙏\nAapki ghar ki kya samasya hai? Neeche se chuno ya mujhe likh kar batao.',
  options: TILES,
};

const PREFIX = 'nipungo_chat_';
const MAX_HISTORY_TURNS = 10;
const MAX_CHARS_PER_TURN = 600;

export const storageKey = (userId) => `${PREFIX}${userId}`;

export const isExpired = (lastActive, now = Date.now(), expiryMs = CHAT_EXPIRY_MS) =>
  !lastActive || now - lastActive > expiryMs;

// Returns { chat, expired }.
//  chat    - { messages, flow, lastActive } or null
//  expired - true when a stored chat was found but had timed out (and was deleted)
export const loadChat = (userId, now = Date.now()) => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { chat: null, expired: false };

    const chat = JSON.parse(raw);
    if (!chat || !Array.isArray(chat.messages) || !chat.messages.length) {
      localStorage.removeItem(storageKey(userId));
      return { chat: null, expired: false };
    }
    if (isExpired(chat.lastActive, now)) {
      localStorage.removeItem(storageKey(userId));
      return { chat: null, expired: true };
    }
    return { chat, expired: false };
  } catch {
    return { chat: null, expired: false };
  }
};

export const saveChat = (userId, chat) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(chat));
  } catch {
    // storage full / unavailable - chat just won't persist
  }
};

export const clearChat = (userId) => {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
};

// Used on logout so the next person on this browser never sees the chat
export const clearAllChats = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};

// Turn the visible messages into what Gemini accepts:
//  - skip our own error bubbles and the booking-form conversation
//  - strictly alternate user/model, starting with a user turn
//  - keep only the most recent turns, each trimmed
// If the last stored turn is an unanswered user message (e.g. the request
// failed), it is folded into the new message instead of breaking alternation.
export const buildChatPayload = (messages, newText) => {
  const turns = [];
  for (const m of messages) {
    if (m.isError || m.isFlow) continue;
    const text = String(m.text || '').slice(0, MAX_CHARS_PER_TURN).trim();
    if (!text) continue;
    const role = m.role === 'user' ? 'user' : 'model';
    const last = turns[turns.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n${text}`;
    } else {
      turns.push({ role, parts: [{ text }] });
    }
  }

  let message = newText;
  if (turns.length && turns[turns.length - 1].role === 'user') {
    message = `${turns.pop().parts[0].text}\n${newText}`;
  }

  const history = turns.slice(-MAX_HISTORY_TURNS);
  while (history.length && history[0].role !== 'user') history.shift();

  return { message, history };
};
