import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use Service Role Key to bypass RLS for server-side updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { razorpay_subscription_id, user_id } = await req.json();

    if (!razorpay_subscription_id || !user_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Upsert the settings row. If the user hasn't saved their profile yet, this will create it
    // and flag it as 'pro'. If it exists, it will merge the 'pro' status into their existing settings.
    const { error: upsertError } = await supabaseAdmin
      .from('settings')
      .upsert({
        user_id: user_id,
        plan_type: 'pro',
        razorpay_subscription_id: razorpay_subscription_id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Upsert Error:', upsertError);
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Upgraded to Pro' });

  } catch (err) {
    console.error('Verify Subscription Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
