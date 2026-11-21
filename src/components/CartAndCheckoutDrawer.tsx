import React, { useMemo, useState } from 'react';
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { apiFetch, formatTnd } from '../lib/api';
import type { CartItem, PageRoute, PublicUser, ShopOrder } from '../types/studio';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  user: PublicUser | null;
  onUpdateQty: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: ShopOrder) => void;
  onNavigate: (page: PageRoute) => void;
}

const TUNISIAN_GOVERNORATES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Sousse',
  'Monastir',
  'Sfax',
  'Bizerte',
  'Kairouan',
  'Gabès',
  'Médenine',
  'Gafsa',
  'Hammamet / Nabeul',
];

export const CartAndCheckoutDrawer: React.FC<CartDrawerProps> = ({
  open,
  onClose,
  items,
  user,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  onNavigate,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountTnd: number; description: string } | null>(
    null,
  );
  const [promoError, setPromoError] = useState('');

  // Checkout fields
  const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(defaultAddr?.phone || user?.phone || '');
  const [deliveryMethod, setDeliveryMethod] = useState<ShopOrder['deliveryMethod']>('Grand Tunis Courier');
  const [deliveryAddress, setDeliveryAddress] = useState(defaultAddr?.addressLine || '');
  const [city, setCity] = useState(defaultAddr?.city || user?.city || 'Tunis');
  const [governorate, setGovernorate] = useState(defaultAddr?.governorate || 'Tunis');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<ShopOrder | null>(null);

  const subtotalTnd = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPriceTnd * item.quantity, 0),
    [items],
  );

  const discountTnd = appliedPromo ? Math.min(subtotalTnd, appliedPromo.discountTnd) : 0;
  const netSubtotal = Math.max(0, subtotalTnd - discountTnd);
  const shippingFeeTnd =
    items.length === 0
      ? 0
      : deliveryMethod === 'Studio Pickup (Lac 2, Tunis)' || netSubtotal >= 180
        ? 0
        : deliveryMethod === 'Grand Tunis Courier'
          ? 7
          : 9;
  const totalTnd = netSubtotal + shippingFeeTnd;

  if (!open) return null;

  const handleApplyPromo = async () => {
    setPromoError('');
    try {
      const res = await apiFetch<{
        promo: { code: string; description: string };
        discountTnd: number;
      }>('/api/shop/validate-promo', {
        method: 'POST',
        body: JSON.stringify({ code: promoInput, subtotalTnd }),
      });
      setAppliedPromo({
        code: res.promo.code,
        discountTnd: res.discountTnd,
        description: res.promo.description,
      });
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err instanceof Error ? err.message : 'Invalid promo code');
    }
  };

  const handleSelectSavedAddress = (addrId: string) => {
    const found = user?.addresses?.find((a) => a.id === addrId);
    if (!found) return;
    setCustomerName(found.recipientName);
    setCustomerPhone(found.phone);
    setDeliveryAddress(found.addressLine);
    setCity(found.city);
    setGovernorate(found.governorate);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiFetch<{ order: ShopOrder }>('/api/shop/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: customerName || user?.name,
          customerEmail: customerEmail || user?.email,
          customerPhone: customerPhone || user?.phone,
          deliveryMethod,
          deliveryAddress,
          city,
          governorate,
          paymentMethod: 'Cash on Delivery',
          discountCode: appliedPromo?.code || '',
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            selectedSize: i.selectedSize,
            selectedColor: i.selectedColor,
            variantLabel: i.variantLabel,
            personalizationNotes: i.personalizationNotes,
            customArtwork: i.customArtwork,
          })),
        }),
      });
      setConfirmedOrder(res.order);
      setStep('confirmed');
      onClearCart();
      setAppliedPromo(null);
      onOrderSuccess(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('cart');
    setConfirmedOrder(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="w-full max-w-lg bg-white h-full flex flex-col border-l border-[#111111]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#111111] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-[#00FFFF]" />
            <span className="font-display text-base font-bold">
              {step === 'cart'
                ? `GANZO SHOP Bag (${items.reduce((s, i) => s + i.quantity, 0)})`
                : step === 'checkout'
                  ? 'Checkout · Tunisia Delivery'
                  : 'Order Confirmed'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close bag"
            className="p-1 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'confirmed' && confirmedOrder ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-[#007A87]">
                <CheckCircle2 className="w-7 h-7" />
                <span className="font-mono text-xs font-semibold">GANZO SHOP ORDER CONFIRMED</span>
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-[#111111]">
                  Order {confirmedOrder.orderNumber}
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Confirmation sent for {confirmedOrder.customerEmail}. Pay {formatTnd(confirmedOrder.totalTnd)} via Cash on Delivery upon receipt.
                </p>
              </div>
              <div className="bg-[#F4F4F4] border border-neutral-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Delivery Method</span>
                  <span className="font-semibold text-[#111111]">{confirmedOrder.deliveryMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Destination</span>
                  <span className="font-semibold text-[#111111]">
                    {confirmedOrder.city}, {confirmedOrder.governorate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Amount</span>
                  <span className="font-mono font-bold text-[#111111] tabular-nums">
                    {formatTnd(confirmedOrder.totalTnd)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleResetAndClose();
                    onNavigate('customer-dashboard');
                  }}
                  className="w-full py-3 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] cursor-pointer"
                >
                  View in Customer Account
                </button>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full py-3 border border-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-sm text-neutral-500">Your GANZO SHOP bag is currently empty.</p>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          ) : step === 'cart' ? (
            <>
              <div className="divide-y divide-neutral-200 border border-neutral-200">
                {items.map((item) => (
                  <div key={item.cartKey} className="p-4 flex gap-4">
                    <img
                      src={item.image}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 object-cover bg-[#F4F4F4] border border-neutral-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-sm font-bold text-[#111111] leading-snug">
                          {item.productName}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartKey)}
                          aria-label="Remove item"
                          className="text-neutral-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-neutral-500">
                        {item.selectedSize} · {item.selectedColor}
                      </div>
                      {item.personalizationNotes && (
                        <div className="text-[11px] text-[#007A87] bg-[#F4F4F4] p-1.5">
                          Custom note: {item.personalizationNotes}
                        </div>
                      )}
                      {item.customArtwork && (
                        <div className="text-[11px] font-mono text-neutral-600">
                          Artwork attached: {item.customArtwork.name}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <div className="inline-flex items-center border border-neutral-300">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.cartKey, -1)}
                            className="p-1.5 hover:bg-[#F4F4F4] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-xs font-mono tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.cartKey, 1)}
                            className="p-1.5 hover:bg-[#F4F4F4] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-mono text-sm font-bold text-[#111111] tabular-nums">
                          {formatTnd(item.unitPriceTnd * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700">
                  Promotion Code (Try GANZO10 or TUNIS20)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 border border-neutral-300 font-mono text-xs uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 border border-[#111111] text-xs font-semibold hover:bg-[#111111] hover:text-white cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-600">{promoError}</p>}
                {appliedPromo && (
                  <p className="text-xs text-[#007A87] font-medium">
                    Applied {appliedPromo.code}: -{formatTnd(discountTnd)} ({appliedPromo.description})
                  </p>
                )}
              </div>
            </>
          ) : (
            <form id="ganzo-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="text-xs font-semibold text-[#007A87] hover:underline cursor-pointer"
              >
                ← Back to Bag
              </button>

              {user?.addresses && user.addresses.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Use Saved Address
                  </label>
                  <select
                    onChange={(e) => handleSelectSavedAddress(e.target.value)}
                    defaultValue=""
                    className="w-full px-3 py-2 border border-neutral-300 bg-[#F4F4F4] text-xs"
                  >
                    <option value="">Select saved delivery address...</option>
                    {user.addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} — {a.addressLine}, {a.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Phone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+216 55 000 000"
                    className="w-full px-3 py-2 border border-neutral-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Delivery Method</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as ShopOrder['deliveryMethod'])}
                  className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
                >
                  <option value="Grand Tunis Courier">Grand Tunis Courier (7 TND · Free ≥ 180 TND)</option>
                  <option value="Tunisia National Delivery">Tunisia National Delivery (9 TND · Free ≥ 180 TND)</option>
                  <option value="Studio Pickup (Lac 2, Tunis)">Studio Pickup (Lac 2, Tunis — Free)</option>
                </select>
              </div>

              {deliveryMethod !== 'Studio Pickup (Lac 2, Tunis)' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Delivery Address *</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Street, building, floor"
                      className="w-full px-3 py-2 border border-neutral-300 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Governorate</label>
                      <select
                        value={governorate}
                        onChange={(e) => setGovernorate(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
                      >
                        {TUNISIAN_GOVERNORATES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Payment Methods */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <label className="block text-xs font-semibold text-neutral-700">Payment Method (Tunisia)</label>
                <div className="p-3 border border-[#111111] bg-[#F4F4F4] flex items-start gap-3">
                  <input type="radio" checked readOnly className="mt-1 accent-[#111111]" />
                  <div>
                    <div className="text-xs font-bold text-[#111111]">Cash on Delivery (Paiement à la livraison)</div>
                    <div className="text-[11px] text-neutral-600">
                      Pay in Tunisian Dinars (TND) upon delivery or studio pickup.
                    </div>
                  </div>
                </div>
                <div className="p-3 border border-neutral-200 bg-white opacity-60 flex items-start gap-3">
                  <input type="radio" disabled className="mt-1" />
                  <div>
                    <div className="text-xs font-semibold text-neutral-700">
                      Online Card / e-Dinar Payment — Pending Integration
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Configurable Tunisian payment gateway (Konnect / ClicToPay) is prepared and pending merchant API activation.
                    </div>
                  </div>
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-800">{error}</div>}
            </form>
          )}
        </div>

        {/* Footer Totals */}
        {step !== 'confirmed' && items.length > 0 && (
          <div className="p-6 bg-[#F4F4F4] border-t border-neutral-200 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatTnd(subtotalTnd)}</span>
              </div>
              {discountTnd > 0 && (
                <div className="flex justify-between text-[#007A87]">
                  <span>Discount ({appliedPromo?.code})</span>
                  <span className="font-mono tabular-nums">-{formatTnd(discountTnd)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Shipping ({deliveryMethod})</span>
                <span className="font-mono tabular-nums">
                  {shippingFeeTnd === 0 ? 'FREE' : formatTnd(shippingFeeTnd)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#111111] pt-2 border-t border-neutral-300">
                <span>Total</span>
                <span className="font-mono text-base tabular-nums">{formatTnd(totalTnd)}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3.5 bg-[#111111] text-white text-xs font-bold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
              >
                Proceed to Checkout
              </button>
            ) : (
              <button
                type="submit"
                form="ganzo-checkout-form"
                disabled={submitting}
                className="w-full py-3.5 bg-[#00FFFF] text-[#111111] text-xs font-bold hover:bg-[#111111] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Confirming Order...' : `Confirm Order · ${formatTnd(totalTnd)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
