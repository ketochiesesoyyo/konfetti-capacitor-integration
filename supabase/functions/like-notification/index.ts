import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIKE_NOTIFICATION_RATE_LIMIT_HOURS = 24;

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

    const { likedUserId, eventId } = await req.json();

    if (!likedUserId || !eventId) {
      throw new Error("Missing likedUserId or eventId");
    }

    // Get liked user profile with notification preferences
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("name, email_like_notifications, user_id")
      .eq("user_id", likedUserId)
      .single();

    if (!profile || !profile.email_like_notifications) {
      return new Response(
        JSON.stringify({ success: true, message: "User has notifications disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if we've sent a like notification to this user recently
    const canSend = await canSendLikeEmail(supabaseClient, likedUserId, eventId);
    if (!canSend) {
      return new Response(
        JSON.stringify({ success: true, message: "Rate limited" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
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

    // Get user email from auth
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(likedUserId);
    
    if (!authUser?.email) {
      throw new Error("User email not found");
    }

    // Get user's language preference
    const { data: { user: currentUser } } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    const language = currentUser?.user_metadata?.language || 'en';

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const emailHtml = createLikeEmail(profile.name, event.name, event.date, language);
    const subject = language === 'es' ? '¡Alguien te dio me gusta!' : 'Someone liked you!';

    const { error: emailError } = await resend.emails.send({
      from: "Konfetti <onboarding@resend.dev>",
      to: [authUser.email],
      subject,
      html: emailHtml,
    });

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    // Log notification
    await supabaseClient.from("notification_logs").insert({
      user_id: likedUserId,
      event_id: eventId,
      notification_type: "like",
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in like-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

async function canSendLikeEmail(
  supabase: any,
  userId: string,
  eventId: string
): Promise<boolean> {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - LIKE_NOTIFICATION_RATE_LIMIT_HOURS);

  const { data } = await supabase
    .from("notification_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("notification_type", "like")
    .gte("sent_at", cutoffTime.toISOString())
    .limit(1);

  return !data || data.length === 0;
}

function createLikeEmail(userName: string, eventName: string, eventDate: string, language: string): string {
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
              <h1>💜 ¡Alguien te dio me gusta!</h1>
            </div>
            <div class="content">
              <p>Hola ${userName},</p>
              <p>¡Buenas noticias! Alguien te dio me gusta en <strong>${eventName}</strong>.</p>
              <p>Fecha del evento: ${new Date(eventDate).toLocaleDateString('es-ES')}</p>
              <p>Abre la aplicación Konfetti para ver quién está interesado en ti. Si tú también les das me gusta, ¡tendrán un match!</p>
              <p>¡No esperes más! 💜</p>
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
            <h1>💜 Someone liked you!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Great news! Someone liked you at <strong>${eventName}</strong>.</p>
            <p>Event date: ${new Date(eventDate).toLocaleDateString('en-US')}</p>
            <p>Open the Konfetti app to see who's interested in you. If you like them back, it's a match!</p>
            <p>Don't wait! 💜</p>
          </div>
          <div class="footer">
            <p>© 2025 Konfetti. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}