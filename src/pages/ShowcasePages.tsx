import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { OrderPipelineTracker, PortfolioVisual } from '../components/StudioMockups';
import { apiFetch, formatDateTime, formatTnd } from '../lib/api';
import {
  SHOP_ORDER_STATUSES,
  type DesignerProfile,
  type OrderStatus,
  type OrderTimelineEntry,
  type PageRoute,
  type PortfolioItem,
  type ShopOrderStatus,
  type ShopOrderTimelineEntry,
  type SiteContent,
} from '../types/studio';

/* ==================== ABOUT GANZO ==================== */
export const AboutPage: React.FC<{ onNavigate: (page: PageRoute) => void; siteContent: SiteContent }> = ({
  onNavigate,
  siteContent,
}) => {
  return (
    <section className="bg-white">
      <div className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <p className="font-mono text-xs text-[#00FFFF] tracking-wider">ABOUT GANZO STUDIO</p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mt-2 max-w-3xl text-balance">
            One unified creative house &amp; printing atelier in Tunisia.
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 mt-4 max-w-2xl leading-relaxed">
            Built in Tunis to eliminate the gap between creative direction and physical production. GANZO STUDIO manages every stage—briefing, graphic design, proofing, printing, textile personalization, quality control, and delivery.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              num: '01',
              title: 'Centralized Accountability',
              body: 'Customers never juggle separate freelancers and print workshops. You work exclusively with GANZO STUDIO on one timeline and one invoice.',
            },
            {
              num: '02',
              title: 'Internal Creative Team',
              body: 'Our graphic designers and collaborating specialists are assigned internally by GANZO project managers based on industry and technical print expertise.',
            },
            {
              num: '03',
              title: 'Strict Pre-Press & QC',
              body: 'Every logo, menu, packaging dieline, and garment print passes pre-press calibration and physical inspection before leaving our Tunis facility.',
            },
          ].map((block) => (
            <div key={block.num} className="border border-neutral-200 p-7 bg-[#F4F4F4]">
              <div className="font-mono text-xs text-[#007A87] font-semibold">{block.num}</div>
              <h2 className="font-display text-xl font-bold text-[#111111] mt-3">{block.title}</h2>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{block.body}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-t border-neutral-200 pt-12">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111111]">
              Who we serve across Tunisia &amp; North Africa
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              From emerging streetwear labels and specialty coffee roasters in La Marsa to enterprise conferences, corporate headquarters at Les Berges du Lac, and hospitality groups in Sousse and Hammamet.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('quote')}
                className="px-6 py-3 bg-[#111111] text-white text-sm font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
              >
                Start Your Project
              </button>
              <button
                type="button"
                onClick={() => onNavigate('designers')}
                className="px-6 py-3 border border-[#111111] text-[#111111] text-sm font-semibold hover:bg-[#F4F4F4] transition-colors cursor-pointer"
              >
                Meet Our Creative Team
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#111111] text-white p-8 space-y-3">
            <div className="font-mono text-xs text-[#00FFFF]">TUNIS HEADQUARTERS</div>
            <div className="font-display text-xl font-bold">{siteContent.studioLocation}</div>
            <div className="text-sm text-neutral-300">{siteContent.studioPhone}</div>
            <div className="text-sm text-neutral-300">{siteContent.studioEmail}</div>
            <div className="pt-4 border-t border-neutral-800 text-xs text-neutral-400">
              {siteContent.heroSlogan}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ==================== OUR DESIGNERS ==================== */
export const DesignersPage: React.FC<{
  designers: DesignerProfile[];
  onNavigate: (page: PageRoute) => void;
}> = ({ designers, onNavigate }) => {
  const [selectedDesigner, setSelectedDesigner] = useState<DesignerProfile | null>(null);

  return (
    <section className="bg-white">
      <div className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <p className="font-mono text-xs text-[#00FFFF] tracking-wider">04 · OUR DESIGNERS</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">
            The creative professionals behind GANZO STUDIO.
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 mt-3 max-w-2xl leading-relaxed">
            Every designer listed here works internally or under direct GANZO STUDIO art direction. Customers do not hire freelancers separately—our project managers assign the right specialist to your order and oversee every revision and print proof.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designers.map((d) => (
            <div key={d.id} className="border border-neutral-200 bg-white flex flex-col justify-between p-7">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 flex items-center justify-center text-white font-display text-xl font-bold shrink-0 border border-[#111111]"
                    style={{ backgroundColor: d.portraitTone }}
                  >
                    {d.avatarInitials}
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#111111]">{d.name}</h2>
                    <div className="text-xs text-[#007A87] font-medium">{d.roleTitle}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                      {d.experienceYears} years exp · {d.languages.join(' / ')}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-neutral-600 leading-relaxed">{d.bio}</p>

                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <div className="text-xs font-mono text-neutral-500">SPECIALTIES</div>
                  <div className="text-xs text-[#111111] font-medium">{d.specialties.join(' · ')}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-neutral-500">CORE SKILLS</div>
                  <div className="text-xs text-neutral-600">{d.skills.join(' · ')}</div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedDesigner(d)}
                  className="text-xs font-semibold text-[#111111] underline underline-offset-4 hover:text-[#007A87] cursor-pointer"
                >
                  View Studio Portfolio
                </button>
                <span className="text-[11px] font-mono text-neutral-400">GANZO ASSIGNED</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#F4F4F4] border border-neutral-200 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-[#111111]">
              Want our creative team assigned to your next project?
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Submit your brief to GANZO STUDIO—we match the optimal designer and manage all deliverables.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('design')}
            className="px-6 py-3 bg-[#111111] text-white text-sm font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors shrink-0 cursor-pointer"
          >
            Submit Creative Brief
          </button>
        </div>
      </div>

      {selectedDesigner && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#111111] max-w-lg w-full p-7 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-[#007A87]">GANZO STUDIO CREATIVE PROFILE</div>
                <h3 className="font-display text-2xl font-bold text-[#111111] mt-1">{selectedDesigner.name}</h3>
                <div className="text-sm text-neutral-600">{selectedDesigner.roleTitle}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDesigner(null)}
                className="p-1.5 border border-neutral-200 hover:border-[#111111] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-neutral-700 leading-relaxed">{selectedDesigner.bio}</p>

            <div className="space-y-3 pt-3 border-t border-neutral-200">
              <div className="text-xs font-mono text-neutral-500">SELECTED STUDIO DELIVERABLES</div>
              {selectedDesigner.portfolioHighlights.length === 0 ? (
                <p className="text-xs text-neutral-500">Studio projects managed internally under NDA.</p>
              ) : (
                selectedDesigner.portfolioHighlights.map((item, idx) => (
                  <div key={idx} className="bg-[#F4F4F4] p-4 border border-neutral-200">
                    <div className="text-xs text-neutral-500">
                      {item.client} · {item.category}
                    </div>
                    <div className="font-display text-sm font-bold text-[#111111] mt-0.5">{item.title}</div>
                    <div className="text-xs text-[#007A87] mt-1">{item.outcome}</div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedDesigner(null);
                  onNavigate('quote');
                }}
                className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
              >
                Start a Project with GANZO
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* ==================== OUR PORTFOLIO ==================== */
export const PortfolioPage: React.FC<{
  portfolio: PortfolioItem[];
  onNavigate: (page: PageRoute) => void;
}> = ({ portfolio, onNavigate }) => {
  const [filter, setFilter] = useState<string>('All');
  const [selected, setSelected] = useState<PortfolioItem | null>(null);

  const categories = ['All', 'Textile Printing', 'Paper Printing', 'Graphic Design', 'Brand Identity'];
  const filtered = filter === 'All' ? portfolio : portfolio.filter((p) => p.category === filter);

  return (
    <section className="bg-white">
      <div className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <p className="font-mono text-xs text-[#00FFFF] tracking-wider">OUR PORTFOLIO</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">
            Case studies across branding, print &amp; apparel.
          </h1>
          <div className="flex flex-wrap gap-2 mt-6">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  filter === cat
                    ? 'bg-[#00FFFF] text-[#111111]'
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-700 hover:border-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className="border border-neutral-200 bg-white hover:border-[#111111] transition-colors cursor-pointer flex flex-col justify-between"
            >
              <PortfolioVisual item={item} />
              <div className="p-6 space-y-3">
                <div className="text-xs text-neutral-500">
                  {item.category} · {item.year}
                </div>
                <h2 className="font-display text-lg font-bold text-[#111111]">{item.title}</h2>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.summary}</p>
                <div className="pt-3 border-t border-neutral-100 text-xs font-medium text-[#007A87]">
                  {item.metric}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#111111] max-w-xl w-full p-7 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-neutral-500">
                  {selected.client} · {selected.category} · {selected.year}
                </div>
                <h3 className="font-display text-2xl font-bold text-[#111111] mt-1">{selected.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 border border-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed">{selected.summary}</p>
            <div className="bg-[#F4F4F4] p-4 border border-neutral-200 space-y-2">
              <div className="text-xs font-mono text-neutral-500">DELIVERABLES PRODUCED BY GANZO</div>
              <ul className="space-y-1 text-sm text-[#111111]">
                {selected.deliverables.map((d) => (
                  <li key={d} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#007A87]" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-xs font-semibold text-[#007A87]">{selected.metric}</div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  onNavigate('quote');
                }}
                className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
              >
                Request Similar Production
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* ==================== ORDER TRACKING ==================== */
interface PublicTrackingResult {
  trackingCode: string;
  category: string;
  serviceName: string;
  status: OrderStatus;
  productType: string;
  quantity: number;
  deliveryMethod: string;
  timeline: OrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

interface ShopTrackingResult {
  orderNumber: string;
  status: ShopOrderStatus;
  deliveryMethod: string;
  city: string;
  governorate: string;
  totalTnd: number;
  itemsCount: number;
  timeline: ShopOrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export const OrderTrackingPage: React.FC<{ initialCode?: string }> = ({ initialCode = '' }) => {
  const [codeInput, setCodeInput] = useState(initialCode || 'GNZ-2026-0142');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PublicTrackingResult | null>(null);
  const [shopResult, setShopResult] = useState<ShopTrackingResult | null>(null);

  const performLookup = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    setShopResult(null);

    const upper = trimmed.toUpperCase();
    try {
      if (upper.startsWith('SHP-')) {
        const shopData = await apiFetch<{ tracking: ShopTrackingResult }>(
          `/api/shop/track/${encodeURIComponent(trimmed)}`,
        );
        setShopResult(shopData.tracking);
      } else {
        try {
          const data = await apiFetch<{ tracking: PublicTrackingResult }>(
            `/api/track/${encodeURIComponent(trimmed)}`,
          );
          setResult(data.tracking);
        } catch (studioErr) {
          try {
            const shopData = await apiFetch<{ tracking: ShopTrackingResult }>(
              `/api/shop/track/${encodeURIComponent(trimmed)}`,
            );
            setShopResult(shopData.tracking);
          } catch {
            throw studioErr;
          }
        }
      }
    } catch (err) {
      setResult(null);
      setShopResult(null);
      setError(err instanceof Error ? err.message : 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setCodeInput(initialCode);
      void performLookup(initialCode);
    } else {
      void performLookup('GNZ-2026-0142');
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performLookup(codeInput);
  };

  const shopStageSteps: ShopOrderStatus[] = SHOP_ORDER_STATUSES.filter((s) => s !== 'Cancelled');
  const activeShopIdx = shopResult ? shopStageSteps.indexOf(shopResult.status) : -1;

  return (
    <section className="bg-white">
      <div className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <p className="font-mono text-xs text-[#00FFFF] tracking-wider">LIVE ORDER TRACKING</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">
            Track your GANZO STUDIO or GANZO SHOP order.
          </h1>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter code (e.g. GNZ-2026-0142 or SHP-2026-0401)"
                className="w-full pl-10 pr-4 py-3 bg-white text-[#111111] font-mono text-sm border border-neutral-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#00FFFF] text-[#111111] font-semibold text-sm hover:bg-white transition-colors cursor-pointer"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-neutral-400">
            <span>Sample tracking codes:</span>
            {['GNZ-2026-0142', 'GNZ-2026-0143', 'GNZ-2026-0144', 'SHP-2026-0401'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setCodeInput(sample);
                  void performLookup(sample);
                }}
                className="font-mono text-[#00FFFF] hover:underline cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {error && <div className="p-4 bg-red-50 border border-red-300 text-sm text-red-800">{error}</div>}

        {result && (
          <div className="space-y-8">
            <div className="bg-[#F4F4F4] border border-neutral-200 p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-neutral-500">Studio Order Code</div>
                <div className="font-mono text-base font-bold text-[#111111] mt-1">{result.trackingCode}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Service</div>
                <div className="text-sm font-semibold text-[#111111] mt-1">{result.serviceName}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Quantity &amp; Delivery</div>
                <div className="text-sm text-[#111111] mt-1 tabular-nums">
                  {result.quantity} units · {result.deliveryMethod}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Current Stage</div>
                <div className="text-sm font-bold text-[#007A87] mt-1">{result.status}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold text-[#111111]">10-Stage Studio Workflow</h2>
              <OrderPipelineTracker currentStatus={result.status} />
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-[#111111]">Chronological Activity Log</h2>
              <div className="border border-neutral-200 divide-y divide-neutral-200">
                {[...result.timeline].reverse().map((entry, idx) => (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[#111111]">{entry.status}</div>
                      <div className="text-xs text-neutral-600 mt-0.5">{entry.note}</div>
                    </div>
                    <div className="text-xs font-mono text-neutral-500 shrink-0">
                      {formatDateTime(entry.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {shopResult && (
          <div className="space-y-8">
            <div className="bg-[#F4F4F4] border border-neutral-200 p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-neutral-500">GANZO SHOP Order</div>
                <div className="font-mono text-base font-bold text-[#111111] mt-1">{shopResult.orderNumber}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Items &amp; Total</div>
                <div className="text-sm font-semibold text-[#111111] mt-1 tabular-nums">
                  {shopResult.itemsCount} item{shopResult.itemsCount === 1 ? '' : 's'} · {formatTnd(shopResult.totalTnd)}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Delivery Route</div>
                <div className="text-sm text-[#111111] mt-1">
                  {shopResult.deliveryMethod} ({shopResult.city}, {shopResult.governorate})
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Current Status</div>
                <div className="text-sm font-bold text-[#007A87] mt-1">{shopResult.status}</div>
              </div>
            </div>

            {shopResult.status === 'Cancelled' ? (
              <div className="p-4 bg-red-50 border border-red-300 text-sm text-red-800 font-semibold">
                This store order has been cancelled.
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-bold text-[#111111]">Store Fulfillment Pipeline</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {shopStageSteps.map((stage, idx) => {
                    const completed = activeShopIdx >= idx;
                    const current = activeShopIdx === idx;
                    return (
                      <div
                        key={stage}
                        className={`p-3 border text-xs ${
                          current
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : completed
                              ? 'bg-[#00FFFF]/15 text-[#111111] border-[#00A3A3]'
                              : 'bg-white text-neutral-500 border-neutral-200'
                        }`}
                      >
                        <div className="font-mono text-[10px] opacity-70 tabular-nums">0{idx + 1}</div>
                        <div className="font-semibold mt-1">{stage}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-[#111111]">Delivery Timeline</h2>
              <div className="border border-neutral-200 divide-y divide-neutral-200">
                {[...shopResult.timeline].reverse().map((entry, idx) => (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[#111111]">{entry.status}</div>
                      <div className="text-xs text-neutral-600 mt-0.5">{entry.note}</div>
                    </div>
                    <div className="text-xs font-mono text-neutral-500 shrink-0">
                      {formatDateTime(entry.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

/* ==================== CONTACT PAGE ==================== */
export const ContactPage: React.FC<{ siteContent: SiteContent }> = ({ siteContent }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await apiFetch('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, company, subject, message }),
      });
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-white">
      <div className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <p className="font-mono text-xs text-[#00FFFF] tracking-wider">CONTACT GANZO STUDIO</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">
            Speak directly with our Tunis creative &amp; print desk.
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          {sent ? (
            <div className="bg-[#F4F4F4] border border-[#111111] p-8 space-y-4">
              <h2 className="font-display text-2xl font-bold text-[#111111]">Message received.</h2>
              <p className="text-sm text-neutral-600">
                Our GANZO Customer Support desk has logged your inquiry and will reply by email or phone shortly.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Company / Organization</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Corporate uniforms, restaurant menu run, brand identity..."
                  className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Message *</label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                />
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800">{error}</div>}

              <button
                type="submit"
                disabled={sending}
                className="px-7 py-3.5 bg-[#111111] text-white text-sm font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
              >
                {sending ? 'Sending...' : 'Send Message to GANZO'}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#F4F4F4] border border-neutral-200 p-7 space-y-4">
            <div className="font-mono text-xs text-[#007A87] font-semibold">TUNIS STUDIO &amp; PICKUP DESK</div>
            <div className="font-display text-xl font-bold text-[#111111]">{siteContent.studioLocation}</div>
            <div className="text-sm text-neutral-600 space-y-1">
              <p>Monday – Friday: 08:30 – 18:00</p>
              <p>Saturday: 09:00 – 14:00</p>
            </div>
            <div className="pt-4 border-t border-neutral-200 space-y-1 text-sm text-[#111111]">
              <p className="font-mono">{siteContent.studioPhone}</p>
              <p>{siteContent.studioEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ==================== FAQ PAGE ==================== */
export const FaqPage: React.FC<{
  siteContent: SiteContent;
  onNavigate: (page: PageRoute) => void;
}> = ({ siteContent, onNavigate }) => {
  const [cat, setCat] = useState<string>('All');
  const [openId, setOpenId] = useState<string>(siteContent.faqs[0]?.id || '');

  const categories = [
    'All',
    'Orders & Pricing',
    'Textile Printing',
    'Paper Printing',
    'Graphic Design',
    'Delivery & Revisions',
  ];

  const items = cat === 'All' ? siteContent.faqs : siteContent.faqs.filter((f) => f.category === cat);

  return (
    <section className="bg-white">
      <div className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <p className="font-mono text-xs text-[#00FFFF] tracking-wider">FREQUENTLY ASKED QUESTIONS</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">
            Answers about files, turnaround, pricing &amp; delivery.
          </h1>
          <div className="flex flex-wrap gap-2 mt-6">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                  cat === c
                    ? 'bg-[#00FFFF] text-[#111111]'
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 space-y-3">
        {items.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="border border-neutral-200">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? '' : faq.id)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 bg-white hover:bg-[#F4F4F4] cursor-pointer"
              >
                <div>
                  <div className="text-[11px] font-mono text-[#007A87]">{faq.category}</div>
                  <div className="font-display text-base font-bold text-[#111111] mt-1">{faq.question}</div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-8">
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="px-6 py-3 bg-[#111111] text-white text-sm font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
          >
            Still have a question? Contact GANZO
          </button>
        </div>
      </div>
    </section>
  );
};
