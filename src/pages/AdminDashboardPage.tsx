import React, { useEffect, useState } from 'react';
import { LogOut, Plus, Send, Trash2, Upload } from 'lucide-react';
import { AdminShopManager } from '../components/AdminShopManager';
import { AuthGate } from '../components/AuthGate';
import { apiFetch, formatDateShort, formatDateTime, formatTnd, uploadStudioFile } from '../lib/api';
import {
  ORDER_STATUSES,
  ROLE_LABELS,
  type ContactInquiry,
  type DesignerProfile,
  type OrderStatus,
  type PaymentStatus,
  type PortfolioItem,
  type PublicUser,
  type ServiceCategory,
  type SiteContent,
  type StudioOrder,
  type StudioService,
} from '../types/studio';

interface AdminDashboardProps {
  user: PublicUser | null;
  designers: DesignerProfile[];
  portfolio: PortfolioItem[];
  siteContent: SiteContent;
  onAuthenticated: (user: PublicUser) => void;
  onLogout: () => void;
  onBootstrapRefresh: () => void;
}

interface AdminOverviewData {
  stats: {
    totalOrders: number;
    activeOrders: number;
    awaitingQuote: number;
    inProduction: number;
    openInquiries: number;
    totalRevenueTnd: number;
    totalPipelineTnd: number;
  };
  customers: PublicUser[];
  teamMembers: PublicUser[];
  inquiries: ContactInquiry[];
  allServices: StudioService[];
}

type AdminTab =
  | 'overview'
  | 'orders'
  | 'shop'
  | 'customers'
  | 'services'
  | 'designers'
  | 'portfolio'
  | 'inquiries'
  | 'content';

export const AdminDashboardPage: React.FC<AdminDashboardProps> = ({
  user,
  designers,
  portfolio,
  siteContent,
  onAuthenticated,
  onLogout,
  onBootstrapRefresh,
}) => {
  const [tab, setTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<StudioOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Order Edit States
  const [quoteInput, setQuoteInput] = useState('');
  const [statusInput, setStatusInput] = useState<OrderStatus>('New Request');
  const [statusNote, setStatusNote] = useState('');
  const [designerAssign, setDesignerAssign] = useState('');
  const [prodLead, setProdLead] = useState('');
  const [paymentInput, setPaymentInput] = useState<PaymentStatus>('Unpaid');
  const [prodNotes, setProdNotes] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  // Preview upload states
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewNotes, setPreviewNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [uploadingPreview, setUploadingPreview] = useState(false);

  // Admin Create Forms
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvCat, setNewSrvCat] = useState<ServiceCategory>('textile');
  const [newSrvPrice, setNewSrvPrice] = useState('40');
  const [newSrvSubtitle, setNewSrvSubtitle] = useState('');

  const [newDesName, setNewDesName] = useState('');
  const [newDesRole, setNewDesRole] = useState('');
  const [newDesBio, setNewDesBio] = useState('');
  const [newDesSpecs, setNewDesSpecs] = useState('Brand Identity, Print');

  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortClient, setNewPortClient] = useState('');
  const [newPortCat, setNewPortCat] = useState<PortfolioItem['category']>('Textile Printing');
  const [newPortMetric, setNewPortMetric] = useState('');

  const [contentForm, setContentForm] = useState<SiteContent>(siteContent);

  useEffect(() => {
    setContentForm(siteContent);
  }, [siteContent]);

  const role = user?.role;
  const isAdmin = role === 'administrator';
  const isPM = role === 'project_manager';
  const isDesigner = role === 'graphic_designer';
  const isProd = role === 'production_manager';
  const isSupport = role === 'customer_support';

  const loadConsoleData = async () => {
    if (!user || user.role === 'customer') return;
    setLoading(true);
    setError('');
    try {
      const ordRes = await apiFetch<{ orders: StudioOrder[] }>('/api/orders');
      setOrders(ordRes.orders);
      if (ordRes.orders.length > 0 && !ordRes.orders.some((o) => o.id === selectedOrderId)) {
        setSelectedOrderId(ordRes.orders[0].id);
      }

      if (!isDesigner) {
        const ovRes = await apiFetch<AdminOverviewData>('/api/admin/overview');
        setOverview(ovRes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load console data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'customer') {
      setTab(isAdmin || isPM ? 'overview' : isSupport ? 'inquiries' : 'orders');
      void loadConsoleData();
    }
  }, [user?.id, user?.role]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || null;

  useEffect(() => {
    if (selectedOrder) {
      setQuoteInput(selectedOrder.quotedPriceTnd !== null ? String(selectedOrder.quotedPriceTnd) : '');
      setStatusInput(selectedOrder.status);
      setDesignerAssign(selectedOrder.assignedDesignerId || '');
      setProdLead(selectedOrder.assignedProductionLead || '');
      setPaymentInput(selectedOrder.paymentStatus);
      setProdNotes(selectedOrder.productionNotes || '');
      setStatusNote('');
    }
  }, [selectedOrder?.id, selectedOrder?.updatedAt]);

  if (!user) {
    return (
      <AuthGate
        title="GANZO Internal Team & Admin Console"
        subtitle="Sign in with an internal GANZO STUDIO role (Administrator, Project Manager, Graphic Designer, Production Manager, or Customer Support)."
        onAuthenticated={onAuthenticated}
      />
    );
  }

  if (user.role === 'customer') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-neutral-200 p-8 space-y-4">
          <div className="font-mono text-xs text-[#007A87]">RESTRICTED WORKSPACE</div>
          <h1 className="font-display text-2xl font-bold text-[#111111]">Internal Team Access Only</h1>
          <p className="text-sm text-neutral-600">
            You are currently signed in as a Customer ({user.email}). Sign out to log in with an internal GANZO STUDIO staff account.
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
          >
            Sign Out &amp; Switch Account
          </button>
        </div>
      </div>
    );
  }

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const replaceOrder = (updated: StudioOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleSaveOrderChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setError('');
    try {
      const payload: Record<string, unknown> = {
        status: statusInput,
        statusNote,
        productionNotes: prodNotes,
      };
      if (isAdmin || isPM) {
        payload.quotedPriceTnd = quoteInput ? Number(quoteInput) : null;
        payload.assignedDesignerId = designerAssign || null;
        payload.assignedProductionLead = prodLead || null;
      }
      if (isAdmin) {
        payload.paymentStatus = paymentInput;
      }

      const res = await apiFetch<{ order: StudioOrder }>(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      replaceOrder(res.order);
      notify(`Order ${res.order.trackingCode} updated.`);
      if (!isDesigner) void loadConsoleData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handlePreviewFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPreview(true);
    try {
      const ref = await uploadStudioFile(file);
      setPreviewUrl(ref.url);
      setPreviewFileName(ref.name);
      if (!previewTitle) setPreviewTitle(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview upload failed');
    } finally {
      setUploadingPreview(false);
    }
  };

  const handlePublishPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !previewTitle.trim()) return;
    const finalUrl = previewUrl || '/api/sample-asset/preview-tshirt-v1';
    try {
      const res = await apiFetch<{ order: StudioOrder }>(`/api/orders/${selectedOrder.id}/previews`, {
        method: 'POST',
        body: JSON.stringify({
          title: previewTitle,
          notes: previewNotes,
          fileUrl: finalUrl,
          fileName: previewFileName || 'GANZO-Proof.svg',
        }),
      });
      replaceOrder(res.order);
      setPreviewTitle('');
      setPreviewNotes('');
      setPreviewUrl('');
      setPreviewFileName('');
      notify('Design preview published and sent to customer for validation.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload preview');
    }
  };

  const handleSendStudioMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !replyMessage.trim()) return;
    try {
      const res = await apiFetch<{ order: StudioOrder }>(`/api/orders/${selectedOrder.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: replyMessage }),
      });
      replaceOrder(res.order);
      setReplyMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName.trim()) return;
    try {
      await apiFetch('/api/admin/services', {
        method: 'POST',
        body: JSON.stringify({
          name: newSrvName,
          category: newSrvCat,
          basePriceTnd: Number(newSrvPrice) || 50,
          subtitle: newSrvSubtitle || 'Custom GANZO Service',
        }),
      });
      setNewSrvName('');
      setNewSrvSubtitle('');
      notify('Service added to catalog.');
      onBootstrapRefresh();
      void loadConsoleData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add service');
    }
  };

  const handleToggleService = async (srv: StudioService) => {
    try {
      await apiFetch(`/api/admin/services/${srv.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !srv.active }),
      });
      onBootstrapRefresh();
      void loadConsoleData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update service');
    }
  };

  const handleAddDesigner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesName.trim() || !newDesRole.trim()) return;
    try {
      await apiFetch('/api/admin/designers', {
        method: 'POST',
        body: JSON.stringify({
          name: newDesName,
          roleTitle: newDesRole,
          bio: newDesBio,
          specialties: newDesSpecs.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      setNewDesName('');
      setNewDesRole('');
      setNewDesBio('');
      notify('Designer profile added to GANZO creative roster.');
      onBootstrapRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add designer');
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortTitle.trim() || !newPortClient.trim()) return;
    try {
      await apiFetch('/api/admin/portfolio', {
        method: 'POST',
        body: JSON.stringify({
          title: newPortTitle,
          client: newPortClient,
          category: newPortCat,
          metric: newPortMetric || 'Produced end-to-end by GANZO STUDIO',
          summary: `${newPortCat} production delivered for ${newPortClient}.`,
          featured: true,
        }),
      });
      setNewPortTitle('');
      setNewPortClient('');
      setNewPortMetric('');
      notify('Portfolio project published.');
      onBootstrapRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add portfolio project');
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    try {
      await apiFetch(`/api/admin/portfolio/${id}`, { method: 'DELETE' });
      notify('Portfolio item removed.');
      onBootstrapRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleInquiryStatus = async (inq: ContactInquiry, status: ContactInquiry['status']) => {
    try {
      await apiFetch(`/api/admin/inquiries/${inq.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      notify(`Inquiry marked as ${status}.`);
      void loadConsoleData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update inquiry');
    }
  };

  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/site-content', {
        method: 'PATCH',
        body: JSON.stringify(contentForm),
      });
      notify('Website content updated live.');
      onBootstrapRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update site content');
    }
  };

  const allowedTabs: { id: AdminTab; label: string }[] = [
    ...(isAdmin || isPM ? [{ id: 'overview' as const, label: 'Overview & Revenue' }] : []),
    { id: 'orders', label: isDesigner ? 'My Assigned Projects' : isProd ? 'Production & QC' : 'Orders & Quotes' },
    ...(isAdmin || isPM ? [{ id: 'shop' as const, label: 'GANZO SHOP (Store)' }] : []),
    ...(isAdmin || isPM || isSupport ? [{ id: 'customers' as const, label: 'Customers' }] : []),
    ...(isAdmin || isPM ? [{ id: 'services' as const, label: 'Services & Products' }] : []),
    ...(isAdmin ? [{ id: 'designers' as const, label: 'Designers Team' }] : []),
    ...(isAdmin || isPM ? [{ id: 'portfolio' as const, label: 'Portfolio' }] : []),
    ...(isAdmin || isPM || isSupport ? [{ id: 'inquiries' as const, label: 'Inquiries' }] : []),
    ...(isAdmin ? [{ id: 'content' as const, label: 'Website Content' }] : []),
  ];

  const allowedStatusOptions: OrderStatus[] = isDesigner
    ? ['Design in Progress', 'Awaiting Customer Validation']
    : isProd
      ? ['In Production', 'Quality Control', 'Ready', 'Delivered']
      : [...ORDER_STATUSES];

  return (
    <section className="bg-[#F4F4F4] min-h-[calc(100vh-4rem)]">
      {/* Console Header */}
      <div className="bg-[#111111] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-[#00FFFF]">
              INTERNAL STUDIO CONSOLE · {ROLE_LABELS[user.role].toUpperCase()}
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold mt-0.5">
              {user.name} — GANZO Operations
            </h1>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-neutral-700 text-xs font-semibold hover:border-[#00FFFF] hover:text-[#00FFFF] self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
          {allowedTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                tab === t.id
                  ? 'border-[#00FFFF] text-[#00FFFF]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {toast && (
          <div className="mb-4 p-3 bg-[#111111] text-[#00FFFF] text-xs font-semibold border border-[#00FFFF]">
            {toast}
          </div>
        )}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-300 text-xs text-red-800">{error}</div>}

        {/* OVERVIEW & REVENUE */}
        {tab === 'overview' && overview && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-neutral-200 p-6">
                <div className="text-xs font-mono text-neutral-500">COLLECTED REVENUE</div>
                <div className="font-display text-3xl font-extrabold text-[#111111] mt-2 tabular-nums">
                  {formatTnd(overview.stats.totalRevenueTnd)}
                </div>
                <div className="text-xs text-[#007A87] mt-1 tabular-nums">
                  Pipeline: {formatTnd(overview.stats.totalPipelineTnd)}
                </div>
              </div>
              <div className="bg-white border border-neutral-200 p-6">
                <div className="text-xs font-mono text-neutral-500">ACTIVE ORDERS</div>
                <div className="font-display text-3xl font-extrabold text-[#111111] mt-2 tabular-nums">
                  {overview.stats.activeOrders}
                </div>
                <div className="text-xs text-neutral-500 mt-1 tabular-nums">
                  {overview.stats.totalOrders} total orders
                </div>
              </div>
              <div className="bg-white border border-neutral-200 p-6">
                <div className="text-xs font-mono text-neutral-500">IN PRODUCTION / QC</div>
                <div className="font-display text-3xl font-extrabold text-[#111111] mt-2 tabular-nums">
                  {overview.stats.inProduction}
                </div>
                <div className="text-xs text-neutral-500 mt-1">Tunis &amp; Ariana atelier</div>
              </div>
              <div className="bg-white border border-neutral-200 p-6">
                <div className="text-xs font-mono text-neutral-500">AWAITING QUOTE / INQUIRIES</div>
                <div className="font-display text-3xl font-extrabold text-[#111111] mt-2 tabular-nums">
                  {overview.stats.awaitingQuote + overview.stats.openInquiries}
                </div>
                <div className="text-xs text-neutral-500 mt-1 tabular-nums">
                  {overview.stats.openInquiries} open inquiries
                </div>
              </div>
            </div>

            {isAdmin && overview.teamMembers.length > 0 && (
              <div className="bg-white border border-neutral-200 p-6">
                <h2 className="font-display text-lg font-bold text-[#111111] mb-4">Internal Team Permissions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
                        <th className="py-2.5 pr-4">MEMBER</th>
                        <th className="py-2.5 pr-4">ROLE</th>
                        <th className="py-2.5 pr-4">EMAIL</th>
                        <th className="py-2.5">CITY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {overview.teamMembers.map((m) => (
                        <tr key={m.id}>
                          <td className="py-3 pr-4 font-semibold text-[#111111]">{m.name}</td>
                          <td className="py-3 pr-4 text-[#007A87] font-medium">{ROLE_LABELS[m.role]}</td>
                          <td className="py-3 pr-4 font-mono text-neutral-600">{m.email}</td>
                          <td className="py-3 text-neutral-600">{m.city}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS & WORKFLOW */}
        {tab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 bg-white border border-neutral-200 divide-y divide-neutral-200">
              <div className="px-5 py-3.5 bg-[#111111] text-white flex items-center justify-between text-xs font-mono">
                <span>{isDesigner ? 'ASSIGNED QUEUE' : 'STUDIO ORDERS'}</span>
                <span className="tabular-nums">{orders.length}</span>
              </div>
              {loading && orders.length === 0 ? (
                <div className="p-6 text-xs text-neutral-500">Loading queue...</div>
              ) : orders.length === 0 ? (
                <div className="p-6 text-xs text-neutral-500">No projects assigned to this queue yet.</div>
              ) : (
                orders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer ${
                      selectedOrder?.id === o.id ? 'bg-[#F4F4F4]' : 'bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#111111]">{o.trackingCode}</span>
                      <span className="text-[#007A87] font-semibold">{o.status}</span>
                    </div>
                    <div className="font-display text-sm font-bold text-[#111111] mt-1">{o.serviceName}</div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {o.customerName} {o.companyName ? `· ${o.companyName}` : ''}
                    </div>
                  </button>
                ))
              )}
            </div>

            {selectedOrder && (
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-neutral-200 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-neutral-200">
                    <div>
                      <div className="text-xs font-mono text-neutral-500">
                        {selectedOrder.trackingCode} · {selectedOrder.category.toUpperCase()} · Created{' '}
                        {formatDateShort(selectedOrder.createdAt)}
                      </div>
                      <h2 className="font-display text-2xl font-bold text-[#111111] mt-1">
                        {selectedOrder.serviceName}
                      </h2>
                      <div className="text-xs text-neutral-600 mt-1">
                        Client: {selectedOrder.customerName} ({selectedOrder.companyName || 'Individual'}) ·{' '}
                        {selectedOrder.customerEmail}
                      </div>
                    </div>
                    {!isDesigner && !isProd && (
                      <div className="sm:text-right">
                        <div className="text-xs text-neutral-500">Quote / Estimate</div>
                        <div className="font-display text-xl font-bold text-[#111111] tabular-nums">
                          {formatTnd(selectedOrder.quotedPriceTnd ?? selectedOrder.estimatedPriceTnd)}
                        </div>
                        <div className="text-xs font-mono text-[#007A87]">{selectedOrder.paymentStatus}</div>
                      </div>
                    )}
                  </div>

                  {/* Specs & Brief */}
                  <div className="bg-[#F4F4F4] border border-neutral-200 p-4 space-y-2 text-xs">
                    <div className="font-mono text-neutral-500">CLIENT BRIEF &amp; SPECIFICATIONS</div>
                    <p className="text-sm text-[#111111] leading-relaxed">
                      {selectedOrder.specifications.creativeBrief}
                    </p>
                    <div className="text-neutral-600 pt-1">
                      Qty: <strong className="tabular-nums">{selectedOrder.specifications.quantity}</strong> · Product:{' '}
                      {selectedOrder.specifications.productType} · Delivery: {selectedOrder.specifications.deliveryMethod}
                    </div>
                    {selectedOrder.referenceFiles.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {selectedOrder.referenceFiles.map((f) => (
                          <a
                            key={f.id}
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-white border border-neutral-300 text-[#111111] hover:border-[#111111]"
                          >
                            Ref: {f.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revision Notes Alert */}
                  {selectedOrder.revisions.length > 0 && (
                    <div className="border border-amber-300 bg-amber-50 p-4 space-y-2">
                      <div className="text-xs font-mono font-bold text-amber-900">CUSTOMER REVISION REQUESTS</div>
                      {selectedOrder.revisions.map((r) => (
                        <div key={r.id} className="text-xs text-amber-900 flex justify-between gap-2">
                          <span>“{r.message}”</span>
                          <span className="font-mono shrink-0">{r.resolved ? 'Resolved' : 'Pending'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Workflow & Assignment Controls */}
                  {!isSupport && (
                    <form onSubmit={handleSaveOrderChanges} className="space-y-4 pt-2 border-t border-neutral-200">
                      <h3 className="font-display text-base font-bold text-[#111111]">
                        Workflow, Assignment &amp; Quotation Controls
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">Order Status</label>
                          <select
                            value={statusInput}
                            onChange={(e) => setStatusInput(e.target.value as OrderStatus)}
                            className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
                          >
                            {!allowedStatusOptions.includes(statusInput) && (
                              <option value={statusInput}>{statusInput}</option>
                            )}
                            {allowedStatusOptions.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        {(isAdmin || isPM) && (
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Official Quotation (TND)
                            </label>
                            <input
                              type="number"
                              value={quoteInput}
                              onChange={(e) => setQuoteInput(e.target.value)}
                              placeholder={String(selectedOrder.estimatedPriceTnd)}
                              className="w-full px-3 py-2 border border-neutral-300 font-mono text-sm tabular-nums"
                            />
                          </div>
                        )}

                        {(isAdmin || isPM) && (
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Assign Internal Designer
                            </label>
                            <select
                              value={designerAssign}
                              onChange={(e) => setDesignerAssign(e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
                            >
                              <option value="">Unassigned</option>
                              {designers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name} ({d.roleTitle})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {(isAdmin || isPM) && (
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Production Lead
                            </label>
                            <input
                              type="text"
                              value={prodLead}
                              onChange={(e) => setProdLead(e.target.value)}
                              placeholder="Sami Mejri"
                              className="w-full px-3 py-2 border border-neutral-300 text-sm"
                            />
                          </div>
                        )}

                        {isAdmin && (
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">Payment Status</label>
                            <select
                              value={paymentInput}
                              onChange={(e) => setPaymentInput(e.target.value as PaymentStatus)}
                              className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
                            >
                              <option value="Unpaid">Unpaid</option>
                              <option value="Deposit Paid">Deposit Paid</option>
                              <option value="Paid in Full">Paid in Full</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Timeline Update Note
                          </label>
                          <input
                            type="text"
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="Optional note shown in order timeline"
                            className="w-full px-3 py-2 border border-neutral-300 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          Internal Production / Task Notes
                        </label>
                        <textarea
                          rows={2}
                          value={prodNotes}
                          onChange={(e) => setProdNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
                      >
                        Save Order Updates
                      </button>
                    </form>
                  )}
                </div>

                {/* Upload Design Preview (Admin, PM, Designer) */}
                {(isAdmin || isPM || isDesigner) && (
                  <div className="bg-white border border-neutral-200 p-6 space-y-4">
                    <div className="text-xs font-mono text-[#007A87]">STUDIO DELIVERABLE</div>
                    <h3 className="font-display text-lg font-bold text-[#111111]">
                      Upload Design Preview for Customer Validation
                    </h3>
                    <form onSubmit={handlePublishPreview} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={previewTitle}
                          onChange={(e) => setPreviewTitle(e.target.value)}
                          placeholder="Proof Title (e.g. Packaging Proof v2)"
                          className="px-3 py-2 border border-neutral-300 text-sm"
                        />
                        <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-neutral-400 bg-[#F4F4F4] text-xs cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span className="truncate">
                            {uploadingPreview
                              ? 'Uploading...'
                              : previewFileName || 'Attach Image / SVG Proof (optional)'}
                          </span>
                          <input type="file" onChange={handlePreviewFilePick} className="hidden" />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={previewNotes}
                        onChange={(e) => setPreviewNotes(e.target.value)}
                        placeholder="Design notes (margins, colors, fabric placement)..."
                        className="w-full px-3 py-2 border border-neutral-300 text-sm"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#00FFFF] text-[#111111] text-xs font-bold hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
                      >
                        Publish Design Preview to Customer
                      </button>
                    </form>
                  </div>
                )}

                {/* Customer Support Thread (Admin, PM, Support) */}
                {(isAdmin || isPM || isSupport) && (
                  <div className="bg-white border border-neutral-200 p-6 space-y-4">
                    <h3 className="font-display text-base font-bold text-[#111111]">
                      Customer Communication (Sent as GANZO Studio Desk)
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedOrder.messages.map((m) => (
                        <div key={m.id} className="p-3 bg-[#F4F4F4] border border-neutral-200 text-xs">
                          <div className="flex justify-between font-semibold mb-1">
                            <span>{m.senderName}</span>
                            <span className="font-mono text-neutral-500">{formatDateTime(m.createdAt)}</span>
                          </div>
                          <p>{m.body}</p>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendStudioMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Reply to customer on behalf of GANZO STUDIO..."
                        className="flex-1 px-3 py-2 border border-neutral-300 text-sm"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CUSTOMERS */}
        {tab === 'customers' && overview && (
          <div className="bg-white border border-neutral-200 p-6">
            <h2 className="font-display text-lg font-bold text-[#111111] mb-4">Registered Customers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 font-mono text-neutral-500">
                    <th className="py-2.5 pr-4">NAME</th>
                    <th className="py-2.5 pr-4">COMPANY</th>
                    <th className="py-2.5 pr-4">EMAIL</th>
                    <th className="py-2.5 pr-4">PHONE</th>
                    <th className="py-2.5">CITY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {overview.customers.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 pr-4 font-semibold text-[#111111]">{c.name}</td>
                      <td className="py-3 pr-4 text-neutral-600">{c.companyName || '—'}</td>
                      <td className="py-3 pr-4 font-mono text-neutral-600">{c.email}</td>
                      <td className="py-3 pr-4 font-mono text-neutral-600">{c.phone || '—'}</td>
                      <td className="py-3 text-neutral-600">{c.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERVICES & PRODUCTS */}
        {tab === 'services' && overview && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={handleAddService} className="lg:col-span-4 bg-white border border-neutral-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#111111]">Add Service / Product</h2>
              <select
                value={newSrvCat}
                onChange={(e) => setNewSrvCat(e.target.value as ServiceCategory)}
                className="w-full px-3 py-2 border border-neutral-300 text-sm bg-white"
              >
                <option value="textile">Textile Printing</option>
                <option value="paper">Paper Printing</option>
                <option value="design">Graphic Design</option>
              </select>
              <input
                type="text"
                required
                value={newSrvName}
                onChange={(e) => setNewSrvName(e.target.value)}
                placeholder="Product / Service Name"
                className="w-full px-3 py-2 border border-neutral-300 text-sm"
              />
              <input
                type="text"
                value={newSrvSubtitle}
                onChange={(e) => setNewSrvSubtitle(e.target.value)}
                placeholder="Specs subtitle"
                className="w-full px-3 py-2 border border-neutral-300 text-sm"
              />
              <input
                type="number"
                value={newSrvPrice}
                onChange={(e) => setNewSrvPrice(e.target.value)}
                placeholder="Base Price (TND)"
                className="w-full px-3 py-2 border border-neutral-300 font-mono text-sm"
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Catalog</span>
              </button>
            </form>

            <div className="lg:col-span-8 bg-white border border-neutral-200 divide-y divide-neutral-200">
              {overview.allServices.map((srv) => (
                <div key={srv.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono text-[#007A87]">{srv.category.toUpperCase()}</div>
                    <div className="font-display text-sm font-bold text-[#111111]">{srv.name}</div>
                    <div className="text-xs text-neutral-500">{srv.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-xs font-bold tabular-nums">{formatTnd(srv.basePriceTnd)}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleService(srv)}
                      className={`px-3 py-1 text-xs font-semibold border cursor-pointer ${
                        srv.active
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-neutral-500 border-neutral-300'
                      }`}
                    >
                      {srv.active ? 'Active' : 'Hidden'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DESIGNERS */}
        {tab === 'designers' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={handleAddDesigner} className="lg:col-span-4 bg-white border border-neutral-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#111111]">Add Studio Designer</h2>
              <input
                type="text"
                required
                value={newDesName}
                onChange={(e) => setNewDesName(e.target.value)}
                placeholder="Designer Name"
                className="w-full px-3 py-2 border border-neutral-300 text-sm"
              />
              <input
                type="text"
                required
                value={newDesRole}
                onChange={(e) => setNewDesRole(e.target.value)}
                placeholder="Studio Title"
                className="w-full px-3 py-2 border border-neutral-300 text-sm"
              />
              <input
                type="text"
                value={newDesSpecs}
                onChange={(e) => setNewDesSpecs(e.target.value)}
                placeholder="Specialties (comma-separated)"
                className="w-full px-3 py-2 border border-neutral-300 text-sm"
              />
              <textarea
                rows={3}
                value={newDesBio}
                onChange={(e) => setNewDesBio(e.target.value)}
                placeholder="Short biography"
                className="w-full px-3 py-2 border border-neutral-300 text-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
              >
                Add to GANZO Roster
              </button>
            </form>

            <div className="lg:col-span-8 bg-white border border-neutral-200 divide-y divide-neutral-200">
              {designers.map((d) => (
                <div key={d.id} className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-base font-bold text-[#111111]">{d.name}</div>
                    <div className="text-xs text-[#007A87]">{d.roleTitle}</div>
                    <p className="text-xs text-neutral-600 mt-1">{d.bio}</p>
                    <div className="text-[11px] font-mono text-neutral-500 mt-2">
                      {d.specialties.join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PORTFOLIO */}
        {tab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={handleAddPortfolio} className="lg:col-span-4 bg-white border border-neutral-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#111111]">Add Portfolio Case Study</h2>
              <input
                type="text"
                required
                value={newPortTitle}
                onChange={(e) => setNewPortTitle(e.target.value)}
                placeholder="Project Title"
                className="w-full px-3 py-2 border border-neutral-300 text-sm"
              />
              <input
                type="text"
                required
                value={newPortClient}
                onChange={(e) => setNewPortClient(e.target.value)}
                placeholder="Client Name"
                className="w-full px-3 py-2 border border-neutral-300 text-sm"
              />
              <select
                value={newPortCat}
                onChange={(e) => setNewPortCat(e.target.value as PortfolioItem['category'])}
                className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
              >
                <option value="Textile Printing">Textile Printing</option>
                <option value="Paper Printing">Paper Printing</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Brand Identity">Brand Identity</option>
              </select>
              <input
                type="text"
                value={newPortMetric}
                onChange={(e) => setNewPortMetric(e.target.value)}
                placeholder="Outcome / Metric"
                className="w-full px-3 py-2 border border-neutral-300 text-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#111111] text-white text-xs font-semibold cursor-pointer"
              >
                Publish Case Study
              </button>
            </form>

            <div className="lg:col-span-8 bg-white border border-neutral-200 divide-y divide-neutral-200">
              {portfolio.map((p) => (
                <div key={p.id} className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono text-[#007A87]">
                      {p.category} · {p.year}
                    </div>
                    <div className="font-display text-sm font-bold text-[#111111]">{p.title}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{p.metric}</div>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeletePortfolio(p.id)}
                      className="p-2 text-neutral-500 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INQUIRIES */}
        {tab === 'inquiries' && overview && (
          <div className="bg-white border border-neutral-200 divide-y divide-neutral-200">
            {overview.inquiries.length === 0 ? (
              <div className="p-8 text-sm text-neutral-500">No contact inquiries yet.</div>
            ) : (
              overview.inquiries.map((inq) => (
                <div key={inq.id} className="p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono text-[#007A87]">
                      {inq.status.toUpperCase()} · {formatDateTime(inq.createdAt)}
                    </div>
                    <div className="font-display text-base font-bold text-[#111111]">{inq.subject}</div>
                    <div className="text-xs text-neutral-600">
                      {inq.name} ({inq.company || 'Individual'}) · {inq.email} · {inq.phone}
                    </div>
                    <p className="text-sm text-neutral-700 pt-1">{inq.message}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {(['Open', 'In Review', 'Resolved'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleInquiryStatus(inq, st)}
                        className={`px-3 py-1.5 text-xs font-semibold border cursor-pointer ${
                          inq.status === st
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white text-neutral-600 border-neutral-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* WEBSITE CONTENT */}
        {tab === 'content' && isAdmin && (
          <form onSubmit={handleSaveSiteContent} className="bg-white border border-neutral-200 p-7 max-w-3xl space-y-5">
            <h2 className="font-display text-xl font-bold text-[#111111]">Website Copy &amp; Studio Contact</h2>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Hero Headline</label>
              <input
                type="text"
                value={contentForm.heroHeadline}
                onChange={(e) => setContentForm({ ...contentForm, heroHeadline: e.target.value })}
                className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Slogan</label>
              <input
                type="text"
                value={contentForm.heroSlogan}
                onChange={(e) => setContentForm({ ...contentForm, heroSlogan: e.target.value })}
                className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Hero Description</label>
              <textarea
                rows={3}
                value={contentForm.heroSubtext}
                onChange={(e) => setContentForm({ ...contentForm, heroSubtext: e.target.value })}
                className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Studio Address</label>
                <input
                  type="text"
                  value={contentForm.studioLocation}
                  onChange={(e) => setContentForm({ ...contentForm, studioLocation: e.target.value })}
                  className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Studio Phone</label>
                <input
                  type="text"
                  value={contentForm.studioPhone}
                  onChange={(e) => setContentForm({ ...contentForm, studioPhone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-neutral-300 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-[#111111] text-white text-xs font-semibold hover:bg-[#00FFFF] hover:text-[#111111] transition-colors cursor-pointer"
            >
              Publish Website Content
            </button>
          </form>
        )}

        {/* GANZO SHOP E-COMMERCE CONSOLE */}
        {tab === 'shop' && (isAdmin || isPM) && <AdminShopManager isAdmin={isAdmin} />}
      </div>
    </section>
  );
};
