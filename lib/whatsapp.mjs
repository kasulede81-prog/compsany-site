/**
 * DKASU company-site WhatsApp click-to-chat helpers (Phase 1).
 * Browser-safe: no Node APIs. Embedded into public UI by scripts/build-company.mjs.
 */

export const WHATSAPP_DEFAULT_DIGITS = '256765146177';
export const WHATSAPP_FALLBACK_PATH = '/contact';
export const WHATSAPP_SHORT_LINK_PATTERN = /^https:\/\/wa\.me\/message\/[A-Za-z0-9]+$/;

const DIVISION_ALIASES = {
  general: 'general',
  dkasu: 'general',
  'dkasu services': 'general',
  'dkasu products and services': 'general',
  'computer-arena': 'computer',
  'dkasu computer arena': 'computer',
  computer: 'computer',
  computers: 'computer',
  pos: 'pos',
  dkasupos: 'pos',
  'dkasu pos': 'pos',
  loyalty: 'loyalty',
  'dkasu loyalty': 'loyalty',
  dkasuloyalty: 'loyalty',
  vision: 'vision',
  'dkasu vision': 'vision',
  dkasuvision: 'vision',
  logistic: 'logistic',
  logistics: 'logistic',
  'dkasu logistic': 'logistic',
  dkasulogistic: 'logistic',
  digital: 'digital',
  'dkasu digital': 'digital',
  dkasudigital: 'digital',
  global: 'global',
  'dkasu global': 'global',
  dkasuglobal: 'global',
};

const DIVISION_MESSAGES = {
  general: 'Hello DKASU, I would like help with your products and services.',
  computer: 'Hello DKASU Computers, I am interested in computers and accessories from Computer Arena.',
  pos: 'Hello DKASU POS, I would like to learn about DKASU POS for my business.',
  loyalty: 'Hello DKASU Loyalty, I would like to ask about loyalty tools.',
  vision: 'Hello DKASU Vision, I would like a CCTV installation quote.',
  logistic: 'Hello DKASU Logistic, I would like shipping and logistics help.',
  digital: 'Hello DKASU Digital, I would like website or digital services.',
  global: 'Hello DKASU Global, I would like study and travel guidance.',
};

const PRODUCT_GREETING = {
  general: 'Hello DKASU',
  computer: 'Hello DKASU Computers',
  pos: 'Hello DKASU POS',
  loyalty: 'Hello DKASU Loyalty',
  vision: 'Hello DKASU Vision',
  logistic: 'Hello DKASU Logistic',
  digital: 'Hello DKASU Digital',
  global: 'Hello DKASU Global',
};

function sanitizeFragment(value, max = 120) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Normalize a CMS phone value to E.164 digits; fall back to the DKASU default. */
export function normalizeWhatsAppDigits(value, fallback = WHATSAPP_DEFAULT_DIGITS) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return String(fallback || '').replace(/\D/g, '') || WHATSAPP_DEFAULT_DIGITS;
}

export function isWhatsAppShortLink(url) {
  return WHATSAPP_SHORT_LINK_PATTERN.test(String(url || '').trim());
}

/** Map service ids, slugs, and labels to a stable division key. */
export function resolveDivisionKey(input) {
  const raw = sanitizeFragment(input, 80).toLowerCase();
  if (!raw) return 'general';
  if (DIVISION_ALIASES[raw]) return DIVISION_ALIASES[raw];
  const compact = raw.replace(/[^a-z0-9]+/g, '');
  for (const [alias, key] of Object.entries(DIVISION_ALIASES)) {
    if (alias.replace(/[^a-z0-9]+/g, '') === compact) return key;
  }
  return 'general';
}

/**
 * Allow only public https DKASU URLs or safe same-site paths.
 * Strips query/hash so interest params and tracking are not copied into chats.
 */
export function sanitizePageUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/')) {
    const path = raw.split(/[?#]/)[0];
    if (!/^\/[A-Za-z0-9\-._/~]*$/.test(path)) return '';
    return sanitizeFragment(path, 200);
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return '';
    const host = parsed.hostname.toLowerCase();
    if (host !== 'www.dkasu.com' && host !== 'dkasu.com' && !host.endsWith('.dkasu.com')) return '';
    return sanitizeFragment(`${parsed.origin}${parsed.pathname}`, 200);
  } catch {
    return '';
  }
}

export function buildPrefillMessage({ division, productName, pageUrl, subject } = {}) {
  const key = resolveDivisionKey(division || subject);
  const product = sanitizeFragment(productName, 100);
  let message;

  if (product) {
    const greeting = PRODUCT_GREETING[key] || PRODUCT_GREETING.general;
    message = `${greeting}, I would like to ask about ${product}.`;
  } else if (subject) {
    const subjectKey = resolveDivisionKey(subject);
    if (subjectKey !== 'general' || DIVISION_ALIASES[sanitizeFragment(subject, 80).toLowerCase()]) {
      message = DIVISION_MESSAGES[subjectKey] || DIVISION_MESSAGES.general;
    } else {
      const topic = sanitizeFragment(subject, 100);
      message = topic
        ? `Hello DKASU, I would like to ask about ${topic}.`
        : DIVISION_MESSAGES.general;
    }
  } else {
    message = DIVISION_MESSAGES[key] || DIVISION_MESSAGES.general;
  }

  const safePage = sanitizePageUrl(pageUrl);
  if (safePage) message += ` (Ref: ${safePage})`;
  return message;
}

/**
 * Build a WhatsApp click-to-chat URL.
 *
 * mode 'generic'     → CMS short link when valid (header/footer/floating/contact).
 * mode 'contextual'  → wa.me/{digits}?text=… so division/product context is preserved.
 */
export function buildWhatsAppUrl(options = {}) {
  const {
    mode = 'contextual',
    contactWhatsApp,
    contactWhatsAppLink,
    division,
    productName,
    pageUrl,
    subject,
    fallbackPath = WHATSAPP_FALLBACK_PATH,
  } = options;

  const digits = normalizeWhatsAppDigits(contactWhatsApp);
  const shortLink = isWhatsAppShortLink(contactWhatsAppLink) ? String(contactWhatsAppLink).trim() : '';

  if (mode === 'generic' && shortLink) return shortLink;
  if (!digits) return fallbackPath || WHATSAPP_FALLBACK_PATH;

  const text = buildPrefillMessage({ division, productName, pageUrl, subject });
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
