"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDataStore } from '@/hooks/useDataStore';
import Modal from '@/components/Modal';
import DownloadPDFButton from '@/components/DownloadPDFButton';
import Toast from '@/components/Toast';
import UpgradeBanner from '@/components/UpgradeBanner';
import { Plus, Search, FileText, Calendar, DollarSign, Filter, Building2, Trash2, Edit, CheckCircle2, Clock, Send, AlertCircle, Link as LinkIcon, Loader2, Sparkles } from 'lucide-react';

const INVOICE_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue'];

function InvoicesContent() {
  const { data: invoices, add, update, remove, isLoaded: invoicesLoaded } = useDataStore('invoices', []);
  const { data: clients, isLoaded: clientsLoaded } = useDataStore('clients', []);
  const { data: settings } = useDataStore('settings', []);

  const currencySymbol = settings[0]?.currencySymbol || '$';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (invoicesLoaded) {
      if (searchParams.get('success') === 'true') {
        const id = searchParams.get('invoice_id');
        const invoice = invoices.find(i => i.id === id);
        if (invoice && invoice.status !== 'Paid') {
          update(id, { ...invoice, status: 'Paid' });
          setToast({ message: 'Payment successful! Your invoice has been marked as Paid.', type: 'success' });
        }
        router.replace('/invoices'); // Cleanup URL
      } else if (searchParams.get('canceled') === 'true') {
        setToast({ message: 'Payment was canceled.', type: 'error' });
        router.replace('/invoices'); // Cleanup URL
      }
    }
  }, [invoicesLoaded, searchParams, invoices, update, router]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isPro = settings[0]?.planType === 'pro';

  const generateInvoiceNumber = () => {
    const prefix = 'INV-';
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${yearMonth}-${random}`;
  };

  const getInitialFormState = () => ({
    number: '',
    clientId: '',
    status: 'Draft',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 days default
    notes: '',
    items: [{ id: Date.now().toString(), description: '', qty: 1, rate: 0 }],
    taxRate: 0
  });

  // Form state
  const [formData, setFormData] = useState(getInitialFormState);

  if (!invoicesLoaded || !clientsLoaded) return <div className="flex items-center justify-center h-full">Loading...</div>;

  const filteredInvoices = invoices.filter(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    const clientNameMatches = client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const numberMatches = invoice.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = clientNameMatches || numberMatches;
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Overdue': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Sent': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-foreground/70 bg-foreground/5 border-border';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'Overdue': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'Sent': return <Send className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const calculateTotals = (items, taxRate) => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.rate)), 0);
    const tax = subtotal * (Number(taxRate) / 100);
    return { subtotal, tax, total: subtotal + tax };
  };

  const openAddModal = () => {
    if (!isPro && invoices.length >= 3) {
      setShowUpgradeModal(true);
      return;
    }

    setEditingInvoice(null);
    setFormData({
      number: generateInvoiceNumber(),
      clientId: clients[0]?.id || '',
      status: 'Draft',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      items: [{ id: Date.now().toString(), description: '', qty: 1, rate: 0 }],
      taxRate: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({ ...invoice });
    setIsModalOpen(true);
  };

  const openDeleteModal = (invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', qty: 1, rate: 0 }]
    }));
  };

  const handleRemoveItem = (id) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleItemChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientId) {
      setToast({ message: "Please select a client.", type: "error" });
      return;
    }

    // Cleanup items & calc total
    const validItems = formData.items.filter(i => i.description.trim() !== '');
    if (validItems.length === 0) {
      setToast({ message: "Please add at least one line item.", type: "error" });
      return;
    }

    try {
      setIsSaving(true);

      const { subtotal, tax, total } = calculateTotals(validItems, formData.taxRate);

      const dataToSave = {
        ...formData,
        items: validItems,
        subtotal,
        tax,
        total
      };

      if (editingInvoice) {
        await update(editingInvoice.id, dataToSave);
      } else {
        await add(dataToSave);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (invoiceToDelete) {
      remove(invoiceToDelete.id);
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const formatCurrency = (val) => `${currencySymbol}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;

  const { subtotal, tax, total } = calculateTotals(formData.items, formData.taxRate);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-foreground/60 mt-1">Create, manage, and track your invoices.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors shadow-lg shadow-primary/25"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Search by invoice number or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 bg-background/50 border border-border rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {INVOICE_STATUSES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/50 uppercase bg-card/50">
              <tr>
                <th className="px-6 py-4 font-medium">Invoice Number</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Date & Status</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-foreground/50">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText className="w-8 h-8 opacity-50" />
                      <p>No invoices found.</p>
                      {searchTerm && <p className="text-xs">Try adjusting your filters.</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((invoice) => {
                  const client = clients.find(c => c.id === invoice.clientId);
                  return (
                    <tr key={invoice.id} className="border-b border-border/50 hover:bg-card/30 transition-colors last:border-0">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {invoice.number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-foreground/40" />
                          <span>{client?.name || 'Unknown Client'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 align-start">
                          <span className={`flex w-max items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            {invoice.status}
                          </span>
                          <span className="text-xs text-foreground/50 flex items-center gap-1">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status !== 'Paid' && (
                            <button
                              onClick={() => {
                                update(invoice.id, { ...invoice, status: 'Paid' });
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg transition-colors border border-emerald-500/20"
                              title="Mark as Paid"
                            >
                              Mark Paid
                            </button>
                          )}
                          {invoice.status !== 'Paid' && client?.email && (
                            <button
                              id={`send-btn-${invoice.id}`}
                              disabled={sendingInvoiceId === invoice.id}
                              onClick={async () => {
                                try {
                                  setSendingInvoiceId(invoice.id);

                                  const paymentLink = `${window.location.origin}/api/checkout?id=${invoice.id}`;

                                  const response = await fetch('/api/send-invoice', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      email: client.email,
                                      clientName: client.name,
                                      invoiceNumber: invoice.number,
                                      amount: formatCurrency(invoice.total),
                                      dueDate: new Date(invoice.dueDate).toLocaleDateString(),
                                      paymentLink: paymentLink
                                    })
                                  });

                                  if (!response.ok) throw new Error('Failed to send email');
                                  if (invoice.status === 'Draft') {
                                    update(invoice.id, { ...invoice, status: 'Sent' });
                                  }
                                  setToast({ message: `Invoice sent successfully to ${client.email}!`, type: 'success' });
                                } catch (err) {
                                  setToast({ message: 'Error sending invoice: ' + err.message, type: 'error' });
                                } finally {
                                  setSendingInvoiceId(null);
                                }
                              }}
                              className="p-2 text-foreground/50 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Send Invoice Email"
                            >
                              {sendingInvoiceId === invoice.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {invoice.status !== 'Paid' && (
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/api/checkout?id=${invoice.id}`;
                                navigator.clipboard.writeText(url);
                                setToast({ message: 'Payment link copied to clipboard!', type: 'success' });
                              }}
                              className="p-2 text-foreground/50 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                              title="Copy Payment Link"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </button>
                          )}
                          <DownloadPDFButton invoice={invoice} client={client} currencySymbol={currencySymbol} settings={settings[0] || {}} />
                          <button
                            onClick={() => openEditModal(invoice)}
                            className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(invoice)}
                            className="p-2 text-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Screen Add/Edit Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto outline-none focus:outline-none bg-background/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl min-h-screen sm:min-h-0 sm:my-8 bg-card border-x sm:border border-border/50 sm:rounded-2xl shadow-2xl flex flex-col sm:mb-8">
            <div className="flex items-center justify-between p-6 border-b border-border/50 sticky top-0 bg-card/80 backdrop-blur-xl z-10 sm:rounded-t-2xl">
              <h2 className="text-2xl font-bold">{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors text-foreground/80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-6 py-2 flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingInvoice ? 'Save Changes' : 'Create Invoice'}
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form Details */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4 fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground/80">Invoice Number</label>
                    <input
                      value={formData.number}
                      onChange={e => setFormData({...formData, number: e.target.value})}
                      className="bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground/80">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className="bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50 appearance-none"
                    >
                      {INVOICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground/80 text-primary">Client</label>
                    {clients.length === 0 ? (
                       <span className="text-sm text-rose-500 py-2">Please create a client first in the Clients tab.</span>
                    ) : (
                      <select
                        value={formData.clientId}
                        onChange={e => setFormData({...formData, clientId: e.target.value})}
                        className="bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50 appearance-none"
                        required
                      >
                        <option value="" disabled>Select Client</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground/80">Due Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                        className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Line Items</h3>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-12 gap-3 px-2 text-xs font-medium text-foreground/60 uppercase">
                      <div className="col-span-6">Description</div>
                      <div className="col-span-2">Qty</div>
                      <div className="col-span-3">Rate</div>
                      <div className="col-span-1"></div>
                    </div>
                    {formData.items.map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-3 items-start animate-in slide-in-from-left duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="col-span-6">
                            <input
                              value={item.description}
                              onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                              placeholder="Service description"
                              className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                              required
                            />
                        </div>
                        <div className="col-span-2">
                           <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={e => handleItemChange(item.id, 'qty', e.target.value)}
                              className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                              required
                            />
                        </div>
                        <div className="col-span-3">
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={e => handleItemChange(item.id, 'rate', e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-lg pl-7 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                                required
                              />
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center mt-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={formData.items.length === 1}
                            className={`p-1.5 rounded-lg transition-colors ${formData.items.length === 1 ? 'text-foreground/20 cursor-not-allowed' : 'text-foreground/50 hover:text-rose-500 hover:bg-rose-500/10'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="mt-2 text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1.5 w-max px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Line Item
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <label className="text-sm font-medium text-foreground/80 mb-2 block">Notes to Client</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Thank you for your business!"
                    className="w-full h-24 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50 resize-none resize-y"
                  />
                </div>
              </div>

              {/* Right Column: Calculations */}
              <div className="lg:col-span-1">
                  <div className="bg-background/30 rounded-xl p-6 border border-border/50 sticky top-24 shadow-inner">
                    <h3 className="text-lg font-bold mb-6">Summary</h3>

                    <div className="flex flex-col gap-4 text-sm">
                      <div className="flex justify-between items-center text-foreground/80">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>

                      <div className="flex justify-between items-center text-foreground/80">
                        <span className="flex items-center gap-2">
                          Tax Rate
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={formData.taxRate}
                              onChange={e => setFormData({...formData, taxRate: e.target.value})}
                              className="w-16 bg-card border border-border rounded px-2 py-0.5 text-xs text-right outline-none focus:border-primary"
                            />
                            <span className="ml-1">%</span>
                          </div>
                        </span>
                        <span>{formatCurrency(tax)}</span>
                      </div>

                      <div className="pt-4 mt-2 border-t border-border/50 flex justify-between items-center">
                        <span className="text-base font-semibold">Total</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-emerald-400 text-transparent bg-clip-text">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Invoice"
      >
        <div className="flex flex-col">
          <p className="text-foreground/80 mb-6">
            Are you sure you want to delete invoice <span className="font-semibold text-foreground">{invoiceToDelete?.number}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors text-foreground/80"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
            >
              Delete Invoice
            </button>
          </div>
        </div>
      </Modal>

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Required"
      >
        <div className="flex flex-col gap-4">
          <p className="text-foreground/80">
            You've reached the free tier limit of 3 invoices. Upgrade to LanceLedger Pro to create unlimited invoices and unlock all premium features.
          </p>
          <UpgradeBanner title="Get Unlimited Invoices" description="" />
        </div>
      </Modal>

      {/* Modern Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Invoices...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}
