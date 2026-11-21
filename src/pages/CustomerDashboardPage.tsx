import React, { useEffect, useState } from 'react';
import { Check, FileText, Heart, LogOut, Plus, Send, Trash2, Upload } from 'lucide-react';
import { AuthGate } from '../components/AuthGate';
import { OrderPipelineTracker } from '../components/StudioMockups';
import { apiFetch, formatDateShort, formatDateTime, formatTnd, uploadStudioFile } from '../lib/api';
import type { PageRoute, PublicUser, ShopOrder, ShopProduct, StudioOrder } from '../types/studio';

interface CustomerDashboardProps {
  user: PublicUser | null;
  onAuthenticated: (user: PublicUser) => void;
  onUserUpdated: (user: PublicUser) => void;
  onLogout: () => void;
  onNavigate: (page: PageRoute) => void;
  onOpenShopProduct: (productId: string) => void;
}

export const CustomerDashboardPage: React.FC<CustomerDashboardProps> = ({
  user,
  onAuthenticated,
  onUserUpdated,
  onLogout,
  onNavigate,
  onOpenShopProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'shop' | 'favorites' | 'profile'>('studio');
  const [orders, setOrders] = useState<StudioOrder[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  // Profile & Address forms
  const [profName, setProfName] = useState(user?.name || '');
  const [profPhone, setProfPhone] = useState(user?.phone || '');
  const [profCompany, setProfCompany] = useState(user?.companyName || '');
  const [profCity, setProfCity] = useState(user?.city || 'Tunis');

  const [addrLabel, setAddrLabel] = useState('Office / Studio');
  const [addrPhone, setAddrPhone] = useState(user?.phone || '');
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState(user?.city || 'Tunis');
  const [addrGov, setAddrGov] = useState('Tunis');

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [ordRes, shopRes, catRes] = await Promise.all([
        apiFetch<{ orders: StudioOrder[] }>('/api/orders'),
        apiFetch<{ orders: ShopOrder[] }>('/api/shop/my-orders'),
        apiFetch<{ products: ShopProduct[] }>('/api/shop/catalog'),
      ]);
      setOrders(ordRes.orders);
      setShopOrders(shopRes.orders);
      setShopProducts(catRes.products);
      if (ordRes.orders.length > 0 && !ordRes.orders.some((o) => o.id === selectedId)) {
        setSelectedId(ordRes.orders[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfName(user.name);
      setProfPhone(user.phone || '');
      setProfCompany(user.companyName || '');
      setProfCity(user.city || 'Tunis');
      void loadOrders();
    }
  }, [user?.id]);

  if (!user) {
    return (
      <AuthGate
        title="Customer Dashboard"
        subtitle="Sign in to track orders, view design previews, request revisions, approve final proofs, and download invoices."
        onAuthenticated={onAuthenticated}
      />
    );
  }

  if (user.role !== 'customer') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-neutral-200 p-8 space-y-4">
          <div className="font-mono text-xs text-[#007A87]">INTERNAL TEAM SESSION ACTIVE</div>
          <h1 className="font-display text-2xl font-bold text-[#111111]">
            Signed in as {user.name} ({user.role.replace('_', ' ')})
          </h1>
          <p className="text-sm text-neutral-600">
            Internal staff manage orders through the Studio Console. You can open the Studio Console or sign out to switch to a customer account.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('admin-dashboard')}
              className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] cursor-pointer"
            >
              Open Studio Console
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-5 py-2.5 border border-neutral-300 text-xs font-semibold cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedOrder = orders.find((o) => o.id === selectedId) || orders[0] || null;

  const updateOrderInState = (updated: StudioOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleUploadExtraFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedOrder || !e.target.files?.[0]) return;
    setActionBusy(true);
    try {
      const fileRef = await uploadStudioFile(e.target.files[0]);
      const res = await apiFetch<{ order: StudioOrder }>(`/api/orders/${selectedOrder.id}/files`, {
        method: 'POST',
        body: JSON.stringify({ file: fileRef }),
      });
      updateOrderInState(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setActionBusy(false);
      e.target.value = '';
    }
  };

  const handleApproveQuote = async () => {
    if (!selectedOrder) return;
    setActionBusy(true);
    try {
      const res = await apiFetch<{ order: StudioOrder }>(`/api/orders/${selectedOrder.id}/approve-quote`, {
        method: 'POST',
      });
      updateOrderInState(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve quote');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !revisionNote.trim()) return;
    setActionBusy(true);
    try {
      const res = await apiFetch<{ order: StudioOrder }>(`/api/orders/${selectedOrder.id}/revisions`, {
        method: 'POST',
        body: JSON.stringify({ message: revisionNote }),
      });
      updateOrderInState(res.order);
      setRevisionNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit revision');
    } finally {
      setActionBusy(false);
    }
  };

  const handleApproveDesign = async () => {
    if (!selectedOrder) return;
    setActionBusy(true);
    try {
      const res = await apiFetch<{ order: StudioOrder }>(`/api/orders/${selectedOrder.id}/approve-design`, {
        method: 'POST',
      });
      updateOrderInState(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve design');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !messageBody.trim()) return;
    setActionBusy(true);
    try {
      const res = await apiFetch<{ order: StudioOrder }>(`/api/orders/${selectedOrder.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: messageBody }),
      });
      updateOrderInState(res.order);
      setMessageBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch<{ user: PublicUser }>('/api/customer/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profName,
          phone: profPhone,
          companyName: profCompany,
          city: profCity,
        }),
      });
      onUserUpdated(res.user);
      setNotice('Profile saved.');
      setTimeout(() => setNotice(''), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch<{ user: PublicUser }>('/api/customer/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label: addrLabel,
          recipientName: profName || user.name,
          phone: addrPhone || profPhone || user.phone,
          addressLine: addrLine,
          city: addrCity,
          governorate: addrGov,
          isDefault: true,
        }),
      });
      onUserUpdated(res.user);
      setAddrLine('');
      setNotice('Delivery address added.');
      setTimeout(() => setNotice(''), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add address');
    }
  };

  const handleRemoveAddress = async (addrId: string) => {
    try {
      const res = await apiFetch<{ user: PublicUser }>(`/api/customer/addresses/${addrId}`, {
        method: 'DELETE',
      });
      onUserUpdated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove address');
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      const res = await apiFetch<{ user: PublicUser }>(`/api/customer/favorites/${productId}`, {
        method: 'POST',
      });
      onUserUpdated(res.user);
    } catch {
      // ignore
    }
  };

  const favoriteProducts = shopProducts.filter((p) => user.favorites?.includes(p.id));

  return (
    <section className="bg-[#F4F4F4] min-h-[calc(100vh-4rem)]">
      {/* Top Workspace Strip */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#007A87]">CUSTOMER PORTAL · {user.companyName || user.city}</div>
            <h1 className="font-display text-2xl font-bold text-[#111111]">Welcome, {user.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="px-4 py-2.5 border border-[#111111] text-[#111111] text-xs font-semibold hover:bg-[#F4F4F4] transition-colors cursor-pointer"
            >
              Browse GANZO SHOP
            </button>
            <button
              type="button"
              onClick={() => onNavigate('quote')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Studio Order</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-neutral-300 text-xs font-semibold text-neutral-700 hover:border-[#111111] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Account Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto">
          {(
            [
              ['studio', `Studio Orders (${orders.length})`],
              ['shop', `GANZO SHOP Orders (${shopOrders.length})`],
              ['favorites', `Favorites (${favoriteProducts.length})`],
              ['profile', 'Profile & Addresses'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === id
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-neutral-500 hover:text-[#111111]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {notice && <div className="mb-4 p-3 bg-[#111111] text-[#00FFFF] text-xs font-semibold">{notice}</div>}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-300 text-xs text-red-800">{error}</div>}

        {activeTab === 'shop' && (
          <div className="space-y-4">
            {shopOrders.length === 0 ? (
              <div className="bg-white border border-neutral-200 p-10 text-center space-y-3">
                <p className="font-display text-lg font-bold text-[#111111]">No GANZO SHOP orders yet</p>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
                >
                  Shop Ready-Made &amp; Custom Products
                </button>
              </div>
            ) : (
              shopOrders.map((ord) => (
                <div key={ord.id} className="bg-white border border-neutral-200 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200">
                    <div>
                      <div className="font-mono text-xs text-[#007A87]">
                        {ord.orderNumber} · {formatDateShort(ord.createdAt)} · {ord.paymentMethod}
                      </div>
                      <div className="font-display text-lg font-bold text-[#111111] mt-0.5">
                        Status: {ord.status}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {ord.deliveryMethod} · {ord.deliveryAddress}, {ord.city}
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <div className="font-mono text-xl font-bold text-[#111111] tabular-nums">
                        {formatTnd(ord.totalTnd)}
                      </div>
                      <div className="text-xs font-mono text-neutral-500">{ord.paymentStatus}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-xs">
                      <div className="font-mono text-neutral-500">ITEMS</div>
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#F4F4F4] p-2.5 border border-neutral-200">
                          <div>
                            <span className="font-semibold text-[#111111]">
                              {item.quantity} × {item.productName}
                            </span>
                            <div className="text-neutral-500">{item.variantLabel}</div>
                          </div>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatTnd(item.unitPriceTnd * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="font-mono text-neutral-500">DELIVERY TRACKING</div>
                      {[...ord.timeline].reverse().map((t, i) => (
                        <div key={i} className="flex justify-between border-b border-neutral-100 pb-1.5">
                          <div>
                            <span className="font-semibold text-[#111111]">{t.status}</span>
                            <span className="text-neutral-500"> — {t.note}</span>
                          </div>
                          <span className="font-mono text-neutral-400 shrink-0 ml-2">
                            {formatDateTime(t.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="bg-white border border-neutral-200 p-6">
            {favoriteProducts.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-neutral-500">You have not saved any favorite products yet.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
                >
                  Explore GANZO SHOP
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {favoriteProducts.map((p) => (
                  <div key={p.id} className="border border-neutral-200 flex flex-col justify-between">
                    <div
                      onClick={() => onOpenShopProduct(p.id)}
                      className="aspect-[4/3] bg-[#F4F4F4] cursor-pointer overflow-hidden"
                    >
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="font-display text-sm font-bold text-[#111111]">{p.name}</div>
                      <div className="font-mono text-xs font-bold tabular-nums">{formatTnd(p.priceTnd)}</div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => onOpenShopProduct(p.id)}
                          className="flex-1 py-2 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
                        >
                          View Product
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(p.id)}
                          aria-label="Remove favorite"
                          className="p-2 border border-neutral-300 text-[#007A87] cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5" fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={handleSaveProfile} className="lg:col-span-5 bg-white border border-neutral-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#111111]">Customer Profile</h2>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Company / Brand</label>
                <input
                  type="text"
                  value={profCompany}
                  onChange={(e) => setProfCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">City</label>
                <input
                  type="text"
                  value={profCity}
                  onChange={(e) => setProfCity(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
              >
                Save Profile
              </button>
            </form>

            <div className="lg:col-span-7 bg-white border border-neutral-200 p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#111111]">Saved Delivery Addresses</h2>
              {(user.addresses || []).length === 0 ? (
                <p className="text-xs text-neutral-500">No delivery addresses saved yet.</p>
              ) : (
                <div className="space-y-2">
                  {(user.addresses || []).map((a) => (
                    <div key={a.id} className="p-3 bg-[#F4F4F4] border border-neutral-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#111111]">
                          {a.label} · {a.recipientName}
                        </div>
                        <div className="text-neutral-600">
                          {a.addressLine}, {a.city} ({a.governorate}) · {a.phone}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(a.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddAddress} className="pt-4 border-t border-neutral-200 space-y-3">
                <div className="text-xs font-mono text-[#007A87]">ADD NEW ADDRESS</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="Label (Home, Store, Office)"
                    className="px-3 py-2 border border-neutral-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="Phone (+216 ...)"
                    className="px-3 py-2 border border-neutral-300 text-xs"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  placeholder="Street Address *"
                  className="w-full px-3 py-2 border border-neutral-300 text-xs"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="City *"
                    className="px-3 py-2 border border-neutral-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={addrGov}
                    onChange={(e) => setAddrGov(e.target.value)}
                    placeholder="Governorate *"
                    className="px-3 py-2 border border-neutral-300 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
                >
                  Save Delivery Address
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'studio' && (loading && orders.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-10 text-sm text-neutral-500">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-12 text-center space-y-4">
            <h2 className="font-display text-xl font-bold text-[#111111]">No orders submitted yet</h2>
            <p className="text-sm text-neutral-600 max-w-md mx-auto">
              Start a textile print run, paper print order, or graphic design brief with GANZO STUDIO.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('quote')}
              className="px-6 py-3 bg-[#111111] text-white text-sm font-semibold cursor-pointer"
            >
              Start Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Order List Sidebar */}
            <div className="lg:col-span-4 bg-white border border-neutral-200 divide-y divide-neutral-200">
              <div className="px-5 py-3.5 bg-[#111111] text-white flex items-center justify-between text-xs font-mono">
                <span>YOUR ORDERS</span>
                <span className="tabular-nums">{orders.length} TOTAL</span>
              </div>
              {orders.map((o) => {
                const active = selectedOrder?.id === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                    className={`w-full text-left p-5 transition-colors cursor-pointer ${
                      active ? 'bg-[#F4F4F4]' : 'bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#111111]">{o.trackingCode}</span>
                      <span className="text-[11px] font-semibold text-[#007A87]">{o.status}</span>
                    </div>
                    <div className="font-display text-sm font-bold text-[#111111] mt-1">{o.serviceName}</div>
                    <div className="flex items-center justify-between text-xs text-neutral-500 mt-2">
                      <span className="tabular-nums">{o.specifications.quantity} units</span>
                      <span className="font-mono tabular-nums">
                        {formatTnd(o.quotedPriceTnd ?? o.estimatedPriceTnd)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Order Detail */}
            {selectedOrder && (
              <div className="lg:col-span-8 space-y-6">
                {/* Summary + Quotation / Invoice Box */}
                <div className="bg-white border border-neutral-200 p-6 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-neutral-200">
                    <div>
                      <div className="text-xs font-mono text-neutral-500">
                        {selectedOrder.trackingCode} · {selectedOrder.invoiceNumber} · Submitted{' '}
                        {formatDateShort(selectedOrder.createdAt)}
                      </div>
                      <h2 className="font-display text-2xl font-bold text-[#111111] mt-1">
                        {selectedOrder.serviceName}
                      </h2>
                      <div className="text-xs text-neutral-600 mt-1">
                        {selectedOrder.specifications.productType} · Qty {selectedOrder.specifications.quantity} ·{' '}
                        {selectedOrder.specifications.deliveryMethod}
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-xs text-neutral-500">
                        {selectedOrder.quotedPriceTnd ? 'Official GANZO Quote' : 'Initial Estimate'}
                      </div>
                      <div className="font-display text-2xl font-extrabold text-[#111111] tabular-nums">
                        {formatTnd(selectedOrder.quotedPriceTnd ?? selectedOrder.estimatedPriceTnd)}
                      </div>
                      <div className="text-xs font-mono text-[#007A87] mt-0.5">{selectedOrder.paymentStatus}</div>
                    </div>
                  </div>

                  {selectedOrder.status === 'Quotation Sent' && (
                    <div className="bg-[#111111] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono text-xs text-[#00FFFF]">QUOTATION READY FOR APPROVAL</div>
                        <p className="text-sm text-neutral-200 mt-1">
                          GANZO STUDIO issued a fixed quote of{' '}
                          <span className="font-bold">{formatTnd(selectedOrder.quotedPriceTnd ?? selectedOrder.estimatedPriceTnd)}</span>.
                          Approve to initiate internal studio production.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={handleApproveQuote}
                        className="px-5 py-2.5 bg-[#00FFFF] text-[#111111] text-xs font-bold hover:bg-white transition-colors shrink-0 cursor-pointer"
                      >
                        Approve Quotation
                      </button>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-mono text-neutral-500 mb-3">10-STAGE WORKFLOW PROGRESS</div>
                    <OrderPipelineTracker currentStatus={selectedOrder.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-200">
                    <div>
                      <div className="text-xs font-mono text-neutral-500 mb-2">CREATIVE BRIEF &amp; SPECS</div>
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {selectedOrder.specifications.creativeBrief}
                      </p>
                      <div className="mt-3 text-xs text-neutral-500 space-y-1">
                        {selectedOrder.specifications.color && <div>Color: {selectedOrder.specifications.color}</div>}
                        {selectedOrder.specifications.sizes && (
                          <div>Sizes: {selectedOrder.specifications.sizes.join(', ')}</div>
                        )}
                        {selectedOrder.specifications.format && <div>Format: {selectedOrder.specifications.format}</div>}
                        {selectedOrder.specifications.paperType && (
                          <div>Paper: {selectedOrder.specifications.paperType}</div>
                        )}
                        {selectedOrder.specifications.finish && <div>Finish: {selectedOrder.specifications.finish}</div>}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-neutral-500">REFERENCE FILES</span>
                        <label className="inline-flex items-center gap-1 text-xs font-semibold text-[#007A87] cursor-pointer hover:underline">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                          <input type="file" onChange={handleUploadExtraFile} className="hidden" />
                        </label>
                      </div>
                      {selectedOrder.referenceFiles.length === 0 ? (
                        <p className="text-xs text-neutral-500">No files uploaded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedOrder.referenceFiles.map((f) => (
                            <a
                              key={f.id}
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 p-2.5 bg-[#F4F4F4] border border-neutral-200 text-xs text-[#111111] hover:border-[#111111]"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Design Previews & Customer Approval / Revision */}
                <div className="bg-white border border-neutral-200 p-6 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-[#007A87]">DESIGN PREVIEWS &amp; VALIDATION</div>
                      <h3 className="font-display text-lg font-bold text-[#111111]">
                        Studio Proofs ({selectedOrder.designPreviews.length})
                      </h3>
                    </div>
                    {selectedOrder.status === 'Awaiting Customer Validation' && (
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={handleApproveDesign}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00FFFF] text-[#111111] text-xs font-bold hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Final Design</span>
                      </button>
                    )}
                  </div>

                  {selectedOrder.designPreviews.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      Design proofs uploaded by GANZO STUDIO will appear here for your review and approval.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedOrder.designPreviews.map((prv) => (
                        <div key={prv.id} className="border border-neutral-200 bg-[#F4F4F4] p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#111111]">
                              v{prv.version} · {prv.title}
                            </span>
                            <span className="font-mono text-neutral-500">{formatDateTime(prv.uploadedAt)}</span>
                          </div>
                          <div className="bg-white border border-neutral-200 p-3 flex justify-center">
                            <img
                              src={prv.fileUrl}
                              alt={prv.title}
                              referrerPolicy="no-referrer"
                              className="max-h-72 object-contain"
                            />
                          </div>
                          {prv.notes && <p className="text-xs text-neutral-600">{prv.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedOrder.designPreviews.length > 0 &&
                    selectedOrder.status === 'Awaiting Customer Validation' && (
                      <form onSubmit={handleRequestRevision} className="pt-4 border-t border-neutral-200 space-y-3">
                        <label className="block text-xs font-semibold text-[#111111]">
                          Need changes? Request a revision from GANZO STUDIO
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            value={revisionNote}
                            onChange={(e) => setRevisionNote(e.target.value)}
                            placeholder="Describe exact adjustments (e.g. enlarge logo 15%, adjust cyan contrast)..."
                            className="flex-1 px-3 py-2.5 border border-neutral-300 text-sm"
                          />
                          <button
                            type="submit"
                            disabled={actionBusy || !revisionNote.trim()}
                            className="px-5 py-2.5 border border-[#111111] text-[#111111] text-xs font-semibold hover:bg-[#111111] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Request Revision
                          </button>
                        </div>
                      </form>
                    )}

                  {selectedOrder.revisions.length > 0 && (
                    <div className="pt-3 space-y-2">
                      <div className="text-xs font-mono text-neutral-500">REVISION HISTORY</div>
                      {selectedOrder.revisions.map((r) => (
                        <div key={r.id} className="text-xs p-3 bg-[#F4F4F4] border border-neutral-200 flex justify-between">
                          <span>{r.message}</span>
                          <span className="font-mono text-neutral-500 ml-3 shrink-0">
                            {r.resolved ? 'Resolved' : 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact GANZO Support Thread */}
                <div className="bg-white border border-neutral-200 p-6 sm:p-7 space-y-4">
                  <div className="text-xs font-mono text-[#007A87]">GANZO STUDIO COMMUNICATION</div>
                  <h3 className="font-display text-lg font-bold text-[#111111]">Direct Thread with GANZO Support</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedOrder.messages.length === 0 ? (
                      <p className="text-xs text-neutral-500">No messages yet. Ask our team any question about this order.</p>
                    ) : (
                      selectedOrder.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3.5 text-xs border ${
                            m.senderRole === 'customer'
                              ? 'bg-[#F4F4F4] border-neutral-200 ml-6'
                              : 'bg-[#111111] text-white border-[#111111] mr-6'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 opacity-75">
                            <span className="font-semibold">{m.senderName}</span>
                            <span className="font-mono">{formatDateTime(m.createdAt)}</span>
                          </div>
                          <p className="leading-relaxed">{m.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Write a message to GANZO Studio..."
                      className="flex-1 px-3 py-2.5 border border-neutral-300 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={actionBusy || !messageBody.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
