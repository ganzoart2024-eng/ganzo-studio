import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, Upload, X } from 'lucide-react';
import { apiFetch, formatTnd, uploadStudioFile } from '../lib/api';
import type {
  CartItem,
  PageRoute,
  PublicUser,
  ShopCategory,
  ShopProduct,
  UploadedFileRef,
} from '../types/studio';

interface ShopPageProps {
  user: PublicUser | null;
  cartCount: number;
  onOpenCart: () => void;
  onAddToCart: (item: CartItem) => void;
  onToggleFavorite: (productId: string) => void;
  onNavigate: (page: PageRoute) => void;
  initialProductId?: string;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  user,
  cartCount,
  onOpenCart,
  onAddToCart,
  onToggleFavorite,
  onNavigate,
  initialProductId,
}) => {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Catalog Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showcaseTab, setShowcaseTab] = useState<
    'all' | 'featured' | 'new' | 'bestsellers' | 'offers'
  >('all');
  const [maxPrice, setMaxPrice] = useState<number>(250);
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [customizableOnly, setCustomizableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price-asc' | 'price-desc'>('popular');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // PDP State
  const [activeProductId, setActiveProductId] = useState<string>(initialProductId || '');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [pdpSize, setPdpSize] = useState('');
  const [pdpColor, setPdpColor] = useState('');
  const [pdpQty, setPdpQty] = useState(1);
  const [personalizationNotes, setPersonalizationNotes] = useState('');
  const [customArtwork, setCustomArtwork] = useState<UploadedFileRef | null>(null);
  const [uploadingArt, setUploadingArt] = useState(false);
  const [addedToast, setAddedToast] = useState('');

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ categories: ShopCategory[]; products: ShopProduct[] }>(
        '/api/shop/catalog',
      );
      setCategories(data.categories);
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  useEffect(() => {
    if (initialProductId) {
      setActiveProductId(initialProductId);
    }
  }, [initialProductId]);

  const activeProduct = products.find((p) => p.id === activeProductId) || null;

  useEffect(() => {
    if (activeProduct) {
      setActiveImageIdx(0);
      setPdpSize(activeProduct.sizes[0] || 'Standard');
      setPdpColor(activeProduct.colors[0]?.name || 'Standard');
      setPdpQty(1);
      setPersonalizationNotes('');
      setCustomArtwork(null);
      setAddedToast('');
    }
  }, [activeProduct?.id]);

  const allAvailableSizes = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => p.sizes.forEach((sz) => s.add(sz)));
    return Array.from(s);
  }, [products]);

  const allAvailableColors = useMemo(() => {
    const c = new Set<string>();
    products.forEach((p) => p.colors.forEach((col) => c.add(col.name)));
    return Array.from(c);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (showcaseTab === 'featured' && !p.featured) return false;
      if (showcaseTab === 'new' && !p.newArrival) return false;
      if (showcaseTab === 'bestsellers' && !p.bestSeller) return false;
      if (showcaseTab === 'offers' && !p.specialOffer) return false;
      if (p.priceTnd > maxPrice) return false;
      if (selectedSizeFilter !== 'all' && !p.sizes.includes(selectedSizeFilter)) return false;
      if (selectedColorFilter !== 'all' && !p.colors.some((c) => c.name === selectedColorFilter)) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (customizableOnly && !p.customizable) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.categoryName.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q) &&
        !p.sku.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceTnd - b.priceTnd;
      if (sortBy === 'price-desc') return b.priceTnd - a.priceTnd;
      if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
      return b.popularityScore - a.popularityScore;
    });
  }, [
    products,
    search,
    selectedCategory,
    showcaseTab,
    maxPrice,
    selectedSizeFilter,
    selectedColorFilter,
    inStockOnly,
    customizableOnly,
    sortBy,
  ]);

  const relatedProducts = useMemo(() => {
    if (!activeProduct) return [];
    return products
      .filter((p) => p.id !== activeProduct.id)
      .sort((a, b) =>
        a.categoryId === activeProduct.categoryId && b.categoryId !== activeProduct.categoryId ? -1 : 1,
      )
      .slice(0, 4);
  }, [activeProduct, products]);

  const handleUploadCustomArt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingArt(true);
    try {
      const ref = await uploadStudioFile(file);
      setCustomArtwork(ref);
    } finally {
      setUploadingArt(false);
      e.target.value = '';
    }
  };

  const handleAddProductToCart = (product: ShopProduct, size?: string, color?: string) => {
    const chosenSize = size || product.sizes[0] || 'Standard';
    const chosenColor = color || product.colors[0]?.name || 'Standard';
    const variantLabel = `${chosenSize} / ${chosenColor}`;
    const customTag = personalizationNotes.trim() || customArtwork?.name || '';
    const cartKey = `${product.id}__${variantLabel}__${customTag}`;

    onAddToCart({
      cartKey,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      image: product.images[0] || '/assets/aistudio/logo_ganzo_brand_1_c97e8249.png',
      unitPriceTnd: product.priceTnd,
      quantity: activeProduct?.id === product.id ? pdpQty : 1,
      selectedSize: chosenSize,
      selectedColor: chosenColor,
      variantLabel,
      customizable: product.customizable,
      personalizationNotes: activeProduct?.id === product.id ? personalizationNotes.trim() : '',
      customArtwork: activeProduct?.id === product.id ? customArtwork : null,
    });
    setAddedToast(`Added "${product.name}" to your GANZO SHOP bag.`);
    setTimeout(() => setAddedToast(''), 2500);
  };

  const isFav = (productId: string) => Boolean(user?.favorites?.includes(productId));

  /* ==================== PRODUCT DETAIL VIEW ==================== */
  if (activeProduct) {
    const images =
      activeProduct.images.length > 0
        ? activeProduct.images
        : ['/assets/aistudio/logo_ganzo_brand_1_c97e8249.png'];

    return (
      <section className="bg-white">
        {/* Top Utility Strip */}
        <div className="bg-[#F4F4F4] border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setActiveProductId('')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#111111] hover:text-[#007A87] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to GANZO SHOP</span>
            </button>
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bag ({cartCount})</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Multi-Image Gallery */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-[4/3] bg-[#F4F4F4] border border-neutral-200 overflow-hidden">
                <img
                  src={images[activeImageIdx] || images[0]}
                  alt={activeProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {customArtwork && customArtwork.mimeType.startsWith('image/') && (
                  <div className="absolute bottom-4 right-4 bg-white/95 border border-[#111111] p-2 max-w-[140px]">
                    <div className="text-[10px] font-mono text-[#007A87] mb-1">YOUR ARTWORK</div>
                    <img
                      src={customArtwork.url}
                      alt="Uploaded customization preview"
                      referrerPolicy="no-referrer"
                      className="w-24 h-16 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`aspect-[4/3] bg-[#F4F4F4] border overflow-hidden cursor-pointer ${
                      activeImageIdx === idx ? 'border-[#111111] ring-1 ring-[#111111]' : 'border-neutral-200'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${activeProduct.name} angle ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Contiguous Purchase Module */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 border border-neutral-200 p-7 space-y-6 bg-white">
              <div className="space-y-2">
                <div className="text-xs text-neutral-500">
                  {activeProduct.categoryName} · {activeProduct.sku} ·{' '}
                  {activeProduct.customizable ? 'Direct Purchase or Custom Print' : 'Ready-Made Edition'}
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
                  {activeProduct.name}
                </h1>
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="font-display text-2xl font-extrabold text-[#111111] tabular-nums">
                    {formatTnd(activeProduct.priceTnd)}
                  </span>
                  {activeProduct.compareAtPriceTnd && (
                    <span className="text-sm text-neutral-400 line-through font-mono tabular-nums">
                      {formatTnd(activeProduct.compareAtPriceTnd)}
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono">
                  {activeProduct.stock > 0 ? (
                    <span className="text-[#007A87] font-semibold">
                      In Stock · {activeProduct.stock} units available
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">Out of Stock</span>
                  )}
                </div>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed">{activeProduct.description}</p>

              {/* Variant Quick Selector */}
              {activeProduct.variants.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-neutral-700 mb-2">Available Variants</div>
                  <div className="flex flex-wrap gap-2">
                    {activeProduct.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          if (v.size) setPdpSize(v.size);
                          if (v.color) setPdpColor(v.color);
                        }}
                        className={`px-3 py-1.5 text-xs border cursor-pointer ${
                          pdpSize === v.size && pdpColor === v.color
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-[#F4F4F4] text-[#111111] border-neutral-200'
                        }`}
                      >
                        {v.label} ({v.stock})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div>
                <div className="text-xs font-semibold text-neutral-700 mb-2">Size: {pdpSize}</div>
                <div className="flex flex-wrap gap-2">
                  {activeProduct.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPdpSize(sz)}
                      className={`px-3.5 py-2 text-xs font-mono font-semibold border cursor-pointer ${
                        pdpSize === sz
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#111111]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <div className="text-xs font-semibold text-neutral-700 mb-2">Color: {pdpColor}</div>
                <div className="flex flex-wrap gap-2">
                  {activeProduct.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setPdpColor(c.name)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 border text-xs cursor-pointer ${
                        pdpColor === c.name
                          ? 'border-[#111111] bg-[#F4F4F4] font-semibold'
                          : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 border border-neutral-300" style={{ backgroundColor: c.hex }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personalization for Customizable Products */}
              {activeProduct.customizable && (
                <div className="bg-[#F4F4F4] border border-neutral-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#007A87]">
                      OPTIONAL PERSONALIZATION
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('design')}
                      className="text-[11px] font-semibold text-[#111111] underline cursor-pointer"
                    >
                      Need a custom design first?
                    </button>
                  </div>
                  <input
                    type="text"
                    value={personalizationNotes}
                    onChange={(e) => setPersonalizationNotes(e.target.value)}
                    placeholder="Optional text, monogram, or placement instructions..."
                    className="w-full px-3 py-2 bg-white border border-neutral-300 text-xs"
                  />
                  <label className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-dashed border-neutral-400 text-xs cursor-pointer hover:border-[#111111]">
                    <Upload className="w-3.5 h-3.5" />
                    <span className="truncate">
                      {uploadingArt
                        ? 'Uploading artwork...'
                        : customArtwork
                          ? `Attached: ${customArtwork.name}`
                          : 'Upload custom logo / artwork (PNG, SVG, PDF)'}
                    </span>
                    <input type="file" onChange={handleUploadCustomArt} className="hidden" />
                  </label>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-3 pt-2">
                <div className="inline-flex items-center border border-neutral-300 h-11">
                  <button
                    type="button"
                    onClick={() => setPdpQty((q) => Math.max(1, q - 1))}
                    className="px-3 h-full hover:bg-[#F4F4F4] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 font-mono text-sm tabular-nums">{pdpQty}</span>
                  <button
                    type="button"
                    onClick={() => setPdpQty((q) => Math.min(Math.max(1, activeProduct.stock), q + 1))}
                    className="px-3 h-full hover:bg-[#F4F4F4] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={activeProduct.stock <= 0}
                  onClick={() => handleAddProductToCart(activeProduct, pdpSize, pdpColor)}
                  className="flex-1 h-11 bg-[#111111] text-white text-xs font-bold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer disabled:opacity-40"
                >
                  {activeProduct.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleFavorite(activeProduct.id)}
                  aria-label="Save to favorites"
                  className={`h-11 w-11 border flex items-center justify-center cursor-pointer ${
                    isFav(activeProduct.id)
                      ? 'bg-[#111111] text-[#00FFFF] border-[#111111]'
                      : 'bg-white text-[#111111] border-neutral-300 hover:border-[#111111]'
                  }`}
                >
                  <Heart className="w-4 h-4" fill={isFav(activeProduct.id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              {addedToast && (
                <div className="p-3 bg-[#111111] text-[#00FFFF] text-xs font-semibold flex items-center justify-between">
                  <span>{addedToast}</span>
                  <button type="button" onClick={onOpenCart} className="underline cursor-pointer">
                    Open Bag →
                  </button>
                </div>
              )}

              {/* Bridge to Bulk GANZO STUDIO Services */}
              <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-600 flex items-center justify-between gap-2">
                <span>Ordering 15+ custom units for a team or event?</span>
                <button
                  type="button"
                  onClick={() => onNavigate('quote')}
                  className="font-semibold text-[#007A87] hover:underline whitespace-nowrap cursor-pointer"
                >
                  Request Studio Quote →
                </button>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-12 border-t border-neutral-200">
              <h2 className="font-display text-2xl font-bold text-[#111111] mb-6">Related GANZO SHOP Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => setActiveProductId(rel.id)}
                    className="border border-neutral-200 bg-white hover:border-[#111111] transition-colors cursor-pointer flex flex-col justify-between"
                  >
                    <div className="aspect-[4/3] bg-[#F4F4F4] overflow-hidden">
                      <img
                        src={rel.images[0]}
                        alt={rel.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="text-[11px] text-neutral-500">{rel.categoryName}</div>
                      <div className="font-display text-sm font-bold text-[#111111] line-clamp-1">{rel.name}</div>
                      <div className="font-mono text-sm font-bold text-[#111111] tabular-nums pt-1">
                        {formatTnd(rel.priceTnd)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  /* ==================== STOREFRONT CATALOG VIEW ==================== */
  return (
    <section className="bg-white">
      {/* Storefront Hero */}
      <div className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="font-mono text-xs text-[#00FFFF] tracking-wider">
                GANZO SHOP · OFFICIAL STUDIO STORE
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Ready-made &amp; customizable products crafted by GANZO STUDIO.
              </h1>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Every product in GANZO SHOP is stocked, personalized, quality-checked, and dispatched directly by GANZO STUDIO in Tunisia. Free shipping on orders over 180 TND.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2.5 px-5 py-3 bg-[#00FFFF] text-[#111111] text-xs font-bold hover:bg-white transition-colors self-start lg:self-auto cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shopping Bag ({cartCount})</span>
            </button>
          </div>

          {/* 3 Clear Pathways: Direct Purchase vs Customizable vs Studio Services */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-neutral-800 text-xs">
            <div className="bg-[#18181B] border border-neutral-800 p-4">
              <div className="font-mono text-[#00FFFF] mb-1">01 · DIRECT PURCHASE</div>
              <p className="text-neutral-300">Ready-made studio apparel, mugs, bottles, stickers, and capsules shipped immediately.</p>
            </div>
            <div className="bg-[#18181B] border border-neutral-800 p-4">
              <div className="font-mono text-[#00FFFF] mb-1">02 · CUSTOMIZABLE PRODUCTS</div>
              <p className="text-neutral-300">Attach your logo or personalization instructions directly on eligible shop items.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('quote')}
              className="text-left bg-[#18181B] border border-neutral-800 hover:border-[#00FFFF] p-4 transition-colors cursor-pointer"
            >
              <div className="font-mono text-[#00FFFF] mb-1">03 · BESPOKE DESIGN &amp; BULK PRINT →</div>
              <p className="text-neutral-300">Need custom branding or 20+ corporate units? Open GANZO STUDIO quotation services.</p>
            </button>
          </div>
        </div>
      </div>

      {/* Store Toolbar */}
      <div className="bg-[#F4F4F4] border-b border-neutral-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', 'All Products'],
                ['featured', 'Featured'],
                ['new', 'New Arrivals'],
                ['bestsellers', 'Best Sellers'],
                ['offers', 'Special Offers'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setShowcaseTab(key)}
                className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  showcaseTab === key
                    ? 'bg-[#111111] text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-[#111111]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-300 text-xs"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2.5 py-1.5 bg-white border border-neutral-300 text-xs"
            >
              <option value="popular">Popularity</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>

            <button
              type="button"
              onClick={() => setShowFiltersMobile((p) => !p)}
              className="lg:hidden p-2 bg-white border border-neutral-300 cursor-pointer"
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Store Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside
          className={`lg:col-span-3 space-y-6 border border-neutral-200 p-5 bg-white ${
            showFiltersMobile ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#111111]">Filters</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setMaxPrice(250);
                setSelectedSizeFilter('all');
                setSelectedColorFilter('all');
                setInStockOnly(false);
                setCustomizableOnly(false);
                setSearch('');
              }}
              className="text-xs text-[#007A87] hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-neutral-500 mb-2">CATEGORIES</div>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-2.5 py-1.5 text-xs cursor-pointer ${
                selectedCategory === 'all' ? 'bg-[#111111] text-white font-semibold' : 'text-neutral-700 hover:bg-[#F4F4F4]'
              }`}
            >
              All Categories ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-2.5 py-1.5 text-xs cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#111111] text-white font-semibold'
                    : 'text-neutral-700 hover:bg-[#F4F4F4]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Price Filter */}
          <div className="pt-4 border-t border-neutral-200 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-mono text-neutral-500">MAX PRICE</span>
              <span className="font-mono font-bold tabular-nums">{formatTnd(maxPrice)}</span>
            </div>
            <input
              type="range"
              min={20}
              max={250}
              step={5}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#111111]"
            />
          </div>

          {/* Size & Color */}
          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-neutral-500 mb-1">SIZE</label>
              <select
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white text-xs"
              >
                <option value="all">All Sizes</option>
                {allAvailableSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-neutral-500 mb-1">COLOR</label>
              <select
                value={selectedColorFilter}
                onChange={(e) => setSelectedColorFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-neutral-300 bg-white text-xs"
              >
                <option value="all">All Colors</option>
                {allAvailableColors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Availability */}
          <div className="pt-4 border-t border-neutral-200 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#111111]"
              />
              <span>In Stock Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={customizableOnly}
                onChange={(e) => setCustomizableOnly(e.target.checked)}
                className="accent-[#111111]"
              />
              <span>Customizable Products Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9 space-y-6">
          {addedToast && (
            <div className="p-3 bg-[#111111] text-[#00FFFF] text-xs font-semibold flex items-center justify-between">
              <span>{addedToast}</span>
              <button type="button" onClick={onOpenCart} className="underline cursor-pointer">
                View Bag ({cartCount}) →
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="border border-neutral-200 p-4 h-80 bg-[#F4F4F4]" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="border border-neutral-200 p-12 text-center space-y-3">
              <p className="font-display text-lg font-bold text-[#111111]">No matching products found</p>
              <p className="text-xs text-neutral-500">Try clearing filters or request a custom production via GANZO STUDIO.</p>
              <button
                type="button"
                onClick={() => onNavigate('quote')}
                className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
              >
                Request Custom Product Quote
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group border border-neutral-200 bg-white hover:border-[#111111] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div
                      onClick={() => setActiveProductId(product.id)}
                      className="relative aspect-[4/3] bg-[#F4F4F4] overflow-hidden cursor-pointer"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(product.id);
                        }}
                        aria-label="Favorite product"
                        className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center border cursor-pointer ${
                          isFav(product.id)
                            ? 'bg-[#111111] text-[#00FFFF] border-[#111111]'
                            : 'bg-white/90 text-[#111111] border-neutral-200 hover:border-[#111111]'
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5" fill={isFav(product.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div
                      onClick={() => setActiveProductId(product.id)}
                      className="p-5 space-y-2 cursor-pointer"
                    >
                      <div className="text-[11px] text-neutral-500 flex items-center justify-between">
                        <span>{product.categoryName}</span>
                        <span>
                          {product.specialOffer
                            ? 'Special Offer'
                            : product.newArrival
                              ? 'New Arrival'
                              : product.bestSeller
                                ? 'Best Seller'
                                : product.customizable
                                  ? 'Customizable'
                                  : 'In Stock'}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold text-[#111111] leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="text-xs text-neutral-500">
                        {product.sizes.slice(0, 4).join(' / ')} · {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-sm font-bold text-[#111111] tabular-nums">
                        {formatTnd(product.priceTnd)}
                      </span>
                      {product.compareAtPriceTnd && (
                        <span className="font-mono text-xs text-neutral-400 line-through tabular-nums">
                          {formatTnd(product.compareAtPriceTnd)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={() =>
                        product.customizable ? setActiveProductId(product.id) : handleAddProductToCart(product)
                      }
                      className="px-3.5 py-2 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {product.customizable ? 'Select & Customize' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
