import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// We use the Service Role Key here to bypass RLS securely from the server
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } else {
        // Fallback for local testing without signature verification if secret is not set
        event = JSON.parse(rawBody);
      }
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // We look up the customer details. Assuming they use the same email or we embed user_id in client_reference_id
      // For MVP, we'll try to match by email in the settings table.
      const customerEmail = session.customer_details?.email;

      if (customerEmail) {
        // Find the user by email (joined via settings companyEmail or try to update where companyEmail matches)
        const { data: settingsRow } = await supabaseAdmin
          .from('settings')
          .select('id, user_id')
          .eq('company_email', customerEmail)
          .single();

        if (settingsRow) {
          await supabaseAdmin
            .from('settings')
            .update({
              plan_type: 'pro',
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
            })
            .eq('id', settingsRow.id);
          console.log(`Successfully upgraded user ${customerEmail} to Pro.`);
        } else {
           console.log(`Could not find a settings row for email ${customerEmail}.`);
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;

      // Downgrade user back to free if subscription is canceled/unpaid
      await supabaseAdmin
        .from('settings')
        .update({ plan_type: 'free' })
        .eq('stripe_subscription_id', subscription.id);
      console.log(`Subscription ${subscription.id} canceled. Downgraded user to Free.`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
