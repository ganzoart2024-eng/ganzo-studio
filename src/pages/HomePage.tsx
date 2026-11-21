import React, { useState } from 'react';
import { ArrowRight, Check, ShoppingBag } from 'lucide-react';
import { ApparelMockup, PaperMockup, PortfolioVisual } from '../components/StudioMockups';
import { formatTnd } from '../lib/api';
import type { DesignerProfile, PageRoute, PortfolioItem, ShopProduct, SiteContent } from '../types/studio';

interface HomePageProps {
  onNavigate: (page: PageRoute) => void;
  siteContent: SiteContent;
  portfolio: PortfolioItem[];
  designers: DesignerProfile[];
  featuredProducts?: ShopProduct[];
  onOpenShopProduct?: (productId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  siteContent,
  portfolio,
  designers,
  featuredProducts = [],
  onOpenShopProduct,
}) => {
  const [showcaseTab, setShowcaseTab] = useState<'apparel' | 'print' | 'identity'>('apparel');
  const featuredPortfolio = portfolio.filter((p) => p.featured).slice(0, 3);
  const storePreview = featuredProducts.slice(0, 4);

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <img
                    src="/assets/aistudio/logo_ganzo_brand_1_c97e8249.png"
                    alt="GANZO Brand Emblem"
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 object-contain border border-neutral-200 p-1.5 bg-white"
                  />
                  <div>
                    <div className="font-mono text-xs tracking-widest text-[#007A87] font-semibold">
                      {siteContent.heroSlogan}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {siteContent.studioLocation} · {siteContent.announcementNote}
                    </div>
                  </div>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-[#111111] leading-[1.06] text-balance max-w-2xl">
                  {siteContent.heroHeadline}
                </h1>

                <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl">
                  {siteContent.heroSubtext}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('shop')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#00FFFF] text-[#111111] text-sm font-bold hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Visit GANZO SHOP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('quote')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#111111] text-white text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <span>Start Custom Project</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('textile')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 bg-white text-[#111111] border border-[#111111] text-sm font-semibold hover:bg-[#F4F4F4] transition-colors cursor-pointer"
                  >
                    <span>Studio Services</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-neutral-200 max-w-xl">
                <div>
                  <div className="font-display text-2xl font-bold text-[#111111] tabular-nums">10 Stages</div>
                  <div className="text-xs text-neutral-500 mt-1">Tracked end-to-end workflow</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-[#111111] tabular-nums">1 Studio</div>
                  <div className="text-xs text-neutral-500 mt-1">Design, print &amp; QC unified</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-[#111111] tabular-nums">24 Gov.</div>
                  <div className="text-xs text-neutral-500 mt-1">Delivery across Tunisia</div>
                </div>
              </div>
            </div>

            {/* Interactive Visual Product Showcase */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#111111] text-white p-6 border border-[#111111]">
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-neutral-800">
                <span className="text-xs font-mono text-[#00FFFF]">LIVE PRODUCT SHOWCASE</span>
                <div className="flex items-center gap-1 bg-neutral-900 p-1">
                  {(
                    [
                      ['apparel', 'Textile'],
                      ['print', 'Print'],
                      ['identity', 'Identity'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setShowcaseTab(key)}
                      className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        showcaseTab === key ? 'bg-[#00FFFF] text-[#111111]' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="my-5">
                {showcaseTab === 'apparel' && (
                  <ApparelMockup
                    productName="220gsm Heavyweight Tee"
                    colorHex="#111111"
                    printText="CARTHAGE"
                    printMethod="DTF + Embroidery"
                  />
                )}
                {showcaseTab === 'print' && (
                  <PaperMockup
                    productName="Executive Business Cards"
                    format="85×55mm"
                    paperType="400g Cotton Luxury"
                    finish="Cyan Foil + Soft Touch"
                    brandTitle="DAR EL MEDINA"
                  />
                )}
                {showcaseTab === 'identity' && (
                  <div className="bg-[#F4F4F4] text-[#111111] p-6 border border-neutral-200 min-h-[340px] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                      <span>BRAND ARCHITECTURE</span>
                      <span>VECTOR + PRINT</span>
                    </div>
                    <div className="my-auto py-6 flex flex-col items-center text-center space-y-4">
                      <img
                        src="/assets/aistudio/logo_ganzo_brand_1_c97e8249.png"
                        alt="GANZO STUDIO Identity Specimen"
                        referrerPolicy="no-referrer"
                        className="h-24 w-24 object-contain"
                      />
                      <div>
                        <div className="font-display text-xl font-extrabold tracking-tight">
                          Custom Brand Systems
                        </div>
                        <p className="text-xs text-neutral-600 mt-1 max-w-xs">
                          Logos, packaging dielines, typography, and apparel graphics crafted under one roof.
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
                      <span>AI · SVG · EPS · CMYK PDF</span>
                      <span className="font-mono text-[#007A87] font-semibold">GANZO STUDIO</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 pt-2 text-xs text-neutral-400">
                <span>
                  {showcaseTab === 'apparel'
                    ? 'Configure colors, sizes & print placement'
                    : showcaseTab === 'print'
                      ? 'Choose paper stock, foil & finishing specs'
                      : 'Submit your creative brief to our team'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(showcaseTab === 'apparel' ? 'textile' : showcaseTab === 'print' ? 'paper' : 'design')
                  }
                  className="text-[#00FFFF] font-semibold whitespace-nowrap hover:underline cursor-pointer"
                >
                  Configure →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Four Service Category Cards */}
      <section className="bg-[#F4F4F4] border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="font-mono text-xs text-[#007A87] font-semibold tracking-wider">FOUR CORE PILLARS</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] mt-2 text-balance">
                Everything your brand needs, managed by one studio.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('quote')}
              className="text-sm font-semibold text-[#111111] underline underline-offset-4 hover:text-[#007A87] whitespace-nowrap cursor-pointer"
            >
              Request a Custom Bundle Quote →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                index: '01',
                title: 'Textile Printing',
                desc: 'T-shirts, hoodies, polos, caps, pants, and corporate uniforms with screen print, DTF, or embroidery.',
                meta: '10+ pcs · Live mockup',
                page: 'textile' as PageRoute,
              },
              {
                index: '02',
                title: 'Paper Printing',
                desc: 'Business cards, flyers, posters, brochures, catalogues, menus, stickers, invitations, and packaging.',
                meta: 'Offset & digital · Foil & UV',
                page: 'paper' as PageRoute,
              },
              {
                index: '03',
                title: 'Graphic Design',
                desc: 'Logo systems, brand identity, social campaigns, packaging dielines, menus, illustration, and motion.',
                meta: 'Creative brief · Studio proofs',
                page: 'design' as PageRoute,
              },
              {
                index: '04',
                title: 'Our Designers',
                desc: `${designers.length} specialized internal & collaborating creatives assigned directly by GANZO to your order.`,
                meta: 'Zero freelance friction',
                page: 'designers' as PageRoute,
              },
            ].map((card) => (
              <button
                key={card.index}
                type="button"
                onClick={() => onNavigate(card.page)}
                className="group text-left bg-white border border-neutral-200 p-7 flex flex-col justify-between hover:border-[#111111] transition-colors cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-neutral-500">{card.index}</span>
                    <span className="w-2.5 h-2.5 bg-[#00FFFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#111111]">{card.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{card.desc}</p>
                </div>
                <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-neutral-500">{card.meta}</span>
                  <span className="font-semibold text-[#111111] group-hover:translate-x-0.5 transition-transform">
                    Open →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2B. GANZO SHOP — Direct Store & Customizable Products */}
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="font-mono text-xs text-[#007A87] font-semibold tracking-wider">GANZO SHOP · OFFICIAL STORE</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] mt-2 text-balance">
                Ready-made essentials &amp; customizable merch in TND.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-sm font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>Browse Full Store</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 border border-neutral-200 bg-[#F4F4F4] p-6">
            <div className="space-y-1">
              <div className="font-mono text-[11px] font-semibold text-[#007A87]">01 · READY-MADE PURCHASE</div>
              <div className="font-display text-base font-bold text-[#111111]">In-Stock GANZO Editions</div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Direct checkout in Tunisian Dinars with immediate dispatch from our Tunis studio.
              </p>
            </div>
            <div className="space-y-1 md:border-l md:border-neutral-300 md:pl-6">
              <div className="font-mono text-[11px] font-semibold text-[#007A87]">02 · CUSTOMIZABLE ITEMS</div>
              <div className="font-display text-base font-bold text-[#111111]">Upload Artwork Per Item</div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Personalize mugs, hoodies, caps, and notebooks directly on the product page before checkout.
              </p>
            </div>
            <div className="space-y-1 md:border-l md:border-neutral-300 md:pl-6">
              <div className="font-mono text-[11px] font-semibold text-[#007A87]">03 · STUDIO QUOTATIONS</div>
              <div className="font-display text-base font-bold text-[#111111]">Bespoke Design &amp; Bulk Print</div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Need brand identity, packaging dielines, or 50+ uniforms? Request an official GANZO STUDIO quote.
              </p>
            </div>
          </div>

          {storePreview.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {storePreview.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => (onOpenShopProduct ? onOpenShopProduct(prod.id) : onNavigate('shop'))}
                  className="group text-left border border-neutral-200 bg-white hover:border-[#111111] transition-colors flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="aspect-[4/3] bg-[#F4F4F4] overflow-hidden border-b border-neutral-200">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-500">
                        <span>{prod.categoryName}</span>
                        {prod.customizable && <span className="text-[#007A87] font-semibold">CUSTOMIZABLE</span>}
                      </div>
                      <h3 className="font-display text-base font-bold text-[#111111] leading-snug">{prod.name}</h3>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-neutral-100">
                    <div className="font-mono text-sm font-bold text-[#111111] tabular-nums">
                      {formatTnd(prod.priceTnd)}
                    </div>
                    <span className="text-xs font-semibold text-[#111111] group-hover:text-[#007A87]">
                      View Item →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Featured Projects & Portfolio */}
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="font-mono text-xs text-[#007A87] font-semibold tracking-wider">SELECTED WORK</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] mt-2">
                Recent productions delivered across Tunisia.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('portfolio')}
              className="px-5 py-2.5 border border-[#111111] text-sm font-semibold text-[#111111] hover:bg-[#111111] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              View Full Portfolio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPortfolio.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('portfolio')}
                className="border border-neutral-200 bg-white flex flex-col justify-between cursor-pointer hover:border-[#111111] transition-colors"
              >
                <PortfolioVisual item={item} />
                <div className="p-6 space-y-3">
                  <div className="text-xs text-neutral-500">
                    {item.category} · {item.year}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#111111] leading-snug">{item.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{item.summary}</p>
                  <div className="pt-3 border-t border-neutral-100 text-xs font-medium text-[#007A87]">
                    {item.metric}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works & Why Choose GANZO */}
      <section className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-8">
              <div>
                <p className="font-mono text-xs text-[#00FFFF] tracking-wider">HOW IT WORKS</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2 text-balance">
                  One accountable pipeline from creative brief to delivery.
                </h2>
              </div>

              <div className="divide-y divide-neutral-800 border-t border-b border-neutral-800">
                {[
                  {
                    step: '01',
                    title: 'Select Service & Specifications',
                    text: 'Choose textile, paper print, or graphic design specs, upload reference files, and receive an instant TND estimate.',
                  },
                  {
                    step: '02',
                    title: 'Official GANZO Review & Quote',
                    text: 'Our project managers verify artwork feasibility, confirm exact pricing, and lock your delivery schedule.',
                  },
                  {
                    step: '03',
                    title: 'Internal Team Design & Previews',
                    text: 'GANZO assigns the specialist designer internally. You review digital proofs and request revisions in one dashboard.',
                  },
                  {
                    step: '04',
                    title: 'In-House Production & Quality Control',
                    text: 'Once you approve the final design, our print & apparel workshop executes production followed by multi-point QC.',
                  },
                  {
                    step: '05',
                    title: 'Studio Pickup or Nationwide Delivery',
                    text: 'Collect from Les Berges du Lac 2 in Tunis or receive tracked delivery across all 24 Tunisian governorates.',
                  },
                ].map((row) => (
                  <div key={row.step} className="py-5 grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-2 font-mono text-sm text-[#00FFFF] tabular-nums">{row.step}</div>
                    <div className="col-span-10">
                      <h3 className="font-display text-base font-bold text-white">{row.title}</h3>
                      <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{row.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#18181B] border border-neutral-800 p-8 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <p className="font-mono text-xs text-[#00FFFF] tracking-wider">WHY CHOOSE GANZO</p>
                <h3 className="font-display text-2xl font-bold text-white">
                  Not a freelance marketplace. A full creative &amp; print house.
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  You never waste time vetting random freelancers or chasing disconnected print shops. GANZO STUDIO owns the quality, deadlines, and client communication from start to finish.
                </p>

                <ul className="space-y-3 pt-4">
                  {[
                    'Single point of contact — communicate only with GANZO Studio',
                    'Pre-press calibration & fabric testing included on every order',
                    'Real-time 10-stage order tracking with design proof approvals',
                    'Transparent TND quotations, deposits, and official invoices',
                    'Dedicated creative team + in-house Tunis production workshop',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-neutral-200">
                      <Check className="w-4 h-4 text-[#00FFFF] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-neutral-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="text-sm font-semibold text-white hover:text-[#00FFFF] transition-colors cursor-pointer"
                >
                  About Our Studio Model →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('tracking')}
                  className="text-xs font-mono text-[#00FFFF] hover:underline cursor-pointer"
                >
                  Track an Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Testimonials */}
      <section className="bg-[#F4F4F4] border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="mb-10">
            <p className="font-mono text-xs text-[#007A87] font-semibold tracking-wider">CLIENT PROOF</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#111111] mt-2">
              Trusted by Tunisian cafés, startups, and event organizers.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {siteContent.testimonials.map((t) => (
              <div key={t.id} className="bg-white border border-neutral-200 p-7 flex flex-col justify-between space-y-6">
                <p className="text-sm text-neutral-700 leading-relaxed">“{t.quote}”</p>
                <div className="pt-5 border-t border-neutral-100 space-y-2">
                  <div className="font-display text-sm font-bold text-[#111111]">{t.author}</div>
                  <div className="text-xs text-neutral-500">
                    {t.role} · {t.organization}
                  </div>
                  <div className="text-xs font-medium text-[#007A87]">{t.outcome}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Contact CTA */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="bg-[#111111] text-white p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <p className="font-mono text-xs text-[#00FFFF] tracking-wider">{siteContent.heroSlogan}</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                Ready to launch your next collection, print run, or brand identity?
              </h2>
              <p className="text-sm text-neutral-300">
                Submit a project brief in two minutes or speak directly with our Tunis studio team.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('quote')}
                className="px-6 py-3.5 bg-[#00FFFF] text-[#111111] text-sm font-bold hover:bg-white transition-colors cursor-pointer"
              >
                Request a Quote
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="px-6 py-3.5 border border-neutral-600 text-white text-sm font-semibold hover:border-white transition-colors cursor-pointer"
              >
                Contact GANZO
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
