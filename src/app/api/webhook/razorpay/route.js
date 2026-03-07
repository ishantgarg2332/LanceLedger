import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

// Use Service Role Key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // Verify webhook signature
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('Invalid Razorpay Webhook Signature');
        return NextResponse.json({ error: 'Webhook Signature Error' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    if (eventType === 'subscription.charged') {
      const subscription = payload.subscription.entity;
      const customerEmail = payload.payment?.entity?.email;

      if (customerEmail) {
        const { data: settingsRow } = await supabaseAdmin
          .from('settings')
          .select('id')
          .eq('company_email', customerEmail)
          .single();

        if (settingsRow) {
          await supabaseAdmin
            .from('settings')
            .update({
              plan_type: 'pro',
              razorpay_customer_id: subscription.customer_id,
              razorpay_subscription_id: subscription.id,
            })
            .eq('id', settingsRow.id);
          console.log(`Successfully upgraded user ${customerEmail} to Pro via Razorpay.`);
        }
      }
    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.halted') {
      const subscription = payload.subscription.entity;

      // Downgrade user back to free
      await supabaseAdmin
        .from('settings')
        .update({ plan_type: 'free' })
        .eq('razorpay_subscription_id', subscription.id);
      console.log(`Razorpay subscription ${subscription.id} canceled. Downgraded user to Free.`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Razorpay Webhook processing error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
