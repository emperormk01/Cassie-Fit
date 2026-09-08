// Follow this guide to deploy: https://supabase.com/docs/guides/functions
// 1. Run `supabase functions new lemon-squeezy`
// 2. Paste this code into `supabase/functions/lemon-squeezy/index.ts`
// 3. Set secrets: `supabase secrets set LEMON_SQUEEZY_WEBHOOK_SECRET=your_secret`
// 4. Deploy: `supabase functions deploy lemon-squeezy`

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.173.0/crypto/mod.ts";

// Fix for "Cannot find name 'Deno'" when not using Deno VS Code extension or TS config
declare const Deno: any;

const LEMON_SQUEEZY_WEBHOOK_SECRET = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // 1. Validate Signature
    const signature = req.headers.get('x-signature');
    if (!signature || !LEMON_SQUEEZY_WEBHOOK_SECRET) {
      return new Response('Signature missing', { status: 401 });
    }

    const rawBody = await req.text();
    const isValid = await verifySignature(LEMON_SQUEEZY_WEBHOOK_SECRET, rawBody, signature);

    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    // 2. Parse Event
    const event = JSON.parse(rawBody);
    const eventName = event.meta.event_name;
    const userId = event.data.attributes.test_mode 
       ? 'test-user-id' // Handle test mode if needed
       : event.meta.custom_data?.user_id; // Retrieve userId passed from frontend

    console.log(`Received event: ${eventName} for user: ${userId}`);

    if (!userId) {
       // Only process if we know who the user is
       return new Response('No user_id found in custom_data', { status: 200 });
    }

    // 3. Update Database based on event
    if (eventName === 'order_created' || eventName === 'subscription_created' || eventName === 'subscription_updated') {
       
       // Update logic: We need to update the `data` jsonb column to set isPremium: true
       // First, fetch current data to avoid overwriting
       const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('data')
          .eq('id', userId)
          .single();

       if (fetchError || !profile) {
          console.error("Profile not found");
          return new Response('Profile not found', { status: 404 });
       }

       const newData = {
          ...profile.data,
          isPremium: true,
          subscriptionId: event.data.id,
          subscriptionStatus: event.data.attributes.status
       };

       const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
             data: newData,
             updated_at: new Date()
          })
          .eq('id', userId);

       if (updateError) {
          console.error("Update failed", updateError);
          return new Response('Database update failed', { status: 500 });
       }
    }

    // Handle cancellations/expirations if needed
    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
       // Similar logic to set isPremium: false
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// Helper to verify HMAC signature
async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  );

  const hex = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return hex === signature;
}