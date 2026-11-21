import React, { useMemo, useState } from 'react';
import { CheckCircle2, Upload, X } from 'lucide-react';
import { ApparelMockup, PaperMockup } from '../components/StudioMockups';
import { apiFetch, formatTnd, uploadStudioFile } from '../lib/api';
import type {
  PageRoute,
  PublicUser,
  ServiceCategory,
  StudioOrder,
  StudioService,
  UploadedFileRef,
} from '../types/studio';

interface ServicePageProps {
  mode: 'textile' | 'paper' | 'design' | 'quote';
  services: StudioService[];
  user: PublicUser | null;
  onNavigate: (page: PageRoute) => void;
  onTrackOrder: (trackingCode: string) => void;
  onOrderCreated: (order: StudioOrder) => void;
}

const TEXTILE_COLORS = [
  { name: 'Obsidian Black', hex: '#111111' },
  { name: 'Optic White', hex: '#FFFFFF' },
  { name: 'GANZO Cyan', hex: '#00FFFF' },
  { name: 'Slate Navy', hex: '#1E293B' },
  { name: 'Stone Gray', hex: '#E4E4E7' },
  { name: 'Forest Olive', hex: '#14532D' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const ServiceConfigPages: React.FC<ServicePageProps> = ({
  mode,
  services,
  user,
  onNavigate,
  onTrackOrder,
  onOrderCreated,
}) => {
  const [quoteCategory, setQuoteCategory] = useState<ServiceCategory>('textile');
  const activeCategory: ServiceCategory = mode === 'quote' ? quoteCategory : mode;

  const categoryServices = useMemo(
    () => services.filter((s) => s.category === activeCategory && s.active),
    [services, activeCategory],
  );

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const activeService =
    categoryServices.find((s) => s.id === selectedServiceId) || categoryServices[0];

  // Textile state
  const [selectedColor, setSelectedColor] = useState(TEXTILE_COLORS[0]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L']);
  const [printMethod, setPrintMethod] = useState('DTF High-Definition');
  const [placement, setPlacement] = useState<'front' | 'back'>('front');
  const [mockupBrandLabel, setMockupBrandLabel] = useState('YOUR BRAND');

  // Paper state
  const [paperFormat, setPaperFormat] = useState('85×55mm Standard');
  const [paperStock, setPaperStock] = useState('350g Matte Coated');
  const [paperFinish, setPaperFinish] = useState('Matte Lamination');

  // Common order state
  const [quantity, setQuantity] = useState<number>(
    activeCategory === 'textile' ? 25 : activeCategory === 'paper' ? 250 : 1,
  );
  const [needsCustomDesign, setNeedsCustomDesign] = useState<boolean>(activeCategory === 'design');
  const [creativeBrief, setCreativeBrief] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<
    'Studio Pickup (Lac 2, Tunis)' | 'Grand Tunis Courier' | 'Tunisia National Delivery'
  >('Grand Tunis Courier');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Contact fields (prefilled if logged in)
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');

  // Upload & submit states
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileRef[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<StudioOrder | null>(null);

  const handleCategorySwitch = (cat: ServiceCategory) => {
    setQuoteCategory(cat);
    const first = services.find((s) => s.category === cat && s.active);
    if (first) {
      setSelectedServiceId(first.id);
      setQuantity(first.minQuantity);
    }
    setNeedsCustomDesign(cat === 'design');
  };

  const handleServiceSelect = (srv: StudioService) => {
    setSelectedServiceId(srv.id);
    setQuantity(srv.minQuantity);
    if (srv.options[0]) {
      setPaperFormat(srv.options[0]);
    }
  };

  const toggleSize = (sz: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? (prev.length > 1 ? prev.filter((s) => s !== sz) : prev) : [...prev, sz],
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const uploaded = await uploadStudioFile(file);
      setUploadedFiles((prev) => [...prev, uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const estimatedTotal = useMemo(() => {
    if (!activeService) return 180;
    const qty = Math.max(1, quantity);
    let total = activeService.basePriceTnd;
    if (activeService.category === 'textile') {
      const discount = qty >= 100 ? 0.82 : qty >= 50 ? 0.9 : 1;
      total = Math.round(activeService.basePriceTnd * qty * discount);
    } else if (activeService.category === 'paper') {
      const ratio = Math.max(1, qty / Math.max(1, activeService.minQuantity));
      const scale = ratio > 3 ? ratio * 0.78 : ratio;
      const extra =
        paperFinish.includes('Foil') || paperFinish.includes('Spot UV') ? 85 : 0;
      total = Math.round(activeService.basePriceTnd * scale + extra);
    } else {
      total = Math.round(activeService.basePriceTnd * qty);
    }
    if (needsCustomDesign && activeService.category !== 'design') {
      total += 140;
    }
    return total;
  }, [activeService, quantity, paperFinish, needsCustomDesign]);

  const previewImageUrl = useMemo(() => {
    const imgFile = uploadedFiles.find((f) => f.mimeType.startsWith('image/'));
    return imgFile ? imgFile.url : null;
  }, [uploadedFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalName = (customerName || user?.name || '').trim();
    const finalEmail = (customerEmail || user?.email || '').trim();

    if (!finalName || !finalEmail) {
      setError('Please enter your full name and email address to receive your quote & tracking code.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ order: StudioOrder }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: finalName,
          customerEmail: finalEmail,
          customerPhone: customerPhone || user?.phone || '',
          companyName: companyName || user?.companyName || '',
          category: activeCategory,
          serviceId: activeService?.id,
          serviceName: activeService?.name,
          referenceFiles: uploadedFiles,
          specifications: {
            productType: activeService?.name || 'Custom Order',
            color: activeCategory === 'textile' ? selectedColor.name : undefined,
            colorHex: activeCategory === 'textile' ? selectedColor.hex : undefined,
            sizes: activeCategory === 'textile' ? selectedSizes : undefined,
            printMethod: activeCategory === 'textile' ? printMethod : undefined,
            format: activeCategory === 'paper' ? paperFormat : undefined,
            paperType: activeCategory === 'paper' ? paperStock : undefined,
            finish: activeCategory === 'paper' ? paperFinish : undefined,
            quantity,
            deliveryMethod,
            deliveryAddress,
            needsCustomDesign,
            creativeBrief:
              creativeBrief.trim() ||
              `Standard ${activeService?.name || 'project'} specification submitted via GANZO STUDIO configurator.`,
          },
        }),
      });
      setCreatedOrder(res.order);
      onOrderCreated(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  if (createdOrder) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-[#111111] p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 text-[#007A87]">
            <CheckCircle2 className="w-7 h-7" />
            <span className="font-mono text-xs font-semibold tracking-wider">ORDER RECEIVED BY GANZO STUDIO</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[#111111]">
            Project submitted — {createdOrder.trackingCode}
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Our project management desk in Tunis is reviewing your specifications ({createdOrder.serviceName}, qty{' '}
            {createdOrder.specifications.quantity}). You will receive an official fixed quotation before production begins.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F4F4F4] p-5 border border-neutral-200">
            <div>
              <div className="text-xs text-neutral-500">Tracking Code</div>
              <div className="font-mono text-base font-bold text-[#111111] mt-1">{createdOrder.trackingCode}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Initial Estimate</div>
              <div className="font-mono text-base font-bold text-[#111111] mt-1 tabular-nums">
                {formatTnd(createdOrder.estimatedPriceTnd)}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Current Status</div>
              <div className="text-sm font-semibold text-[#007A87] mt-1">{createdOrder.status}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onTrackOrder(createdOrder.trackingCode)}
              className="px-6 py-3 bg-[#111111] text-white text-sm font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
            >
              Track Order Live
            </button>
            <button
              type="button"
              onClick={() => onNavigate('customer-dashboard')}
              className="px-6 py-3 border border-[#111111] text-[#111111] text-sm font-semibold hover:bg-[#F4F4F4] transition-colors cursor-pointer"
            >
              Open Customer Dashboard
            </button>
            <button
              type="button"
              onClick={() => setCreatedOrder(null)}
              className="text-sm text-neutral-600 underline cursor-pointer"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </section>
    );
  }

  const headerMeta: Record<typeof mode, { kicker: string; title: string; subtitle: string }> = {
    textile: {
      kicker: '01 · TEXTILE PRINTING',
      title: 'Custom Apparel & Workwear Production',
      subtitle:
        'Select your garment, choose colors and sizes, upload artwork or request a custom GANZO design, and preview your product live.',
    },
    paper: {
      kicker: '02 · PAPER PRINTING',
      title: 'Commercial Print, Stationery & Packaging',
      subtitle:
        'Configure formats, heavyweight paper stocks, lamination, foil finishes, and quantities for crisp pre-press production.',
    },
    design: {
      kicker: '03 · GRAPHIC DESIGN',
      title: 'Studio-Managed Brand & Visual Design',
      subtitle:
        'Submit your creative brief directly to GANZO STUDIO. Our internal art directors assign the specialist designer and deliver studio-verified proofs.',
    },
    quote: {
      kicker: 'PROJECT BRIEF & QUOTATION',
      title: 'Request an Official GANZO STUDIO Quote',
      subtitle:
        'Configure any textile, paper print, or graphic design service and receive an instant baseline estimate plus an official studio quotation.',
    },
  };

  return (
    <section className="bg-white">
      {/* Page Banner */}
      <div className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="font-mono text-xs text-[#00FFFF] tracking-wider">{headerMeta[mode].kicker}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2 text-balance">
            {headerMeta[mode].title}
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 mt-3 max-w-2xl leading-relaxed">
            {headerMeta[mode].subtitle}
          </p>

          {mode === 'quote' && (
            <div className="flex flex-wrap gap-2 mt-6">
              {(
                [
                  ['textile', 'Textile Printing'],
                  ['paper', 'Paper Printing'],
                  ['design', 'Graphic Design'],
                ] as [ServiceCategory, string][]
              ).map(([cat, label]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySwitch(cat)}
                  className={`px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#00FFFF] text-[#111111]'
                      : 'bg-neutral-900 text-neutral-300 border border-neutral-700 hover:border-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Configurator + Live Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
            {/* Step 1: Product / Service Catalog */}
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-[#111111]">
                1. Choose {activeCategory === 'textile' ? 'Garment' : activeCategory === 'paper' ? 'Print Product' : 'Design Service'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryServices.map((srv) => {
                  const selected = activeService?.id === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleServiceSelect(srv)}
                      className={`text-left p-4 border transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#111111] bg-[#F4F4F4]'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-bold text-[#111111]">{srv.name}</span>
                        <span className="font-mono text-xs font-semibold text-[#007A87] tabular-nums shrink-0">
                          {formatTnd(srv.basePriceTnd)}/{srv.unitLabel}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{srv.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Category-specific Specs */}
            {activeCategory === 'textile' && (
              <div className="space-y-6 pt-6 border-t border-neutral-200">
                <h2 className="font-display text-lg font-bold text-[#111111]">2. Garment Color, Sizes &amp; Print Method</h2>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">
                    Garment Color: <span className="text-[#111111]">{selectedColor.name}</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {TEXTILE_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        title={c.name}
                        className={`flex items-center gap-2 px-3 py-1.5 border text-xs cursor-pointer ${
                          selectedColor.name === c.name
                            ? 'border-[#111111] bg-[#F4F4F4] font-semibold'
                            : 'border-neutral-200 bg-white'
                        }`}
                      >
                        <span
                          className="w-4 h-4 border border-neutral-300"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">Sizes Required</label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        className={`w-11 h-10 text-xs font-mono font-semibold border cursor-pointer ${
                          selectedSizes.includes(sz)
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Printing Technique</label>
                    <select
                      value={printMethod}
                      onChange={(e) => setPrintMethod(e.target.value)}
                      className="w-full px-3 py-2.5 border border-neutral-300 bg-white text-sm"
                    >
                      <option value="DTF High-Definition">DTF High-Definition</option>
                      <option value="Screen Printing">Screen Printing (Spot Color)</option>
                      <option value="Embroidery">Multi-Head Embroidery</option>
                      <option value="DTF + Chest Embroidery">DTF + Chest Embroidery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Mockup Label Text</label>
                    <input
                      type="text"
                      value={mockupBrandLabel}
                      onChange={(e) => setMockupBrandLabel(e.target.value)}
                      placeholder="YOUR BRAND"
                      className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'paper' && (
              <div className="space-y-5 pt-6 border-t border-neutral-200">
                <h2 className="font-display text-lg font-bold text-[#111111]">2. Format, Paper Stock &amp; Finish</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Format / Dimensions</label>
                    <select
                      value={paperFormat}
                      onChange={(e) => setPaperFormat(e.target.value)}
                      className="w-full px-3 py-2.5 border border-neutral-300 bg-white text-sm"
                    >
                      {(activeService?.options || ['A4', 'A5', '85×55mm Standard']).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      <option value="Custom Die-Cut Size">Custom Die-Cut Size</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Paper Weight &amp; Stock</label>
                    <select
                      value={paperStock}
                      onChange={(e) => setPaperStock(e.target.value)}
                      className="w-full px-3 py-2.5 border border-neutral-300 bg-white text-sm"
                    >
                      <option value="350g Matte Coated">350g Matte Coated</option>
                      <option value="400g Cotton Luxury">400g Cotton Luxury</option>
                      <option value="170g Silk Couché">170g Silk Couché</option>
                      <option value="250g Kraft Natural">250g Kraft Natural</option>
                      <option value="Waterproof PVC Vinyl">Waterproof PVC Vinyl</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Finishing</label>
                    <select
                      value={paperFinish}
                      onChange={(e) => setPaperFinish(e.target.value)}
                      className="w-full px-3 py-2.5 border border-neutral-300 bg-white text-sm"
                    >
                      <option value="Matte Lamination">Matte Lamination</option>
                      <option value="Soft-Touch Velvet">Soft-Touch Velvet</option>
                      <option value="Spot UV Highlights">Spot UV Highlights</option>
                      <option value="Cyan / Metallic Foil">Cyan / Metallic Foil</option>
                      <option value="Uncoated Raw">Uncoated Raw</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity & Custom Design Toggle */}
            <div className="space-y-5 pt-6 border-t border-neutral-200">
              <h2 className="font-display text-lg font-bold text-[#111111]">
                {activeCategory === 'design' ? '2. Scope & Creative Brief' : '3. Quantity, Design Option & Brief'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Quantity ({activeService?.unitLabel || 'units'}) — Min {activeService?.minQuantity || 1}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2.5 border border-neutral-300 font-mono text-sm tabular-nums"
                  />
                </div>

                {activeCategory !== 'design' && (
                  <label className="flex items-center gap-3 p-3 border border-neutral-200 bg-[#F4F4F4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needsCustomDesign}
                      onChange={(e) => setNeedsCustomDesign(e.target.checked)}
                      className="w-4 h-4 accent-[#111111]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#111111]">Request Custom GANZO Design (+140 TND)</div>
                      <div className="text-[11px] text-neutral-500">Our internal studio creates the print-ready artwork</div>
                    </div>
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Project Requirements &amp; Creative Brief
                </label>
                <textarea
                  rows={4}
                  value={creativeBrief}
                  onChange={(e) => setCreativeBrief(e.target.value)}
                  placeholder="Describe colors, text, placement, target audience, or deadline requirements..."
                  className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Upload Logo, Reference Images, or Print Files (PNG, JPG, SVG, PDF)
                </label>
                <label className="flex items-center justify-center gap-2 p-5 border border-dashed border-neutral-400 bg-[#F4F4F4] hover:border-[#111111] cursor-pointer text-sm text-neutral-700">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Uploading to GANZO Studio...' : 'Click to attach reference or print file'}</span>
                  <input type="file" onChange={handleFileChange} className="hidden" />
                </label>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between px-3 py-2 bg-white border border-neutral-200 text-xs"
                      >
                        <span className="truncate font-medium">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setUploadedFiles((prev) => prev.filter((item) => item.id !== f.id))}
                          className="text-neutral-500 hover:text-[#111111] ml-3 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery & Contact */}
            <div className="space-y-4 pt-6 border-t border-neutral-200">
              <h2 className="font-display text-lg font-bold text-[#111111]">4. Delivery &amp; Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Amine Ben Salah"
                    className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="amine@company.tn"
                    className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+216 55 000 000"
                    className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Company / Brand</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Delivery Option</label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) =>
                      setDeliveryMethod(
                        e.target.value as
                          | 'Studio Pickup (Lac 2, Tunis)'
                          | 'Grand Tunis Courier'
                          | 'Tunisia National Delivery',
                      )
                    }
                    className="w-full px-3 py-2.5 border border-neutral-300 bg-white text-sm"
                  >
                    <option value="Studio Pickup (Lac 2, Tunis)">Studio Pickup (Lac 2, Tunis)</option>
                    <option value="Grand Tunis Courier">Grand Tunis Courier</option>
                    <option value="Tunisia National Delivery">Tunisia National Delivery (All 24 Gov.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Delivery Address / Governorate</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street, City, Governorate"
                    className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#111111] text-white font-semibold text-sm hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting Order to GANZO STUDIO...' : 'Submit Order & Request Official Quote'}
            </button>
          </form>

          {/* Right Live Preview & Price Estimate */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            {activeCategory === 'textile' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-500">INTERACTIVE GARMENT MOCKUP</span>
                  <div className="flex gap-1">
                    {(['front', 'back'] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => setPlacement(side)}
                        className={`px-2.5 py-1 text-xs font-medium border cursor-pointer ${
                          placement === side
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {side === 'front' ? 'Front' : 'Back'}
                      </button>
                    ))}
                  </div>
                </div>
                <ApparelMockup
                  productName={activeService?.name || 'Custom T-Shirt'}
                  colorHex={selectedColor.hex}
                  printText={mockupBrandLabel || 'GANZO'}
                  uploadedLogoUrl={previewImageUrl}
                  placement={placement}
                  printMethod={printMethod}
                />
              </div>
            )}

            {activeCategory === 'paper' && (
              <PaperMockup
                productName={activeService?.name || 'Business Cards'}
                format={paperFormat}
                paperType={paperStock}
                finish={paperFinish}
                brandTitle={companyName || mockupBrandLabel || 'YOUR BRAND'}
                uploadedArtUrl={previewImageUrl}
              />
            )}

            {activeCategory === 'design' && (
              <div className="bg-[#111111] text-white p-7 border border-[#111111] space-y-4">
                <div className="font-mono text-xs text-[#00FFFF]">STUDIO DESIGN PROCESS</div>
                <h3 className="font-display text-2xl font-bold">{activeService?.name}</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">{activeService?.description}</p>
                <div className="pt-4 border-t border-neutral-800 space-y-2 text-xs text-neutral-300">
                  <div>· Assigned internally to a GANZO specialist designer</div>
                  <div>· Interactive proof preview delivered to your dashboard</div>
                  <div>· Structured revision rounds before final vector/print delivery</div>
                </div>
              </div>
            )}

            <div className="bg-[#F4F4F4] border border-neutral-200 p-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                <span>ESTIMATED QUOTATION</span>
                <span>LEAD TIME: ~{activeService?.leadTimeDays || 5} DAYS</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-neutral-700 font-medium">{activeService?.name}</span>
                <span className="font-display text-3xl font-extrabold text-[#111111] tabular-nums">
                  {formatTnd(estimatedTotal)}
                </span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                This is an automatic baseline estimate. GANZO STUDIO verifies your files and confirms the final fixed quote before charging or starting production.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
