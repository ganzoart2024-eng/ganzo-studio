export const ORDER_STATUSES = [
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
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SHOP_ORDER_STATUSES = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Dispatched',
  'Delivered',
  'Cancelled',
] as const;

export type ShopOrderStatus = (typeof SHOP_ORDER_STATUSES)[number];

export const USER_ROLES = [
  'customer',
  'administrator',
  'project_manager',
  'graphic_designer',
  'production_manager',
  'customer_support',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type ServiceCategory = 'textile' | 'paper' | 'design';

export type PaymentStatus = 'Unpaid' | 'Deposit Paid' | 'Paid in Full';

export interface CustomerAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  governorate: string;
  isDefault: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  city: string;
  role: UserRole;
  designerId?: string;
  favorites?: string[];
  addresses?: CustomerAddress[];
  createdAt: string;
}

export interface StudioService {
  id: string;
  category: ServiceCategory;
  name: string;
  subtitle: string;
  description: string;
  basePriceTnd: number;
  unitLabel: string;
  minQuantity: number;
  leadTimeDays: number;
  options: string[];
  active: boolean;
}

export interface DesignerProfile {
  id: string;
  userId?: string;
  name: string;
  roleTitle: string;
  bio: string;
  specialties: string[];
  skills: string[];
  languages: string[];
  experienceYears: number;
  avatarInitials: string;
  portraitTone: string;
  portfolioHighlights: {
    title: string;
    client: string;
    category: string;
    outcome: string;
  }[];
  featured: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  client: string;
  category: 'Textile Printing' | 'Paper Printing' | 'Graphic Design' | 'Brand Identity';
  year: string;
  summary: string;
  deliverables: string[];
  metric: string;
  palette: [string, string, string];
  mockupType: 'apparel' | 'print' | 'identity' | 'packaging';
  featured: boolean;
}

export interface UploadedFileRef {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface DesignPreview {
  id: string;
  version: number;
  title: string;
  notes: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface RevisionRequest {
  id: string;
  message: string;
  requestedBy: string;
  createdAt: string;
  resolved: boolean;
}

export interface OrderMessage {
  id: string;
  senderName: string;
  senderRole: UserRole;
  body: string;
  createdAt: string;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  note: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
}

export interface OrderSpecifications {
  productType: string;
  color?: string;
  colorHex?: string;
  sizes?: string[];
  format?: string;
  paperType?: string;
  finish?: string;
  printMethod?: string;
  quantity: number;
  deliveryMethod: 'Studio Pickup (Lac 2, Tunis)' | 'Grand Tunis Courier' | 'Tunisia National Delivery';
  deliveryAddress?: string;
  needsCustomDesign: boolean;
  creativeBrief: string;
}

export interface StudioOrder {
  id: string;
  trackingCode: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  category: ServiceCategory;
  serviceId: string;
  serviceName: string;
  status: OrderStatus;
  specifications: OrderSpecifications;
  estimatedPriceTnd: number;
  quotedPriceTnd: number | null;
  paymentStatus: PaymentStatus;
  invoiceNumber: string;
  assignedDesignerId: string | null;
  assignedDesignerName: string | null;
  assignedProductionLead: string | null;
  productionNotes: string;
  referenceFiles: UploadedFileRef[];
  designPreviews: DesignPreview[];
  revisions: RevisionRequest[];
  messages: OrderMessage[];
  timeline: OrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Review' | 'Resolved';
  assignedTo: string | null;
  replyNote: string;
  createdAt: string;
}

export interface SiteContent {
  heroHeadline: string;
  heroSlogan: string;
  heroSubtext: string;
  studioLocation: string;
  studioPhone: string;
  studioEmail: string;
  announcementNote: string;
  testimonials: {
    id: string;
    quote: string;
    author: string;
    role: string;
    organization: string;
    outcome: string;
  }[];
  faqs: {
    id: string;
    category: 'Orders & Pricing' | 'Textile Printing' | 'Paper Printing' | 'Graphic Design' | 'Delivery & Revisions';
    question: string;
    answer: string;
  }[];
}

/* ==================== GANZO SHOP TYPES ==================== */

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

export interface ShopColorOption {
  name: string;
  hex: string;
}

export interface ShopProductVariant {
  id: string;
  label: string;
  size?: string;
  color?: string;
  stock: number;
  priceDeltaTnd: number;
}

export interface ShopProduct {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  priceTnd: number;
  compareAtPriceTnd: number | null;
  description: string;
  images: string[];
  sizes: string[];
  colors: ShopColorOption[];
  variants: ShopProductVariant[];
  stock: number;
  customizable: boolean;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  specialOffer: boolean;
  popularityScore: number;
  active: boolean;
  createdAt: string;
}

export interface ShopPromotion {
  id: string;
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  value: number;
  minOrderTnd: number;
  active: boolean;
  usageCount: number;
}

export interface CartItem {
  cartKey: string;
  productId: string;
  sku: string;
  productName: string;
  image: string;
  unitPriceTnd: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  variantLabel: string;
  customizable: boolean;
  personalizationNotes: string;
  customArtwork: UploadedFileRef | null;
}

export interface ShopOrderItem {
  productId: string;
  sku: string;
  productName: string;
  image: string;
  quantity: number;
  unitPriceTnd: number;
  selectedSize: string;
  selectedColor: string;
  variantLabel: string;
  customizable: boolean;
  personalizationNotes: string;
  customArtwork: UploadedFileRef | null;
}

export interface ShopOrderTimelineEntry {
  status: ShopOrderStatus;
  note: string;
  timestamp: string;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: 'Studio Pickup (Lac 2, Tunis)' | 'Grand Tunis Courier' | 'Tunisia National Delivery';
  deliveryAddress: string;
  city: string;
  governorate: string;
  items: ShopOrderItem[];
  subtotalTnd: number;
  discountCode: string;
  discountTnd: number;
  shippingFeeTnd: number;
  totalTnd: number;
  paymentMethod: 'Cash on Delivery';
  paymentStatus: 'Unpaid (COD)' | 'Paid';
  status: ShopOrderStatus;
  timeline: ShopOrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export type PageRoute =
  | 'home'
  | 'shop'
  | 'about'
  | 'textile'
  | 'paper'
  | 'design'
  | 'designers'
  | 'portfolio'
  | 'quote'
  | 'contact'
  | 'customer-dashboard'
  | 'tracking'
  | 'faq'
  | 'admin-dashboard';

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  administrator: 'Administrator',
  project_manager: 'Project Manager',
  graphic_designer: 'Graphic Designer',
  production_manager: 'Production Manager',
  customer_support: 'Customer Support',
};
