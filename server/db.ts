import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  ContactInquiry,
  DesignerProfile,
  OrderStatus,
  PaymentStatus,
  PortfolioItem,
  PublicUser,
  ServiceCategory,
  ShopCategory,
  ShopOrder,
  ShopOrderStatus,
  ShopProduct,
  ShopPromotion,
  SiteContent,
  StudioOrder,
  StudioService,
  UserRole,
} from '../src/types/studio.ts';

export interface StoredUser extends PublicUser {
  passwordHash: string;
}

export interface StudioDatabase {
  users: StoredUser[];
  services: StudioService[];
  designers: DesignerProfile[];
  portfolio: PortfolioItem[];
  orders: StudioOrder[];
  inquiries: ContactInquiry[];
  siteContent: SiteContent;
  shopCategories: ShopCategory[];
  shopProducts: ShopProduct[];
  shopPromotions: ShopPromotion[];
  shopOrders: ShopOrder[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'ganzo-db.json');
const SECRET_FILE = path.join(DATA_DIR, '.session-secret');

function ensureDirs(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  ensureDirs();
  if (fs.existsSync(SECRET_FILE)) {
    return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, secret, 'utf8');
  return secret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash: _ignored, ...pub } = user;
  return pub;
}

export function signToken(userId: string, role: UserRole): string {
  const payload = Buffer.from(
    JSON.stringify({
      uid: userId,
      role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }),
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { uid: string; role: UserRole } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid: string;
      role: UserRole;
      exp: number;
    };
    if (!decoded.uid || !decoded.exp || decoded.exp < Date.now()) {
      return null;
    }
    return { uid: decoded.uid, role: decoded.role };
  } catch {
    return null;
  }
}

function createSeedDatabase(): StudioDatabase {
  const now = '2026-11-18T10:30:00.000Z';
  const users: StoredUser[] = [
    {
      id: 'usr_admin_01',
      name: 'Karim Ben Youssef',
      email: 'admin@ganzostudio.tn',
      phone: '+216 71 860 120',
      companyName: 'GANZO STUDIO HQ',
      city: 'Tunis',
      role: 'administrator',
      createdAt: '2026-01-10T09:00:00.000Z',
      passwordHash: hashPassword('GanzoAdmin2026!'),
    },
    {
      id: 'usr_pm_01',
      name: 'Nour Haddad',
      email: 'pm@ganzostudio.tn',
      phone: '+216 71 860 121',
      companyName: 'GANZO STUDIO',
      city: 'Tunis',
      role: 'project_manager',
      createdAt: '2026-01-12T09:00:00.000Z',
      passwordHash: hashPassword('GanzoPM2026!'),
    },
    {
      id: 'usr_des_01',
      name: 'Ines Ben Ali',
      email: 'ines@ganzostudio.tn',
      phone: '+216 71 860 122',
      companyName: 'GANZO STUDIO',
      city: 'Tunis',
      role: 'graphic_designer',
      designerId: 'des_01',
      createdAt: '2026-01-15T09:00:00.000Z',
      passwordHash: hashPassword('GanzoDesign2026!'),
    },
    {
      id: 'usr_prod_01',
      name: 'Sami Mejri',
      email: 'prod@ganzostudio.tn',
      phone: '+216 71 860 123',
      companyName: 'GANZO Print Atelier',
      city: 'Ariana',
      role: 'production_manager',
      createdAt: '2026-01-18T09:00:00.000Z',
      passwordHash: hashPassword('GanzoProd2026!'),
    },
    {
      id: 'usr_sup_01',
      name: 'Lina Jaziri',
      email: 'support@ganzostudio.tn',
      phone: '+216 71 860 124',
      companyName: 'GANZO Client Desk',
      city: 'Tunis',
      role: 'customer_support',
      createdAt: '2026-01-20T09:00:00.000Z',
      passwordHash: hashPassword('GanzoSupport2026!'),
    },
    {
      id: 'usr_cust_01',
      name: 'Yassine Trabelsi',
      email: 'client@carthage.tn',
      phone: '+216 55 412 890',
      companyName: 'Café Carthage Roasters',
      city: 'La Marsa, Tunis',
      role: 'customer',
      createdAt: '2026-06-04T11:20:00.000Z',
      passwordHash: hashPassword('Client2026!'),
    },
  ];

  const services: StudioService[] = [
    // TEXTILE PRINTING
    {
      id: 'srv_tex_tshirt',
      category: 'textile',
      name: 'Custom T-Shirts',
      subtitle: '190gsm–240gsm Combed Cotton · DTF, Screen Print & Embroidery',
      description: 'Premium heavyweight crewnecks and oversized tees personalized with crisp screen printing, vibrant DTF transfers, or high-density chest embroidery.',
      basePriceTnd: 32,
      unitLabel: 'piece',
      minQuantity: 10,
      leadTimeDays: 6,
      options: ['Black #111111', 'Optic White #FFFFFF', 'Slate Charcoal', 'Forest Green', 'Custom Pantone'],
      active: true,
    },
    {
      id: 'srv_tex_hoodie',
      category: 'textile',
      name: 'Hoodies & Sweatshirts',
      subtitle: '380gsm–420gsm Brushed Fleece · Streetwear & Corporate Grade',
      description: 'Structured heavyweight hoodies and crew sweatshirts built for emerging Tunisian fashion labels, universities, and corporate drops.',
      basePriceTnd: 78,
      unitLabel: 'piece',
      minQuantity: 10,
      leadTimeDays: 8,
      options: ['Black #111111', 'Heather Ash', 'Deep Navy', 'Sandstone'],
      active: true,
    },
    {
      id: 'srv_tex_polo',
      category: 'textile',
      name: 'Polo Shirts',
      subtitle: '220gsm Piqué Cotton · Precision Logo Embroidery',
      description: 'Breathable piqué knit polos tailored for hospitality, retail teams, and executive corporate events.',
      basePriceTnd: 46,
      unitLabel: 'piece',
      minQuantity: 15,
      leadTimeDays: 7,
      options: ['Black #111111', 'White', 'Navy Blue', 'Graphite'],
      active: true,
    },
    {
      id: 'srv_tex_pants',
      category: 'textile',
      name: 'Pants & Joggers',
      subtitle: 'Heavy Fleece & Twill · Woven Labels & Leg Prints',
      description: 'Custom-branded joggers, cargo trousers, and hospitality pants with tonal embroidery or high-durability transfers.',
      basePriceTnd: 68,
      unitLabel: 'piece',
      minQuantity: 15,
      leadTimeDays: 9,
      options: ['Black #111111', 'Charcoal', 'Olive'],
      active: true,
    },
    {
      id: 'srv_tex_cap',
      category: 'textile',
      name: 'Caps & Headwear',
      subtitle: '6-Panel Structured & Dad Caps · 3D Puff Embroidery',
      description: 'Custom embroidered twill caps, trucker hats, and beanies with clean stitch registration.',
      basePriceTnd: 26,
      unitLabel: 'piece',
      minQuantity: 20,
      leadTimeDays: 6,
      options: ['Black #111111', 'White', 'Stone', 'Navy'],
      active: true,
    },
    {
      id: 'srv_tex_workwear',
      category: 'textile',
      name: 'Workwear & Uniforms',
      subtitle: 'Chef Aprons, Lab Coats, Hi-Vis & Hospitality Kits',
      description: 'Industrial-wash resistant uniforms for restaurants, clinics, logistics fleets, and retail spaces across Tunisia.',
      basePriceTnd: 58,
      unitLabel: 'set',
      minQuantity: 10,
      leadTimeDays: 8,
      options: ['Black Canvas', 'Navy Twill', 'White Poplin'],
      active: true,
    },
    {
      id: 'srv_tex_events',
      category: 'textile',
      name: 'Brand & Event Collections',
      subtitle: 'Full Merch Capsules · Custom Tags, Packaging & Sizing',
      description: 'End-to-end event staff apparel, VIP merch boxes, and capsule drops with custom neck labels and polybagging.',
      basePriceTnd: 45,
      unitLabel: 'unit',
      minQuantity: 25,
      leadTimeDays: 10,
      options: ['Multi-Garment Kit', 'Custom Woven Neck Tag'],
      active: true,
    },

    // PAPER PRINTING
    {
      id: 'srv_pap_cards',
      category: 'paper',
      name: 'Business Cards (Cartes de visite)',
      subtitle: '350g–450g Coated, Cotton or Soft-Touch · Foil & Spot UV',
      description: 'Crisp double-sided business cards with matte lamination, cyan or metallic foil stamping, and precision die-cut corners.',
      basePriceTnd: 85,
      unitLabel: 'pack of 250',
      minQuantity: 250,
      leadTimeDays: 3,
      options: ['85x55mm Standard', '85x55mm Rounded', 'Square 65x65mm'],
      active: true,
    },
    {
      id: 'srv_pap_flyers',
      category: 'paper',
      name: 'Flyers & Leaflets',
      subtitle: '135g–250g Gloss or Matte Silk · A5, A4 & DL',
      description: 'High-saturation offset and digital flyers engineered for retail launches, restaurant openings, and cultural festivals.',
      basePriceTnd: 120,
      unitLabel: 'pack of 500',
      minQuantity: 250,
      leadTimeDays: 3,
      options: ['A5', 'A4', 'DL (99x210mm)'],
      active: true,
    },
    {
      id: 'srv_pap_posters',
      category: 'paper',
      name: 'Posters & Affiches',
      subtitle: 'A3, A2, B2 & Large Format Indoor/Outdoor',
      description: 'Gallery-grade posters and commercial street affiches with sharp typographic detail and UV-stable inks.',
      basePriceTnd: 95,
      unitLabel: 'pack of 25',
      minQuantity: 10,
      leadTimeDays: 3,
      options: ['A3 (297x420mm)', 'A2 (420x594mm)', '50x70cm'],
      active: true,
    },
    {
      id: 'srv_pap_brochures',
      category: 'paper',
      name: 'Brochures & Folded Leaflets',
      subtitle: 'Bi-Fold, Tri-Fold & Z-Fold · Creased & Trimmed',
      description: 'Precision-scored corporate brochures and product guides printed on 170g–250g matte silk stock.',
      basePriceTnd: 240,
      unitLabel: 'pack of 250',
      minQuantity: 100,
      leadTimeDays: 4,
      options: ['A4 Tri-Fold', 'A4 Bi-Fold', 'A5 Bi-Fold'],
      active: true,
    },
    {
      id: 'srv_pap_catalogues',
      category: 'paper',
      name: 'Catalogues & Lookbooks',
      subtitle: 'Saddle-Stitched or PUR Perfect Bound · 16 to 120 Pages',
      description: 'Editorial lookbooks, real estate dossiers, and B2B product catalogues with laminated heavy covers.',
      basePriceTnd: 680,
      unitLabel: 'pack of 50',
      minQuantity: 25,
      leadTimeDays: 7,
      options: ['A4 Portrait', 'A5 Compact', 'Square 210x210mm'],
      active: true,
    },
    {
      id: 'srv_pap_menus',
      category: 'paper',
      name: 'Restaurant Menus',
      subtitle: 'Water-Resistant Matte Film, Hardcover or Textured Stock',
      description: 'Durable hospitality menus built for cafés, fine dining, and beach clubs with wipe-clean protective finishes.',
      basePriceTnd: 320,
      unitLabel: 'pack of 30',
      minQuantity: 15,
      leadTimeDays: 5,
      options: ['A4 Flat Laminated', 'A3 Folded', 'Hardcover Screw-Post'],
      active: true,
    },
    {
      id: 'srv_pap_stickers',
      category: 'paper',
      name: 'Stickers & Product Labels',
      subtitle: 'Die-Cut Vinyl, Transparent, Kraft & Roll Labels',
      description: 'Custom-contoured waterproof stickers and bottle/jar labels for olive oil, cosmetics, coffee bags, and packaging.',
      basePriceTnd: 110,
      unitLabel: 'pack of 500',
      minQuantity: 100,
      leadTimeDays: 4,
      options: ['Die-Cut Sheets', 'Roll Labels', 'Clear Vinyl'],
      active: true,
    },
    {
      id: 'srv_pap_invitations',
      category: 'paper',
      name: 'Invitations & Wedding Cards',
      subtitle: 'Textured Fine Art Paper, Foil Stamping & Custom Envelopes',
      description: 'Bespoke wedding suites, gala invitations, and VIP corporate passes with tactile paper stocks.',
      basePriceTnd: 290,
      unitLabel: 'pack of 100',
      minQuantity: 50,
      leadTimeDays: 6,
      options: ['A5 Suite + Envelope', 'Square 150x150mm', 'Embossed Foil'],
      active: true,
    },
    {
      id: 'srv_pap_packaging',
      category: 'paper',
      name: 'Packaging & Promotional Boxes',
      subtitle: 'Folding Cartons, Mailer Boxes, Sleeves & Paper Bags',
      description: 'Custom structural boxes, branded takeaway bags, and tissue/sleeve wraps engineered for retail unboxing.',
      basePriceTnd: 490,
      unitLabel: 'pack of 100',
      minQuantity: 50,
      leadTimeDays: 9,
      options: ['Mailer Box', 'Product Tuck Box', 'Luxury Shopping Bag'],
      active: true,
    },

    // GRAPHIC DESIGN
    {
      id: 'srv_des_logo',
      category: 'design',
      name: 'Logo Design',
      subtitle: 'Primary Mark, Monochrome Lockups & Vector Master Files',
      description: 'Three conceptual directions refined through GANZO studio critique into crisp AI, SVG, EPS, and print-ready marks.',
      basePriceTnd: 450,
      unitLabel: 'project',
      minQuantity: 1,
      leadTimeDays: 6,
      options: ['Wordmark + Symbol', 'Monogram Crest', 'Minimalist Typographic'],
      active: true,
    },
    {
      id: 'srv_des_identity',
      category: 'design',
      name: 'Complete Brand Identity',
      subtitle: 'Logo System, Typography, Palette, Guidelines & Stationery',
      description: 'Comprehensive visual identity system ready for digital platforms, signage, packaging, and apparel production.',
      basePriceTnd: 1250,
      unitLabel: 'package',
      minQuantity: 1,
      leadTimeDays: 12,
      options: ['Startup Identity Kit', 'Full Brand Book + Print Files'],
      active: true,
    },
    {
      id: 'srv_des_social',
      category: 'design',
      name: 'Social Media Design System',
      subtitle: 'Modular Campaign Templates, Carousels & Story Grids',
      description: 'Cohesive Instagram, LinkedIn, and TikTok visual templates tailored to your product launches and seasonal promos.',
      basePriceTnd: 380,
      unitLabel: 'pack of 15',
      minQuantity: 1,
      leadTimeDays: 5,
      options: ['Launch Pack (15 visuals)', 'Monthly Brand Kit (30 visuals)'],
      active: true,
    },
    {
      id: 'srv_des_poster',
      category: 'design',
      name: 'Posters & Flyers Design',
      subtitle: 'Print-Ready CMYK Layouts for Events & Retail',
      description: 'Editorial poster compositions and promotional flyers crafted with strict pre-press bleed and color calibration.',
      basePriceTnd: 180,
      unitLabel: 'design',
      minQuantity: 1,
      leadTimeDays: 3,
      options: ['Single Poster Layout', 'Event Poster + Social Resize'],
      active: true,
    },
    {
      id: 'srv_des_cards',
      category: 'design',
      name: 'Business Card Design',
      subtitle: 'Double-Sided Layout with Foil/Spot UV Separation',
      description: 'Clean executive card layout prepared specifically for luxury print finishes.',
      basePriceTnd: 110,
      unitLabel: 'design',
      minQuantity: 1,
      leadTimeDays: 2,
      options: ['Single Profile', 'Team Master Template'],
      active: true,
    },
    {
      id: 'srv_des_packaging',
      category: 'design',
      name: 'Packaging Design',
      subtitle: 'Dieline Graphics, Labels, Box Artwork & 3D Mockup',
      description: 'Shelf-ready structural artwork for cosmetics, food & beverage, coffee roasters, and e-commerce shipping boxes.',
      basePriceTnd: 540,
      unitLabel: 'SKU',
      minQuantity: 1,
      leadTimeDays: 7,
      options: ['Box + Dieline', 'Bottle/Jar Label Series'],
      active: true,
    },
    {
      id: 'srv_des_menu',
      category: 'design',
      name: 'Menu Design',
      subtitle: 'Editorial Hospitality Typography & Section Hierarchy',
      description: 'Readable, appetizing multi-page or single-sheet menu systems designed for cafés, bakeries, and restaurants.',
      basePriceTnd: 260,
      unitLabel: 'menu',
      minQuantity: 1,
      leadTimeDays: 4,
      options: ['Single Sheet Front/Back', 'Multi-Page Booklet'],
      active: true,
    },
    {
      id: 'srv_des_campaign',
      category: 'design',
      name: 'Advertising Campaigns',
      subtitle: 'Omnichannel Key Visuals · Billboards, Print & Digital',
      description: 'High-impact campaign key visuals adapted across outdoor 4x3 billboards, social ads, and in-store POS displays.',
      basePriceTnd: 890,
      unitLabel: 'campaign',
      minQuantity: 1,
      leadTimeDays: 9,
      options: ['Key Visual + 5 Formats', 'Full 360 Campaign'],
      active: true,
    },
    {
      id: 'srv_des_illustration',
      category: 'design',
      name: 'Custom Illustration',
      subtitle: 'Editorial Vector, Apparel Graphics & Mascot Art',
      description: 'Original artwork engineered for screen-printed streetwear, packaging storytelling, and editorial publications.',
      basePriceTnd: 340,
      unitLabel: 'artwork',
      minQuantity: 1,
      leadTimeDays: 5,
      options: ['Apparel Graphic', 'Packaging Illustration'],
      active: true,
    },
    {
      id: 'srv_des_motion',
      category: 'design',
      name: 'Motion Graphics',
      subtitle: 'Logo Reveals, Product Reels & Animated Event Screens',
      description: 'Crisp 1080p/4K animated brand stings, digital signage loops, and product promo reels.',
      basePriceTnd: 480,
      unitLabel: 'video',
      minQuantity: 1,
      leadTimeDays: 6,
      options: ['15s Logo & Product Loop', '30s Launch Reel'],
      active: true,
    },
  ];

  const designers: DesignerProfile[] = [
    {
      id: 'des_01',
      userId: 'usr_des_01',
      name: 'Ines Ben Ali',
      roleTitle: 'Lead Brand & Identity Designer',
      bio: '8 years shaping distinctive visual identities for Tunisian hospitality brands, startups, and cultural festivals. Specializes in geometric typography and print-ready brand books.',
      specialties: ['Brand Identity', 'Logo Systems', 'Editorial Typography'],
      skills: ['Adobe Illustrator', 'InDesign', 'Brand Architecture', 'Pre-Press Foil Specs'],
      languages: ['Arabic', 'French', 'English'],
      experienceYears: 8,
      avatarInitials: 'IB',
      portraitTone: '#111111',
      portfolioHighlights: [
        {
          title: 'Café Carthage Roasters Identity',
          client: 'Carthage Roasters',
          category: 'Brand Identity',
          outcome: 'Unified packaging, cup sleeves, and barista uniforms across 3 Tunis cafés.',
        },
        {
          title: 'Zitouna Olive Reserve',
          client: 'Domaine Zitouna',
          category: 'Packaging & Identity',
          outcome: 'Export-ready bottle labels launched in 14 European specialty stores.',
        },
      ],
      featured: true,
    },
    {
      id: 'des_02',
      userId: 'usr_des_02',
      name: 'Mehdi Gharbi',
      roleTitle: 'Senior Textile & Apparel Specialist',
      bio: 'Combines streetwear graphic sensibility with deep technical mastery of screen-print color separation, DTF calibration, and high-density embroidery.',
      specialties: ['Textile Graphics', 'Color Separation', 'Merchandise Drops'],
      skills: ['Screen Print Separation', 'Embroidery Digitizing', 'Apparel Mockups', 'Custom Illustration'],
      languages: ['Arabic', 'French', 'English'],
      experienceYears: 6,
      avatarInitials: 'MG',
      portraitTone: '#1F2937',
      portfolioHighlights: [
        {
          title: 'Carthage Run Club Capsule',
          client: 'CRC Tunis',
          category: 'Textile Printing',
          outcome: '450 technical tees and heavyweight hoodies delivered in 7 days.',
        },
        {
          title: 'Medina Sound Festival Merch',
          client: 'Medina Sound',
          category: 'Event Apparel',
          outcome: 'Sold out 100% of festival capsule inventory on opening night.',
        },
      ],
      featured: true,
    },
    {
      id: 'des_03',
      userId: 'usr_des_03',
      name: 'Salma Khelifi',
      roleTitle: 'Print Production & Editorial Designer',
      bio: 'Precision-obsessed print specialist guiding multi-page catalogues, luxury menus, and foil-stamped stationery through GANZO’s pre-press and finishing lines.',
      specialties: ['Commercial Print', 'Menus & Catalogues', 'Foil & Die-Cut Finishing'],
      skills: ['CMYK Color Management', 'InDesign Grids', 'Imposition', 'Paper Stock Pairing'],
      languages: ['Arabic', 'French', 'Italian'],
      experienceYears: 7,
      avatarInitials: 'SK',
      portraitTone: '#27272A',
      portfolioHighlights: [
        {
          title: 'Bistro La Marsa Menu System',
          client: 'Bistro La Marsa',
          category: 'Paper Printing',
          outcome: 'Soft-touch waterproof menus + matching embossed bill folders.',
        },
      ],
      featured: true,
    },
    {
      id: 'des_04',
      userId: 'usr_des_04',
      name: 'Youssef Bouazizi',
      roleTitle: 'Motion & Campaign Art Director',
      bio: 'Crafts kinetic typography, product launch reels, and omnichannel campaign visuals that bridge physical signage and social storytelling.',
      specialties: ['Motion Graphics', 'Advertising Campaigns', 'Social Media Systems'],
      skills: ['After Effects', 'Cinema 4D', 'Key Visual Direction', 'Event LED Screens'],
      languages: ['Arabic', 'French', 'English'],
      experienceYears: 5,
      avatarInitials: 'YB',
      portraitTone: '#18181B',
      portfolioHighlights: [
        {
          title: 'Ksar Tech Summit 2026',
          client: 'Ksar Venture Hub',
          category: 'Campaign & Motion',
          outcome: 'Stage motion loops, wayfinding totems, and 600 attendee kits.',
        },
      ],
      featured: false,
    },
    {
      id: 'des_05',
      userId: 'usr_des_05',
      name: 'Amira Mansouri',
      roleTitle: 'Packaging & Custom Illustration Lead',
      bio: 'Transforms structural dielines and custom vector illustrations into memorable retail boxes, cosmetic tubes, and specialty food labels.',
      specialties: ['Packaging Design', 'Custom Illustration', 'Label Systems'],
      skills: ['Structural Dielines', 'Vector Illustration', 'Retail Unboxing', 'Spot UV Finishing'],
      languages: ['Arabic', 'French'],
      experienceYears: 6,
      avatarInitials: 'AM',
      portraitTone: '#09090B',
      portfolioHighlights: [
        {
          title: 'Sahara Botanicals Skincare',
          client: 'Sahara Labs',
          category: 'Packaging Design',
          outcome: '8-SKU folding carton line with tactile matte varnish and cyan foil.',
        },
      ],
      featured: false,
    },
  ];

  const portfolio: PortfolioItem[] = [
    {
      id: 'port_01',
      title: 'Café Carthage Roasters — Brand, Packaging & Barista Uniforms',
      client: 'Café Carthage Roasters',
      category: 'Brand Identity',
      year: '2026',
      summary: 'Complete identity overhaul spanning coffee pouch labels, embossed takeaway sleeves, laminated menus, and embroidered black canvas barista aprons.',
      deliverables: ['Logo & Brand Book', '2,000 Matte Pouch Labels', '40 Embroidered Aprons & Polos'],
      metric: '3 Tunis locations launched on unified print & apparel specs in 14 days',
      palette: ['#111111', '#00FFFF', '#F4F4F4'],
      mockupType: 'packaging',
      featured: true,
    },
    {
      id: 'port_02',
      title: 'Carthage Run Club — Technical Drop & Event Merch',
      client: 'Carthage Run Club',
      category: 'Textile Printing',
      year: '2026',
      summary: 'Custom-illustrated back graphics and reflective DTF chest marks across 220gsm breathable tees, 400gsm post-run hoodies, and structured caps.',
      deliverables: ['Custom Apparel Graphics', '250 Screen-Printed Tees', '120 Heavyweight Hoodies'],
      metric: '100% QC pass rate across 370 garments with zero wash-fade complaints',
      palette: ['#111111', '#00FFFF', '#D4D4D8'],
      mockupType: 'apparel',
      featured: true,
    },
    {
      id: 'port_03',
      title: 'Tunis Design Week — Exhibition Posters & Catalogues',
      client: 'Tunis Design Collective',
      category: 'Paper Printing',
      year: '2026',
      summary: 'High-contrast 50x70cm street posters, 96-page PUR-bound exhibition catalogues, and VIP press badges printed in Tunis.',
      deliverables: ['300 Exhibition Posters', '400 PUR Catalogues', 'Wayfinding Signage'],
      metric: 'Delivered 48 hours ahead of vernissage across 4 venues',
      palette: ['#111111', '#FFFFFF', '#00FFFF'],
      mockupType: 'print',
      featured: true,
    },
    {
      id: 'port_04',
      title: 'Sahara Botanicals — Structural Packaging & Campaign',
      client: 'Sahara Labs Tunisia',
      category: 'Graphic Design',
      year: '2025',
      summary: 'Custom botanical illustration series, structural folding carton dielines, and social launch motion kit for an organic skincare debut.',
      deliverables: ['8-SKU Packaging Dielines', 'Custom Vector Botanicals', 'Motion Launch Kit'],
      metric: 'Secured placement in 22 pharmacies & concept stores nationwide',
      palette: ['#111111', '#E4E4E7', '#00FFFF'],
      mockupType: 'identity',
      featured: true,
    },
    {
      id: 'port_05',
      title: 'Bistro La Marsa — Waterproof Menus & Foil Business Cards',
      client: 'Groupe La Marsa Hospitality',
      category: 'Paper Printing',
      year: '2026',
      summary: 'Editorial typography and spill-proof soft-touch laminated menus paired with 450g duplexed business cards.',
      deliverables: ['Menu Design & Layout', '60 Soft-Touch Menus', '1,000 Executive Cards'],
      metric: 'Cut annual menu reprint waste by 65% with durable laminated stock',
      palette: ['#111111', '#F4F4F4', '#00FFFF'],
      mockupType: 'print',
      featured: false,
    },
    {
      id: 'port_06',
      title: 'Ksar Tech Summit — 600-Attendee Merch & Stage Visuals',
      client: 'Ksar Venture Hub',
      category: 'Textile Printing',
      year: '2026',
      summary: 'Turnkey conference kit including organic cotton tees, tote bags, lanyards, printed badges, and 4K stage motion graphics.',
      deliverables: ['600 Event T-Shirts', '600 Printed Badges & Guides', 'Stage Motion Stings'],
      metric: 'Single studio invoice replaced 4 separate vendors',
      palette: ['#111111', '#00FFFF', '#FFFFFF'],
      mockupType: 'apparel',
      featured: false,
    },
  ];

  const orders: StudioOrder[] = [
    {
      id: 'ord_142',
      trackingCode: 'GNZ-2026-0142',
      customerId: 'usr_cust_01',
      customerName: 'Yassine Trabelsi',
      customerEmail: 'client@carthage.tn',
      customerPhone: '+216 55 412 890',
      companyName: 'Café Carthage Roasters',
      category: 'textile',
      serviceId: 'srv_tex_tshirt',
      serviceName: 'Custom T-Shirts',
      status: 'Awaiting Customer Validation',
      specifications: {
        productType: '220gsm Heavyweight Staff T-Shirt',
        color: 'Black',
        colorHex: '#111111',
        sizes: ['S (8)', 'M (18)', 'L (16)', 'XL (8)'],
        printMethod: 'DTF + Chest Embroidery',
        quantity: 50,
        deliveryMethod: 'Studio Pickup (Lac 2, Tunis)',
        deliveryAddress: 'Les Berges du Lac 2, Tunis',
        needsCustomDesign: true,
        creativeBrief:
          'Minimalist crest logo on left chest in cyan/white, large typographic back print reading CARTHAGE ROASTERS EST. 2021 with coffee bean line-art.',
      },
      estimatedPriceTnd: 1600,
      quotedPriceTnd: 1520,
      paymentStatus: 'Deposit Paid',
      invoiceNumber: 'INV-GNZ-0142',
      assignedDesignerId: 'des_01',
      assignedDesignerName: 'Ines Ben Ali',
      assignedProductionLead: 'Sami Mejri',
      productionNotes: 'Chest crest digitized at 8,400 stitches; back DTF film calibrated.',
      referenceFiles: [
        {
          id: 'ref_1',
          name: 'carthage-roasters-crest-reference.svg',
          url: '/api/sample-asset/carthage-ref',
          size: 48200,
          mimeType: 'image/svg+xml',
          uploadedAt: '2026-11-15T09:12:00.000Z',
        },
      ],
      designPreviews: [
        {
          id: 'prv_1',
          version: 1,
          title: 'Front Chest & Back Print Proof v1',
          notes: 'Positioned crest 18cm below collar seam. Back typography set at 28cm width for M–XL balance.',
          fileUrl: '/api/sample-asset/preview-tshirt-v1',
          fileName: 'GNZ-0142-Proof-v1.svg',
          uploadedBy: 'Ines Ben Ali (via GANZO Studio)',
          uploadedAt: '2026-11-18T14:20:00.000Z',
        },
      ],
      revisions: [],
      messages: [
        {
          id: 'msg_1',
          senderName: 'Yassine Trabelsi',
          senderRole: 'customer',
          body: 'Can we make sure the back lettering stays crisp in optic white on the black fabric?',
          createdAt: '2026-11-16T10:05:00.000Z',
        },
        {
          id: 'msg_2',
          senderName: 'GANZO Studio Desk',
          senderRole: 'project_manager',
          body: 'Confirmed—our design team set a double-pass white underbase for maximum opacity. Proof v1 is now ready for your validation.',
          createdAt: '2026-11-18T14:25:00.000Z',
        },
      ],
      timeline: [
        {
          status: 'New Request',
          note: 'Customer submitted custom staff T-shirt order (50 pcs).',
          actorName: 'Yassine Trabelsi',
          actorRole: 'Customer',
          timestamp: '2026-11-15T09:12:00.000Z',
        },
        {
          status: 'Under Review',
          note: 'Order specs reviewed by GANZO Project Management.',
          actorName: 'Nour Haddad',
          actorRole: 'Project Manager',
          timestamp: '2026-11-15T11:30:00.000Z',
        },
        {
          status: 'Quotation Sent',
          note: 'Official quote of 1,520 TND sent including custom back typography.',
          actorName: 'Nour Haddad',
          actorRole: 'Project Manager',
          timestamp: '2026-11-15T15:00:00.000Z',
        },
        {
          status: 'Awaiting Approval',
          note: '50% deposit confirmed. Preparing internal studio brief.',
          actorName: 'Karim Ben Youssef',
          actorRole: 'Administrator',
          timestamp: '2026-11-16T09:00:00.000Z',
        },
        {
          status: 'Design in Progress',
          note: 'Assigned internally to GANZO Creative Team.',
          actorName: 'Nour Haddad',
          actorRole: 'Project Manager',
          timestamp: '2026-11-16T10:40:00.000Z',
        },
        {
          status: 'Awaiting Customer Validation',
          note: 'Proof v1 uploaded and awaiting client approval.',
          actorName: 'Ines Ben Ali',
          actorRole: 'Graphic Designer',
          timestamp: '2026-11-18T14:20:00.000Z',
        },
      ],
      createdAt: '2026-11-15T09:12:00.000Z',
      updatedAt: '2026-11-18T14:25:00.000Z',
    },
    {
      id: 'ord_143',
      trackingCode: 'GNZ-2026-0143',
      customerId: 'usr_cust_01',
      customerName: 'Yassine Trabelsi',
      customerEmail: 'client@carthage.tn',
      customerPhone: '+216 55 412 890',
      companyName: 'Café Carthage Roasters',
      category: 'paper',
      serviceId: 'srv_pap_menus',
      serviceName: 'Restaurant Menus',
      status: 'In Production',
      specifications: {
        productType: 'A4 Double-Sided Laminated Menus',
        format: 'A4 (210x297mm)',
        paperType: '350g Matte Coated + Anti-Scratch Film',
        finish: 'Matte Waterproof Encapsulation',
        quantity: 40,
        deliveryMethod: 'Grand Tunis Courier',
        deliveryAddress: 'Avenue Habib Bourguiba, La Marsa',
        needsCustomDesign: false,
        creativeBrief: 'Print-ready PDF provided. Ensure rich black #111111 background remains uniform across all 40 copies.',
      },
      estimatedPriceTnd: 410,
      quotedPriceTnd: 390,
      paymentStatus: 'Paid in Full',
      invoiceNumber: 'INV-GNZ-0143',
      assignedDesignerId: 'des_03',
      assignedDesignerName: 'Salma Khelifi',
      assignedProductionLead: 'Sami Mejri',
      productionNotes: 'Digital offset run complete; moving to hydraulic lamination line.',
      referenceFiles: [],
      designPreviews: [
        {
          id: 'prv_2',
          version: 1,
          title: 'Pre-Press Menu Layout Proof',
          notes: 'Bleed 3mm verified, CMYK rich black C40 M30 Y30 K100 applied.',
          fileUrl: '/api/sample-asset/preview-menu-v1',
          fileName: 'GNZ-0143-Prepress.svg',
          uploadedBy: 'Salma Khelifi (via GANZO Studio)',
          uploadedAt: '2026-11-12T16:10:00.000Z',
        },
      ],
      revisions: [],
      messages: [],
      timeline: [
        {
          status: 'New Request',
          note: 'Order received for 40 A4 laminated café menus.',
          actorName: 'Yassine Trabelsi',
          actorRole: 'Customer',
          timestamp: '2026-11-11T09:00:00.000Z',
        },
        {
          status: 'Quotation Sent',
          note: 'Quote of 390 TND approved and paid.',
          actorName: 'Nour Haddad',
          actorRole: 'Project Manager',
          timestamp: '2026-11-11T14:00:00.000Z',
        },
        {
          status: 'Awaiting Customer Validation',
          note: 'Pre-press proof approved by customer.',
          actorName: 'Yassine Trabelsi',
          actorRole: 'Customer',
          timestamp: '2026-11-13T10:00:00.000Z',
        },
        {
          status: 'In Production',
          note: 'Printing and matte lamination underway in Ariana atelier.',
          actorName: 'Sami Mejri',
          actorRole: 'Production Manager',
          timestamp: '2026-11-17T08:30:00.000Z',
        },
      ],
      createdAt: '2026-11-11T09:00:00.000Z',
      updatedAt: '2026-11-17T08:30:00.000Z',
    },
    {
      id: 'ord_144',
      trackingCode: 'GNZ-2026-0144',
      customerId: 'usr_cust_01',
      customerName: 'Yassine Trabelsi',
      customerEmail: 'client@carthage.tn',
      customerPhone: '+216 55 412 890',
      companyName: 'Café Carthage Roasters',
      category: 'design',
      serviceId: 'srv_des_packaging',
      serviceName: 'Packaging Design',
      status: 'Quotation Sent',
      specifications: {
        productType: '250g Coffee Bag Label & Box Sleeve',
        format: '110x160mm',
        paperType: 'Textured Matte Label + Kraft Sleeve',
        finish: 'Cyan Foil Accent',
        quantity: 1,
        deliveryMethod: 'Studio Pickup (Lac 2, Tunis)',
        needsCustomDesign: true,
        creativeBrief: 'Seasonal winter single-origin coffee label series (3 origin variants: Ethiopia, Colombia, Yemen) matching our core Carthage Roasters aesthetic.',
      },
      estimatedPriceTnd: 540,
      quotedPriceTnd: 620,
      paymentStatus: 'Unpaid',
      invoiceNumber: 'INV-GNZ-0144',
      assignedDesignerId: null,
      assignedDesignerName: null,
      assignedProductionLead: null,
      productionNotes: '',
      referenceFiles: [],
      designPreviews: [],
      revisions: [],
      messages: [],
      timeline: [
        {
          status: 'New Request',
          note: 'Packaging design brief submitted for 3 coffee origin SKUs.',
          actorName: 'Yassine Trabelsi',
          actorRole: 'Customer',
          timestamp: '2026-11-18T11:00:00.000Z',
        },
        {
          status: 'Under Review',
          note: 'Brief reviewed for 3-SKU variant structure.',
          actorName: 'Nour Haddad',
          actorRole: 'Project Manager',
          timestamp: '2026-11-18T13:15:00.000Z',
        },
        {
          status: 'Quotation Sent',
          note: 'Quotation of 620 TND sent covering master dieline + 3 flavor variants.',
          actorName: 'Nour Haddad',
          actorRole: 'Project Manager',
          timestamp: '2026-11-18T16:40:00.000Z',
        },
      ],
      createdAt: '2026-11-18T11:00:00.000Z',
      updatedAt: now,
    },
    {
      id: 'ord_145',
      trackingCode: 'GNZ-2026-0145',
      customerId: 'usr_cust_02',
      customerName: 'Meriem Chaabane',
      customerEmail: 'meriem@atlas-events.tn',
      customerPhone: '+216 98 214 700',
      companyName: 'Atlas Events Tunisia',
      category: 'paper',
      serviceId: 'srv_pap_cards',
      serviceName: 'Business Cards (Cartes de visite)',
      status: 'Delivered',
      specifications: {
        productType: 'Executive Duplex Business Cards',
        format: '85x55mm Standard',
        paperType: '400g Cotton Luxury',
        finish: 'Soft-Touch + Spot UV',
        quantity: 500,
        deliveryMethod: 'Grand Tunis Courier',
        deliveryAddress: 'Centre Urbain Nord, Tunis',
        needsCustomDesign: false,
        creativeBrief: '500 executive cards for 2 team members (250 each).',
      },
      estimatedPriceTnd: 170,
      quotedPriceTnd: 170,
      paymentStatus: 'Paid in Full',
      invoiceNumber: 'INV-GNZ-0145',
      assignedDesignerId: 'des_03',
      assignedDesignerName: 'Salma Khelifi',
      assignedProductionLead: 'Sami Mejri',
      productionNotes: 'Delivered and signed by recipient.',
      referenceFiles: [],
      designPreviews: [],
      revisions: [],
      messages: [],
      timeline: [
        {
          status: 'New Request',
          note: 'Order submitted for 500 luxury business cards.',
          actorName: 'Meriem Chaabane',
          actorRole: 'Customer',
          timestamp: '2026-11-01T09:00:00.000Z',
        },
        {
          status: 'In Production',
          note: 'Printed and Spot UV cured.',
          actorName: 'Sami Mejri',
          actorRole: 'Production Manager',
          timestamp: '2026-11-03T10:00:00.000Z',
        },
        {
          status: 'Quality Control',
          note: 'Edge trim and UV alignment inspected.',
          actorName: 'Sami Mejri',
          actorRole: 'Production Manager',
          timestamp: '2026-11-04T15:00:00.000Z',
        },
        {
          status: 'Ready',
          note: 'Packed for Grand Tunis courier.',
          actorName: 'Sami Mejri',
          actorRole: 'Production Manager',
          timestamp: '2026-11-05T09:00:00.000Z',
        },
        {
          status: 'Delivered',
          note: 'Delivered to Centre Urbain Nord, Tunis.',
          actorName: 'Lina Jaziri',
          actorRole: 'Customer Support',
          timestamp: '2026-11-05T14:20:00.000Z',
        },
      ],
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: '2026-11-05T14:20:00.000Z',
    },
  ];

  const inquiries: ContactInquiry[] = [
    {
      id: 'inq_01',
      name: 'Houssem Karray',
      email: 'houssem@medina-hospitality.tn',
      phone: '+216 22 908 112',
      company: 'Medina Hospitality Group',
      subject: 'Opening Kit for New Restaurant in Sousse',
      message: 'We are opening a 90-seat bistro in Sousse next month and need 60 laminated menus, 35 embroidered staff uniforms, and outdoor signage.',
      status: 'In Review',
      assignedTo: 'Lina Jaziri',
      replyNote: 'Prepared preliminary multi-service bundle schedule.',
      createdAt: '2026-11-17T15:10:00.000Z',
    },
  ];

  const siteContent: SiteContent = {
    heroHeadline: 'Your Ideas. Our Creativity. One Studio.',
    heroSlogan: 'DESIGN IT. CUSTOMIZE IT. PRINT IT.',
    heroSubtext:
      'GANZO STUDIO unifies graphic design, textile personalization, and commercial paper printing in Tunisia. Submit one brief, approve studio-crafted proofs, and receive quality-checked production delivered to your door.',
    studioLocation: 'Les Berges du Lac 2, Tunis, Tunisia',
    studioPhone: '+216 71 860 120',
    studioEmail: 'hello@ganzostudio.tn',
    announcementNote: 'Production Dispatch Across All 24 Tunisian Governorates',
    testimonials: [
      {
        id: 'tes_01',
        quote: 'Before GANZO, we coordinated three separate suppliers for uniforms, coffee labels, and menus. Moving everything into one GANZO account cut our launch timeline from five weeks to fourteen days.',
        author: 'Yassine Trabelsi',
        role: 'Co-Founder',
        organization: 'Café Carthage Roasters',
        outcome: '3 Tunis café launches unified under 1 studio workflow',
      },
      {
        id: 'tes_02',
        quote: 'Their internal design team fixed our print bleed issues before production and sent a proof within 24 hours. Every stitch and foil stamp matched the approved mockup.',
        author: 'Meriem Chaabane',
        role: 'Managing Director',
        organization: 'Atlas Events Tunisia',
        outcome: '600+ event kits delivered with zero defect reprints',
      },
      {
        id: 'tes_03',
        quote: 'Having direct visibility from Quotation Sent to Quality Control gave our marketing team complete confidence ahead of Tunis Design Week.',
        author: 'Rami Jelassi',
        role: 'Head of Brand',
        organization: 'Tunis Design Collective',
        outcome: '400 catalogues & 300 posters delivered 48h early',
      },
    ],
    faqs: [
      {
        id: 'faq_01',
        category: 'Orders & Pricing',
        question: 'How does GANZO STUDIO work compared to a freelance marketplace?',
        answer: 'GANZO STUDIO is a single accountable creative and printing company. You do not search for or hire independent freelancers. You submit your brief to GANZO, receive an official quote, and our internal project managers assign the right specialist designer and print team while handling all previews, revisions, quality control, and delivery.',
      },
      {
        id: 'faq_02',
        category: 'Orders & Pricing',
        question: 'Are online price estimates final?',
        answer: 'The configurators calculate a transparent baseline estimate in Tunisian Dinars (TND) based on your product, finish, and quantity. Once submitted, our team verifies artwork complexity and sends an official fixed quotation before any production starts.',
      },
      {
        id: 'faq_03',
        category: 'Textile Printing',
        question: 'What printing techniques do you offer for apparel?',
        answer: 'We run in-house screen printing (best for 30+ pieces with solid spot colors), high-definition DTF transfers (ideal for full-color graphics and smaller runs), and industrial multi-head embroidery for polos, caps, hoodies, and workwear.',
      },
      {
        id: 'faq_04',
        category: 'Paper Printing',
        question: 'What file formats should I upload for print-ready jobs?',
        answer: 'We accept PDF/X-1a, AI, EPS, SVG, and high-resolution 300 DPI PNG/JPG files. If you only have a rough sketch or logo, select "Request Custom Design" and our internal studio will build the print-ready layout for you.',
      },
      {
        id: 'faq_05',
        category: 'Graphic Design',
        question: 'How many revision rounds are included in graphic design orders?',
        answer: 'Every custom design order includes structured revision rounds directly inside your Customer Dashboard. You inspect the uploaded proof, submit revision notes, and production only begins after you click "Approve Final Design".',
      },
      {
        id: 'faq_06',
        category: 'Delivery & Revisions',
        question: 'Do you deliver outside Tunis?',
        answer: 'Yes. Customers can pick up orders at our Les Berges du Lac 2 studio in Tunis, request same-day Grand Tunis courier dispatch, or select tracked national delivery across all 24 Tunisian governorates (Sousse, Sfax, Nabeul, Bizerte, Djerba, and beyond).',
      },
    ],
  };

  const shopSeed = createShopSeedData();

  return {
    users,
    services,
    designers,
    portfolio,
    orders,
    inquiries,
    siteContent,
    ...shopSeed,
  };
}

function createShopSeedData(): {
  shopCategories: ShopCategory[];
  shopProducts: ShopProduct[];
  shopPromotions: ShopPromotion[];
  shopOrders: ShopOrder[];
} {
  const shopCategories: ShopCategory[] = [
    { id: 'cat_tshirts', name: 'T-shirts', slug: 't-shirts', description: 'Heavyweight studio tees & custom essentials', sortOrder: 1 },
    { id: 'cat_hoodies', name: 'Hoodies', slug: 'hoodies', description: '400gsm brushed fleece hoodies', sortOrder: 2 },
    { id: 'cat_sweatshirts', name: 'Sweatshirts', slug: 'sweatshirts', description: 'Structured crewneck sweatshirts', sortOrder: 3 },
    { id: 'cat_polos', name: 'Polo shirts', slug: 'polo-shirts', description: 'Breathable 220gsm piqué knit polos', sortOrder: 4 },
    { id: 'cat_caps', name: 'Caps', slug: 'caps', description: '6-panel twill & embroidered caps', sortOrder: 5 },
    { id: 'cat_totes', name: 'Tote bags', slug: 'tote-bags', description: 'Heavy canvas everyday & studio totes', sortOrder: 6 },
    { id: 'cat_mugs', name: 'Mugs', slug: 'mugs', description: 'Matte ceramic & custom gift mugs', sortOrder: 7 },
    { id: 'cat_bottles', name: 'Bottles', slug: 'bottles', description: 'Double-wall insulated matte bottles', sortOrder: 8 },
    { id: 'cat_stickers', name: 'Stickers', slug: 'stickers', description: 'Die-cut waterproof vinyl sticker packs', sortOrder: 9 },
    { id: 'cat_notebooks', name: 'Notebooks', slug: 'notebooks', description: 'Hardcover dotted & lined studio notebooks', sortOrder: 10 },
    { id: 'cat_gifts', name: 'Personalized gifts', slug: 'personalized-gifts', description: 'Curated custom gift boxes & keepsakes', sortOrder: 11 },
    { id: 'cat_limited', name: 'Limited edition collections', slug: 'limited-edition-collections', description: 'Numbered GANZO STUDIO capsule drops', sortOrder: 12 },
  ];

  const shopProducts: ShopProduct[] = [
    {
      id: 'prd_01',
      sku: 'GNZ-TEE-001',
      name: 'GANZO Essential 240gsm Boxy T-Shirt',
      categoryId: 'cat_tshirts',
      categoryName: 'T-shirts',
      priceTnd: 59,
      compareAtPriceTnd: null,
      description: 'Cut from 240gsm Tunisian combed cotton with a relaxed studio silhouette and subtle cyan woven hem label. Available ready-made or customized with your chest/back artwork.',
      images: [
        '/src/assets/images/shop_tshirt_polo_1795263540099.jpg',
        '/src/assets/images/shop_hoodie_streetwear_1795263537483.jpg',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Obsidian Black', hex: '#111111' },
        { name: 'Optic White', hex: '#FFFFFF' },
        { name: 'Slate Gray', hex: '#71717A' },
      ],
      variants: [
        { id: 'v_01_m_blk', label: 'M / Obsidian Black', size: 'M', color: 'Obsidian Black', stock: 18, priceDeltaTnd: 0 },
        { id: 'v_01_l_blk', label: 'L / Obsidian Black', size: 'L', color: 'Obsidian Black', stock: 22, priceDeltaTnd: 0 },
        { id: 'v_01_xl_wht', label: 'XL / Optic White', size: 'XL', color: 'Optic White', stock: 12, priceDeltaTnd: 0 },
      ],
      stock: 52,
      customizable: true,
      featured: true,
      newArrival: false,
      bestSeller: true,
      specialOffer: false,
      popularityScore: 96,
      active: true,
      createdAt: '2026-10-12T10:00:00.000Z',
    },
    {
      id: 'prd_02',
      sku: 'GNZ-HD-002',
      name: 'GANZO Heavyweight 420gsm Cyan-Tag Hoodie',
      categoryId: 'cat_hoodies',
      categoryName: 'Hoodies',
      priceTnd: 135,
      compareAtPriceTnd: 155,
      description: 'Double-lined hood, dropped shoulders, and signature GANZO cyan woven pocket label. Built in Tunis for winter studio comfort.',
      images: [
        '/src/assets/images/shop_hoodie_streetwear_1795263537483.jpg',
        '/src/assets/images/shop_tshirt_polo_1795263540099.jpg',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Obsidian Black', hex: '#111111' },
        { name: 'Heather Gray', hex: '#9CA3AF' },
      ],
      variants: [
        { id: 'v_02_m_blk', label: 'M / Obsidian Black', size: 'M', color: 'Obsidian Black', stock: 14, priceDeltaTnd: 0 },
        { id: 'v_02_l_blk', label: 'L / Obsidian Black', size: 'L', color: 'Obsidian Black', stock: 10, priceDeltaTnd: 0 },
        { id: 'v_02_l_gry', label: 'L / Heather Gray', size: 'L', color: 'Heather Gray', stock: 8, priceDeltaTnd: 0 },
      ],
      stock: 32,
      customizable: true,
      featured: true,
      newArrival: true,
      bestSeller: true,
      specialOffer: true,
      popularityScore: 99,
      active: true,
      createdAt: '2026-11-10T09:00:00.000Z',
    },
    {
      id: 'prd_03',
      sku: 'GNZ-SW-003',
      name: 'Atelier Crewneck Sweatshirt',
      categoryId: 'cat_sweatshirts',
      categoryName: 'Sweatshirts',
      priceTnd: 112,
      compareAtPriceTnd: null,
      description: '380gsm diagonal-loop French terry crewneck with reinforced V-stitch collar and ribbed cuffs. Ideal blank or personalized with tonal embroidery.',
      images: [
        '/src/assets/images/shop_hoodie_streetwear_1795263537483.jpg',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Heather Gray', hex: '#9CA3AF' },
        { name: 'Obsidian Black', hex: '#111111' },
      ],
      variants: [
        { id: 'v_03_m', label: 'M / Heather Gray', size: 'M', color: 'Heather Gray', stock: 15, priceDeltaTnd: 0 },
        { id: 'v_03_l', label: 'L / Obsidian Black', size: 'L', color: 'Obsidian Black', stock: 11, priceDeltaTnd: 0 },
      ],
      stock: 26,
      customizable: true,
      featured: false,
      newArrival: true,
      bestSeller: false,
      specialOffer: false,
      popularityScore: 81,
      active: true,
      createdAt: '2026-11-08T12:00:00.000Z',
    },
    {
      id: 'prd_04',
      sku: 'GNZ-PL-004',
      name: 'Executive 220gsm Piqué Polo Shirt',
      categoryId: 'cat_polos',
      categoryName: 'Polo shirts',
      priceTnd: 74,
      compareAtPriceTnd: null,
      description: 'Tailored cotton piqué polo with structured collar and matte buttons. Ready to wear or custom embroidered with your company monogram.',
      images: [
        '/src/assets/images/shop_tshirt_polo_1795263540099.jpg',
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Optic White', hex: '#FFFFFF' },
        { name: 'Obsidian Black', hex: '#111111' },
      ],
      variants: [
        { id: 'v_04_m_wht', label: 'M / Optic White', size: 'M', color: 'Optic White', stock: 20, priceDeltaTnd: 0 },
        { id: 'v_04_l_blk', label: 'L / Obsidian Black', size: 'L', color: 'Obsidian Black', stock: 16, priceDeltaTnd: 0 },
      ],
      stock: 36,
      customizable: true,
      featured: false,
      newArrival: false,
      bestSeller: true,
      specialOffer: false,
      popularityScore: 85,
      active: true,
      createdAt: '2026-10-20T09:00:00.000Z',
    },
    {
      id: 'prd_05',
      sku: 'GNZ-CAP-005',
      name: 'GANZO 6-Panel Twill Studio Cap',
      categoryId: 'cat_caps',
      categoryName: 'Caps',
      priceTnd: 42,
      compareAtPriceTnd: 52,
      description: 'Brushed heavy cotton twill 6-panel cap with metal clasp strap. Available plain or with custom 3D chest-grade front embroidery.',
      images: [
        '/src/assets/images/shop_cap_tote_1795263538788.jpg',
      ],
      sizes: ['One Size'],
      colors: [
        { name: 'Obsidian Black', hex: '#111111' },
        { name: 'Stone Beige', hex: '#E5E0D5' },
      ],
      variants: [
        { id: 'v_05_blk', label: 'One Size / Obsidian Black', size: 'One Size', color: 'Obsidian Black', stock: 40, priceDeltaTnd: 0 },
      ],
      stock: 40,
      customizable: true,
      featured: true,
      newArrival: false,
      bestSeller: true,
      specialOffer: true,
      popularityScore: 92,
      active: true,
      createdAt: '2026-10-15T10:00:00.000Z',
    },
    {
      id: 'prd_06',
      sku: 'GNZ-TOT-006',
      name: 'Heavy Canvas 340gsm Studio Tote Bag',
      categoryId: 'cat_totes',
      categoryName: 'Tote bags',
      priceTnd: 35,
      compareAtPriceTnd: null,
      description: 'Gusseted 340gsm organic canvas tote with reinforced webbing handles. Fits a 16-inch laptop and sketchbook.',
      images: [
        '/src/assets/images/shop_cap_tote_1795263538788.jpg',
      ],
      sizes: ['38×42cm'],
      colors: [
        { name: 'Natural Canvas', hex: '#F3EFE6' },
        { name: 'Obsidian Black', hex: '#111111' },
      ],
      variants: [
        { id: 'v_06_nat', label: '38×42cm / Natural Canvas', size: '38×42cm', color: 'Natural Canvas', stock: 55, priceDeltaTnd: 0 },
      ],
      stock: 55,
      customizable: true,
      featured: false,
      newArrival: true,
      bestSeller: false,
      specialOffer: false,
      popularityScore: 79,
      active: true,
      createdAt: '2026-11-12T10:00:00.000Z',
    },
    {
      id: 'prd_07',
      sku: 'GNZ-MUG-007',
      name: 'Matte Ceramic Studio Mug (330ml)',
      categoryId: 'cat_mugs',
      categoryName: 'Mugs',
      priceTnd: 28,
      compareAtPriceTnd: null,
      description: 'Stoneware matte-glazed mug fired for daily studio espresso and filter pours. Supports custom monochrome crest or name print.',
      images: [
        '/src/assets/images/shop_mug_bottle_1795263540181.jpg',
      ],
      sizes: ['330ml'],
      colors: [
        { name: 'Obsidian Black', hex: '#111111' },
        { name: 'Optic White', hex: '#FFFFFF' },
      ],
      variants: [
        { id: 'v_07_blk', label: '330ml / Obsidian Black', size: '330ml', color: 'Obsidian Black', stock: 64, priceDeltaTnd: 0 },
      ],
      stock: 64,
      customizable: true,
      featured: false,
      newArrival: false,
      bestSeller: true,
      specialOffer: false,
      popularityScore: 88,
      active: true,
      createdAt: '2026-10-05T09:00:00.000Z',
    },
    {
      id: 'prd_08',
      sku: 'GNZ-BTL-008',
      name: 'Insulated Matte Steel Bottle (600ml)',
      categoryId: 'cat_bottles',
      categoryName: 'Bottles',
      priceTnd: 54,
      compareAtPriceTnd: 65,
      description: 'Double-wall 304 stainless steel thermal bottle keeping drinks cold 24h or hot 12h. Laser engraving or UV full-wrap print available.',
      images: [
        '/src/assets/images/shop_mug_bottle_1795263540181.jpg',
      ],
      sizes: ['600ml'],
      colors: [
        { name: 'Obsidian Black', hex: '#111111' },
        { name: 'Cyan Accent', hex: '#00FFFF' },
      ],
      variants: [
        { id: 'v_08_blk', label: '600ml / Obsidian Black', size: '600ml', color: 'Obsidian Black', stock: 34, priceDeltaTnd: 0 },
      ],
      stock: 34,
      customizable: true,
      featured: true,
      newArrival: true,
      bestSeller: false,
      specialOffer: true,
      popularityScore: 87,
      active: true,
      createdAt: '2026-11-14T11:00:00.000Z',
    },
    {
      id: 'prd_09',
      sku: 'GNZ-STK-009',
      name: 'GANZO Die-Cut Vinyl Sticker Pack (12 pcs)',
      categoryId: 'cat_stickers',
      categoryName: 'Stickers',
      priceTnd: 18,
      compareAtPriceTnd: null,
      description: 'Waterproof UV-coated matte vinyl stickers featuring Tunisian studio typography and architectural marks for laptops, bottles, and packaging.',
      images: [
        '/src/assets/images/shop_notebook_stickers_1795263539590.jpg',
      ],
      sizes: ['A5 Pack (12 pcs)'],
      colors: [{ name: 'Black & Cyan', hex: '#111111' }],
      variants: [
        { id: 'v_09_pack', label: 'A5 Pack / Black & Cyan', size: 'A5 Pack (12 pcs)', color: 'Black & Cyan', stock: 120, priceDeltaTnd: 0 },
      ],
      stock: 120,
      customizable: false,
      featured: false,
      newArrival: false,
      bestSeller: true,
      specialOffer: false,
      popularityScore: 91,
      active: true,
      createdAt: '2026-09-25T10:00:00.000Z',
    },
    {
      id: 'prd_10',
      sku: 'GNZ-NBK-010',
      name: 'GANZO Hardcover Dotted Studio Notebook (A5)',
      categoryId: 'cat_notebooks',
      categoryName: 'Notebooks',
      priceTnd: 34,
      compareAtPriceTnd: null,
      description: '192 pages of 120gsm acid-free ivory dotted paper bound flat in matte black cloth. Optional blind deboss or cyan foil initials.',
      images: [
        '/src/assets/images/shop_notebook_stickers_1795263539590.jpg',
      ],
      sizes: ['A5 (148×210mm)'],
      colors: [{ name: 'Obsidian Black', hex: '#111111' }],
      variants: [
        { id: 'v_10_a5', label: 'A5 / Obsidian Black', size: 'A5 (148×210mm)', color: 'Obsidian Black', stock: 45, priceDeltaTnd: 0 },
      ],
      stock: 45,
      customizable: true,
      featured: false,
      newArrival: true,
      bestSeller: false,
      specialOffer: false,
      popularityScore: 82,
      active: true,
      createdAt: '2026-11-05T10:00:00.000Z',
    },
    {
      id: 'prd_11',
      sku: 'GNZ-GFT-011',
      name: 'Executive Personalized Gift Box (Notebook + Bottle + Mug)',
      categoryId: 'cat_gifts',
      categoryName: 'Personalized gifts',
      priceTnd: 118,
      compareAtPriceTnd: 136,
      description: 'Rigid matte black presentation box holding a custom A5 notebook, insulated bottle, and ceramic mug—personalized for VIP clients, onboarding, or events.',
      images: [
        '/src/assets/images/shop_notebook_stickers_1795263539590.jpg',
        '/src/assets/images/shop_mug_bottle_1795263540181.jpg',
      ],
      sizes: ['Standard Gift Box'],
      colors: [{ name: 'Obsidian Black', hex: '#111111' }],
      variants: [
        { id: 'v_11_std', label: 'Gift Box / Obsidian Black', size: 'Standard Gift Box', color: 'Obsidian Black', stock: 24, priceDeltaTnd: 0 },
      ],
      stock: 24,
      customizable: true,
      featured: true,
      newArrival: true,
      bestSeller: false,
      specialOffer: true,
      popularityScore: 94,
      active: true,
      createdAt: '2026-11-15T09:00:00.000Z',
    },
    {
      id: 'prd_12',
      sku: 'GNZ-LTD-012',
      name: 'GANZO Crown Crest Capsule Set — Limited Edition (1/100)',
      categoryId: 'cat_limited',
      categoryName: 'Limited edition collections',
      priceTnd: 195,
      compareAtPriceTnd: null,
      description: 'Numbered collector capsule pairing our 420gsm hoodie, 6-panel twill cap, and woven GANZO Brand Crest patch in a rigid studio archive box.',
      images: [
        '/src/assets/images/shop_hoodie_streetwear_1795263537483.jpg',
        '/src/assets/images/shop_cap_tote_1795263538788.jpg',
        '/assets/aistudio/logo_ganzo_brand_1_c97e8249.png',
      ],
      sizes: ['M', 'L', 'XL'],
      colors: [{ name: 'Obsidian & Cyan', hex: '#111111' }],
      variants: [
        { id: 'v_12_m', label: 'M / Obsidian & Cyan', size: 'M', color: 'Obsidian & Cyan', stock: 6, priceDeltaTnd: 0 },
        { id: 'v_12_l', label: 'L / Obsidian & Cyan', size: 'L', color: 'Obsidian & Cyan', stock: 9, priceDeltaTnd: 0 },
        { id: 'v_12_xl', label: 'XL / Obsidian & Cyan', size: 'XL', color: 'Obsidian & Cyan', stock: 4, priceDeltaTnd: 0 },
      ],
      stock: 19,
      customizable: false,
      featured: true,
      newArrival: true,
      bestSeller: true,
      specialOffer: false,
      popularityScore: 98,
      active: true,
      createdAt: '2026-11-18T12:00:00.000Z',
    },
  ];

  const shopPromotions: ShopPromotion[] = [
    {
      id: 'promo_01',
      code: 'GANZO10',
      description: '10% off GANZO SHOP orders over 100 TND',
      discountType: 'percent',
      value: 10,
      minOrderTnd: 100,
      active: true,
      usageCount: 14,
    },
    {
      id: 'promo_02',
      code: 'TUNIS20',
      description: '20 TND instant discount on orders 200 TND+',
      discountType: 'fixed',
      value: 20,
      minOrderTnd: 200,
      active: true,
      usageCount: 6,
    },
  ];

  const shopOrders: ShopOrder[] = [
    {
      id: 'shord_401',
      orderNumber: 'SHP-2026-0401',
      customerId: 'usr_cust_01',
      customerName: 'Yassine Trabelsi',
      customerEmail: 'client@carthage.tn',
      customerPhone: '+216 55 412 890',
      deliveryMethod: 'Grand Tunis Courier',
      deliveryAddress: 'Avenue Habib Bourguiba, 24',
      city: 'La Marsa',
      governorate: 'Tunis',
      items: [
        {
          productId: 'prd_02',
          sku: 'GNZ-HD-002',
          productName: 'GANZO Heavyweight 420gsm Cyan-Tag Hoodie',
          image: '/src/assets/images/shop_hoodie_streetwear_1795263537483.jpg',
          quantity: 1,
          unitPriceTnd: 135,
          selectedSize: 'L',
          selectedColor: 'Obsidian Black',
          variantLabel: 'L / Obsidian Black',
          customizable: true,
          personalizationNotes: 'Embroider small CCR monogram on right sleeve.',
          customArtwork: null,
        },
        {
          productId: 'prd_07',
          sku: 'GNZ-MUG-007',
          productName: 'Matte Ceramic Studio Mug (330ml)',
          image: '/src/assets/images/shop_mug_bottle_1795263540181.jpg',
          quantity: 2,
          unitPriceTnd: 28,
          selectedSize: '330ml',
          selectedColor: 'Obsidian Black',
          variantLabel: '330ml / Obsidian Black',
          customizable: false,
          personalizationNotes: '',
          customArtwork: null,
        },
      ],
      subtotalTnd: 191,
      discountCode: '',
      discountTnd: 0,
      shippingFeeTnd: 0,
      totalTnd: 191,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Unpaid (COD)',
      status: 'Dispatched',
      timeline: [
        {
          status: 'Order Placed',
          note: 'Order placed via GANZO SHOP (Cash on Delivery).',
          timestamp: '2026-11-16T10:15:00.000Z',
        },
        {
          status: 'Confirmed',
          note: 'Inventory allocated in Lac 2 warehouse.',
          timestamp: '2026-11-16T11:40:00.000Z',
        },
        {
          status: 'Preparing',
          note: 'Sleeve personalization completed & QC checked.',
          timestamp: '2026-11-17T14:00:00.000Z',
        },
        {
          status: 'Dispatched',
          note: 'Handed to Grand Tunis courier for La Marsa delivery.',
          timestamp: '2026-11-18T09:30:00.000Z',
        },
      ],
      createdAt: '2026-11-16T10:15:00.000Z',
      updatedAt: '2026-11-18T09:30:00.000Z',
    },
  ];

  return {
    shopCategories,
    shopProducts,
    shopPromotions,
    shopOrders,
  };
}

let cachedDb: StudioDatabase | null = null;

export function getDb(): StudioDatabase {
  if (cachedDb) return cachedDb;
  ensureDirs();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StudioDatabase>;
      const shopDefaults = createShopSeedData();
      let migrated = false;
      if (!parsed.shopCategories) {
        parsed.shopCategories = shopDefaults.shopCategories;
        migrated = true;
      }
      if (!parsed.shopProducts) {
        parsed.shopProducts = shopDefaults.shopProducts;
        migrated = true;
      }
      if (!parsed.shopPromotions) {
        parsed.shopPromotions = shopDefaults.shopPromotions;
        migrated = true;
      }
      if (!parsed.shopOrders) {
        parsed.shopOrders = shopDefaults.shopOrders;
        migrated = true;
      }
      if (Array.isArray(parsed.users)) {
        for (const u of parsed.users) {
          if (!Array.isArray(u.favorites)) {
            u.favorites = [];
            migrated = true;
          }
          if (!Array.isArray(u.addresses)) {
            u.addresses = [];
            migrated = true;
          }
        }
      }
      cachedDb = parsed as StudioDatabase;
      if (migrated) saveDb(cachedDb);
      return cachedDb;
    } catch {
      // Fallback to fresh seed if corrupted
    }
  }
  cachedDb = createSeedDatabase();
  saveDb(cachedDb);
  return cachedDb;
}

export function saveDb(db: StudioDatabase): void {
  ensureDirs();
  cachedDb = db;
  const tmpPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_FILE);
}

export function generateTrackingCode(orders: StudioOrder[]): string {
  const maxNum = orders.reduce((acc, o) => {
    const match = o.trackingCode.match(/GNZ-2026-(\d+)/);
    const n = match ? Number.parseInt(match[1], 10) : 0;
    return Math.max(acc, n);
  }, 145);
  return `GNZ-2026-${String(maxNum + 1).padStart(4, '0')}`;
}

export function generateShopOrderNumber(shopOrders: ShopOrder[]): string {
  const maxNum = shopOrders.reduce((acc, o) => {
    const match = o.orderNumber.match(/SHP-2026-(\d+)/);
    const n = match ? Number.parseInt(match[1], 10) : 0;
    return Math.max(acc, n);
  }, 401);
  return `SHP-2026-${String(maxNum + 1).padStart(4, '0')}`;
}

export function isValidStatus(status: string): status is OrderStatus {
  return [
    'New Request',
    'Under Review',
    'Quotation Sent',
    'Awaiting Approval',
    'Design in Progress',
    'Awaiting Customer Validation',
    'In Production',
    'Quality Control',
    'Ready',
    'Delivered',
  ].includes(status);
}

export function isValidShopStatus(status: string): status is ShopOrderStatus {
  return ['Order Placed', 'Confirmed', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled'].includes(
    status,
  );
}

export function isValidPaymentStatus(status: string): status is PaymentStatus {
  return ['Unpaid', 'Deposit Paid', 'Paid in Full'].includes(status);
}

export function isValidCategory(cat: string): cat is ServiceCategory {
  return ['textile', 'paper', 'design'].includes(cat);
}
