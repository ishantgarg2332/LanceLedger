import { NextResponse, NextRequest } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get('id');

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    if (!supabaseServiceKey || !process.env.RAZORPAY_KEY_ID) {
      return NextResponse.json({ error: 'Razorpay API is not fully configured' }, { status: 500 });
    }

    // Fetch the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          phone
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'Paid') {
      // Just redirect them back if it's already paid
      return NextResponse.redirect(new URL(`/reports?paid=true&id=${invoice.id}`, req.url));
    }

    // Convert amount to paise (Razorpay requires smallest currency unit)
    const amountInPaise = Math.round(invoice.total * 100);

    // Create a Razorpay Payment Link
    const paymentLinkRequest = {
      amount: amountInPaise,
      currency: 'INR', // Defaulting to INR, can be made dynamic based on settings if needed
      accept_partial: false,
      description: `Payment for Invoice ${invoice.number}`,
      customer: {
        name: invoice.clients?.name || 'Customer',
        email: invoice.clients?.email || 'customer@example.com',
        contact: invoice.clients?.phone || '',
      },
      notify: {
        sms: false,
        email: true,
      },
      reminder_enable: true,
      callback_url: `${req.headers.get('origin')}/reports?success=true&invoice_id=${invoice.id}`,
      callback_method: 'get'
    };

    const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest);

    // Redirect the user directly to the Razorpay checkout page
    return NextResponse.redirect(paymentLink.short_url);

  } catch (error) {
    console.error('Error creating Razorpay payment link:', error);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}
