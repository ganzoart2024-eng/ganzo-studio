import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  generateShopOrderNumber,
  generateTrackingCode,
  getDb,
  hashPassword,
  isValidCategory,
  isValidPaymentStatus,
  isValidShopStatus,
  isValidStatus,
  saveDb,
  signToken,
  toPublicUser,
  UPLOADS_DIR,
  verifyPassword,
  verifyToken,
  type StoredUser,
} from './server/db.ts';
import type {
  ContactInquiry,
  CustomerAddress,
  DesignerProfile,
  OrderStatus,
  PortfolioItem,
  PublicUser,
  ServiceCategory,
  ShopCategory,
  ShopOrder,
  ShopOrderItem,
  ShopOrderStatus,
  ShopProduct,
  ShopPromotion,
  SiteContent,
  StudioOrder,
  StudioService,
  UploadedFileRef,
} from './src/types/studio.ts';

interface AuthedRequest extends Request {
  currentUser?: StoredUser;
}

const PORT = Number(process.env.PORT || 3000);
const COOKIE_NAME = 'ganzo_session';

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    result[key] = decodeURIComponent(val);
  }
  return result;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies[COOKIE_NAME] || '';
  }
  if (token) {
    const verified = verifyToken(token);
    if (verified) {
      const db = getDb();
      const found = db.users.find((u) => u.id === verified.uid);
      if (found) {
        req.currentUser = found;
      }
    }
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

function requireRoles(roles: StoredUser['role'][]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.currentUser.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this studio action.' });
      return;
    }
    next();
  };
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function calculateEstimate(
  service: StudioService | undefined,
  quantity: number,
  needsCustomDesign: boolean,
  finish?: string,
): number {
  if (!service) return needsCustomDesign ? 350 : 180;
  const qty = Math.max(1, quantity);
  let total = service.basePriceTnd;

  if (service.category === 'textile') {
    const discountFactor = qty >= 100 ? 0.82 : qty >= 50 ? 0.9 : 1;
    total = Math.round(service.basePriceTnd * qty * discountFactor);
  } else if (service.category === 'paper') {
    const basePack = Math.max(1, service.minQuantity);
    const ratio = Math.max(1, qty / basePack);
    const scale = ratio > 3 ? ratio * 0.78 : ratio;
    const finishExtra =
      finish && (finish.includes('Foil') || finish.includes('Spot UV') || finish.includes('Hardcover'))
        ? 85
        : 0;
    total = Math.round(service.basePriceTnd * scale + finishExtra);
  } else {
    total = Math.round(service.basePriceTnd * Math.max(1, qty));
  }

  if (needsCustomDesign && service.category !== 'design') {
    total += 140;
  }
  return Math.max(45, total);
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(attachUser);

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, studio: 'GANZO STUDIO' });
  });

  // Public Bootstrap Data
  app.get('/api/public/bootstrap', (_req, res) => {
    const db = getDb();
    res.json({
      services: db.services.filter((s) => s.active),
      designers: db.designers,
      portfolio: db.portfolio,
      siteContent: db.siteContent,
    });
  });

  // Sample SVG Proof & Reference Asset Generator
  app.get('/api/sample-asset/:slug', (req, res) => {
    const slug = req.params.slug;
    res.setHeader('Content-Type', 'image/svg+xml');
    if (slug === 'preview-menu-v1') {
      res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 460">
        <rect width="640" height="460" fill="#F4F4F4"/>
        <rect x="48" y="36" width="260" height="388" fill="#111111"/>
        <rect x="332" y="36" width="260" height="388" fill="#FFFFFF" stroke="#111111" stroke-width="2"/>
        <text x="74" y="88" fill="#00FFFF" font-family="sans-serif" font-size="12" font-weight="700" letter-spacing="3">GANZO PRE-PRESS PROOF</text>
        <text x="74" y="132" fill="#FFFFFF" font-family="sans-serif" font-size="24" font-weight="700">CAFÉ CARTHAGE</text>
        <text x="74" y="158" fill="#A1A1AA" font-family="sans-serif" font-size="13">ROASTERS · LA MARSA</text>
        <line x1="74" y1="184" x2="282" y2="184" stroke="#00FFFF" stroke-width="2"/>
        <text x="74" y="220" fill="#FFFFFF" font-family="sans-serif" font-size="12">ESPRESSO &amp; FILTER BAR</text>
        <text x="74" y="246" fill="#D4D4D8" font-family="sans-serif" font-size="11">Single Origin Pour-Over ....... 9.5 TND</text>
        <text x="74" y="268" fill="#D4D4D8" font-family="sans-serif" font-size="11">Carthage Cold Brew ........... 11.0 TND</text>
        <text x="358" y="88" fill="#111111" font-family="sans-serif" font-size="12" font-weight="700" letter-spacing="2">BACK COVER · 3MM BLEED</text>
        <rect x="358" y="116" width="208" height="208" fill="#F4F4F4" stroke="#E4E4E7"/>
        <circle cx="462" cy="220" r="56" fill="none" stroke="#111111" stroke-width="3"/>
        <text x="462" y="226" text-anchor="middle" fill="#111111" font-family="sans-serif" font-size="14" font-weight="700">EST. 2021</text>
        <text x="358" y="388" fill="#52525B" font-family="sans-serif" font-size="11">CMYK C40 M30 Y30 K100 · MATTE 350G</text>
      </svg>`);
      return;
    }
    if (slug === 'carthage-ref') {
      res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#FFFFFF"/>
        <rect x="20" y="20" width="360" height="260" fill="none" stroke="#111111" stroke-width="2"/>
        <circle cx="200" cy="135" r="54" fill="#111111"/>
        <text x="200" y="142" text-anchor="middle" fill="#00FFFF" font-family="sans-serif" font-size="20" font-weight="700">CCR</text>
        <text x="200" y="226" text-anchor="middle" fill="#111111" font-family="sans-serif" font-size="14" font-weight="700" letter-spacing="3">CARTHAGE ROASTERS</text>
      </svg>`);
      return;
    }
    res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 420">
      <rect width="680" height="420" fill="#F4F4F4"/>
      <rect x="32" y="28" width="290" height="364" fill="#FFFFFF" stroke="#E4E4E7"/>
      <rect x="358" y="28" width="290" height="364" fill="#FFFFFF" stroke="#E4E4E7"/>
      <text x="52" y="58" fill="#111111" font-family="sans-serif" font-size="11" font-weight="700" letter-spacing="2">FRONT · LEFT CHEST CREST</text>
      <text x="378" y="58" fill="#111111" font-family="sans-serif" font-size="11" font-weight="700" letter-spacing="2">BACK · DTF 28CM PRINT</text>
      <path d="M120 96 L152 84 Q177 98 202 84 L234 96 L264 134 L240 156 L224 140 L224 342 L130 342 L130 140 L114 156 L90 134 Z" fill="#111111"/>
      <rect x="184" y="138" width="24" height="24" rx="12" fill="none" stroke="#00FFFF" stroke-width="2.5"/>
      <text x="196" y="154" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="8" font-weight="700">CR</text>
      <path d="M446 96 L478 84 Q503 98 528 84 L560 96 L590 134 L566 156 L550 140 L550 342 L456 342 L456 140 L440 156 L416 134 Z" fill="#111111"/>
      <text x="503" y="168" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="12" font-weight="700" letter-spacing="2">CARTHAGE</text>
      <text x="503" y="186" text-anchor="middle" fill="#00FFFF" font-family="sans-serif" font-size="10" font-weight="700" letter-spacing="3">ROASTERS</text>
      <line x1="472" y1="198" x2="534" y2="198" stroke="#FFFFFF" stroke-width="1.5"/>
      <text x="503" y="216" text-anchor="middle" fill="#D4D4D8" font-family="sans-serif" font-size="9">EST. 2021 · LA MARSA</text>
      <text x="177" y="374" text-anchor="middle" fill="#52525B" font-family="sans-serif" font-size="10">GANZO STUDIO · PROOF V1 · 220GSM BLACK</text>
      <text x="503" y="374" text-anchor="middle" fill="#52525B" font-family="sans-serif" font-size="10">DOUBLE-PASS WHITE + CYAN ACCENT</text>
    </svg>`);
  });

  // File Upload (Base64 payload saved cleanly to disk)
  app.post('/api/upload', (req, res) => {
    const { fileName, mimeType, base64Data } = req.body as {
      fileName?: string;
      mimeType?: string;
      base64Data?: string;
    };

    if (!fileName || !base64Data) {
      res.status(400).json({ error: 'Missing fileName or file payload.' });
      return;
    }

    const cleanedData = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(cleanedData, 'base64');
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(413).json({ error: 'File exceeds 10MB upload limit.' });
      return;
    }

    const ext = path.extname(fileName).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10) || '.bin';
    const safeBase = path
      .basename(fileName, path.extname(fileName))
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 40);
    const id = crypto.randomBytes(6).toString('hex');
    const diskName = `${Date.now()}-${id}-${safeBase}${ext}`;
    const dest = path.join(UPLOADS_DIR, diskName);

    fs.writeFileSync(dest, buffer);

    const fileRef: UploadedFileRef = {
      id: `fil_${id}`,
      name: fileName,
      url: `/api/uploads/${diskName}`,
      size: buffer.length,
      mimeType: mimeType || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    };

    res.status(201).json({ file: fileRef });
  });

  app.get('/api/uploads/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }
    res.sendFile(filePath);
  });

  // Authentication Endpoints
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, phone, companyName, city } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      companyName?: string;
      city?: string;
    };

    if (!name || !email || !password || password.length < 6) {
      res.status(400).json({ error: 'Name, valid email, and password (6+ characters) are required.' });
      return;
    }

    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const newUser: StoredUser = {
      id: `usr_${crypto.randomBytes(5).toString('hex')}`,
      name: name.trim(),
      email: normalizedEmail,
      phone: (phone || '').trim(),
      companyName: (companyName || '').trim(),
      city: (city || 'Tunis').trim(),
      role: 'customer',
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(password),
    };

    db.users.push(newUser);
    saveDb(db);

    const token = signToken(newUser.id, newUser.role);
    setSessionCookie(res, token);
    res.status(201).json({ token, user: toPublicUser(newUser) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken(user.id, user.role);
    setSessionCookie(res, token);
    res.json({ token, user: toPublicUser(user) });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      res.json({ user: null });
      return;
    }
    res.json({ user: toPublicUser(req.currentUser) });
  });

  // Public Order Tracking (Sanitized — no PII exposure)
  app.get('/api/track/:trackingCode', (req, res) => {
    const code = req.params.trackingCode.trim().toUpperCase();
    const db = getDb();
    const order = db.orders.find((o) => o.trackingCode.toUpperCase() === code || o.id.toUpperCase() === code);
    if (!order) {
      res.status(404).json({ error: `No GANZO STUDIO order found for code "${code}".` });
      return;
    }

    res.json({
      tracking: {
        trackingCode: order.trackingCode,
        category: order.category,
        serviceName: order.serviceName,
        status: order.status,
        productType: order.specifications.productType,
        quantity: order.specifications.quantity,
        deliveryMethod: order.specifications.deliveryMethod,
        timeline: order.timeline,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  });

  // Contact / Support Inquiries
  app.post('/api/inquiries', (req, res) => {
    const { name, email, phone, company, subject, message } = req.body as Partial<ContactInquiry>;
    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: 'Please complete name, email, subject, and message.' });
      return;
    }

    const db = getDb();
    const inquiry: ContactInquiry = {
      id: `inq_${crypto.randomBytes(4).toString('hex')}`,
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      company: (company || '').trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'Open',
      assignedTo: null,
      replyNote: '',
      createdAt: new Date().toISOString(),
    };
    db.inquiries.unshift(inquiry);
    saveDb(db);
    res.status(201).json({ inquiry });
  });

  // Orders List (Strict RBAC Scoping)
  app.get('/api/orders', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const db = getDb();

    if (user.role === 'customer') {
      const myOrders = db.orders.filter(
        (o) => o.customerId === user.id || o.customerEmail.toLowerCase() === user.email.toLowerCase(),
      );
      res.json({ orders: myOrders });
      return;
    }

    if (user.role === 'graphic_designer') {
      const assigned = db.orders
        .filter((o) => o.assignedDesignerId && o.assignedDesignerId === user.designerId)
        .map((o) => ({
          ...o,
          // Designers do not manage customer payments or pricing
          quotedPriceTnd: null,
          estimatedPriceTnd: 0,
          paymentStatus: 'Unpaid' as const,
        }));
      res.json({ orders: assigned });
      return;
    }

    if (user.role === 'production_manager') {
      const prodOrders = db.orders.map((o) => ({
        ...o,
        quotedPriceTnd: null,
        estimatedPriceTnd: 0,
      }));
      res.json({ orders: prodOrders });
      return;
    }

    // administrator, project_manager, customer_support
    res.json({ orders: db.orders });
  });

  // Create New Order / Quote Request
  app.post('/api/orders', (req: AuthedRequest, res) => {
    const body = req.body as {
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      companyName?: string;
      category?: string;
      serviceId?: string;
      serviceName?: string;
      specifications?: StudioOrder['specifications'];
      referenceFiles?: UploadedFileRef[];
    };

    const user = req.currentUser;
    const customerName = (body.customerName || user?.name || '').trim();
    const customerEmail = (body.customerEmail || user?.email || '').trim().toLowerCase();
    const customerPhone = (body.customerPhone || user?.phone || '').trim();
    const companyName = (body.companyName || user?.companyName || '').trim();

    if (!customerName || !customerEmail || !body.category || !isValidCategory(body.category) || !body.specifications) {
      res.status(400).json({ error: 'Customer contact details, service category, and specifications are required.' });
      return;
    }

    const db = getDb();
    const service = db.services.find((s) => s.id === body.serviceId);
    const trackingCode = generateTrackingCode(db.orders);
    const estimate = calculateEstimate(
      service,
      Number(body.specifications.quantity || 1),
      Boolean(body.specifications.needsCustomDesign),
      body.specifications.finish,
    );
    const now = new Date().toISOString();

    const newOrder: StudioOrder = {
      id: `ord_${crypto.randomBytes(4).toString('hex')}`,
      trackingCode,
      customerId: user ? user.id : `guest_${crypto.randomBytes(3).toString('hex')}`,
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      category: body.category as ServiceCategory,
      serviceId: service?.id || body.serviceId || 'custom',
      serviceName: service?.name || body.serviceName || 'Custom Studio Project',
      status: 'New Request',
      specifications: {
        ...body.specifications,
        quantity: Math.max(1, Number(body.specifications.quantity || 1)),
      },
      estimatedPriceTnd: estimate,
      quotedPriceTnd: null,
      paymentStatus: 'Unpaid',
      invoiceNumber: `INV-${trackingCode.replace('GNZ-2026-', 'GNZ-')}`,
      assignedDesignerId: null,
      assignedDesignerName: null,
      assignedProductionLead: null,
      productionNotes: '',
      referenceFiles: Array.isArray(body.referenceFiles) ? body.referenceFiles : [],
      designPreviews: [],
      revisions: [],
      messages: [],
      timeline: [
        {
          status: 'New Request',
          note: `Order submitted (${body.specifications.quantity} × ${body.specifications.productType}). Initial estimate: ${estimate} TND.`,
          actorName: customerName,
          actorRole: 'Customer',
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(newOrder);
    saveDb(db);
    res.status(201).json({ order: newOrder });
  });

  // Customer Uploads Additional Reference Files
  app.post('/api/orders/:id/files', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const user = req.currentUser!;
    const isOwner = order.customerId === user.id || order.customerEmail.toLowerCase() === user.email.toLowerCase();
    const isStaff = user.role !== 'customer';
    if (!isOwner && !isStaff) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const { file } = req.body as { file?: UploadedFileRef };
    if (!file || !file.url || !file.name) {
      res.status(400).json({ error: 'Valid file object required.' });
      return;
    }

    order.referenceFiles.push(file);
    order.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ order });
  });

  // Customer <-> GANZO Studio Message Thread
  app.post('/api/orders/:id/messages', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const user = req.currentUser!;
    const isOwner = order.customerId === user.id || order.customerEmail.toLowerCase() === user.email.toLowerCase();
    const isStaff = ['administrator', 'project_manager', 'customer_support'].includes(user.role);
    if (!isOwner && !isStaff) {
      res.status(403).json({ error: 'Only the client and GANZO management desk can message on this thread.' });
      return;
    }

    const { body } = req.body as { body?: string };
    if (!body || !body.trim()) {
      res.status(400).json({ error: 'Message body is required.' });
      return;
    }

    const now = new Date().toISOString();
    order.messages.push({
      id: `msg_${crypto.randomBytes(4).toString('hex')}`,
      senderName: user.role === 'customer' ? user.name : 'GANZO Studio Desk',
      senderRole: user.role,
      body: body.trim(),
      createdAt: now,
    });
    order.updatedAt = now;
    saveDb(db);
    res.json({ order });
  });

  // Customer Approves Official Quote
  app.post('/api/orders/:id/approve-quote', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const user = req.currentUser!;
    const isOwner = order.customerId === user.id || order.customerEmail.toLowerCase() === user.email.toLowerCase();
    if (!isOwner && user.role !== 'administrator') {
      res.status(403).json({ error: 'Only the customer can approve this quotation.' });
      return;
    }

    const now = new Date().toISOString();
    order.status = 'Awaiting Approval';
    order.timeline.push({
      status: 'Awaiting Approval',
      note: `Customer approved quotation (${order.quotedPriceTnd ?? order.estimatedPriceTnd} TND). Ready for studio scheduling.`,
      actorName: user.name,
      actorRole: 'Customer',
      timestamp: now,
    });
    order.updatedAt = now;
    saveDb(db);
    res.json({ order });
  });

  // Customer Requests Revision on Preview
  app.post('/api/orders/:id/revisions', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const user = req.currentUser!;
    const isOwner = order.customerId === user.id || order.customerEmail.toLowerCase() === user.email.toLowerCase();
    if (!isOwner && user.role !== 'administrator') {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const { message } = req.body as { message?: string };
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Revision instructions are required.' });
      return;
    }

    const now = new Date().toISOString();
    order.revisions.push({
      id: `rev_${crypto.randomBytes(4).toString('hex')}`,
      message: message.trim(),
      requestedBy: user.name,
      createdAt: now,
      resolved: false,
    });
    order.status = 'Design in Progress';
    order.timeline.push({
      status: 'Design in Progress',
      note: `Customer requested design revision: "${message.trim().slice(0, 120)}"`,
      actorName: user.name,
      actorRole: 'Customer',
      timestamp: now,
    });
    order.updatedAt = now;
    saveDb(db);
    res.json({ order });
  });

  // Customer Approves Final Design
  app.post('/api/orders/:id/approve-design', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const user = req.currentUser!;
    const isOwner = order.customerId === user.id || order.customerEmail.toLowerCase() === user.email.toLowerCase();
    if (!isOwner && user.role !== 'administrator') {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const now = new Date().toISOString();
    order.revisions.forEach((r) => {
      r.resolved = true;
    });
    order.status = 'In Production';
    order.timeline.push({
      status: 'In Production',
      note: 'Final design proof approved by customer. Released to GANZO production atelier.',
      actorName: user.name,
      actorRole: 'Customer',
      timestamp: now,
    });
    order.updatedAt = now;
    saveDb(db);
    res.json({ order });
  });

  // Internal Team Uploads Design Preview
  app.post(
    '/api/orders/:id/previews',
    requireRoles(['administrator', 'project_manager', 'graphic_designer']),
    (req: AuthedRequest, res) => {
      const db = getDb();
      const order = db.orders.find((o) => o.id === req.params.id);
      if (!order) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      const user = req.currentUser!;
      if (user.role === 'graphic_designer' && order.assignedDesignerId !== user.designerId) {
        res.status(403).json({ error: 'Designers can only upload previews for projects assigned to them.' });
        return;
      }

      const { title, notes, fileUrl, fileName } = req.body as {
        title?: string;
        notes?: string;
        fileUrl?: string;
        fileName?: string;
      };
      if (!title || !fileUrl) {
        res.status(400).json({ error: 'Preview title and file URL are required.' });
        return;
      }

      const now = new Date().toISOString();
      const version = order.designPreviews.length + 1;
      order.designPreviews.push({
        id: `prv_${crypto.randomBytes(4).toString('hex')}`,
        version,
        title: title.trim(),
        notes: (notes || '').trim(),
        fileUrl,
        fileName: fileName || `Proof-v${version}`,
        uploadedBy: `${user.name} (via GANZO Studio)`,
        uploadedAt: now,
      });

      order.status = 'Awaiting Customer Validation';
      order.timeline.push({
        status: 'Awaiting Customer Validation',
        note: `GANZO Studio uploaded design proof v${version}: ${title.trim()}.`,
        actorName: user.name,
        actorRole: user.role === 'graphic_designer' ? 'Graphic Designer' : 'Studio Management',
        timestamp: now,
      });
      order.updatedAt = now;
      saveDb(db);
      res.json({ order });
    },
  );

  // Internal Team Order Updates (Status, Quote, Assignment, Payment)
  app.patch(
    '/api/orders/:id',
    requireRoles([
      'administrator',
      'project_manager',
      'graphic_designer',
      'production_manager',
      'customer_support',
    ]),
    (req: AuthedRequest, res) => {
      const db = getDb();
      const order = db.orders.find((o) => o.id === req.params.id);
      if (!order) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      const user = req.currentUser!;
      if (user.role === 'graphic_designer' && order.assignedDesignerId !== user.designerId) {
        res.status(403).json({ error: 'Designers may only update their assigned projects.' });
        return;
      }

      const {
        status,
        statusNote,
        quotedPriceTnd,
        paymentStatus,
        assignedDesignerId,
        assignedProductionLead,
        productionNotes,
      } = req.body as {
        status?: string;
        statusNote?: string;
        quotedPriceTnd?: number | null;
        paymentStatus?: string;
        assignedDesignerId?: string | null;
        assignedProductionLead?: string | null;
        productionNotes?: string;
      };

      const now = new Date().toISOString();

      // Payment updates strictly Administrator only
      if (paymentStatus !== undefined) {
        if (user.role !== 'administrator') {
          res.status(403).json({ error: 'Only Administrators can modify payment status.' });
          return;
        }
        if (isValidPaymentStatus(paymentStatus)) {
          order.paymentStatus = paymentStatus;
        }
      }

      // Quote creation strictly Administrator or Project Manager
      if (quotedPriceTnd !== undefined) {
        if (!['administrator', 'project_manager'].includes(user.role)) {
          res.status(403).json({ error: 'Only Administrators or Project Managers can issue quotations.' });
          return;
        }
        order.quotedPriceTnd = quotedPriceTnd === null ? null : Number(quotedPriceTnd);
      }

      // Internal Designer & Production assignment strictly Admin or PM
      if (assignedDesignerId !== undefined) {
        if (!['administrator', 'project_manager'].includes(user.role)) {
          res.status(403).json({ error: 'Only Administrators or Project Managers can assign designers.' });
          return;
        }
        if (!assignedDesignerId) {
          order.assignedDesignerId = null;
          order.assignedDesignerName = null;
        } else {
          const des = db.designers.find((d) => d.id === assignedDesignerId);
          order.assignedDesignerId = des ? des.id : assignedDesignerId;
          order.assignedDesignerName = des ? des.name : 'GANZO Designer';
        }
      }

      if (assignedProductionLead !== undefined) {
        if (!['administrator', 'project_manager', 'production_manager'].includes(user.role)) {
          res.status(403).json({ error: 'Insufficient permission to assign production lead.' });
          return;
        }
        order.assignedProductionLead = assignedProductionLead || null;
      }

      if (productionNotes !== undefined) {
        order.productionNotes = productionNotes;
      }

      if (status && isValidStatus(status) && status !== order.status) {
        if (
          user.role === 'graphic_designer' &&
          !['Design in Progress', 'Awaiting Customer Validation'].includes(status)
        ) {
          res.status(403).json({ error: 'Designers can only update design task statuses.' });
          return;
        }
        if (
          user.role === 'production_manager' &&
          !['In Production', 'Quality Control', 'Ready', 'Delivered'].includes(status)
        ) {
          res.status(403).json({ error: 'Production Managers can only advance production & QC statuses.' });
          return;
        }

        order.status = status as OrderStatus;
        order.timeline.push({
          status: status as OrderStatus,
          note: statusNote?.trim() || `Order status updated to ${status}.`,
          actorName: user.name,
          actorRole: user.role.replace('_', ' '),
          timestamp: now,
        });
      }

      order.updatedAt = now;
      saveDb(db);
      res.json({ order });
    },
  );

  // Admin & Internal Studio Overview
  app.get(
    '/api/admin/overview',
    requireRoles(['administrator', 'project_manager', 'production_manager', 'customer_support']),
    (req: AuthedRequest, res) => {
      const user = req.currentUser!;
      const db = getDb();
      const canSeeFinancials = ['administrator', 'project_manager'].includes(user.role);

      const totalRevenueTnd = canSeeFinancials
        ? db.orders
            .filter((o) => o.paymentStatus === 'Paid in Full' || o.paymentStatus === 'Deposit Paid')
            .reduce((sum, o) => {
              const amount = o.quotedPriceTnd ?? o.estimatedPriceTnd;
              return sum + (o.paymentStatus === 'Paid in Full' ? amount : Math.round(amount * 0.5));
            }, 0)
        : 0;

      const totalPipelineTnd = canSeeFinancials
        ? db.orders.reduce((sum, o) => sum + (o.quotedPriceTnd ?? o.estimatedPriceTnd), 0)
        : 0;

      const customers: PublicUser[] = db.users
        .filter((u) => u.role === 'customer')
        .map(toPublicUser);

      const teamMembers: PublicUser[] =
        user.role === 'administrator'
          ? db.users.filter((u) => u.role !== 'customer').map(toPublicUser)
          : [];

      res.json({
        stats: {
          totalOrders: db.orders.length,
          activeOrders: db.orders.filter((o) => o.status !== 'Delivered').length,
          awaitingQuote: db.orders.filter((o) => o.status === 'New Request' || o.status === 'Under Review').length,
          inProduction: db.orders.filter((o) => o.status === 'In Production' || o.status === 'Quality Control').length,
          openInquiries: db.inquiries.filter((i) => i.status !== 'Resolved').length,
          totalRevenueTnd,
          totalPipelineTnd,
        },
        customers,
        teamMembers,
        inquiries: db.inquiries,
        allServices: db.services,
      });
    },
  );

  // Admin: Manage Services & Products
  app.post('/api/admin/services', requireRoles(['administrator', 'project_manager']), (req, res) => {
    const body = req.body as Partial<StudioService>;
    if (!body.name || !body.category || !isValidCategory(body.category)) {
      res.status(400).json({ error: 'Service name and valid category are required.' });
      return;
    }

    const db = getDb();
    const created: StudioService = {
      id: `srv_${crypto.randomBytes(4).toString('hex')}`,
      category: body.category,
      name: body.name.trim(),
      subtitle: (body.subtitle || 'Custom Studio Specification').trim(),
      description: (body.description || '').trim(),
      basePriceTnd: Number(body.basePriceTnd || 100),
      unitLabel: (body.unitLabel || 'unit').trim(),
      minQuantity: Number(body.minQuantity || 1),
      leadTimeDays: Number(body.leadTimeDays || 5),
      options: Array.isArray(body.options) ? body.options : ['Standard'],
      active: body.active !== false,
    };
    db.services.push(created);
    saveDb(db);
    res.status(201).json({ service: created });
  });

  app.patch('/api/admin/services/:id', requireRoles(['administrator', 'project_manager']), (req, res) => {
    const db = getDb();
    const srv = db.services.find((s) => s.id === req.params.id);
    if (!srv) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    const updates = req.body as Partial<StudioService>;
    if (updates.name !== undefined) srv.name = updates.name;
    if (updates.subtitle !== undefined) srv.subtitle = updates.subtitle;
    if (updates.basePriceTnd !== undefined) srv.basePriceTnd = Number(updates.basePriceTnd);
    if (updates.leadTimeDays !== undefined) srv.leadTimeDays = Number(updates.leadTimeDays);
    if (updates.active !== undefined) srv.active = Boolean(updates.active);
    saveDb(db);
    res.json({ service: srv });
  });

  // Admin: Manage Designers & Collaborators
  app.post('/api/admin/designers', requireRoles(['administrator']), (req, res) => {
    const body = req.body as Partial<DesignerProfile>;
    if (!body.name || !body.roleTitle) {
      res.status(400).json({ error: 'Designer name and role title are required.' });
      return;
    }

    const initials = body.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('');

    const db = getDb();
    const designer: DesignerProfile = {
      id: `des_${crypto.randomBytes(3).toString('hex')}`,
      name: body.name.trim(),
      roleTitle: body.roleTitle.trim(),
      bio: (body.bio || '').trim(),
      specialties: Array.isArray(body.specialties) ? body.specialties : ['Brand Design'],
      skills: Array.isArray(body.skills) ? body.skills : ['Adobe Creative Suite'],
      languages: Array.isArray(body.languages) ? body.languages : ['Arabic', 'French'],
      experienceYears: Number(body.experienceYears || 3),
      avatarInitials: initials || 'GS',
      portraitTone: body.portraitTone || '#111111',
      portfolioHighlights: Array.isArray(body.portfolioHighlights) ? body.portfolioHighlights : [],
      featured: Boolean(body.featured),
    };
    db.designers.push(designer);
    saveDb(db);
    res.status(201).json({ designer });
  });

  // Admin: Manage Portfolio Projects
  app.post('/api/admin/portfolio', requireRoles(['administrator', 'project_manager']), (req, res) => {
    const body = req.body as Partial<PortfolioItem>;
    if (!body.title || !body.client || !body.category) {
      res.status(400).json({ error: 'Project title, client, and category are required.' });
      return;
    }

    const db = getDb();
    const item: PortfolioItem = {
      id: `port_${crypto.randomBytes(3).toString('hex')}`,
      title: body.title.trim(),
      client: body.client.trim(),
      category: body.category,
      year: body.year || '2026',
      summary: (body.summary || '').trim(),
      deliverables: Array.isArray(body.deliverables) ? body.deliverables : ['Custom Production'],
      metric: (body.metric || 'Delivered on schedule by GANZO STUDIO').trim(),
      palette: ['#111111', '#00FFFF', '#F4F4F4'],
      mockupType: body.mockupType || 'identity',
      featured: Boolean(body.featured),
    };
    db.portfolio.unshift(item);
    saveDb(db);
    res.status(201).json({ item });
  });

  app.delete('/api/admin/portfolio/:id', requireRoles(['administrator']), (req, res) => {
    const db = getDb();
    const idx = db.portfolio.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Portfolio item not found.' });
      return;
    }
    db.portfolio.splice(idx, 1);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin & Support: Manage Inquiries
  app.patch(
    '/api/admin/inquiries/:id',
    requireRoles(['administrator', 'project_manager', 'customer_support']),
    (req: AuthedRequest, res) => {
      const db = getDb();
      const inq = db.inquiries.find((i) => i.id === req.params.id);
      if (!inq) {
        res.status(404).json({ error: 'Inquiry not found.' });
        return;
      }

      const { status, replyNote } = req.body as {
        status?: ContactInquiry['status'];
        replyNote?: string;
      };
      if (status) inq.status = status;
      if (replyNote !== undefined) inq.replyNote = replyNote;
      inq.assignedTo = req.currentUser!.name;
      saveDb(db);
      res.json({ inquiry: inq });
    },
  );

  // Admin: Manage Website Content
  app.patch('/api/admin/site-content', requireRoles(['administrator']), (req, res) => {
    const db = getDb();
    const updates = req.body as Partial<SiteContent>;
    db.siteContent = {
      ...db.siteContent,
      ...updates,
    };
    saveDb(db);
    res.json({ siteContent: db.siteContent });
  });

  /* ==================== GANZO SHOP PUBLIC & CHECKOUT ROUTES ==================== */

  app.get('/api/shop/catalog', (_req, res) => {
    const db = getDb();
    res.json({
      categories: [...db.shopCategories].sort((a, b) => a.sortOrder - b.sortOrder),
      products: db.shopProducts.filter((p) => p.active),
    });
  });

  app.post('/api/shop/validate-promo', (req, res) => {
    const { code, subtotalTnd } = req.body as { code?: string; subtotalTnd?: number };
    const normalized = (code || '').trim().toUpperCase();
    const subtotal = Number(subtotalTnd || 0);
    if (!normalized) {
      res.status(400).json({ error: 'Enter a promotion code.' });
      return;
    }
    const db = getDb();
    const promo = db.shopPromotions.find((p) => p.code.toUpperCase() === normalized && p.active);
    if (!promo) {
      res.status(404).json({ error: `Promo code "${normalized}" is invalid or expired.` });
      return;
    }
    if (subtotal < promo.minOrderTnd) {
      res.status(400).json({
        error: `Code ${promo.code} requires a minimum subtotal of ${promo.minOrderTnd} TND.`,
      });
      return;
    }
    const discountTnd =
      promo.discountType === 'percent'
        ? Math.round((subtotal * promo.value) / 100)
        : Math.min(subtotal, promo.value);
    res.json({ promo, discountTnd });
  });

  app.post('/api/shop/orders', (req: AuthedRequest, res) => {
    const body = req.body as {
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      deliveryMethod?: ShopOrder['deliveryMethod'];
      deliveryAddress?: string;
      city?: string;
      governorate?: string;
      paymentMethod?: string;
      discountCode?: string;
      items?: {
        productId: string;
        quantity: number;
        selectedSize: string;
        selectedColor: string;
        variantLabel: string;
        personalizationNotes?: string;
        customArtwork?: UploadedFileRef | null;
      }[];
    };

    if (body.paymentMethod && body.paymentMethod !== 'Cash on Delivery') {
      res.status(400).json({
        error: 'Online payment gateway is pending integration. Please complete checkout with Cash on Delivery.',
      });
      return;
    }

    const user = req.currentUser;
    const customerName = (body.customerName || user?.name || '').trim();
    const customerEmail = (body.customerEmail || user?.email || '').trim().toLowerCase();
    const customerPhone = (body.customerPhone || user?.phone || '').trim();
    const deliveryMethod = body.deliveryMethod || 'Grand Tunis Courier';
    const deliveryAddress = (body.deliveryAddress || '').trim();
    const city = (body.city || user?.city || 'Tunis').trim();
    const governorate = (body.governorate || 'Tunis').trim();

    if (!customerName || !customerEmail || !customerPhone) {
      res.status(400).json({ error: 'Name, email, and phone number are required.' });
      return;
    }
    if (deliveryMethod !== 'Studio Pickup (Lac 2, Tunis)' && !deliveryAddress) {
      res.status(400).json({ error: 'Please provide a delivery street address.' });
      return;
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Your shopping cart is empty.' });
      return;
    }

    const db = getDb();
    const orderItems: ShopOrderItem[] = [];
    let subtotalTnd = 0;

    for (const line of body.items) {
      const product = db.shopProducts.find((p) => p.id === line.productId && p.active);
      if (!product) {
        res.status(404).json({ error: 'One of the selected products is no longer available.' });
        return;
      }
      const qty = Math.max(1, Math.floor(Number(line.quantity || 1)));
      if (product.stock < qty) {
        res.status(400).json({
          error: `Insufficient stock for "${product.name}". Only ${product.stock} left.`,
        });
        return;
      }

      const variant = product.variants.find(
        (v) => v.label === line.variantLabel || (v.size === line.selectedSize && v.color === line.selectedColor),
      );
      const unitPriceTnd = product.priceTnd + (variant?.priceDeltaTnd || 0);

      orderItems.push({
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        image: product.images[0] || '/assets/aistudio/logo_ganzo_brand_1_c97e8249.png',
        quantity: qty,
        unitPriceTnd,
        selectedSize: line.selectedSize || product.sizes[0] || 'Standard',
        selectedColor: line.selectedColor || product.colors[0]?.name || 'Standard',
        variantLabel: line.variantLabel || `${line.selectedSize} / ${line.selectedColor}`,
        customizable: product.customizable,
        personalizationNotes: (line.personalizationNotes || '').trim(),
        customArtwork: line.customArtwork || null,
      });
      subtotalTnd += unitPriceTnd * qty;
    }

    // Deduct stock after validation passes
    for (const item of orderItems) {
      const product = db.shopProducts.find((p) => p.id === item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        product.popularityScore += item.quantity;
        const variant = product.variants.find((v) => v.label === item.variantLabel);
        if (variant) {
          variant.stock = Math.max(0, variant.stock - item.quantity);
        }
      }
    }

    let discountCode = '';
    let discountTnd = 0;
    if (body.discountCode) {
      const normalized = body.discountCode.trim().toUpperCase();
      const promo = db.shopPromotions.find((p) => p.code.toUpperCase() === normalized && p.active);
      if (promo && subtotalTnd >= promo.minOrderTnd) {
        discountCode = promo.code;
        discountTnd =
          promo.discountType === 'percent'
            ? Math.round((subtotalTnd * promo.value) / 100)
            : Math.min(subtotalTnd, promo.value);
        promo.usageCount += 1;
      }
    }

    const netSubtotal = Math.max(0, subtotalTnd - discountTnd);
    const shippingFeeTnd =
      deliveryMethod === 'Studio Pickup (Lac 2, Tunis)' || netSubtotal >= 180
        ? 0
        : deliveryMethod === 'Grand Tunis Courier'
          ? 7
          : 9;
    const totalTnd = netSubtotal + shippingFeeTnd;
    const now = new Date().toISOString();
    const orderNumber = generateShopOrderNumber(db.shopOrders);

    const newShopOrder: ShopOrder = {
      id: `shord_${crypto.randomBytes(4).toString('hex')}`,
      orderNumber,
      customerId: user ? user.id : `guest_${crypto.randomBytes(3).toString('hex')}`,
      customerName,
      customerEmail,
      customerPhone,
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'Studio Pickup (Lac 2, Tunis)' ? 'Les Berges du Lac 2, Tunis' : deliveryAddress,
      city,
      governorate,
      items: orderItems,
      subtotalTnd,
      discountCode,
      discountTnd,
      shippingFeeTnd,
      totalTnd,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Unpaid (COD)',
      status: 'Order Placed',
      timeline: [
        {
          status: 'Order Placed',
          note: `Order received via GANZO SHOP (${deliveryMethod}, Cash on Delivery).`,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.shopOrders.unshift(newShopOrder);
    saveDb(db);
    res.status(201).json({ order: newShopOrder });
  });

  app.get('/api/shop/track/:orderNumber', (req, res) => {
    const code = req.params.orderNumber.trim().toUpperCase();
    const db = getDb();
    const order = db.shopOrders.find((o) => o.orderNumber.toUpperCase() === code);
    if (!order) {
      res.status(404).json({ error: `No GANZO SHOP order found for "${code}".` });
      return;
    }
    res.json({
      tracking: {
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryMethod: order.deliveryMethod,
        city: order.city,
        governorate: order.governorate,
        totalTnd: order.totalTnd,
        itemsCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
        timeline: order.timeline,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  });

  /* ==================== CUSTOMER ACCOUNT SHOP & PROFILE ROUTES ==================== */

  app.get('/api/shop/my-orders', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const db = getDb();
    const orders = db.shopOrders.filter(
      (o) => o.customerId === user.id || o.customerEmail.toLowerCase() === user.email.toLowerCase(),
    );
    res.json({ orders });
  });

  app.patch('/api/customer/profile', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.currentUser!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { name, phone, companyName, city } = req.body as Partial<PublicUser>;
    if (name !== undefined && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (city !== undefined) user.city = city.trim();
    saveDb(db);
    res.json({ user: toPublicUser(user) });
  });

  app.post('/api/customer/favorites/:productId', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.currentUser!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const productId = req.params.productId;
    if (!Array.isArray(user.favorites)) user.favorites = [];
    if (user.favorites.includes(productId)) {
      user.favorites = user.favorites.filter((id) => id !== productId);
    } else {
      user.favorites.push(productId);
    }
    saveDb(db);
    res.json({ user: toPublicUser(user) });
  });

  app.post('/api/customer/addresses', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.currentUser!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const body = req.body as Partial<CustomerAddress>;
    if (!body.addressLine || !body.city || !body.phone) {
      res.status(400).json({ error: 'Address line, city, and phone are required.' });
      return;
    }
    if (!Array.isArray(user.addresses)) user.addresses = [];
    const newAddr: CustomerAddress = {
      id: `addr_${crypto.randomBytes(4).toString('hex')}`,
      label: (body.label || 'Delivery Address').trim(),
      recipientName: (body.recipientName || user.name).trim(),
      phone: body.phone.trim(),
      addressLine: body.addressLine.trim(),
      city: body.city.trim(),
      governorate: (body.governorate || body.city).trim(),
      isDefault: Boolean(body.isDefault) || user.addresses.length === 0,
    };
    if (newAddr.isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }
    user.addresses.push(newAddr);
    saveDb(db);
    res.status(201).json({ user: toPublicUser(user) });
  });

  app.delete('/api/customer/addresses/:addrId', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.currentUser!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    user.addresses = (user.addresses || []).filter((a) => a.id !== req.params.addrId);
    saveDb(db);
    res.json({ user: toPublicUser(user) });
  });

  /* ==================== ADMIN E-COMMERCE ROUTES ==================== */

  app.get('/api/admin/shop', requireRoles(['administrator', 'project_manager']), (_req, res) => {
    const db = getDb();
    const completedOrders = db.shopOrders.filter((o) => o.status !== 'Cancelled');
    const totalSalesTnd = completedOrders.reduce((sum, o) => sum + o.totalTnd, 0);
    const totalUnitsSold = completedOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0,
    );
    const lowStockCount = db.shopProducts.filter((p) => p.active && p.stock <= 10).length;

    res.json({
      categories: [...db.shopCategories].sort((a, b) => a.sortOrder - b.sortOrder),
      products: db.shopProducts,
      promotions: db.shopPromotions,
      orders: db.shopOrders,
      stats: {
        totalSalesTnd,
        totalOrders: db.shopOrders.length,
        pendingOrders: db.shopOrders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length,
        totalUnitsSold,
        lowStockCount,
      },
    });
  });

  app.post('/api/admin/shop/categories', requireRoles(['administrator']), (req, res) => {
    const { name, description } = req.body as Partial<ShopCategory>;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const db = getDb();
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const created: ShopCategory = {
      id: `cat_${crypto.randomBytes(4).toString('hex')}`,
      name: name.trim(),
      slug,
      description: (description || '').trim(),
      sortOrder: db.shopCategories.length + 1,
    };
    db.shopCategories.push(created);
    saveDb(db);
    res.status(201).json({ category: created });
  });

  app.patch('/api/admin/shop/categories/:id', requireRoles(['administrator']), (req, res) => {
    const db = getDb();
    const cat = db.shopCategories.find((c) => c.id === req.params.id);
    if (!cat) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    const { name, description } = req.body as Partial<ShopCategory>;
    if (name !== undefined && name.trim()) {
      cat.name = name.trim();
      cat.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      db.shopProducts.forEach((p) => {
        if (p.categoryId === cat.id) p.categoryName = cat.name;
      });
    }
    if (description !== undefined) cat.description = description.trim();
    saveDb(db);
    res.json({ category: cat });
  });

  app.delete('/api/admin/shop/categories/:id', requireRoles(['administrator']), (req, res) => {
    const db = getDb();
    db.shopCategories = db.shopCategories.filter((c) => c.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  app.post('/api/admin/shop/products', requireRoles(['administrator']), (req, res) => {
    const body = req.body as Partial<ShopProduct>;
    if (!body.name || !body.categoryId || body.priceTnd === undefined) {
      res.status(400).json({ error: 'Product name, category, and TND price are required.' });
      return;
    }
    const db = getDb();
    const cat = db.shopCategories.find((c) => c.id === body.categoryId);
    const sizes = Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : ['One Size'];
    const colors =
      Array.isArray(body.colors) && body.colors.length > 0
        ? body.colors
        : [{ name: 'Obsidian Black', hex: '#111111' }];
    const stock = Math.max(0, Number(body.stock ?? 20));

    const created: ShopProduct = {
      id: `prd_${crypto.randomBytes(4).toString('hex')}`,
      sku: (body.sku || `GNZ-${crypto.randomBytes(2).toString('hex').toUpperCase()}`).trim(),
      name: body.name.trim(),
      categoryId: body.categoryId,
      categoryName: cat?.name || body.categoryName || 'Limited edition collections',
      priceTnd: Number(body.priceTnd),
      compareAtPriceTnd: body.compareAtPriceTnd ? Number(body.compareAtPriceTnd) : null,
      description: (body.description || '').trim(),
      images:
        Array.isArray(body.images) && body.images.length > 0
          ? body.images
          : ['/src/assets/images/shop_tshirt_polo_1795263540099.jpg'],
      sizes,
      colors,
      variants: [
        {
          id: `v_${crypto.randomBytes(3).toString('hex')}`,
          label: `${sizes[0]} / ${colors[0].name}`,
          size: sizes[0],
          color: colors[0].name,
          stock,
          priceDeltaTnd: 0,
        },
      ],
      stock,
      customizable: Boolean(body.customizable),
      featured: Boolean(body.featured),
      newArrival: body.newArrival !== false,
      bestSeller: Boolean(body.bestSeller),
      specialOffer: Boolean(body.compareAtPriceTnd && Number(body.compareAtPriceTnd) > Number(body.priceTnd)),
      popularityScore: 50,
      active: body.active !== false,
      createdAt: new Date().toISOString(),
    };

    db.shopProducts.unshift(created);
    saveDb(db);
    res.status(201).json({ product: created });
  });

  app.patch('/api/admin/shop/products/:id', requireRoles(['administrator']), (req, res) => {
    const db = getDb();
    const product = db.shopProducts.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const updates = req.body as Partial<ShopProduct>;
    if (updates.name !== undefined) product.name = updates.name.trim();
    if (updates.priceTnd !== undefined) product.priceTnd = Number(updates.priceTnd);
    if (updates.compareAtPriceTnd !== undefined) {
      product.compareAtPriceTnd = updates.compareAtPriceTnd ? Number(updates.compareAtPriceTnd) : null;
      product.specialOffer = Boolean(
        product.compareAtPriceTnd && product.compareAtPriceTnd > product.priceTnd,
      );
    }
    if (updates.stock !== undefined) product.stock = Math.max(0, Number(updates.stock));
    if (updates.description !== undefined) product.description = updates.description;
    if (updates.sizes !== undefined) product.sizes = updates.sizes;
    if (updates.colors !== undefined) product.colors = updates.colors;
    if (updates.images !== undefined && updates.images.length > 0) product.images = updates.images;
    if (updates.customizable !== undefined) product.customizable = Boolean(updates.customizable);
    if (updates.featured !== undefined) product.featured = Boolean(updates.featured);
    if (updates.newArrival !== undefined) product.newArrival = Boolean(updates.newArrival);
    if (updates.bestSeller !== undefined) product.bestSeller = Boolean(updates.bestSeller);
    if (updates.active !== undefined) product.active = Boolean(updates.active);
    if (updates.categoryId !== undefined) {
      const cat = db.shopCategories.find((c) => c.id === updates.categoryId);
      if (cat) {
        product.categoryId = cat.id;
        product.categoryName = cat.name;
      }
    }
    saveDb(db);
    res.json({ product });
  });

  app.delete('/api/admin/shop/products/:id', requireRoles(['administrator']), (req, res) => {
    const db = getDb();
    db.shopProducts = db.shopProducts.filter((p) => p.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  app.patch('/api/admin/shop/orders/:id', requireRoles(['administrator', 'project_manager']), (req, res) => {
    const db = getDb();
    const order = db.shopOrders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Shop order not found.' });
      return;
    }
    const { status, paymentStatus, note } = req.body as {
      status?: string;
      paymentStatus?: ShopOrder['paymentStatus'];
      note?: string;
    };
    const now = new Date().toISOString();
    if (status && isValidShopStatus(status) && status !== order.status) {
      order.status = status as ShopOrderStatus;
      order.timeline.push({
        status: status as ShopOrderStatus,
        note: note?.trim() || `Order status updated to ${status} by GANZO Studio.`,
        timestamp: now,
      });
    }
    if (paymentStatus && (paymentStatus === 'Paid' || paymentStatus === 'Unpaid (COD)')) {
      order.paymentStatus = paymentStatus;
    }
    order.updatedAt = now;
    saveDb(db);
    res.json({ order });
  });

  app.post('/api/admin/shop/promotions', requireRoles(['administrator']), (req, res) => {
    const { code, description, discountType, value, minOrderTnd } = req.body as Partial<ShopPromotion>;
    if (!code || !value) {
      res.status(400).json({ error: 'Promo code and discount value are required.' });
      return;
    }
    const db = getDb();
    const promo: ShopPromotion = {
      id: `promo_${crypto.randomBytes(3).toString('hex')}`,
      code: code.trim().toUpperCase(),
      description: (description || `${value}${discountType === 'percent' ? '%' : ' TND'} off`).trim(),
      discountType: discountType === 'fixed' ? 'fixed' : 'percent',
      value: Number(value),
      minOrderTnd: Number(minOrderTnd || 0),
      active: true,
      usageCount: 0,
    };
    db.shopPromotions.unshift(promo);
    saveDb(db);
    res.status(201).json({ promo });
  });

  app.patch('/api/admin/shop/promotions/:id', requireRoles(['administrator']), (req, res) => {
    const db = getDb();
    const promo = db.shopPromotions.find((p) => p.id === req.params.id);
    if (!promo) {
      res.status(404).json({ error: 'Promotion not found.' });
      return;
    }
    const { active } = req.body as { active?: boolean };
    if (active !== undefined) promo.active = Boolean(active);
    saveDb(db);
    res.json({ promo });
  });

  app.delete('/api/admin/shop/promotions/:id', requireRoles(['administrator']), (req, res) => {
    const db = getDb();
    db.shopPromotions = db.shopPromotions.filter((p) => p.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  app.get('/api/admin/shop/export', requireRoles(['administrator']), (_req, res) => {
    const db = getDb();
    const header = [
      'OrderNumber',
      'Date',
      'Customer',
      'Email',
      'Phone',
      'City',
      'DeliveryMethod',
      'Status',
      'PaymentStatus',
      'SubtotalTND',
      'DiscountTND',
      'ShippingTND',
      'TotalTND',
    ].join(',');
    const rows = db.shopOrders.map((o) =>
      [
        o.orderNumber,
        o.createdAt,
        `"${o.customerName.replace(/"/g, '""')}"`,
        o.customerEmail,
        o.customerPhone,
        `"${o.city.replace(/"/g, '""')}"`,
        `"${o.deliveryMethod}"`,
        o.status,
        o.paymentStatus,
        o.subtotalTnd,
        o.discountTnd,
        o.shippingFeeTnd,
        o.totalTnd,
      ].join(','),
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ganzo-shop-orders.csv"');
    res.send([header, ...rows].join('\n'));
  });

  // Vite Middleware (Dev) or Static Serve (Production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GANZO STUDIO platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start GANZO STUDIO server:', err);
  process.exit(1);
});
