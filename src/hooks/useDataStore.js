"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export function useDataStore(key, initialData = []) {
  const [data, setData] = useState(initialData);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setData(initialData);
      setIsLoaded(true);
      return;
    }

    const fetchData = async () => {
      try {
        if (key === 'invoices') {
          const { data: invoices, error } = await supabase
            .from('invoices')
            .select(`
              *,
              items:invoice_items(*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const formatted = invoices.map(inv => ({
            id: inv.id,
            clientId: inv.client_id,
            number: inv.number,
            status: inv.status,
            dueDate: inv.due_date,
            notes: inv.notes,
            subtotal: Number(inv.subtotal),
            taxRate: Number(inv.tax_rate),
            tax: Number(inv.tax),
            total: Number(inv.total),
            createdAt: inv.created_at,
            items: inv.items.map(i => ({
              id: i.id,
              description: i.description,
              qty: i.qty,
              rate: Number(i.rate)
            }))
          }));
          setData(formatted);

        } else if (key === 'expenses') {
            const { data: expenses, error } = await supabase
              .from('expenses')
              .select('*')
              .eq('user_id', user.id)
              .order('date', { ascending: false });
            if (error) throw error;
            setData(expenses.map(e => ({
                id: e.id,
                amount: Number(e.amount),
                category: e.category,
                date: e.date,
                description: e.description,
                createdAt: e.created_at
            })));
        } else if (key === 'clients') {
            const { data: clients, error } = await supabase
              .from('clients')
              .select('*')
              .eq('user_id', user.id)
              .order('name', { ascending: true });
            if (error) throw error;
            setData(clients.map(c => ({
                id: c.id,
                name: c.name,
                email: c.email,
                company: c.company,
                phone: c.phone,
                address: c.address,
                createdAt: c.created_at
            })));
        } else if (key === 'settings') {
            const { data: settings, error } = await supabase
              .from('settings')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
            if (error) throw error;

            if (settings) {
                setData([{
                    id: settings.id,
                    companyName: settings.company_name,
                    companyEmail: settings.company_email,
                    companyAddress: settings.company_address,
                    taxId: settings.tax_id,
                    currencySymbol: settings.currency_symbol,
                    logoUrl: settings.logo_url
                }]);
            } else {
                setData([]);
            }
        }
      } catch (e) {
        console.error(`Failed to load ${key} from Supabase`, e);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user]);

  const add = async (item) => {
    if (!user) return;
    try {
        if (key === 'clients') {
            const { data: newClient, error } = await supabase
                .from('clients')
                .insert([{
                    user_id: user.id,
                    name: item.name,
                    email: item.email,
                    company: item.company,
                    phone: item.phone,
                    address: item.address
                }])
                .select()
                .single();
            if (error) throw error;

            setData(prev => [...prev, {
                id: newClient.id,
                name: newClient.name,
                email: newClient.email,
                company: newClient.company,
                phone: newClient.phone,
                address: newClient.address,
                createdAt: newClient.created_at
            }]);
        } else if (key === 'expenses') {
             const { data: newExpense, error } = await supabase
                .from('expenses')
                .insert([{
                    user_id: user.id,
                    amount: item.amount,
                    category: item.category,
                    date: item.date,
                    description: item.description
                }])
                .select()
                .single();
            if (error) throw error;

            setData(prev => [...prev, {
                id: newExpense.id,
                amount: Number(newExpense.amount),
                category: newExpense.category,
                date: newExpense.date,
                description: newExpense.description,
                createdAt: newExpense.created_at
            }]);
        } else if (key === 'invoices') {
            const { data: newInvoice, error: invError } = await supabase
                .from('invoices')
                .insert([{
                    user_id: user.id,
                    client_id: item.clientId,
                    number: item.number,
                    status: item.status,
                    due_date: item.dueDate,
                    notes: item.notes,
                    subtotal: item.subtotal,
                    tax_rate: item.taxRate,
                    tax: item.tax,
                    total: item.total
                }])
                .select()
                .single();

            if (invError) throw invError;

            const itemsToInsert = item.items.map(i => ({
                invoice_id: newInvoice.id,
                description: i.description,
                qty: i.qty,
                rate: i.rate
            }));

            const { data: newItems, error: itemsError } = await supabase
                .from('invoice_items')
                .insert(itemsToInsert)
                .select();

            if (itemsError) throw itemsError;

            setData(prev => [...prev, {
                id: newInvoice.id,
                clientId: newInvoice.client_id,
                number: newInvoice.number,
                status: newInvoice.status,
                dueDate: newInvoice.due_date,
                notes: newInvoice.notes,
                subtotal: Number(newInvoice.subtotal),
                taxRate: Number(newInvoice.tax_rate),
                tax: Number(newInvoice.tax),
                total: Number(newInvoice.total),
                createdAt: newInvoice.created_at,
                items: newItems.map(i => ({
                    id: i.id,
                    description: i.description,
                    qty: i.qty,
                    rate: Number(i.rate)
                }))
            }]);
        }
    } catch(e) {
        console.error("Failed to add", e);
        alert("Failed to save data. " + e.message);
    }
  };

  const update = async (id, changes) => {
    if (!user) return;

    if (key === 'settings') {
      setData([{ id: id || 'temp', ...data[0], ...changes }]);
    } else {
      setData(prev => prev.map(item => item.id === id ? { ...item, ...changes } : item));
    }

    try {
        if (key === 'clients') {
            const updates = {};
            if (changes.name !== undefined) updates.name = changes.name;
            if (changes.email !== undefined) updates.email = changes.email;
            if (changes.company !== undefined) updates.company = changes.company;
            if (changes.phone !== undefined) updates.phone = changes.phone;
            if (changes.address !== undefined) updates.address = changes.address;

            const { error } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        } else if (key === 'expenses') {
             const updates = {};
             if (changes.amount !== undefined) updates.amount = changes.amount;
             if (changes.category !== undefined) updates.category = changes.category;
             if (changes.date !== undefined) updates.date = changes.date;
             if (changes.description !== undefined) updates.description = changes.description;

             const { error } = await supabase
                .from('expenses')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        } else if (key === 'invoices') {
             const updates = {};
             if (changes.clientId !== undefined) updates.client_id = changes.clientId;
             if (changes.number !== undefined) updates.number = changes.number;
             if (changes.status !== undefined) updates.status = changes.status;
             if (changes.dueDate !== undefined) updates.due_date = changes.dueDate;
             if (changes.notes !== undefined) updates.notes = changes.notes;
             if (changes.subtotal !== undefined) updates.subtotal = changes.subtotal;
             if (changes.taxRate !== undefined) updates.tax_rate = changes.taxRate;
             if (changes.tax !== undefined) updates.tax = changes.tax;
             if (changes.total !== undefined) updates.total = changes.total;

             const { error: invError } = await supabase
                .from('invoices')
                .update(updates)
                .eq('id', id);

            if (invError) {
              console.error("Invoice update error:", invError);
              alert("Failed to update invoice status: " + invError.message);
              throw invError;
            }

            if (changes.items) {
                await supabase.from('invoice_items').delete().eq('invoice_id', id);
                const itemsToInsert = changes.items.map(i => ({
                    invoice_id: id,
                    description: i.description,
                    qty: i.qty,
                    rate: i.rate
                }));
                await supabase.from('invoice_items').insert(itemsToInsert);
            }
        } else if (key === 'settings') {
             const updates = {};
             if (changes.companyName !== undefined) updates.company_name = changes.companyName;
             if (changes.companyEmail !== undefined) updates.company_email = changes.companyEmail;
             if (changes.companyAddress !== undefined) updates.company_address = changes.companyAddress;
             if (changes.taxId !== undefined) updates.tax_id = changes.taxId;
             if (changes.currencySymbol !== undefined) updates.currency_symbol = changes.currencySymbol;
             if (changes.logoUrl !== undefined) updates.logo_url = changes.logoUrl;

             const { error } = await supabase
                .from('settings')
                .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' });
             if (error) throw error;
        }
    } catch(e) {
         console.error("Failed to update", e);
         alert("Failed to update data: " + e.message);
    }
  };

  const remove = async (id) => {
    if (!user) return;
    setData(prev => prev.filter(item => item.id !== id));

    try {
        const { error } = await supabase.from(key).delete().eq('id', id);
        if (error) throw error;
    } catch(e) {
        console.error("Failed to remove", e);
    }
  };

  return { data, isLoaded, add, update, remove };
}
