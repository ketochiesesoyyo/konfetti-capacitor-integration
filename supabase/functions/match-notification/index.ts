import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { matchId, eventId } = await req.json();

    if (!matchId || !eventId) {
      throw new Error("Missing matchId or eventId");
    }

    // Get match details
    const { data: match, error: matchError } = await supabaseClient
      .from("matches")
      .select("user1_id, user2_id")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      throw new Error("Match not found");
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("name, date")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    // Send emails to both users if they have notifications enabled
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const emailsSent = [];

    for (const userId of [match.user1_id, match.user2_id]) {
      // Get user profile with notification preferences
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("name, email_match_notifications, user_id")
        .eq("user_id", userId)
        .single();

      if (!profile || !profile.email_match_notifications) {
        continue; // Skip if notifications disabled
      }

      // Get user email from auth
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (!authUser?.email) continue;

      // Get user's language preference
      const { data: { user: currentUser } } = await supabaseClient.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      const language = currentUser?.user_metadata?.language || 'en';

      const emailHtml = createMatchEmail(profile.name, event.name, event.date, language);
      const subject = language === 'es' ? '¡Tienes un match!' : 'You have a match!';

      const { error: emailError } = await resend.emails.send({
        from: "Konfetti <onboarding@resend.dev>",
        to: [authUser.email],
        subject,
        html: emailHtml,
      });

      if (!emailError) {
        emailsSent.push(userId);
        
        // Log notification
        await supabaseClient.from("notification_logs").insert({
          user_id: userId,
          event_id: eventId,
          notification_type: "match",
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, emailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in match-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

function createMatchEmail(userName: string, eventName: string, eventDate: string, language: string): string {
  if (language === 'es') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Tienes un match!</h1>
            </div>
            <div class="content">
              <p>Hola ${userName},</p>
              <p>¡Felicidades! Has hecho match con alguien en <strong>${eventName}</strong>.</p>
              <p>Fecha del evento: ${new Date(eventDate).toLocaleDateString('es-ES')}</p>
              <p>Abre la aplicación Konfetti para empezar a chatear y conocer a tu match.</p>
              <p>¡Buena suerte! 💜</p>
            </div>
            <div class="footer">
              <p>© 2025 Konfetti. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You have a match!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Congratulations! You've matched with someone at <strong>${eventName}</strong>.</p>
            <p>Event date: ${new Date(eventDate).toLocaleDateString('en-US')}</p>
            <p>Open the Konfetti app to start chatting and get to know your match.</p>
            <p>Good luck! 💜</p>
          </div>
          <div class="footer">
            <p>© 2025 Konfetti. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}