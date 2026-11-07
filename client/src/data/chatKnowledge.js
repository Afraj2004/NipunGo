// Ready-made answers for the Nipun AI chat.
// Anything matched here is answered instantly and for free; only questions
// that match nothing are sent to the AI (see ChatWidget).
//
// Keep SERVICE_PRICES in sync with server/config/services.js and
// timeSlots/servicePrices in pages/Booking.jsx.

export const PLATFORM_FEE = 50;

export const SERVICE_PRICES = {
  'Plumber': 200,
  'Electrician': 250,
  'Carpenter': 300,
  'Painter': 350,
  'AC Mechanic': 400,
  'Cleaner': 150,
  'Locksmith': 200,
  'Gardener': 180,
  'IT Support': 300,
  'Laundry': 100,
  'Pest Control': 500,
  'Bathroom Fitter': 200,
};

export const SERVICE_ICONS = {
  'Plumber': '🔧',
  'Electrician': '⚡',
  'Carpenter': '🪚',
  'Painter': '🎨',
  'AC Mechanic': '❄️',
  'Cleaner': '🧹',
  'Locksmith': '🔑',
  'Gardener': '🌿',
  'IT Support': '💻',
  'Laundry': '👕',
  'Pest Control': '🐜',
  'Bathroom Fitter': '🚿',
};

export const totalPrice = (service) =>
  SERVICE_PRICES[service] === undefined ? null : SERVICE_PRICES[service] + PLATFORM_FEE;

// action 'book' starts the booking conversation for `value` (a service)
export const bookOption = (service) => ({
  label: `✅ Haan, ${service} book karo`,
  action: 'book',
  value: service,
});

export const MENU_OPTION = { label: '🏠 Main menu', action: 'menu' };

// ── Intents ─────────────────────────────────────────────
// tile: shown as a quick-reply tile on the first screen.
// keywords: matched as whole words / phrases against what the user types.
export const INTENTS = [
  // ── Services ──
  {
    id: 'plumber',
    service: 'Plumber',
    tile: '💧 Pipe / nal leak',
    keywords: [
      'leak', 'leaking', 'tap', 'nal', 'pipe', 'paani', 'pani', 'tapak', 'tapakna',
      'drain', 'blocked', 'choke', 'choked', 'geyser', 'tanki', 'flush', 'seepage',
      'plumber', 'overflow',
    ],
    reply:
      'Paani leak hona urgent hota hai, kyunki isse deewar aur furniture kharab ho sakte hain.\n\n' +
      'Abhi ke liye: main water valve (stopcock) band kar do aur leak ke neeche bartan rakh do.\n\n' +
      'Hamare verified Plumber turant aa sakte hain. Kya main booking kar doon?',
  },
  {
    id: 'electrician',
    service: 'Electrician',
    tile: '⚡ Bijli / switch problem',
    keywords: [
      'bijli', 'light', 'lights', 'switch', 'wiring', 'wire', 'short', 'spark', 'sparking',
      'fan', 'mcb', 'fuse', 'inverter', 'socket', 'plug', 'current', 'electric',
      'electrician', 'bulb', 'tubelight', 'meter', 'trip', 'tripping',
    ],
    reply:
      'Bijli ki problem mein khatra ho sakta hai, isliye khud wiring ko haath mat lagao.\n\n' +
      'Abhi ke liye: us hisse ka main switch / MCB band kar do aur geele haath se kuch mat chhuo.\n\n' +
      'Hamare verified Electrician ko bula loon?',
  },
  {
    id: 'ac',
    service: 'AC Mechanic',
    tile: '❄️ AC thanda nahi kar raha',
    keywords: [
      'ac', 'aircon', 'air conditioner', 'thanda', 'cooling', 'gas leak', 'compressor',
      'split ac', 'window ac', 'ac service', 'ac repair',
    ],
    reply:
      'AC thanda na karne ki aam wajah hai gas kam hona, dirty filter ya compressor ki problem.\n\n' +
      'Abhi ke liye: AC band karke filter check kar lo; dhool ho to saaf kar do.\n\n' +
      'Hamare AC Mechanic checking aur repair kar denge. Booking kar doon?',
  },
  {
    id: 'cleaner',
    service: 'Cleaner',
    tile: '🧹 Ghar ki safai',
    keywords: [
      'safai', 'clean', 'cleaning', 'jhadu', 'pocha', 'sofa cleaning', 'carpet', 'deep clean',
      'kitchen cleaning', 'bathroom cleaning', 'cleaner', 'dhool', 'maid',
    ],
    reply:
      'Ghar, kitchen, bathroom ya sofa, sab ki professional safai ho jaati hai.\n\n' +
      'Hamare verified Cleaner saaf-suthra kaam karte hain. Kya main booking kar doon?',
  },
  {
    id: 'painter',
    service: 'Painter',
    tile: '🎨 Painting / deewar',
    keywords: [
      'paint', 'painting', 'painter', 'rang', 'colour', 'color', 'deewar', 'diwar',
      'wall', 'walls', 'whitewash', 'putty', 'damp', 'seelan', 'polish',
    ],
    reply:
      'Painting ya deewar ki repair ke liye hamare Painter aate hain, wo wall ki halat dekhkar sahi finish batate hain.\n\n' +
      'Kya main booking kar doon?',
  },
  {
    id: 'carpenter',
    service: 'Carpenter',
    tile: '🪚 Furniture / darwaza',
    keywords: [
      'furniture', 'darwaza', 'darwaze', 'door', 'table', 'almirah', 'almari', 'wood',
      'wooden', 'carpenter', 'khidki', 'window repair', 'bed', 'cupboard', 'hinge',
      'drawer', 'shelf', 'wardrobe', 'sofa repair',
    ],
    reply:
      'Furniture, darwaza, almirah ya shelf ki repair ho ya nayi fitting, hamare Carpenter sab sambhal lete hain.\n\n' +
      'Kya main booking kar doon?',
  },
  {
    id: 'locksmith',
    service: 'Locksmith',
    tile: '🔑 Lock / chabi problem',
    keywords: [
      'lock', 'locked', 'chabi', 'key', 'keys', 'taala', 'tala', 'locksmith', 'latch',
      'stuck', 'jam', 'jammed', 'duplicate',
    ],
    reply:
      'Lock ya chabi ki problem mein hamare Locksmith turant madad kar sakte hain, chahe lock khulna ho, badalna ho ya duplicate chabi banani ho.\n\n' +
      'Kya main booking kar doon?',
  },
  {
    id: 'pest',
    service: 'Pest Control',
    tile: '🐜 Keede / pest',
    keywords: [
      'keede', 'keeda', 'cockroach', 'termite', 'deemak', 'machhar', 'mosquito', 'chuhe',
      'chooha', 'rat', 'pest', 'bugs', 'ants', 'cheenti', 'bedbug', 'mice', 'lizard',
    ],
    reply:
      'Pest ki problem jaldi badhti hai, isliye treatment jaldi karwana behtar hai.\n\n' +
      'Abhi ke liye: khane-peene ka saaman dhak kar rakho aur nami wali jagah saaf rakho.\n\n' +
      'Hamare Pest Control expert safe treatment karte hain. Booking kar doon?',
  },
  {
    id: 'gardener',
    service: 'Gardener',
    keywords: ['garden', 'gardener', 'mali', 'paudhe', 'plants', 'lawn', 'grass', 'trimming'],
    reply: 'Garden ki safai, paudhon ki dekhbhal aur lawn trimming ke liye hamare Gardener available hain.\n\nKya main booking kar doon?',
  },
  {
    id: 'it',
    service: 'IT Support',
    keywords: ['wifi', 'laptop', 'computer', 'printer', 'router', 'internet', 'pc', 'software', 'virus', 'network'],
    reply: 'Wifi, laptop, computer ya printer ki problem ke liye hamare IT Support expert ghar aakar madad karte hain.\n\nKya main booking kar doon?',
  },
  {
    id: 'laundry',
    service: 'Laundry',
    keywords: ['kapde', 'laundry', 'dhulai', 'iron', 'press', 'dryclean', 'washing'],
    reply: 'Kapdon ki dhulai aur press ke liye Laundry service available hai.\n\nKya main booking kar doon?',
  },
  {
    id: 'bathroom-fitter',
    service: 'Bathroom Fitter',
    keywords: ['tiles', 'tile', 'commode', 'shower', 'basin', 'bathroom fitting', 'sink'],
    reply: 'Bathroom ki fitting jaise commode, shower, basin ya tiles ke liye hamare Bathroom Fitter available hain.\n\nKya main booking kar doon?',
  },

  // ── FAQs ──
  {
    id: 'pricing',
    tile: '💰 Charges kitne hain?',
    keywords: ['charge', 'charges', 'price', 'prices', 'rate', 'rates', 'kitna', 'kitne', 'cost', 'paisa', 'fees', 'fee', 'rupee', 'rupees', 'how much'],
    reply: null, // built from SERVICE_PRICES below
  },
  {
    id: 'how',
    tile: '📋 Booking kaise hoti hai?',
    keywords: ['process', 'steps', 'procedure', 'booking kaise', 'kaise hoti', 'book kaise', 'how to book', 'how it works', 'kaise kaam'],
    reply:
      'Booking bahut aasan hai:\n\n' +
      '1. Service chuno (ya mujhe problem batao)\n' +
      '2. Date, time aur address batao\n' +
      '3. Aapki request paas ke verified workers ko jaati hai\n' +
      '4. Jo pehle accept karta hai wo aapke ghar aata hai\n\n' +
      'Main ye sab yahin chat mein kar sakta hoon. Bas bolo kaunsi service chahiye!',
  },
  {
    id: 'payment',
    keywords: ['payment', 'pay', 'cash', 'online', 'upi', 'card', 'razorpay', 'paise'],
    reply:
      'Aap kaam ke baad cash mein pay kar sakte ho. Online payment (UPI / card) booking page se bhi available hai.\n\n' +
      'Har booking mein ₹50 platform fee judti hai.',
  },
  {
    id: 'cancel',
    keywords: ['cancel', 'refund', 'radd', 'cancellation'],
    reply:
      'Booking cancel karne ke liye Dashboard mein "Meri Bookings" kholo aur us booking ko cancel kar do. ' +
      'Completed booking cancel nahi ho sakti.',
  },
  {
    id: 'verified',
    keywords: ['verified', 'trust', 'safe', 'trusted', 'bharosa', 'genuine', 'police'],
    reply:
      'Hamare workers verified hote hain aur har kaam ke baad aap rating aur review de sakte ho, jisse quality bani rehti hai.',
  },
  {
    id: 'support',
    tile: '☎️ Support se baat karo',
    keywords: ['support', 'help', 'contact', 'complaint', 'number', 'call', 'email', 'madad'],
    reply:
      'Hamari team se yahan contact karo:\n\n' +
      '📧 support@nipungo.com\n📞 +91 98765 43210\n\n' +
      'Ya mujhe apni problem batao, main madad karne ki koshish karunga.',
  },
  {
    id: 'greeting',
    keywords: ['hi', 'hii', 'hiii', 'hello', 'hey', 'namaste', 'namaskar', 'hlo', 'helo'],
    reply: 'Namaste! 🙏 Main Nipun AI hoon. Neeche se apni problem chuno ya mujhe likh kar batao.',
  },
  {
    id: 'thanks',
    keywords: ['thanks', 'thank', 'thankyou', 'shukriya', 'dhanyawad', 'thx', 'bye'],
    reply: 'Aapka swagat hai! 😊 Kuch aur chahiye to bas puchiye.',
  },
];

export const TILES = INTENTS.filter((i) => i.tile).map((i) => ({
  label: i.tile,
  action: 'tile',
  value: i.id,
}));

export const getIntent = (id) => INTENTS.find((i) => i.id === id) || null;

const pricingText = () =>
  'Service charges (platform fee ₹50 alag se judti hai):\n\n' +
  Object.entries(SERVICE_PRICES)
    .map(([s, p]) => `${SERVICE_ICONS[s] || '•'} ${s}: ₹${p}`)
    .join('\n') +
  '\n\nFinal amount = service charge + ₹50. Kaunsi service book karni hai?';

// The bot messages for an intent
export const replyFor = (intent) => {
  if (intent.id === 'pricing') {
    return [{ role: 'bot', text: pricingText(), options: TILES.slice(0, 8) }];
  }
  if (intent.service) {
    return [
      {
        role: 'bot',
        text: `${intent.reply}\n\n💰 Estimated: ₹${totalPrice(intent.service)} (incl. ₹${PLATFORM_FEE} platform fee)`,
        options: [bookOption(intent.service), MENU_OPTION],
      },
    ];
  }
  if (intent.id === 'greeting' || intent.id === 'how' || intent.id === 'support') {
    return [{ role: 'bot', text: intent.reply, options: TILES }];
  }
  return [{ role: 'bot', text: intent.reply, options: [MENU_OPTION] }];
};

const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

// Best intent for free text, or null when nothing matches (-> ask the AI).
// Highest keyword score wins (longer / multi-word keywords count more), so
// "ac ka charge kitna" goes to pricing, while "ac thanda nahi kar raha" goes to AC.
export const matchIntent = (text) => {
  const tokens = tokenize(text);
  if (!tokens.length) return null;
  const padded = ` ${tokens.join(' ')} `;

  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (padded.includes(` ${kw} `)) score += kw.length > 4 || kw.includes(' ') ? 2 : 1;
    }
    // Greetings/thanks should only win for short messages ("hi", "thanks")
    if ((intent.id === 'greeting' || intent.id === 'thanks') && tokens.length > 3) score = 0;
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  return best;
};

// Very long messages describe something unusual: leave those to the AI
export const MAX_KB_WORDS = 12;
export const shouldUseKnowledgeBase = (text) =>
  tokenize(text).length <= MAX_KB_WORDS;
