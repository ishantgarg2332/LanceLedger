"use client";

import { useState, useEffect } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { Building2, Mail, MapPin, FileDigit, CircleDollarSign, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const EXCHANGE_RATES = {
  '$': 1,
  '€': 0.92,
  '£': 0.79,
  '₹': 91.90,
  '¥': 150.00,
  'A$': 1.53,
  'C$': 1.35
};

export default function SettingsPage() {
  const { data: settingsData, isLoaded: settingsLoaded, update: updateSettings } = useDataStore('settings', []);
  const { data: invoices, isLoaded: invoicesLoaded, update: updateInvoice } = useDataStore('invoices', []);
  const { data: expenses, isLoaded: expensesLoaded, update: updateExpense } = useDataStore('expenses', []);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    companyAddress: '',
    taxId: '',
    currencySymbol: '$',
    logoUrl: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (settingsLoaded && settingsData.length > 0) {
      setFormData(settingsData[0]);
    } else if (settingsLoaded && settingsData.length === 0) {
       // Pre-fill email if available
       setFormData(prev => ({ ...prev, companyEmail: user?.email || '' }));
    }
  }, [settingsLoaded, settingsData, user]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const oldCurrency = settingsData.length > 0 ? settingsData[0].currencySymbol : '$';
      const newCurrency = formData.currencySymbol;

      const id = settingsData.length > 0 ? settingsData[0].id : null;
      await updateSettings(id, formData);

      // Perform currency conversion if currency changed
      if (oldCurrency !== newCurrency && EXCHANGE_RATES[oldCurrency] && EXCHANGE_RATES[newCurrency]) {
        showToast('Converting historical records please wait...', 'success');
        const rate = EXCHANGE_RATES[newCurrency] / EXCHANGE_RATES[oldCurrency];

        // Convert expenses
        for (const exp of expenses) {
          await updateExpense(exp.id, { amount: exp.amount * rate });
        }

        // Convert invoices
        for (const inv of invoices) {
          const convertedItems = inv.items.map(item => ({
            ...item,
            rate: item.rate * rate
          }));
          await updateInvoice(inv.id, {
            subtotal: inv.subtotal * rate,
            tax: inv.tax * rate,
            total: inv.total * rate,
            items: convertedItems
          });
        }
      }

      showToast('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!settingsLoaded || !invoicesLoaded || !expensesLoaded) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
        <p className="text-foreground/60 mt-2">
          Configure your business details to personalize your invoices and reports.
        </p>
      </div>

      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Company Name / Your Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ''}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp or John Doe"
                  className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail || ''}
                  onChange={handleChange}
                  placeholder="e.g. hello@acme.com"
                  className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground/80">Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
                <textarea
                  name="companyAddress"
                  value={formData.companyAddress || ''}
                  onChange={handleChange}
                  placeholder="123 Freelance Blvd, Tech City, TX 75001"
                  rows={3}
                  className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Tax ID / VAT Number (Optional)</label>
              <div className="relative">
                <FileDigit className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId || ''}
                  onChange={handleChange}
                  placeholder="e.g. XX-XXXXXXX"
                  className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Default Currency Symbol</label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <select
                  name="currencySymbol"
                  value={formData.currencySymbol || '$'}
                  onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50 appearance-none"
                >
                  <option value="$">US Dollar ($)</option>
                  <option value="€">Euro (€)</option>
                  <option value="£">British Pound (£)</option>
                  <option value="₹">Indian Rupee (₹)</option>
                  <option value="¥">Japanese Yen (¥)</option>
                  <option value="A$">Australian Dollar (A$)</option>
                  <option value="C$">Canadian Dollar (C$)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground/80">Logo URL (Optional)</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  type="url"
                  name="logoUrl"
                  value={formData.logoUrl || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <p className="text-xs text-foreground/40 mt-1">Provide a publicly accessible URL to an image to include on your invoices.</p>
            </div>

          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`px-6 py-3 rounded-xl shadow-lg border flex items-center gap-3 ${
            toast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
          }`}>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
