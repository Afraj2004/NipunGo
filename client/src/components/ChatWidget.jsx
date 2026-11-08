import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';
import RichText from './RichText';
import {
  CHAT_EXPIRY_MINUTES,
  GREETING,
  isExpired,
  loadChat,
  saveChat,
  clearChat,
  buildChatPayload,
} from '../utils/chatStorage';
import { startBooking, stepFlow, isYes } from '../utils/chatFlow';
import {
  TILES,
  MENU_OPTION,
  bookOption,
  getIntent,
  matchIntent,
  replyFor,
  shouldUseKnowledgeBase,
  totalPrice,
} from '../data/chatKnowledge';

const EXPIRED_NOTICE =
  'Inactivity ki wajah se pichli chat expire ho gayi. Nayi chat shuru karo. 🙂';

const MENU_MESSAGE = {
  role: 'bot',
  text: 'Kis cheez mein madad chahiye? Neeche se chuno ya likh kar batao.',
  options: TILES,
};

const LOGIN_OPTION = { label: '🔐 Login karo', action: 'navigate', value: '/login' };

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const flowTag = (m) => ({ ...m, isFlow: true });

// Quick-reply buttons under the latest bot message
function Options({ options, disabled, onPick }) {
  const isTileGrid = options.length > 6 && options[0].action === 'tile';
  return (
    <div className={isTileGrid ? 'grid grid-cols-2 gap-2 mt-3' : 'flex flex-wrap gap-2 mt-3'}>
      {options.map((o, i) => (
        <button
          key={`${o.label}-${i}`}
          type="button"
          disabled={disabled}
          onClick={() => onPick(o)}
          className={`rounded-xl border border-primary/30 bg-white text-primary font-medium
            px-3 py-2 text-sm lg:text-base shadow-sm hover:bg-primary hover:text-white transition
            disabled:opacity-50 ${isTileGrid ? 'text-left' : 'text-center'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Floating Nipun AI chat. Mounted once at app level, so it is on every page and
// the conversation stays alive while the user moves between pages.
function ChatWidget() {
  const navigate = useNavigate();
  useLocation(); // re-render on every navigation so we pick up login state

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

  const user = readUser();
  const userId = user?.id;
  const isCustomer = !!userId && user.role !== 'worker' && user.role !== 'admin';
  const storageId = userId || 'guest';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([GREETING]);
  const [flow, setFlow] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [fabHidden, setFabHidden] = useState(false);

  const lastActiveRef = useRef(null); // null = no conversation yet
  const endRef = useRef(null);

  const resetConversation = useCallback((withNotice = '') => {
    lastActiveRef.current = null;
    setMessages([GREETING]);
    setFlow(null);
    setNotice(withNotice);
  }, []);

  // Load this user's saved chat (or start fresh) whenever the user changes
  useEffect(() => {
    const { chat, expired } = loadChat(storageId);
    lastActiveRef.current = chat?.lastActive || null;
    setMessages(chat?.messages || [GREETING]);
    setFlow(chat?.flow && chat.flow.step !== 'submitting' ? chat.flow : null);
    setNotice(expired ? EXPIRED_NOTICE : '');
    setIsLoading(false);
  }, [storageId]);

  // Persist after every change once the conversation has started
  useEffect(() => {
    if (lastActiveRef.current) {
      saveChat(storageId, { messages, flow, lastActive: lastActiveRef.current });
    }
  }, [messages, flow, storageId]);

  // Wipe the conversation if the inactivity window has passed.
  // Returns true when it expired.
  const expireIfNeeded = useCallback(() => {
    if (!lastActiveRef.current || !isExpired(lastActiveRef.current)) return false;
    clearChat(storageId);
    resetConversation(EXPIRED_NOTICE);
    return true;
  }, [storageId, resetConversation]);

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

  // Follow the conversation, but when it is just the welcome message keep the top in view
  useEffect(() => {
    if (messages.length > 1 || isLoading || notice) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen, notice]);

  // The round button slides away while the page scrolls down (so it never covers a button
  // the user is reaching for) and comes back as soon as they scroll up or stop near the top.
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY + 8 && y > 120) setFabHidden(true);
      else if (y < lastY - 8 || y <= 120) setFabHidden(false);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const addMessages = (msgs) => setMessages((prev) => [...prev, ...msgs]);
  const touch = () => { lastActiveRef.current = Date.now(); };

  // ── Booking ──────────────────────────────────────────
  const beginBooking = async (service) => {
    if (!isCustomer) {
      addMessages([
        {
          role: 'bot',
          text: userId
            ? 'Booking sirf customer account se ho sakti hai.'
            : `${service} book karne ke liye pehle login karo, phir main yahin se booking kar dunga.`,
          options: userId ? [MENU_OPTION] : [LOGIN_OPTION, MENU_OPTION],
        },
      ]);
      return;
    }
    setIsLoading(true);
    let addresses = [];
    try {
      const res = await axios.get('/user/addresses');
      // default address first
      addresses = [...(res.data.addresses || [])].sort((x, y) => Number(y.isDefault) - Number(x.isDefault));
    } catch {
      // not essential - the user can just type the address
    }
    const started = startBooking(service, { addresses });
    setFlow(started.flow);
    addMessages(started.messages.map(flowTag));
    setIsLoading(false);
  };

  const submitBooking = async (payload, flowAtSubmit) => {
    setIsLoading(true);
    try {
      const res = await axios.post('/booking/create', payload);
      if (res.data.success) {
        setFlow(null);
        addMessages([
          flowTag({
            role: 'bot',
            text:
              `✅ Booking request bhej di gayi!\n\n${res.data.message || ''}\n\n` +
              'Jaise hi koi worker accept karega, aapko Dashboard mein dikh jayega. 🙌',
            options: [
              {
                label: '📍 Booking track karo',
                action: 'navigate',
                value: res.data.booking?._id ? `/track/${res.data.booking._id}` : '/dashboard',
              },
              MENU_OPTION,
            ],
          }),
        ]);
      } else {
        setFlow(null);
        addMessages([
          flowTag({
            role: 'bot',
            text: `😔 ${res.data.message || 'Booking nahi ho payi.'}`,
            options: [MENU_OPTION],
          }),
        ]);
      }
    } catch (err) {
      console.error('Chat booking error:', err);
      if (err.response?.status === 401) {
        setFlow(null);
        addMessages([
          flowTag({
            role: 'bot',
            isError: true,
            text: 'Aapka session expire ho gaya hai. Please dobara login karo.',
            options: [LOGIN_OPTION],
          }),
        ]);
      } else {
        // Keep the details so they can retry with one tap
        setFlow({ ...flowAtSubmit, step: 'confirm' });
        addMessages([
          flowTag({
            role: 'bot',
            isError: true,
            text:
              err.response?.data?.message ||
              'Booking abhi nahi ho payi. Kya dobara try karein?',
            options: [
              { label: '🔁 Haan, dobara try karo', action: 'flow', value: '__confirm' },
              { label: '❌ Cancel', action: 'flow', value: '__cancel' },
            ],
          }),
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── AI (only for questions our answers don't cover) ──
  const askAI = async (text) => {
    if (!isCustomer) {
      addMessages([
        {
          role: 'bot',
          text:
            'Is sawal ka jawab dene ke liye pehle login karo. ' +
            (userId ? '(AI expert sirf customers ke liye hai.) ' : '') +
            'Tab tak neeche se koi option chuno:',
          options: userId ? TILES : [LOGIN_OPTION, ...TILES],
        },
      ]);
      return;
    }

    const { message, history } = buildChatPayload(messages, text);
    setIsLoading(true);
    try {
      const res = await axios.post('/chat/message', { message, history }, { timeout: 60000 });
      const suggestion = res.data.suggestion;
      addMessages([
        {
          role: 'bot',
          text: res.data.reply,
          options: suggestion
            ? [bookOption(suggestion.service), MENU_OPTION]
            : [MENU_OPTION],
          ...(suggestion
            ? { priceNote: `Estimated: ₹${suggestion.price || totalPrice(suggestion.service)}` }
            : {}),
        },
      ]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      const sessionOver = err.response?.status === 401;
      addMessages([
        {
          role: 'bot',
          isError: true,
          text: sessionOver
            ? 'Aapka session expire ho gaya hai. Please dobara login karo.'
            : 'Nipun AI abhi available nahi hai. Neeche se koi option chuno ya thodi der baad try karo. 🙏',
          options: sessionOver ? [LOGIN_OPTION] : [MENU_OPTION],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── One entry point for typed text and tile clicks ───
  const processInput = async ({ text, label, action, value }) => {
    if (isLoading) return;
    if (action === 'navigate') {
      setIsOpen(false);
      navigate(value);
      return;
    }
    if (expireIfNeeded()) return; // timed out: start again (typed text stays)

    const shown = (label || text || '').trim();
    if (!shown) return;

    touch();
    setNotice('');
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: shown, ...(flow ? { isFlow: true } : {}) }]);

    // 1) Inside the booking conversation
    if (flow && flow.step !== 'submitting') {
      const res = stepFlow(flow, { text: shown, value: action === 'flow' ? value : undefined });
      setFlow(res.flow);
      addMessages(res.messages.map(flowTag));
      if (res.submit) submitBooking(res.submit, res.flow);
      return;
    }

    // 2) Buttons
    if (action === 'book') return beginBooking(value);
    if (action === 'menu') return addMessages([MENU_MESSAGE]);
    if (action === 'tile') {
      const intent = getIntent(value);
      return addMessages(intent ? replyFor(intent) : [MENU_MESSAGE]);
    }

    // 3) Typed "yes" right after we offered a booking
    const last = messages[messages.length - 1];
    const offered = last?.options?.find((o) => o.action === 'book');
    if (offered && isYes(shown)) return beginBooking(offered.value);

    // 4) Ready-made answers first (instant, free) ...
    if (shouldUseKnowledgeBase(shown)) {
      const intent = matchIntent(shown);
      if (intent) return addMessages(replyFor(intent));
    }

    // 5) ... AI only for everything else
    return askAI(shown);
  };

  const lastIndex = messages.length - 1;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
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
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { clearChat(storageId); resetConversation(); }}
                  className="text-sm font-medium min-w-[40px] min-h-[40px] px-2 rounded-lg hover:bg-white/20"
                  aria-label="Start a new chat"
                  title="Nayi chat"
                >
                  🔄<span className="hidden sm:inline"> Nayi chat</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xl min-w-[40px] min-h-[40px] px-2 rounded-lg hover:bg-white/20"
                  aria-label="Close chat"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'self-end max-w-[88%]' : 'self-start max-w-[94%]'}>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm text-base lg:text-lg leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <RichText text={m.text} />
                    {m.priceNote && (
                      <div className="mt-2 text-sm text-gray-500">💰 {m.priceNote}</div>
                    )}
                  </div>
                  {i === lastIndex && m.role === 'bot' && m.options?.length > 0 && (
                    <Options
                      options={m.options}
                      disabled={isLoading}
                      onPick={(o) =>
                        processInput({ text: o.label, label: o.label, action: o.action, value: o.value })
                      }
                    />
                  )}
                </div>
              ))}

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
                    if (e.key === 'Enter') processInput({ text: input });
                  }}
                  maxLength={500}
                  className="flex-1 border rounded-xl px-4 py-3 text-base outline-none focus:border-primary"
                  placeholder={flow ? 'Apna jawab likho ya tile chuno...' : 'Describe your problem...'}
                />
                <button
                  onClick={() => processInput({ text: input })}
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
        tabIndex={fabHidden && !isOpen ? -1 : 0}
        className={`ml-auto bg-secondary w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center text-2xl sm:text-3xl hover:scale-110 transition-all duration-300 ${
          fabHidden && !isOpen ? 'translate-x-24 opacity-0 pointer-events-none' : ''
        }`}
        aria-label="Open Nipun AI chat"
      >
        💬
      </button>
    </div>
  );
}

export default ChatWidget;
