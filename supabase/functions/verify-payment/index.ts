import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("[VERIFY] Starting payment verification");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    const { sessionId, eventId } = await req.json();
    if (!sessionId || !eventId) {
      throw new Error("Session ID and Event ID are required");
    }

    console.log("[VERIFY] Verifying session:", sessionId);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    console.log("[VERIFY] Payment verified:", session.id);

    // Check if subscription record already exists
    const { data: existingSub } = await supabaseClient
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .single();

    if (existingSub) {
      console.log("[VERIFY] Subscription already exists");
      return new Response(JSON.stringify({ success: true, message: "Already verified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create subscription record
    const { error: subError } = await supabaseClient
      .from("subscriptions")
      .insert({
        user_id: user.id,
        event_id: eventId,
        platform: "web",
        status: "active",
        transaction_id: session.id,
        amount_cents: session.amount_total || 29900,
        currency: "USD",
        metadata: {
          payment_intent: session.payment_intent,
          customer: session.customer,
        },
      });

    if (subError) throw subError;

    // Grant premium role
    const { error: roleError } = await supabaseClient
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: "premium",
      })
      .select()
      .single();

    if (roleError && roleError.code !== "23505") { // Ignore duplicate key error
      throw roleError;
    }

    console.log("[VERIFY] Premium access granted");

    // Activate the event and upgrade to premium plan
    const { error: eventError } = await supabaseClient
      .from("events")
      .update({ 
        status: "active",
        plan: "premium"
      })
      .eq("id", eventId)
      .eq("created_by", user.id);

    if (eventError) {
      console.error("[VERIFY] Error activating/upgrading event:", eventError);
      throw eventError;
    }

    console.log("[VERIFY] Event activated and upgraded to premium");

    return new Response(JSON.stringify({ success: true, message: "Payment verified and Premium access granted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[VERIFY] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
