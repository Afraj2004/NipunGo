import {
  INTENTS,
  TILES,
  matchIntent,
  replyFor,
  shouldUseKnowledgeBase,
  totalPrice,
} from './chatKnowledge';

const idOf = (text) => matchIntent(text)?.id;

describe('matchIntent (instant answers)', () => {
  test.each([
    ['pipe leak ho raha hai', 'plumber'],
    ['pipe kharab ho gaya hai pani leak ho raha hai', 'plumber'],
    ['bijli ka switch jal gaya', 'electrician'],
    ['ac thanda nahi kar raha', 'ac'],
    ['ghar ki safai karwani hai', 'cleaner'],
    ['deewar ka paint karwana hai', 'painter'],
    ['darwaza toot gaya', 'carpenter'],
    ['chabi kho gayi', 'locksmith'],
    ['ghar mein cockroach hai', 'pest'],
    ['wifi nahi chal raha', 'it'],
  ])('"%s" -> %s', (text, expected) => {
    expect(idOf(text)).toBe(expected);
  });

  test('price questions go to pricing, even when a service is named', () => {
    expect(idOf('ac ka charge kitna hai')).toBe('pricing');
    expect(idOf('how much does it cost')).toBe('pricing');
  });

  test('FAQ questions are answered', () => {
    expect(idOf('booking kaise hoti hai')).toBe('how');
    expect(idOf('payment kaise karu')).toBe('payment');
    expect(idOf('support number do')).toBe('support');
  });

  test('greetings only win for short messages', () => {
    expect(idOf('hi')).toBe('greeting');
    expect(idOf('hello bhai pipe leak ho raha hai')).toBe('plumber');
  });

  test('"book karo" or "service" alone do not wrongly trigger a service', () => {
    expect(matchIntent('book karo')).toBeNull();
    expect(matchIntent('service chahiye')).toBeNull();
  });

  test('unrelated questions are left to the AI', () => {
    expect(matchIntent('meri car kharab ho gayi')).toBeNull();
    expect(matchIntent('')).toBeNull();
  });

  test('long messages go to the AI', () => {
    expect(shouldUseKnowledgeBase('pipe leak')).toBe(true);
    expect(
      shouldUseKnowledgeBase(
        'mere ghar ke bathroom mein pichle teen din se pipe leak ho raha hai aur neeche wale flat mein paani aa raha hai'
      )
    ).toBe(false);
  });
});

describe('knowledge base content', () => {
  test('every service intent offers a booking with a real price', () => {
    INTENTS.filter((i) => i.service).forEach((intent) => {
      const [msg] = replyFor(intent);
      expect(totalPrice(intent.service)).toBeGreaterThan(50);
      expect(msg.options.some((o) => o.action === 'book' && o.value === intent.service)).toBe(true);
    });
  });

  test('tiles exist and point at known intents', () => {
    expect(TILES.length).toBeGreaterThanOrEqual(8);
    TILES.forEach((t) => expect(INTENTS.some((i) => i.id === t.value)).toBe(true));
  });

  test('pricing reply lists every service', () => {
    const pricing = INTENTS.find((i) => i.id === 'pricing');
    const [msg] = replyFor(pricing);
    ['Plumber', 'Electrician', 'Pest Control'].forEach((s) => expect(msg.text).toContain(s));
  });
});
