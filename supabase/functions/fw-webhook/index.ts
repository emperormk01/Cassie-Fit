
// Follow this guide to deploy: https://supabase.com/docs/guides/functions
// 1. Run `supabase functions new fw-webhook`
// 2. Paste this code into `supabase/functions/fw-webhook/index.ts`
// 3. Set secrets if verifying signatures (optional for this context but recommended)
// 4. Deploy: `supabase functions deploy fw-webhook`

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Declare Deno environment variables for Typescript
declare const Deno: any;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize Supabase with Service Role Key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const payload = await req.json();
    console.log("Received Flutterwave Event:", JSON.stringify(payload));

    const eventType = payload.event; // 'charge.completed'
    const data = payload.data;

    // Check for successful charge
    if (eventType === 'charge.completed' && data.status === 'successful') {
        
        const customerEmail = data.customer.email;
        const planType = data.meta?.plan_type || 'pro'; // Default to pro if missing
        
        if (!customerEmail) {
            console.error("No email found in transaction data");
            return new Response('Missing email', { status: 400 });
        }

        // 1. Find user by email
        // Note: profiles table usually shares ID with auth.users, but we need to find the ID first.
        // We can query auth.users if we have permissions, OR if we stored email in profiles.
        // Assuming profiles table has an 'email' column OR we update based on user ID if passed in meta.
        // However, standard Supabase pattern is profiles.id = auth.users.id.
        // We need to look up the profile ID. 
        // If your profiles table doesn't have email, we might need to rely on `auth.users`.
        // BUT, looking at App.tsx, the `profiles` table stores JSON `data` which likely contains email 
        // OR we can rely on `meta.user_id` passed from frontend if available.
        
        // Let's assume we can match by email in the `profiles` table JSON `data->email` OR explicit column if it exists.
        // Since the schema change didn't add email, let's try to query auth users via admin API.
        
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        const user = users?.find(u => u.email === customerEmail);

        if (!user) {
             console.error("User not found for email:", customerEmail);
             // Alternatively, if we passed user_id in meta, use that
             if (data.meta?.user_id) {
                 await updateProfile(data.meta.user_id, planType, data.customer.id);
                 return new Response('Updated via User ID', { status: 200 });
             }
             return new Response('User not found', { status: 404 });
        }

        await updateProfile(user.id, planType, data.customer.id);
        return new Response('Profile Updated Successfully', { status: 200 });
    }

    return new Response('Event ignored', { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function updateProfile(userId: string, planType: string, customerId: string) {
    // 1. Fetch current data to merge
    const { data: profile } = await supabase
        .from('profiles')
        .select('data')
        .eq('id', userId)
        .single();

    const currentJson = profile?.data || {};

    // 2. Update Row
    const { error } = await supabase
        .from('profiles')
        .update({ 
            plan_type: planType,
            subscription_status: 'active',
            flutterwave_customer_id: customerId,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days approx
            updated_at: new Date(),
            // Sync JSON blob for frontend compatibility
            data: {
                ...currentJson,
                isPremium: true,
                planType: planType
            }
        })
        .eq('id', userId);

    if (error) {
        throw new Error("Database update failed: " + error.message);
    }
    console.log(`Updated user ${userId} to plan ${planType}`);
}
