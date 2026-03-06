import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use the Service Role Key to bypass RLS and securely fetch the invoice across user boundaries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('id');

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
    }

    if (!supabaseServiceKey || supabaseServiceKey === 'your_supabase_service_role_key_here') {
      return NextResponse.json({ error: 'Stripe API is not fully configured (Missing Service Role Key)' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice from Supabase securely
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients (
          email,
          name
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const amount = Number(invoice.total);
    const invoiceNumber = invoice.number;
    const clientEmail = invoice.client?.email;

    // Convert amount to cents (Stripe requires smallest currency unit)
    const unitAmount = Math.round(amount * 100);

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: clientEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoiceNumber}`,
              description: `Payment for outstanding invoice ${invoiceNumber}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices?success=true&invoice_id=${invoiceId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices?canceled=true`,
      metadata: {
        invoiceId: invoiceId,
      },
    });

    // Redirect the user directly to the Stripe Checkout page
    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
