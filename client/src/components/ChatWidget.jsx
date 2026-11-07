import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';
import {
  CHAT_EXPIRY_MINUTES,
  GREETING,
  isExpired,
  loadChat,
  saveChat,
  clearChat,
  buildChatPayload,
} from '../utils/chatStorage';

const EXPIRED_NOTICE =
  'Inactivity ki wajah se pichli chat expire ho gayi. Nayi chat shuru karo. 🙂';

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

// Floating Nipun AI chat. Mounted once at app level, so the conversation
// stays alive while the customer moves between pages.
function ChatWidget() {
  const navigate = useNavigate();
  const location = useLocation();

  // Re-render on login/logout even when the route doesn't change
  const [, setAuthTick] = useState(0);
  useEffect(() => {
    const bump = () => setAuthTick((t) => t + 1);
    window.addEventListener('authchange', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('authchange', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  // Re-read on every render; the router re-renders us on each navigation
  const user = readUser();
  const userId = user?.id;
  const isCustomer = !!userId && user.role !== 'worker' && user.role !== 'admin';
  const onAuthPage = ['/login', '/register'].includes(location.pathname);
  const visible = isCustomer && !onAuthPage;

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([GREETING]);
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const lastActiveRef = useRef(null); // null = no conversation yet
  const endRef = useRef(null);

  // Load this user's saved chat (or start fresh) whenever the user changes
  useEffect(() => {
    if (!isCustomer) {
      lastActiveRef.current = null;
      setMessages([GREETING]);
      setSuggestion(null);
      setNotice('');
      setIsOpen(false);
      return;
    }
    const { chat, expired } = loadChat(userId);
    lastActiveRef.current = chat?.lastActive || null;
    setMessages(chat?.messages || [GREETING]);
    setSuggestion(chat?.suggestion || null);
    setNotice(expired ? EXPIRED_NOTICE : '');
  }, [userId, isCustomer]);

  // Persist after every change once the conversation has started
  useEffect(() => {
    if (isCustomer && lastActiveRef.current) {
      saveChat(userId, {
        messages,
        suggestion,
        lastActive: lastActiveRef.current,
      });
    }
  }, [messages, suggestion, userId, isCustomer]);

  // Wipe the conversation if the inactivity window has passed.
  // Returns true when it expired.
  const expireIfNeeded = useCallback(() => {
    if (!isCustomer || !lastActiveRef.current) return false;
    if (!isExpired(lastActiveRef.current)) return false;
    clearChat(userId);
    lastActiveRef.current = null;
    setMessages([GREETING]);
    setSuggestion(null);
    setNotice(EXPIRED_NOTICE);
    return true;
  }, [userId, isCustomer]);

  // Check regularly, and whenever the tab becomes active again
  useEffect(() => {
    const timer = setInterval(expireIfNeeded, 15000);
    window.addEventListener('focus', expireIfNeeded);
    document.addEventListener('visibilitychange', expireIfNeeded);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', expireIfNeeded);
      document.removeEventListener('visibilitychange', expireIfNeeded);
    };
  }, [expireIfNeeded]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen, notice]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Timed out while the user was away: reset and let them start again.
    // Their typed text stays in the box.
    if (expireIfNeeded()) return;

    const { message, history } = buildChatPayload(messages, text);

    setNotice('');
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    lastActiveRef.current = Date.now();
    setIsLoading(true);

    try {
      const res = await axios.post(
        '/chat/message',
        { message, history },
        { timeout: 60000 }
      );
      setMessages((prev) => [...prev, { role: 'bot', text: res.data.reply }]);
      if (res.data.suggestion) setSuggestion(res.data.suggestion);
      lastActiveRef.current = Date.now();
    } catch (err) {
      console.error('AI Chat Error:', err);
      const sessionOver = err.response?.status === 401;
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          isError: true,
          text: sessionOver
            ? 'Aapka session expire ho gaya hai. Please dobara login karo.'
            : 'Nipun AI abhi available nahi hai. Thodi der baad dobara try karo. 🙏',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white w-[24rem] sm:w-[30rem] lg:w-[36rem] max-w-[calc(100vw-2rem)] h-[34rem] lg:h-[42rem] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden border border-gray-200"
          >
            <div className="bg-primary p-5 text-white font-bold text-lg flex justify-between items-center">
              <span>Nipun AI Expert 🤖</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xl px-2"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 rounded-2xl max-w-[88%] shadow-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-white self-end'
                      : 'bg-gray-100 self-start text-gray-800'
                  }`}
                >
                  {/* Hide the raw JSON / code fence from the user */}
                  <p className="text-base lg:text-lg leading-relaxed whitespace-pre-wrap">
                    {m.text.split(/```|\{/)[0].trim()}
                  </p>
                </div>
              ))}

              {suggestion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 p-3 rounded-xl mt-2"
                >
                  <p className="text-sm text-green-700 font-bold mb-2">
                    ✨ Nipun AI Recommendation:
                  </p>
                  <button
                    onClick={() => {
                      const { service } = suggestion;
                      setSuggestion(null);
                      setIsOpen(false);
                      navigate(`/booking/${encodeURIComponent(service)}`);
                    }}
                    className="w-full bg-green-500 text-white py-3 rounded-lg text-sm font-bold shadow-md hover:bg-green-600 transition"
                  >
                    Book {suggestion.service} now (₹{suggestion.price})
                  </button>
                </motion.div>
              )}

              {isLoading && (
                <div className="text-sm text-gray-400 animate-pulse">
                  Nipun AI is thinking...
                </div>
              )}

              {notice && (
                <div className="text-sm text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  {notice}
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  maxLength={500}
                  className="flex-1 border rounded-xl px-4 py-3 text-base outline-none focus:border-primary"
                  placeholder="Describe your problem..."
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="bg-primary text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-60"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Chat {CHAT_EXPIRY_MINUTES} min inactivity ke baad expire ho jaati hai.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          expireIfNeeded();
          setIsOpen((o) => !o);
        }}
        className="bg-secondary w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition"
        aria-label="Open Nipun AI chat"
      >
        💬
      </button>
    </div>
  );
}

export default ChatWidget;
