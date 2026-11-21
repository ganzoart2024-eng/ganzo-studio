import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { CartAndCheckoutDrawer } from './components/CartAndCheckoutDrawer';
import { StudioFooter, StudioHeader } from './components/HeaderAndFooter';
import { apiFetch, setStoredToken } from './lib/api';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { HomePage } from './pages/HomePage';
import { ServiceConfigPages } from './pages/ServiceConfigPages';
import { ShopPage } from './pages/ShopPage';
import {
  AboutPage,
  ContactPage,
  DesignersPage,
  FaqPage,
  OrderTrackingPage,
  PortfolioPage,
} from './pages/ShowcasePages';
import type {
  CartItem,
  DesignerProfile,
  PageRoute,
  PortfolioItem,
  PublicUser,
  ShopOrder,
  ShopProduct,
  SiteContent,
  StudioOrder,
  StudioService,
} from './types/studio';

interface BootstrapPayload {
  services: StudioService[];
  designers: DesignerProfile[];
  portfolio: PortfolioItem[];
  siteContent: SiteContent;
}

const VALID_PAGES: PageRoute[] = [
  'home',
  'shop',
  'about',
  'textile',
  'paper',
  'design',
  'designers',
  'portfolio',
  'quote',
  'contact',
  'customer-dashboard',
  'tracking',
  'faq',
  'admin-dashboard',
];

const CART_STORAGE_KEY = 'ganzo_shop_cart';

function loadInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function getInitialRoute(): PageRoute {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace('#', '') as PageRoute;
  return VALID_PAGES.includes(hash) ? hash : 'home';
}

const FALLBACK_SITE_CONTENT: SiteContent = {
  heroHeadline: 'Your Ideas. Our Creativity. One Studio.',
  heroSlogan: 'DESIGN IT. CUSTOMIZE IT. PRINT IT.',
  heroSubtext:
    'GANZO STUDIO unifies graphic design, textile personalization, and commercial paper printing in Tunisia.',
  studioLocation: 'Les Berges du Lac 2, Tunis, Tunisia',
  studioPhone: '+216 71 860 120',
  studioEmail: 'hello@ganzostudio.tn',
  announcementNote: 'Production Dispatch Across All 24 Tunisian Governorates',
  testimonials: [],
  faqs: [],
};

export default function App() {
  const [page, setPage] = useState<PageRoute>(getInitialRoute);
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>({
    services: [],
    designers: [],
    portfolio: [],
    siteContent: FALLBACK_SITE_CONTENT,
  });
  const [featuredShopProducts, setFeaturedShopProducts] = useState<ShopProduct[]>([]);
  const [selectedShopProductId, setSelectedShopProductId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>(loadInitialCart);
  const [cartOpen, setCartOpen] = useState(false);

  const loadBootstrap = async () => {
    try {
      const [studioRes, shopRes] = await Promise.all([
        apiFetch<BootstrapPayload>('/api/public/bootstrap'),
        apiFetch<{ products: ShopProduct[] }>('/api/shop/catalog').catch(() => ({ products: [] })),
      ]);
      setBootstrap(studioRes);
      const activeFeatured = shopRes.products.filter((p) => p.featured || p.bestSeller);
      setFeaturedShopProducts(activeFeatured.length > 0 ? activeFeatured : shopRes.products);
    } catch {
      // Initial fallback stays active if offline
    }
  };

  const loadSession = async () => {
    try {
      const res = await apiFetch<{ user: PublicUser | null }>('/api/auth/me');
      setUser(res.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    void loadBootstrap();
    void loadSession();

    const onHashChange = () => {
      setPage(getInitialRoute());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  const navigate = (next: PageRoute) => {
    if (next !== 'shop') {
      setSelectedShopProductId('');
    }
    setPage(next);
    if (typeof window !== 'undefined') {
      window.location.hash = next === 'home' ? '' : next;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenShopProduct = (productId: string) => {
    setSelectedShopProductId(productId);
    setPage('shop');
    if (typeof window !== 'undefined') {
      window.location.hash = 'shop';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTrackOrder = (code: string) => {
    setTrackingCode(code);
    navigate('tracking');
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    setStoredToken('');
    setUser(null);
    navigate('home');
  };

  const handleAuthenticated = (authedUser: PublicUser) => {
    setUser(authedUser);
    if (authedUser.role !== 'customer' && page === 'customer-dashboard') {
      navigate('admin-dashboard');
    }
  };

  const handleOrderCreated = (_order: StudioOrder) => {
    // Refresh public or session data if needed
  };

  const handleAddToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartKey === newItem.cartKey);
      if (existingIdx >= 0) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + newItem.quantity } : item,
        );
      }
      return [...prev, newItem];
    });
  };

  const handleUpdateCartQty = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveCartItem = (cartKey: string) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleShopOrderSuccess = (_order: ShopOrder) => {
    void loadBootstrap();
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!user) {
      navigate('customer-dashboard');
      return;
    }
    try {
      const res = await apiFetch<{ favorites: string[] }>(`/api/customer/favorites/${productId}`, {
        method: 'POST',
      });
      setUser((prev) => (prev ? { ...prev, favorites: res.favorites } : prev));
    } catch {
      // Ignore if session expired
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111111]">
      <StudioHeader currentPage={page} onNavigate={navigate} user={user} />

      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            onNavigate={navigate}
            siteContent={bootstrap.siteContent}
            portfolio={bootstrap.portfolio}
            designers={bootstrap.designers}
            featuredProducts={featuredShopProducts}
            onOpenShopProduct={handleOpenShopProduct}
          />
        )}

        {page === 'shop' && (
          <ShopPage
            user={user}
            cartCount={cartCount}
            onOpenCart={() => setCartOpen(true)}
            onAddToCart={handleAddToCart}
            onToggleFavorite={(productId) => void handleToggleFavorite(productId)}
            onNavigate={navigate}
            initialProductId={selectedShopProductId}
          />
        )}

        {page === 'about' && <AboutPage onNavigate={navigate} siteContent={bootstrap.siteContent} />}

        {(page === 'textile' || page === 'paper' || page === 'design' || page === 'quote') && (
          <ServiceConfigPages
            key={page}
            mode={page}
            services={bootstrap.services}
            user={user}
            onNavigate={navigate}
            onTrackOrder={handleTrackOrder}
            onOrderCreated={handleOrderCreated}
          />
        )}

        {page === 'designers' && (
          <DesignersPage designers={bootstrap.designers} onNavigate={navigate} />
        )}

        {page === 'portfolio' && (
          <PortfolioPage portfolio={bootstrap.portfolio} onNavigate={navigate} />
        )}

        {page === 'tracking' && <OrderTrackingPage initialCode={trackingCode} />}

        {page === 'contact' && <ContactPage siteContent={bootstrap.siteContent} />}

        {page === 'faq' && <FaqPage siteContent={bootstrap.siteContent} onNavigate={navigate} />}

        {page === 'customer-dashboard' && (
          <CustomerDashboardPage
            user={user}
            onAuthenticated={handleAuthenticated}
            onUserUpdated={setUser}
            onLogout={handleLogout}
            onNavigate={navigate}
            onOpenShopProduct={handleOpenShopProduct}
          />
        )}

        {page === 'admin-dashboard' && (
          <AdminDashboardPage
            user={user}
            designers={bootstrap.designers}
            portfolio={bootstrap.portfolio}
            siteContent={bootstrap.siteContent}
            onAuthenticated={handleAuthenticated}
            onLogout={handleLogout}
            onBootstrapRefresh={() => void loadBootstrap()}
          />
        )}
      </main>

      <StudioFooter onNavigate={navigate} siteContent={bootstrap.siteContent} />

      {cartCount > 0 && !cartOpen && page !== 'admin-dashboard' && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-5 py-3.5 bg-[#111111] text-white border border-[#00FFFF] shadow-xl hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wide">BAG</span>
          <span className="font-mono text-xs font-bold tabular-nums px-1.5 py-0.5 bg-[#00FFFF] text-[#111111]">
            {cartCount}
          </span>
        </button>
      )}

      <CartAndCheckoutDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        user={user}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderSuccess={handleShopOrderSuccess}
        onNavigate={navigate}
      />
    </div>
  );
}
