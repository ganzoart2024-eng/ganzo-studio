import React, { useEffect, useState } from 'react';
import { Download, Plus, Trash2, Upload } from 'lucide-react';
import { apiFetch, formatDateShort, formatTnd, getStoredToken, uploadStudioFile } from '../lib/api';
import {
  SHOP_ORDER_STATUSES,
  type ShopCategory,
  type ShopOrder,
  type ShopOrderStatus,
  type ShopProduct,
  type ShopPromotion,
} from '../types/studio';

interface AdminShopData {
  categories: ShopCategory[];
  products: ShopProduct[];
  promotions: ShopPromotion[];
  orders: ShopOrder[];
  stats: {
    totalSalesTnd: number;
    totalOrders: number;
    pendingOrders: number;
    totalUnitsSold: number;
    lowStockCount: number;
  };
}

export const AdminShopManager: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const [subTab, setSubTab] = useState<'orders' | 'products' | 'categories' | 'promotions'>('orders');
  const [data, setData] = useState<AdminShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Product Form
  const [prdName, setPrdName] = useState('');
  const [prdSku, setPrdSku] = useState('');
  const [prdCatId, setPrdCatId] = useState('');
  const [prdPrice, setPrdPrice] = useState('65');
  const [prdComparePrice, setPrdComparePrice] = useState('');
  const [prdStock, setPrdStock] = useState('25');
  const [prdSizes, setPrdSizes] = useState('S, M, L, XL');
  const [prdColors, setPrdColors] = useState('Obsidian Black:#111111, Optic White:#FFFFFF');
  const [prdDesc, setPrdDesc] = useState('');
  const [prdImages, setPrdImages] = useState<string[]>([]);
  const [prdCustomizable, setPrdCustomizable] = useState(true);
  const [prdFeatured, setPrdFeatured] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Category Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Promo Form
  const [promoCode, setPromoCode] = useState('');
  const [promoType, setPromoType] = useState<'percent' | 'fixed'>('percent');
  const [promoVal, setPromoVal] = useState('15');
  const [promoMin, setPromoMin] = useState('100');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadShopAdmin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<AdminShopData>('/api/admin/shop');
      setData(res);
      if (!prdCatId && res.categories[0]) {
        setPrdCatId(res.categories[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load shop admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadShopAdmin();
  }, []);

  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const ref = await uploadStudioFile(file);
      setPrdImages((prev) => [...prev, ref.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prdName.trim() || !prdCatId) return;
    try {
      const parsedColors = prdColors
        .split(',')
        .map((c) => {
          const [name, hex] = c.split(':').map((s) => s.trim());
          return name ? { name, hex: hex || '#111111' } : null;
        })
        .filter((x): x is { name: string; hex: string } => Boolean(x));

      await apiFetch('/api/admin/shop/products', {
        method: 'POST',
        body: JSON.stringify({
          name: prdName,
          sku: prdSku,
          categoryId: prdCatId,
          priceTnd: Number(prdPrice),
          compareAtPriceTnd: prdComparePrice ? Number(prdComparePrice) : null,
          stock: Number(prdStock),
          sizes: prdSizes.split(',').map((s) => s.trim()).filter(Boolean),
          colors: parsedColors,
          description: prdDesc,
          images: prdImages,
          customizable: prdCustomizable,
          featured: prdFeatured,
        }),
      });
      setPrdName('');
      setPrdSku('');
      setPrdDesc('');
      setPrdImages([]);
      setPrdComparePrice('');
      notify('Product added to GANZO SHOP.');
      void loadShopAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  const handleAdjustStock = async (product: ShopProduct, nextStock: number) => {
    try {
      await apiFetch(`/api/admin/shop/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: Math.max(0, nextStock) }),
      });
      notify(`Updated stock for ${product.name}.`);
      void loadShopAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stock update failed');
    }
  };

  const handleToggleProductActive = async (product: ShopProduct) => {
    try {
      await apiFetch(`/api/admin/shop/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !product.active }),
      });
      void loadShopAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await apiFetch(`/api/admin/shop/products/${id}`, { method: 'DELETE' });
      notify('Product removed.');
      void loadShopAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await apiFetch('/api/admin/shop/categories', {
        method: 'POST',
        body: JSON.stringify({ name: catName, description: catDesc }),
      });
      setCatName('');
      setCatDesc('');
      notify('Category created.');
      void loadShopAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Category error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await apiFetch(`/api/admin/shop/categories/${id}`, { method: 'DELETE' });
      notify('Category deleted.');
      void loadShopAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleUpdateOrder = async (
    orderId: string,
    updates: { status?: ShopOrderStatus; paymentStatus?: ShopOrder['paymentStatus'] },
  ) => {
    try {
      await apiFetch(`/api/admin/shop/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      notify('Shop order updated.');
      void loadShopAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    try {
      await apiFetch('/api/admin/shop/promotions', {
        method: 'POST',
        body: JSON.stringify({
          code: promoCode,
          discountType: promoType,
          value: Number(promoVal),
          minOrderTnd: Number(promoMin),
        }),
      });
      setPromoCode('');
      notify('Discount code activated.');
      void loadShopAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promo error');
    }
  };

  const handleTogglePromo = async (promo: ShopPromotion) => {
    try {
      await apiFetch(`/api/admin/shop/promotions/${promo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !promo.active }),
      });
      void loadShopAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promo toggle failed');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/admin/shop/export', {
        headers: { Authorization: `Bearer ${getStoredToken()}` },
        credentials: 'include',
      });
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ganzo-shop-orders.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export CSV report.');
    }
  };

  if (loading && !data) {
    return <div className="bg-white border border-neutral-200 p-8 text-sm text-neutral-500">Loading GANZO SHOP console...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Sales Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono text-neutral-500">SHOP SALES</div>
          <div className="font-display text-2xl font-extrabold text-[#111111] mt-1 tabular-nums">
            {formatTnd(data.stats.totalSalesTnd)}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono text-neutral-500">SHOP ORDERS</div>
          <div className="font-display text-2xl font-extrabold text-[#111111] mt-1 tabular-nums">
            {data.stats.totalOrders}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono text-neutral-500">PENDING FULFILLMENT</div>
          <div className="font-display text-2xl font-extrabold text-[#007A87] mt-1 tabular-nums">
            {data.stats.pendingOrders}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono text-neutral-500">UNITS SOLD</div>
          <div className="font-display text-2xl font-extrabold text-[#111111] mt-1 tabular-nums">
            {data.stats.totalUnitsSold}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 flex flex-col justify-between">
          <div className="text-[11px] font-mono text-neutral-500">REPORTS</div>
          {isAdmin ? (
            <button
              type="button"
              onClick={handleExportCsv}
              className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Orders CSV</span>
            </button>
          ) : (
            <span className="text-xs text-neutral-500 mt-1">Admin only</span>
          )}
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
        {(
          [
            ['orders', `Shop Orders (${data.orders.length})`],
            ...(isAdmin ? [['products', `Products & Inventory (${data.products.length})`] as const] : []),
            ...(isAdmin ? [['categories', `Categories (${data.categories.length})`] as const] : []),
            ...(isAdmin ? [['promotions', `Promotions (${data.promotions.length})`] as const] : []),
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSubTab(k)}
            className={`px-4 py-2 text-xs font-semibold cursor-pointer ${
              subTab === k
                ? 'bg-[#111111] text-white'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:border-[#111111]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {toast && (
        <div className="p-3 bg-[#111111] text-[#00FFFF] text-xs font-semibold">{toast}</div>
      )}
      {error && <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800">{error}</div>}

      {/* SHOP ORDERS */}
      {subTab === 'orders' && (
        <div className="bg-white border border-neutral-200 divide-y divide-neutral-200">
          {data.orders.map((ord) => (
            <div key={ord.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-[#007A87]">
                    {ord.orderNumber} · {formatDateShort(ord.createdAt)} · {ord.paymentMethod}
                  </div>
                  <div className="font-display text-lg font-bold text-[#111111]">
                    {ord.customerName} — {ord.city}, {ord.governorate}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {ord.customerPhone} · {ord.customerEmail} · {ord.deliveryAddress}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-mono text-base font-bold text-[#111111] tabular-nums mr-2">
                    {formatTnd(ord.totalTnd)}
                  </div>
                  <select
                    value={ord.status}
                    onChange={(e) =>
                      handleUpdateOrder(ord.id, { status: e.target.value as ShopOrderStatus })
                    }
                    className="px-3 py-1.5 border border-neutral-300 bg-white text-xs font-semibold"
                  >
                    {SHOP_ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ord.paymentStatus}
                    onChange={(e) =>
                      handleUpdateOrder(ord.id, {
                        paymentStatus: e.target.value as ShopOrder['paymentStatus'],
                      })
                    }
                    className="px-3 py-1.5 border border-neutral-300 bg-white text-xs"
                  >
                    <option value="Unpaid (COD)">Unpaid (COD)</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#F4F4F4] border border-neutral-200 p-3 space-y-2 text-xs">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-[#111111]">
                        {item.quantity} × {item.productName}
                      </span>{' '}
                      <span className="text-neutral-500">({item.variantLabel})</span>
                      {item.personalizationNotes && (
                        <span className="ml-2 text-[#007A87]">Note: “{item.personalizationNotes}”</span>
                      )}
                      {item.customArtwork && (
                        <a
                          href={item.customArtwork.url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 underline text-[#111111]"
                        >
                          [View Artwork: {item.customArtwork.name}]
                        </a>
                      )}
                    </div>
                    <span className="font-mono tabular-nums">
                      {formatTnd(item.unitPriceTnd * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCTS & INVENTORY */}
      {subTab === 'products' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleCreateProduct} className="lg:col-span-4 bg-white border border-neutral-200 p-6 space-y-3">
            <h3 className="font-display text-lg font-bold text-[#111111]">Add Product</h3>
            <input
              type="text"
              required
              value={prdName}
              onChange={(e) => setPrdName(e.target.value)}
              placeholder="Product Name *"
              className="w-full px-3 py-2 border border-neutral-300 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={prdSku}
                onChange={(e) => setPrdSku(e.target.value)}
                placeholder="SKU (optional)"
                className="px-3 py-2 border border-neutral-300 font-mono text-xs"
              />
              <select
                value={prdCatId}
                onChange={(e) => setPrdCatId(e.target.value)}
                className="px-3 py-2 border border-neutral-300 bg-white text-xs"
              >
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                required
                value={prdPrice}
                onChange={(e) => setPrdPrice(e.target.value)}
                placeholder="Price TND"
                className="px-2.5 py-2 border border-neutral-300 font-mono text-xs"
              />
              <input
                type="number"
                value={prdComparePrice}
                onChange={(e) => setPrdComparePrice(e.target.value)}
                placeholder="Old Price"
                className="px-2.5 py-2 border border-neutral-300 font-mono text-xs"
              />
              <input
                type="number"
                required
                value={prdStock}
                onChange={(e) => setPrdStock(e.target.value)}
                placeholder="Stock"
                className="px-2.5 py-2 border border-neutral-300 font-mono text-xs"
              />
            </div>
            <input
              type="text"
              value={prdSizes}
              onChange={(e) => setPrdSizes(e.target.value)}
              placeholder="Sizes (comma separated)"
              className="w-full px-3 py-2 border border-neutral-300 text-xs"
            />
            <input
              type="text"
              value={prdColors}
              onChange={(e) => setPrdColors(e.target.value)}
              placeholder="Colors: Name:#Hex, ..."
              className="w-full px-3 py-2 border border-neutral-300 text-xs"
            />
            <textarea
              rows={2}
              value={prdDesc}
              onChange={(e) => setPrdDesc(e.target.value)}
              placeholder="Description"
              className="w-full px-3 py-2 border border-neutral-300 text-xs"
            />
            <label className="flex items-center justify-center gap-2 py-2 border border-dashed border-neutral-400 bg-[#F4F4F4] text-xs cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>
                {uploadingImg
                  ? 'Uploading...'
                  : prdImages.length > 0
                    ? `${prdImages.length} image(s) uploaded`
                    : 'Upload Product Image'}
              </span>
              <input type="file" accept="image/*" onChange={handleUploadProductImage} className="hidden" />
            </label>
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prdCustomizable}
                  onChange={(e) => setPrdCustomizable(e.target.checked)}
                />
                <span>Customizable</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prdFeatured}
                  onChange={(e) => setPrdFeatured(e.target.checked)}
                />
                <span>Featured</span>
              </label>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish Product</span>
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-neutral-200 divide-y divide-neutral-200">
            {data.products.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-cover bg-[#F4F4F4] border border-neutral-200 shrink-0"
                  />
                  <div>
                    <div className="text-[11px] font-mono text-[#007A87]">
                      {p.categoryName} · {p.sku}
                    </div>
                    <div className="font-display text-sm font-bold text-[#111111]">{p.name}</div>
                    <div className="text-xs text-neutral-500 font-mono tabular-nums">
                      {formatTnd(p.priceTnd)} · Stock: {p.stock}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdjustStock(p, p.stock + 5)}
                    className="px-2.5 py-1 border border-neutral-300 text-xs font-mono cursor-pointer hover:border-[#111111]"
                  >
                    +5 Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleProductActive(p)}
                    className={`px-2.5 py-1 text-xs font-semibold border cursor-pointer ${
                      p.active ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-neutral-500 border-neutral-300'
                    }`}
                  >
                    {p.active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      {subTab === 'categories' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleCreateCategory} className="lg:col-span-4 bg-white border border-neutral-200 p-6 space-y-3">
            <h3 className="font-display text-lg font-bold text-[#111111]">Add Category</h3>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Category Name"
              className="w-full px-3 py-2 border border-neutral-300 text-sm"
            />
            <input
              type="text"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Short description"
              className="w-full px-3 py-2 border border-neutral-300 text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
            >
              Create Category
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-neutral-200 divide-y divide-neutral-200">
            {data.categories.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-display text-sm font-bold text-[#111111]">{c.name}</div>
                  <div className="text-xs text-neutral-500">{c.description || c.slug}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROMOTIONS */}
      {subTab === 'promotions' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleCreatePromo} className="lg:col-span-4 bg-white border border-neutral-200 p-6 space-y-3">
            <h3 className="font-display text-lg font-bold text-[#111111]">Create Discount Code</h3>
            <input
              type="text"
              required
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="CODE (e.g. RAMADAN15)"
              className="w-full px-3 py-2 border border-neutral-300 font-mono text-xs uppercase"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={promoType}
                onChange={(e) => setPromoType(e.target.value as 'percent' | 'fixed')}
                className="px-3 py-2 border border-neutral-300 bg-white text-xs"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (TND)</option>
              </select>
              <input
                type="number"
                required
                value={promoVal}
                onChange={(e) => setPromoVal(e.target.value)}
                placeholder="Value"
                className="px-3 py-2 border border-neutral-300 font-mono text-xs"
              />
            </div>
            <input
              type="number"
              value={promoMin}
              onChange={(e) => setPromoMin(e.target.value)}
              placeholder="Minimum Order (TND)"
              className="w-full px-3 py-2 border border-neutral-300 font-mono text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
            >
              Create Promo Code
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-neutral-200 divide-y divide-neutral-200">
            {data.promotions.map((pr) => (
              <div key={pr.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-sm font-bold text-[#111111]">{pr.code}</div>
                  <div className="text-xs text-neutral-600">
                    {pr.description} · Min {formatTnd(pr.minOrderTnd)} · Used {pr.usageCount}x
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePromo(pr)}
                  className={`px-3 py-1 text-xs font-semibold border cursor-pointer ${
                    pr.active ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-neutral-500 border-neutral-300'
                  }`}
                >
                  {pr.active ? 'Active' : 'Paused'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
