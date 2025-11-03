import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NEW_MESSAGE_RATE_LIMIT_MINUTES = 30;

// Rate limiting check
async function canSendNewMessageEmail(
  supabaseAdmin: any,
  eventId: string,
  userId: string,
  notificationType: "guest_new_message" | "host_new_message",
  conversationId: string
): Promise<boolean> {
  const since = new Date(
    Date.now() - NEW_MESSAGE_RATE_LIMIT_MINUTES * 60 * 1000
  ).toISOString();

  const { data, error } = await supabaseAdmin
    .from("notification_logs")
    .select("id, created_at")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("notification_type", notificationType)
    .eq("conversation_id", conversationId)
    .gte("created_at", since)
    .limit(1);

  if (error) {
    console.error("[NEW_MESSAGE][RATE_LIMIT] Error checking logs:", error);
    return true;
  }

  const hasRecent = data && data.length > 0;
  return !hasRecent;
}

// Send email helper
async function sendEmail(
  resend: any,
  to: string,
  html: string,
  eventName: string,
  language: string,
  type: string
) {
  const subjects: Record<string, Record<string, string>> = {
    "new_message": {
      en: `📩 New message on konfetti.app for ${eventName}`,
      es: `📩 Nuevo mensaje en konfetti.app para ${eventName}`,
    },
    "host_new_message": {
      en: `📩 New message from a guest about ${eventName} on konfetti.app`,
      es: `📩 Nuevo mensaje de un invitado sobre ${eventName} en konfetti.app`,
    },
  };

  await resend.emails.send({
    from: "konfetti.app <hello@konfetti.app>",
    to: [to],
    subject: subjects[type]?.[language] || subjects[type]?.["en"] || `Update for ${eventName}`,
    html,
  });
}

// Guest new message email template
function createGuestNewMessageEmail(
  guestName: string,
  senderName: string,
  eventName: string,
  hostName: string,
  lang: string,
  conversationUrl: string
): string {
  const content = lang === "es"
    ? {
        heading: `Nuevo mensaje en konfetti.app para ${eventName}`,
        p1: `Acabas de recibir un nuevo mensaje sobre ${eventName} en konfetti.app.`,
        p2: `${senderName} te ha enviado un nuevo mensaje. Entra a la app para leerlo y responder.`,
        p3: `Haz clic en el botón de abajo para ir directo a tu conversación.`,
        cta: `Abrir tu conversación`,
        closing: `Hablamos pronto,`,
        signature: `${hostName} y konfetti.app`,
        greeting: `Hola ${guestName},`,
      }
    : {
        heading: `New message on konfetti.app for ${eventName}`,
        p1: `You've just received a new message about ${eventName} on konfetti.app.`,
        p2: `${senderName} has sent you a new message. Open the app to read it and reply.`,
        p3: `Tap the button below to go straight to your conversation.`,
        cta: `Open your conversation`,
        closing: `Talk to you soon,`,
        signature: `${hostName} & konfetti.app`,
        greeting: `Hi ${guestName},`,
      };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">📩 ${content.heading}</h1>
        <p style="margin-bottom: 16px;">${content.greeting}</p>
        <p style="margin-bottom: 16px;">${content.p1}</p>
        <p style="margin-bottom: 16px;">${content.p2}</p>
        <p style="margin-bottom: 24px;">${content.p3}</p>
        <a href="${conversationUrl}" style="display: inline-block; background-color: #9b87f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 24px;">
          ${content.cta}
        </a>
        <p style="margin-bottom: 8px;">${content.closing}</p>
        <p style="color: #666; font-size: 14px;">${content.signature}</p>
      </body>
    </html>
  `;
}

// Host new message email template
function createHostNewMessageEmail(
  hostName: string,
  senderName: string,
  eventName: string,
  lang: string,
  conversationUrl: string
): string {
  const content = lang === "es"
    ? {
        heading: `Nuevo mensaje de un invitado sobre ${eventName} en konfetti.app`,
        p1: `Has recibido un nuevo mensaje de ${senderName} sobre ${eventName} en konfetti.app.`,
        p2: `Entra a tu panel de anfitrión para leer el mensaje y darle seguimiento si es necesario.`,
        cta: `Ver mensaje`,
        closing: `Saludos,`,
        signature: `El equipo de konfetti.app`,
        greeting: `Hola ${hostName},`,
      }
    : {
        heading: `New message from a guest about ${eventName} on konfetti.app`,
        p1: `You've received a new message from ${senderName} about ${eventName} on konfetti.app.`,
        p2: `Open your host dashboard to read the message and follow up if needed.`,
        cta: `View message`,
        closing: `Best,`,
        signature: `The konfetti.app team`,
        greeting: `Hi ${hostName},`,
      };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">📩 ${content.heading}</h1>
        <p style="margin-bottom: 16px;">${content.greeting}</p>
        <p style="margin-bottom: 16px;">${content.p1}</p>
        <p style="margin-bottom: 24px;">${content.p2}</p>
        <a href="${conversationUrl}" style="display: inline-block; background-color: #9b87f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 24px;">
          ${content.cta}
        </a>
        <p style="margin-bottom: 8px;">${content.closing}</p>
        <p style="color: #666; font-size: 14px;">${content.signature}</p>
      </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { eventId, conversationId, senderId, recipientId } = await req.json();

    if (!eventId || !conversationId || !senderId || !recipientId) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: eventId, conversationId, senderId, recipientId",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Verify caller is the sender
    const {
      data: { user },
      error: authError,
    } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      console.error("[NEW_MESSAGE] auth.getUser error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (user.id !== senderId) {
      console.error(
        "[NEW_MESSAGE] User not allowed to send notifications for this senderId",
        { userId: user.id, senderId },
      );
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Load event + host profile
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, name, created_by")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      console.error("[NEW_MESSAGE] Unable to load event:", eventError);
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const hostId = event.created_by;

    // Load host profile
    const { data: hostProfile } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("user_id", hostId)
      .maybeSingle();

    const hostName = hostProfile?.name || "Host";

    // Load sender + recipient profiles
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name")
      .eq("user_id", senderId)
      .maybeSingle();

    const { data: recipientProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name")
      .eq("user_id", recipientId)
      .maybeSingle();

    const senderName = senderProfile?.name || "Guest";
    const recipientName = recipientProfile?.name || "Guest";

    // Load recipient auth user (email + language)
    const { data: recipientAuth, error: recipientAuthError } =
      await supabaseAdmin.auth.admin.getUserById(recipientId);

    if (recipientAuthError || !recipientAuth?.user) {
      console.error(
        "[NEW_MESSAGE] Unable to load recipient auth user:",
        recipientAuthError,
      );
      return new Response(
        JSON.stringify({ error: "Recipient user not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const recipientEmail = recipientAuth.user.email;
    const recipientLang = recipientAuth.user.user_metadata?.language || "en";

    // Load host auth (for host notification)
    const { data: hostAuth } = await supabaseAdmin.auth.admin.getUserById(
      hostId,
    );
    const hostEmail = hostAuth?.user?.email || null;
    const hostLang = hostAuth?.user?.user_metadata?.language || "en";

    // Build URLs
    const conversationUrl = `https://konfetti.app/chat/${conversationId}`;
    const hostMessageUrl = `https://konfetti.app/chats?tab=hosts&conversation=${conversationId}`;

    // Rate-limit and send email to recipient (guest)
    const canSendGuest = await canSendNewMessageEmail(
      supabaseAdmin,
      event.id,
      recipientId,
      "guest_new_message",
      conversationId
    );

    let guestEmailSent = false;

    if (canSendGuest) {
      const guestHtml = createGuestNewMessageEmail(
        recipientName,
        senderName,
        event.name,
        hostName,
        recipientLang,
        conversationUrl,
      );

      await sendEmail(
        resend,
        recipientEmail!,
        guestHtml,
        event.name,
        recipientLang,
        "new_message",
      );

      await supabaseAdmin.from("notification_logs").insert({
        event_id: event.id,
        user_id: recipientId,
        notification_type: "guest_new_message",
        conversation_id: conversationId,
      });

      guestEmailSent = true;
    } else {
      console.log("[NEW_MESSAGE][RATE_LIMIT] Skipping guest email", {
        eventId: event.id,
        conversationId,
        recipientId,
      });
    }

    // Optional: notify host if sender is not the host (also rate-limited)
    let hostEmailSent = false;

    if (hostEmail && hostId !== senderId) {
      const canSendHost = await canSendNewMessageEmail(
        supabaseAdmin,
        event.id,
        hostId,
        "host_new_message",
        conversationId
      );

      if (canSendHost) {
        const hostHtml = createHostNewMessageEmail(
          hostName,
          senderName,
          event.name,
          hostLang,
          hostMessageUrl,
        );

        await sendEmail(
          resend,
          hostEmail,
          hostHtml,
          event.name,
          hostLang,
          "host_new_message",
        );

        await supabaseAdmin.from("notification_logs").insert({
          event_id: event.id,
          user_id: hostId,
          notification_type: "host_new_message",
          conversation_id: conversationId,
        });

        hostEmailSent = true;
      } else {
        console.log("[NEW_MESSAGE][RATE_LIMIT] Skipping host email", {
          eventId: event.id,
          conversationId,
          hostId,
        });
      }
    }

    console.log("[NEW_MESSAGE] Notifications sent", {
      eventId,
      conversationId,
      senderId,
      recipientId,
      guestEmailSent,
      hostEmailSent,
    });

    return new Response(
      JSON.stringify({
        success: true,
        guestEmailSent,
        hostEmailSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[NEW_MESSAGE] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Unable to send new message notifications",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
