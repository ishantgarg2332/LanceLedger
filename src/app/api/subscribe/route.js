import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    // Note: To use Subscriptions in Razorpay, you must create a Plan in the dashboard
    // and provide the plan_id here. For now, since it might not be configured,
    // we return a standard error or mock the success if keys are missing.

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_PRO_PLAN_ID) {
      return NextResponse.json({
        error: 'Razorpay keys or Pro Plan ID missing. Please add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_PRO_PLAN_ID to your .env.local file.'
      }, { status: 500 });
    }

    // Create Razorpay Subscription
    const subscriptionParams = {
      plan_id: process.env.RAZORPAY_PRO_PLAN_ID,
      total_count: 120, // Example: 10 years of monthly billing
      quantity: 1,
      customer_notify: 1,
      notes: {
        tier: 'LanceLedger Pro'
      }
    };

    const subscription = await razorpay.subscriptions.create(subscriptionParams);

    // For Razorpay Subscriptions, we send the subscription_id back
    // to the client to open the Razorpay Checkout modal
    return NextResponse.json({
      subscription_id: subscription.id,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error('Razorpay Subscribe Error:', err);
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
