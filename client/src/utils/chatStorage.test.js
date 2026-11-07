import {
  CHAT_EXPIRY_MS,
  GREETING,
  buildChatPayload,
  clearAllChats,
  isExpired,
  loadChat,
  saveChat,
} from './chatStorage';

beforeEach(() => localStorage.clear());

const sample = (lastActive) => ({
  messages: [GREETING, { role: 'user', text: 'pipe leak' }],
  suggestion: { service: 'Plumber', price: 250 },
  lastActive,
});

describe('chat expiry', () => {
  test('isExpired respects the inactivity window', () => {
    const now = 1_000_000_000;
    expect(isExpired(now - 1000, now)).toBe(false);
    expect(isExpired(now - CHAT_EXPIRY_MS - 1, now)).toBe(true);
    expect(isExpired(null, now)).toBe(true);
  });

  test('a recent chat is restored (user came back from another page)', () => {
    const now = Date.now();
    saveChat('u1', sample(now - 60_000));
    const { chat, expired } = loadChat('u1', now);
    expect(expired).toBe(false);
    expect(chat.messages).toHaveLength(2);
    expect(chat.suggestion.service).toBe('Plumber');
  });

  test('an inactive chat expires and is deleted', () => {
    const now = Date.now();
    saveChat('u1', sample(now - CHAT_EXPIRY_MS - 1000));
    expect(loadChat('u1', now)).toEqual({ chat: null, expired: true });
    // gone for good, not just hidden
    expect(loadChat('u1', now)).toEqual({ chat: null, expired: false });
  });

  test('chats are per user', () => {
    const now = Date.now();
    saveChat('u1', sample(now));
    expect(loadChat('u2', now).chat).toBeNull();
  });

  test('corrupt storage is ignored', () => {
    localStorage.setItem('nipungo_chat_u1', '{not json');
    expect(loadChat('u1')).toEqual({ chat: null, expired: false });
  });

  test('clearAllChats removes every user chat but nothing else', () => {
    saveChat('u1', sample(Date.now()));
    saveChat('u2', sample(Date.now()));
    localStorage.setItem('token', 'keep-me');
    clearAllChats();
    expect(loadChat('u1').chat).toBeNull();
    expect(loadChat('u2').chat).toBeNull();
    expect(localStorage.getItem('token')).toBe('keep-me');
  });
});

describe('buildChatPayload', () => {
  test('drops greeting, keeps strict user/model alternation', () => {
    const { message, history } = buildChatPayload(
      [GREETING, { role: 'user', text: 'a' }, { role: 'bot', text: 'b' }],
      'c'
    );
    expect(message).toBe('c');
    expect(history.map((h) => h.role)).toEqual(['user', 'model']);
  });

  test('skips error bubbles and folds an unanswered user message into the new one', () => {
    const { message, history } = buildChatPayload(
      [
        GREETING,
        { role: 'user', text: 'first' },
        { role: 'bot', text: 'oops', isError: true },
      ],
      'second'
    );
    expect(history).toEqual([]);
    expect(message).toBe('first\nsecond');
  });

  test('keeps only the most recent turns, still starting with a user turn', () => {
    const msgs = [];
    for (let i = 0; i < 20; i++) {
      msgs.push({ role: 'user', text: `u${i}` }, { role: 'bot', text: `b${i}` });
    }
    const { history } = buildChatPayload(msgs, 'now');
    expect(history.length).toBeLessThanOrEqual(10);
    expect(history[0].role).toBe('user');
  });
});
