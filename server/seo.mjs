/**
 * DKASU company-site SEO helpers (Phase 1).
 * Canonical host matches production: apex https://dkasu.com 308 → https://www.dkasu.com
 * Do not invent social profiles, registrations, or product claims here.
 */

/** Indexed origin (www) — aligns with live Vercel redirect. */
export const SITE_ORIGIN = 'https://www.dkasu.com';

export const BRAND = {
  name: 'DKASU',
  legalName: 'Waka Marketplace Limited',
  url: SITE_ORIGIN,
  foundingDate: '2025-12',
  founderName: 'Denis Kasule',
  founderJobTitle: 'Founder & CEO',
  /** Verified personal profile only — no unverified brand socials. */
  founderSameAs: ['https://www.linkedin.com/in/kasule-denis-6395b3373'],
  logoPath: '/brand/dkasu-logo.png',
  /**
   * Interim social image (logo PNG 834×258). Dedicated 1200×630 OG artwork is PENDING —
   * do not invent a new creative asset here.
   */
  ogImagePath: '/og-image.png',
  ogImageStatus: 'pending_1200x630',
  email: 'intl@dkasu.com',
  uganda: {
    streetAddress: 'Namasuba, Entebbe Road',
    addressLocality: 'Kampala',
    addressCountry: 'UG',
    postalCode: '209034',
    postOfficeBoxNumber: '209034',
    formatted: 'P.O. Box 209034, Namasuba, Entebbe Road, Kampala, Uganda',
  },
  italy: {
    streetAddress: 'Via Bernardino Alimena 31B',
    addressLocality: 'Roma',
    addressRegion: 'RM',
    postalCode: '00173',
    addressCountry: 'IT',
    formatted: 'Via Bernardino Alimena 31B, 00173 Roma (RM), Italy',
    /** Contact location only — not claimed as a registered legal branch. */
    note: 'Italy contact location',
  },
};

/** Public indexable paths only (no admin, APIs, or authenticated surfaces). */
export const PUBLIC_PAGES = [
  {
    path: '/',
    title: 'DKASU | Business Software, POS Systems & IT Solutions Uganda',
    description:
      'DKASU provides POS software, inventory management, computers, website development and IT solutions for businesses in Uganda.',
    breadcrumbs: [{ name: 'Home', path: '/' }],
  },
  {
    path: '/products',
    title: 'Products & Services | DKASU Computers, POS & IT',
    description:
      'Explore DKASU Computer Arena, DKASU POS, loyalty tools, CCTV installation, logistics and digital services for Ugandan businesses.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
    ],
  },
  {
    path: '/about',
    title: 'About DKASU | Software, Computers & Waka Marketplace Limited',
    description:
      'DKASU is the commercial brand of Waka Marketplace Limited — business software, computers, digital services and IT solutions in Uganda and Italy.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Company', path: '/about' },
    ],
  },
  {
    path: '/contact',
    title: 'Contact DKASU | Uganda & Italy',
    description:
      'Contact DKASU in Kampala, Uganda or Rome, Italy — WhatsApp, email, or enquiry form for computers, POS software, and IT services.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' },
    ],
  },
];

const SERVICE_SEO = {
  'computer-arena': {
    title: 'DKASU Computers | Computer Arena Uganda',
    description:
      'Shop refurbished and new laptops, desktops and computer accessories in Uganda through DKASU Computer Arena — computer.dkasu.com.',
    name: 'DKASU Computer Arena',
  },
  pos: {
    title: 'DKASU POS | Offline Business Management Software Uganda',
    description:
      'DKASU POS is offline-first POS software for retail, restaurants, pharmacies and supermarkets — sales, inventory, staff, reporting and loyalty.',
    name: 'DKASU POS',
  },
  loyalty: {
    title: 'DKASU Loyalty | Customer Engagement Software',
    description:
      'DKASU Loyalty helps businesses stay connected to customers with digital loyalty tools that integrate with DKASU POS.',
    name: 'DKASU Loyalty',
  },
  vision: {
    title: 'DKASU Vision | CCTV Installation Uganda',
    description: 'DKASU Vision provides CCTV installation services for homes and businesses in Uganda.',
    name: 'DKASU Vision',
  },
  logistic: {
    title: 'DKASU Logistic | Shipping & Logistics',
    description: 'DKASU Logistic provides shipping and logistics services for business movement needs.',
    name: 'DKASU Logistic',
  },
};

/** Verified product host — do not invent additional storefronts here. */
export const POS_PRODUCT_URL = 'https://pos.dkasu.com';
export const COMPUTER_PRODUCT_URL = 'https://computer.dkasu.com';

export function absoluteUrl(pathname = '/') {
  if (!pathname || pathname === '/') return `${SITE_ORIGIN}/`;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${SITE_ORIGIN}${path}`;
}

export function resolvePageMeta(pathname) {
  const clean = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const exact = PUBLIC_PAGES.find((p) => p.path === clean || (clean === '' && p.path === '/'));
  if (exact) return { ...exact, path: exact.path === '/' ? '/' : exact.path };

  const serviceMatch = clean.match(/^\/services\/([a-z0-9-]+)$/);
  if (serviceMatch) {
    const slug = serviceMatch[1];
    const svc = SERVICE_SEO[slug];
    if (!svc) return null;
    return {
      path: `/services/${slug}`,
      title: svc.title,
      description: svc.description,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Solutions', path: '/#solutions' },
        { name: svc.name, path: `/services/${slug}` },
      ],
    };
  }
  return null;
}

export function organizationGraph() {
  const logoUrl = absoluteUrl(BRAND.logoPath);
  const founderId = `${SITE_ORIGIN}/#founder`;
  const orgId = `${SITE_ORIGIN}/#organization`;
  const ugandaId = `${SITE_ORIGIN}/#location-uganda`;
  const italyId = `${SITE_ORIGIN}/#location-italy`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: BRAND.name,
        legalName: BRAND.legalName,
        url: BRAND.url,
        foundingDate: BRAND.foundingDate,
        logo: {
          '@type': 'ImageObject',
          url: logoUrl,
        },
        image: logoUrl,
        email: BRAND.email,
        founder: { '@id': founderId },
        address: {
          '@type': 'PostalAddress',
          streetAddress: BRAND.uganda.streetAddress,
          addressLocality: BRAND.uganda.addressLocality,
          addressCountry: BRAND.uganda.addressCountry,
          postOfficeBoxNumber: BRAND.uganda.postOfficeBoxNumber,
        },
        location: [{ '@id': ugandaId }, { '@id': italyId }],
      },
      {
        '@type': 'Person',
        '@id': founderId,
        name: BRAND.founderName,
        jobTitle: BRAND.founderJobTitle,
        worksFor: { '@id': orgId },
        sameAs: BRAND.founderSameAs,
      },
      {
        '@type': 'Place',
        '@id': ugandaId,
        name: 'DKASU Uganda',
        address: {
          '@type': 'PostalAddress',
          streetAddress: BRAND.uganda.streetAddress,
          addressLocality: BRAND.uganda.addressLocality,
          addressCountry: BRAND.uganda.addressCountry,
          postOfficeBoxNumber: BRAND.uganda.postOfficeBoxNumber,
        },
      },
      {
        '@type': 'Place',
        '@id': italyId,
        name: 'DKASU Italy contact location',
        description:
          'Italy contact location for DKASU. Not represented as a separately registered legal branch.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: BRAND.italy.streetAddress,
          addressLocality: BRAND.italy.addressLocality,
          addressRegion: BRAND.italy.addressRegion,
          postalCode: BRAND.italy.postalCode,
          addressCountry: BRAND.italy.addressCountry,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: BRAND.name,
        url: SITE_ORIGIN,
        publisher: { '@id': orgId },
        inLanguage: 'en',
      },
      softwareApplicationNode(),
      computerStoreNode(),
    ],
  };
}

/**
 * Flagship product schema — references corporate Organization via provider @id.
 * No invent ratings, reviews, or unverified launch dates.
 */
export function softwareApplicationNode() {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${POS_PRODUCT_URL}/#software`,
    name: 'DKASU POS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android',
    url: POS_PRODUCT_URL,
    description:
      'DKASU POS is a business management platform for retailers, restaurants, pharmacies, supermarkets and growing businesses — sales, inventory, customers, staff, reporting and receipt printing in one connected offline-first system.',
    provider: { '@id': `${SITE_ORIGIN}/#organization` },
    author: { '@id': `${SITE_ORIGIN}/#founder` },
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'UGX',
      url: POS_PRODUCT_URL,
    },
  };
}

/**
 * Computers division storefront — references corporate Organization via parentOrganization @id.
 * Mirrors computer.dkasu.com/#store; no invent ratings, branches, or stock counts.
 */
export function computerStoreNode() {
  return {
    '@type': 'ComputerStore',
    '@id': `${COMPUTER_PRODUCT_URL}/#store`,
    name: 'DKASU Computer Arena',
    url: COMPUTER_PRODUCT_URL,
    parentOrganization: { '@id': `${SITE_ORIGIN}/#organization` },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kampala',
      addressCountry: 'UG',
    },
    areaServed: { '@type': 'Country', name: 'Uganda' },
  };
}

export function breadcrumbJsonLd(meta) {
  if (!meta?.breadcrumbs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: meta.breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.path.includes('#')
        ? `${SITE_ORIGIN}${crumb.path.startsWith('/') ? '' : '/'}${crumb.path}`
        : absoluteUrl(crumb.path),
    })),
  };
}

function escAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * Build <head> SEO tags for public HTML shells.
 * @param {{ pathname: string, isAdmin?: boolean }} opts
 */
export function buildSeoHead({ pathname, isAdmin = false } = {}) {
  if (isAdmin) {
    return '<meta name="robots" content="noindex,nofollow"><title>DKASU Admin</title>';
  }

  const meta = resolvePageMeta(pathname);
  if (!meta) {
    return '<meta name="robots" content="noindex,nofollow">';
  }

  const canonical = absoluteUrl(meta.path === '/' ? '/' : meta.path);
  const ogImage = absoluteUrl(BRAND.ogImagePath);
  const logoUrl = absoluteUrl(BRAND.logoPath);
  const graph = organizationGraph();
  const crumbs = breadcrumbJsonLd(meta);
  const jsonBlocks = [graph, crumbs].filter(Boolean);

  const tags = [
    `<title>${escAttr(meta.title)}</title>`,
    `<meta name="description" content="${escAttr(meta.description)}">`,
    `<link rel="canonical" href="${escAttr(canonical)}">`,
    `<meta name="robots" content="index,follow,max-image-preview:large">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escAttr(BRAND.name)}">`,
    `<meta property="og:locale" content="en_UG">`,
    `<meta property="og:url" content="${escAttr(canonical)}">`,
    `<meta property="og:title" content="${escAttr(meta.title)}">`,
    `<meta property="og:description" content="${escAttr(meta.description)}">`,
    `<meta property="og:image" content="${escAttr(ogImage)}">`,
    `<meta property="og:image:alt" content="${escAttr(`${BRAND.name} logo`)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escAttr(meta.title)}">`,
    `<meta name="twitter:description" content="${escAttr(meta.description)}">`,
    `<meta name="twitter:image" content="${escAttr(ogImage)}">`,
    `<link rel="icon" href="${escAttr(logoUrl)}" type="image/png">`,
    `<link rel="apple-touch-icon" href="${escAttr(absoluteUrl('/brand/dkasu-icon.png'))}">`,
    ...jsonBlocks.map(
      (block) =>
        `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</script>`,
    ),
  ];
  return tags.join('');
}

export function sitemapXml() {
  const servicePaths = Object.keys(SERVICE_SEO).map((slug) => `/services/${slug}`);
  const paths = [...PUBLIC_PAGES.map((p) => p.path), ...servicePaths];
  const urls = paths
    .map((path) => {
      const loc = absoluteUrl(path === '/' ? '/' : path);
      return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /api

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
}

export function notFoundPage({ css = '', logoSrc = '' } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Page not found | DKASU</title><meta name="description" content="The page you requested is not available on the DKASU website."><style>${css}</style></head><body><main class="auth-page"><div class="auth-card"><a href="/" class="brand-image-link" aria-label="DKASU home">${
    logoSrc ? `<img class="brand-logo" src="${logoSrc}" alt="DKASU">` : 'DKASU'
  }</a><p class="kicker">404</p><h1>Page not found</h1><p>This page is not part of the public DKASU website. Return home to explore our products and services.</p><a class="primary-btn" href="/">Back to DKASU</a></div></main></body></html>`;
}

export const __seoTest = {
  SERVICE_SEO,
  PUBLIC_PAGES,
};
