import React, { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { PageRoute, PublicUser, SiteContent } from '../types/studio';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  user: PublicUser | null;
}

export const StudioHeader: React.FC<HeaderProps> = ({ currentPage, onNavigate, user }) => {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const primaryActionLabel = !user
    ? 'Client Portal'
    : user.role === 'customer'
      ? 'My Dashboard'
      : 'Studio Console';

  const primaryActionTarget: PageRoute =
    user && user.role !== 'customer' ? 'admin-dashboard' : 'customer-dashboard';

  const handleNav = (page: PageRoute) => {
    setServicesOpen(false);
    setMobileOpen(false);
    onNavigate(page);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer"
        >
          <img
            src="/assets/aistudio/logo_ganzo_brand_1_c97e8249.png"
            alt="GANZO STUDIO Crest"
            referrerPolicy="no-referrer"
            className="h-8 w-8 object-contain"
          />
          <span className="font-display text-lg font-extrabold tracking-tight text-[#111111] whitespace-nowrap">
            GANZO STUDIO
          </span>
        </button>

        {/* Zone 2: 5 Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
          <button
            type="button"
            onClick={() => handleNav('shop')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              currentPage === 'shop'
                ? 'text-[#111111] underline underline-offset-8 decoration-2 decoration-[#00A3A3]'
                : 'hover:text-[#111111]'
            }`}
          >
            Shop
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setServicesOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                ['textile', 'paper', 'design', 'quote'].includes(currentPage)
                  ? 'text-[#111111] underline underline-offset-8 decoration-2 decoration-[#00A3A3]'
                  : 'hover:text-[#111111]'
              }`}
            >
              <span>Services</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {servicesOpen && (
              <div
                onMouseLeave={() => setServicesOpen(false)}
                className="absolute left-0 top-full mt-2 w-60 bg-white border border-neutral-200 shadow-lg py-2 z-50"
              >
                <button
                  type="button"
                  onClick={() => handleNav('textile')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#111111] hover:bg-[#F4F4F4] flex items-center justify-between cursor-pointer"
                >
                  <span>Textile Printing</span>
                  <span className="font-mono text-[11px] text-neutral-500">01</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('paper')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#111111] hover:bg-[#F4F4F4] flex items-center justify-between cursor-pointer"
                >
                  <span>Paper Printing</span>
                  <span className="font-mono text-[11px] text-neutral-500">02</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('design')}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#111111] hover:bg-[#F4F4F4] flex items-center justify-between cursor-pointer"
                >
                  <span>Graphic Design</span>
                  <span className="font-mono text-[11px] text-neutral-500">03</span>
                </button>
                <div className="my-1 border-t border-neutral-100" />
                <button
                  type="button"
                  onClick={() => handleNav('quote')}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#00FFFF]/25 cursor-pointer"
                >
                  Request a Quote
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleNav('designers')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              currentPage === 'designers'
                ? 'text-[#111111] underline underline-offset-8 decoration-2 decoration-[#00A3A3]'
                : 'hover:text-[#111111]'
            }`}
          >
            Designers
          </button>

          <button
            type="button"
            onClick={() => handleNav('portfolio')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              currentPage === 'portfolio'
                ? 'text-[#111111] underline underline-offset-8 decoration-2 decoration-[#00A3A3]'
                : 'hover:text-[#111111]'
            }`}
          >
            Portfolio
          </button>

          <button
            type="button"
            onClick={() => handleNav('tracking')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              currentPage === 'tracking'
                ? 'text-[#111111] underline underline-offset-8 decoration-2 decoration-[#00A3A3]'
                : 'hover:text-[#111111]'
            }`}
          >
            Track Order
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav(primaryActionTarget)}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold bg-[#111111] text-white hover:bg-[#00FFFF] hover:text-[#111111] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {primaryActionLabel}
          </button>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 text-[#111111] border border-neutral-200 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200 px-4 py-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['shop', 'GANZO SHOP'],
                ['textile', 'Textile Printing'],
                ['paper', 'Paper Printing'],
                ['design', 'Graphic Design'],
                ['designers', 'Our Designers'],
                ['portfolio', 'Our Portfolio'],
                ['quote', 'Request a Quote'],
                ['tracking', 'Order Tracking'],
                ['about', 'About GANZO'],
                ['faq', 'FAQ'],
                ['contact', 'Contact'],
              ] as [PageRoute, string][]
            ).map(([page, label]) => (
              <button
                key={page}
                type="button"
                onClick={() => handleNav(page)}
                className={`text-left px-3 py-2.5 text-sm border ${
                  currentPage === page
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-[#F4F4F4] text-[#111111] border-neutral-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleNav(primaryActionTarget)}
            className="w-full py-3 bg-[#00FFFF] text-[#111111] font-semibold text-sm"
          >
            {primaryActionLabel}
          </button>
        </div>
      )}
    </header>
  );
};

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
  siteContent: SiteContent;
}

export const StudioFooter: React.FC<FooterProps> = ({ onNavigate, siteContent }) => {
  return (
    <footer className="bg-[#111111] text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-neutral-800">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5">
                <img
                  src="/assets/aistudio/logo_ganzo_brand_1_c97e8249.png"
                  alt="GANZO STUDIO Emblem"
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div>
                <div className="font-display text-xl font-extrabold tracking-tight">GANZO STUDIO</div>
                <div className="font-mono text-[11px] tracking-widest text-[#00FFFF]">
                  {siteContent.heroSlogan}
                </div>
              </div>
            </div>
            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
              Tunisia’s centralized creative design, textile personalization, and commercial printing studio. Managed end-to-end by one accountable team.
            </p>
            <div className="text-xs text-neutral-400 space-y-1 pt-1">
              <p>{siteContent.studioLocation}</p>
              <p>
                {siteContent.studioPhone} · {siteContent.studioEmail}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-mono tracking-wider text-[#00FFFF]">SERVICES</h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                <button type="button" onClick={() => onNavigate('textile')} className="hover:text-white cursor-pointer">
                  Textile Printing
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('paper')} className="hover:text-white cursor-pointer">
                  Paper Printing
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('design')} className="hover:text-white cursor-pointer">
                  Graphic Design
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('quote')} className="hover:text-white cursor-pointer">
                  Request a Quote
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-mono tracking-wider text-[#00FFFF]">STUDIO</h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                <button type="button" onClick={() => onNavigate('shop')} className="text-[#00FFFF] hover:text-white font-semibold cursor-pointer">
                  GANZO SHOP (Store)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('home')} className="hover:text-white cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('about')} className="hover:text-white cursor-pointer">
                  About GANZO
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('designers')} className="hover:text-white cursor-pointer">
                  Our Designers
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('portfolio')} className="hover:text-white cursor-pointer">
                  Our Portfolio
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono tracking-wider text-[#00FFFF]">CLIENT &amp; OPERATIONS</h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('customer-dashboard')}
                  className="hover:text-white cursor-pointer"
                >
                  Customer Dashboard
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('tracking')} className="hover:text-white cursor-pointer">
                  Order Tracking
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('faq')} className="hover:text-white cursor-pointer">
                  FAQ
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('contact')} className="hover:text-white cursor-pointer">
                  Contact
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('admin-dashboard')}
                  className="text-neutral-400 hover:text-[#00FFFF] cursor-pointer"
                >
                  Internal Team &amp; Admin Console
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} GANZO STUDIO Tunisia. All rights reserved.</p>
          <p>{siteContent.announcementNote}</p>
        </div>
      </div>
    </footer>
  );
};
