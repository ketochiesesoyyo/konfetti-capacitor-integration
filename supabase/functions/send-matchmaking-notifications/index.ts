import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://konfetti.app";
const UNSUBSCRIBE_URL = `${APP_URL}/auth`;

// Notification types that are ALWAYS sent (regardless of preferences)
const MANDATORY_NOTIFICATIONS = [
  "guest_matchmaking_open",
  "host_matchmaking_open",
];

// Notification types that respect user preferences
const OPTIONAL_NOTIFICATIONS = [
  "guest_24h_before_open",
  "guest_24h_before_close", 
  "guest_matchmaking_closed",
  "guest_profile_reminder",
  "host_24h_before_open",
  "host_24h_before_close",
  "host_matchmaking_closed",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate CRON_SECRET for security
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');

  if (!cronSecret || cronSecret !== expectedSecret) {
    console.error('[SECURITY] Unauthorized access attempt to send-matchmaking-notifications');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log('[AUTH] CRON_SECRET validated successfully');

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Running notification check at ${now.toISOString()}`);

    let totalSent = 0;

    // 1. Check for events where matchmaking opens tomorrow (24h before) - OPTIONAL
    const { data: events24hBeforeOpen } = await supabase
      .from("events")
      .select("*, profiles!events_created_by_fkey(name, user_id)")
      .eq("matchmaking_start_date", tomorrow)
      .eq("status", "active");

    if (events24hBeforeOpen && events24hBeforeOpen.length > 0) {
      console.log(`Found ${events24hBeforeOpen.length} events opening in 24h`);
      
      for (const event of events24hBeforeOpen) {
        // Send to guests (check preferences)
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("user_id, profiles!event_attendees_user_id_fkey(name, user_id, email_match_notifications)")
          .eq("event_id", event.id);

        for (const attendee of attendees || []) {
          // Check user preferences for optional notifications
          const profile = attendee.profiles?.[0];
          if (!profile?.email_match_notifications) {
            console.log(`[SKIP] User ${attendee.user_id} has email notifications disabled`);
            continue;
          }

          const alreadySent = await checkIfSent(supabase, event.id, attendee.user_id, "guest_24h_before_open");
          if (alreadySent) continue;

          const { data: authUser } = await supabase.auth.admin.getUserById(attendee.user_id);
          const userLang = authUser?.user?.user_metadata?.language || "en";

          const html = createGuest24hBeforeOpenEmail(
            profile?.name || 'Guest',
            event.name,
            event.profiles[0]?.name || 'Host',
            userLang,
            event.id
          );

          await sendEmail(resend, authUser?.user?.email!, html, event.name, userLang, "24h_before_open");
          await logNotification(supabase, event.id, attendee.user_id, "guest_24h_before_open");
          totalSent++;
        }

        // Send to host (check preferences)
        const { data: hostProfile } = await supabase
          .from("profiles")
          .select("email_match_notifications")
          .eq("user_id", event.created_by)
          .single();

        if (hostProfile?.email_match_notifications) {
          const alreadySentHost = await checkIfSent(supabase, event.id, event.created_by, "host_24h_before_open");
          if (!alreadySentHost) {
            const { data: hostAuthUser } = await supabase.auth.admin.getUserById(event.created_by);
            const hostLang = hostAuthUser?.user?.user_metadata?.language || "en";

            const html = createHost24hBeforeOpenEmail(
              event.profiles[0]?.name || 'Host',
              event.name,
              hostLang,
              event.id
            );

            await sendEmail(resend, hostAuthUser?.user?.email!, html, event.name, hostLang, "host_24h_before_open");
            await logNotification(supabase, event.id, event.created_by, "host_24h_before_open");
            totalSent++;
          }
        }
      }
    }

    // 2. Check for events where matchmaking opens today - MANDATORY (always sent)
    const { data: eventsOpeningToday } = await supabase
      .from("events")
      .select("*, profiles!events_created_by_fkey(name, user_id)")
      .eq("matchmaking_start_date", today)
      .eq("status", "active");

    if (eventsOpeningToday && eventsOpeningToday.length > 0) {
      console.log(`Found ${eventsOpeningToday.length} events opening today (MANDATORY notifications)`);
      
      for (const event of eventsOpeningToday) {
        // Send to guests - ALWAYS (regardless of preferences)
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("user_id, profiles!event_attendees_user_id_fkey(name, user_id)")
          .eq("event_id", event.id);

        for (const attendee of attendees || []) {
          const alreadySent = await checkIfSent(supabase, event.id, attendee.user_id, "guest_matchmaking_open");
          if (alreadySent) continue;

          const { data: authUser } = await supabase.auth.admin.getUserById(attendee.user_id);
          const userLang = authUser?.user?.user_metadata?.language || "en";

          const html = createGuestMatchmakingOpenEmail(
            attendee.profiles[0]?.name || 'Guest',
            event.name,
            event.profiles[0]?.name || 'Host',
            userLang,
            event.id
          );

          await sendEmail(resend, authUser?.user?.email!, html, event.name, userLang, "matchmaking_open");
          await logNotification(supabase, event.id, attendee.user_id, "guest_matchmaking_open");
          totalSent++;
        }

        // Send to host - ALWAYS
        const alreadySentHost = await checkIfSent(supabase, event.id, event.created_by, "host_matchmaking_open");
        if (!alreadySentHost) {
          const { data: hostAuthUser } = await supabase.auth.admin.getUserById(event.created_by);
          const hostLang = hostAuthUser?.user?.user_metadata?.language || "en";

          const html = createHostMatchmakingOpenEmail(
            event.profiles[0]?.name || 'Host',
            event.name,
            hostLang,
            event.id
          );

          await sendEmail(resend, hostAuthUser?.user?.email!, html, event.name, hostLang, "host_matchmaking_open");
          await logNotification(supabase, event.id, event.created_by, "host_matchmaking_open");
          totalSent++;
        }
      }
    }

    // 3. Check for events closing tomorrow (24h before) - OPTIONAL
    const { data: eventsClosingTomorrow } = await supabase
      .from("events")
      .select("*, profiles!events_created_by_fkey(name, user_id)")
      .eq("matchmaking_close_date", tomorrow)
      .eq("status", "active");

    if (eventsClosingTomorrow && eventsClosingTomorrow.length > 0) {
      console.log(`Found ${eventsClosingTomorrow.length} events closing in 24h`);
      
      for (const event of eventsClosingTomorrow) {
        // Send to guests (check preferences)
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("user_id, profiles!event_attendees_user_id_fkey(name, user_id, email_match_notifications)")
          .eq("event_id", event.id);

        for (const attendee of attendees || []) {
          const profile = attendee.profiles?.[0];
          if (!profile?.email_match_notifications) {
            console.log(`[SKIP] User ${attendee.user_id} has email notifications disabled`);
            continue;
          }

          const alreadySent = await checkIfSent(supabase, event.id, attendee.user_id, "guest_24h_before_close");
          if (alreadySent) continue;

          const { data: authUser } = await supabase.auth.admin.getUserById(attendee.user_id);
          const userLang = authUser?.user?.user_metadata?.language || "en";

          const html = createGuest24hBeforeCloseEmail(
            profile?.name || 'Guest',
            event.name,
            event.profiles[0]?.name || 'Host',
            userLang,
            event.id
          );

          await sendEmail(resend, authUser?.user?.email!, html, event.name, userLang, "24h_before_close");
          await logNotification(supabase, event.id, attendee.user_id, "guest_24h_before_close");
          totalSent++;
        }

        // Send to host (check preferences)
        const { data: hostProfile } = await supabase
          .from("profiles")
          .select("email_match_notifications")
          .eq("user_id", event.created_by)
          .single();

        if (hostProfile?.email_match_notifications) {
          const alreadySentHost = await checkIfSent(supabase, event.id, event.created_by, "host_24h_before_close");
          if (!alreadySentHost) {
            const { data: hostAuthUser } = await supabase.auth.admin.getUserById(event.created_by);
            const hostLang = hostAuthUser?.user?.user_metadata?.language || "en";

            const html = createHost24hBeforeCloseEmail(
              event.profiles[0]?.name || 'Host',
              event.name,
              hostLang,
              event.id
            );

            await sendEmail(resend, hostAuthUser?.user?.email!, html, event.name, hostLang, "host_24h_before_close");
            await logNotification(supabase, event.id, event.created_by, "host_24h_before_close");
            totalSent++;
          }
        }
      }
    }

    // 4. Check for events closing today - OPTIONAL
    const { data: eventsClosingToday } = await supabase
      .from("events")
      .select("*, profiles!events_created_by_fkey(name, user_id)")
      .eq("matchmaking_close_date", today)
      .eq("status", "active");

    if (eventsClosingToday && eventsClosingToday.length > 0) {
      console.log(`Found ${eventsClosingToday.length} events closing today`);
      
      for (const event of eventsClosingToday) {
        // Send to guests (check preferences)
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("user_id, profiles!event_attendees_user_id_fkey(name, user_id, email_match_notifications)")
          .eq("event_id", event.id);

        for (const attendee of attendees || []) {
          const profile = attendee.profiles?.[0];
          if (!profile?.email_match_notifications) {
            console.log(`[SKIP] User ${attendee.user_id} has email notifications disabled`);
            continue;
          }

          const alreadySent = await checkIfSent(supabase, event.id, attendee.user_id, "guest_matchmaking_closed");
          if (alreadySent) continue;

          const { data: authUser } = await supabase.auth.admin.getUserById(attendee.user_id);
          const userLang = authUser?.user?.user_metadata?.language || "en";

          const html = createGuestMatchmakingClosedEmail(
            profile?.name || 'Guest',
            event.name,
            event.profiles[0]?.name || 'Host',
            userLang
          );

          await sendEmail(resend, authUser?.user?.email!, html, event.name, userLang, "matchmaking_closed");
          await logNotification(supabase, event.id, attendee.user_id, "guest_matchmaking_closed");
          totalSent++;
        }

        // Send to host (check preferences)
        const { data: hostProfile } = await supabase
          .from("profiles")
          .select("email_match_notifications")
          .eq("user_id", event.created_by)
          .single();

        if (hostProfile?.email_match_notifications) {
          const alreadySentHost = await checkIfSent(supabase, event.id, event.created_by, "host_matchmaking_closed");
          if (!alreadySentHost) {
            const { data: hostAuthUser } = await supabase.auth.admin.getUserById(event.created_by);
            const hostLang = hostAuthUser?.user?.user_metadata?.language || "en";

            const html = createHostMatchmakingClosedEmail(
              event.profiles[0]?.name || 'Host',
              event.name,
              hostLang
            );

            await sendEmail(resend, hostAuthUser?.user?.email!, html, event.name, hostLang, "host_matchmaking_closed");
            await logNotification(supabase, event.id, event.created_by, "host_matchmaking_closed");
            totalSent++;
          }
        }

        // Update event status to closed
        await supabase
          .from("events")
          .update({ status: "closed" })
          .eq("id", event.id);
      }
    }

    // 5. Profile completion reminders - OPTIONAL
    // Check for users who joined events but haven't completed their profile
    // Send reminder 3 days before matchmaking opens
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: eventsOpeningIn3Days } = await supabase
      .from("events")
      .select("*, profiles!events_created_by_fkey(name, user_id)")
      .eq("matchmaking_start_date", threeDaysFromNow)
      .eq("status", "active");

    if (eventsOpeningIn3Days && eventsOpeningIn3Days.length > 0) {
      console.log(`Found ${eventsOpeningIn3Days.length} events opening in 3 days - checking for incomplete profiles`);
      
      for (const event of eventsOpeningIn3Days) {
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("user_id, profiles!event_attendees_user_id_fkey(name, user_id, photos, gender, interested_in, email_match_notifications)")
          .eq("event_id", event.id);

        for (const attendee of attendees || []) {
          const profile = attendee.profiles?.[0];
          
          // Check if profile is incomplete (no photos, gender, or interested_in)
          const isIncomplete = !profile?.photos?.length || !profile?.gender || !profile?.interested_in;
          
          if (!isIncomplete) continue;
          
          // Check preferences
          if (!profile?.email_match_notifications) {
            console.log(`[SKIP] User ${attendee.user_id} has email notifications disabled`);
            continue;
          }

          const alreadySent = await checkIfSent(supabase, event.id, attendee.user_id, "guest_profile_reminder");
          if (alreadySent) continue;

          const { data: authUser } = await supabase.auth.admin.getUserById(attendee.user_id);
          const userLang = authUser?.user?.user_metadata?.language || "en";

          const html = createProfileReminderEmail(
            profile?.name || 'Guest',
            event.name,
            event.profiles[0]?.name || 'Host',
            userLang
          );

          await sendEmail(resend, authUser?.user?.email!, html, event.name, userLang, "profile_reminder");
          await logNotification(supabase, event.id, attendee.user_id, "guest_profile_reminder");
          totalSent++;
        }
      }
    }

    console.log(`Notification job complete. Sent ${totalSent} emails.`);

    return new Response(
      JSON.stringify({ success: true, emailsSent: totalSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    // Log full details server-side only
    console.error("[NOTIFICATIONS] Error:", error.message, error.stack);
    
    // Return generic message to client to prevent information leakage
    return new Response(
      JSON.stringify({ 
        error: "Unable to send notifications. Please try again later." 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function checkIfSent(supabase: any, eventId: string, userId: string, notificationType: string): Promise<boolean> {
  const { data } = await supabase
    .from("notification_logs")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("notification_type", notificationType)
    .maybeSingle();
  
  return !!data;
}

async function logNotification(supabase: any, eventId: string, userId: string, notificationType: string) {
  await supabase
    .from("notification_logs")
    .insert({
      event_id: eventId,
      user_id: userId,
      notification_type: notificationType,
    });
}

async function sendEmail(
  resend: any,
  to: string,
  html: string,
  eventName: string,
  language: string,
  type: string
) {
  const subjects: Record<string, Record<string, string>> = {
    "24h_before_open": {
      en: `⏰ 24 hours left! Your ${eventName} matchmaking opens soon on konfetti.app`,
      es: `⏰ ¡Faltan 24 horas! Tu matchmaking de ${eventName} abre pronto en konfetti.app`,
    },
    "matchmaking_open": {
      en: `💫 It's time! Matchmaking for ${eventName} is now open on konfetti.app`,
      es: `💫 ¡Es hora! El matchmaking de ${eventName} ya está abierto en konfetti.app`,
    },
    "24h_before_close": {
      en: `⏰ Last chance to match before ${eventName}!`,
      es: `⏰ ¡Última oportunidad para hacer match antes de ${eventName}!`,
    },
    "matchmaking_closed": {
      en: `💫 Matchmaking for ${eventName} has closed — thank you for joining!`,
      es: `💫 El matchmaking de ${eventName} ha cerrado — ¡gracias por participar!`,
    },
    "host_24h_before_open": {
      en: `⏰ Reminder: matchmaking for ${eventName} opens in 24 hours`,
      es: `⏰ Recordatorio: el matchmaking de ${eventName} abrirá en 24 horas`,
    },
    "host_matchmaking_open": {
      en: `💫 It's live! Guests can now start matching for ${eventName}`,
      es: `💫 ¡Ya está activo! Los invitados ya pueden comenzar a hacer match en ${eventName}`,
    },
    "host_24h_before_close": {
      en: `⏰ Reminder: matchmaking for ${eventName} closes in 24 hours`,
      es: `⏰ Recordatorio: el matchmaking de ${eventName} cierra en 24 horas`,
    },
    "host_matchmaking_closed": {
      en: `💫 Matchmaking for ${eventName} is now closed — thank you for hosting with konfetti.app`,
      es: `💫 El matchmaking de ${eventName} ha cerrado — gracias por organizar con konfetti.app`,
    },
    "profile_reminder": {
      en: `📸 Complete your profile before ${eventName} matchmaking opens!`,
      es: `📸 ¡Completa tu perfil antes de que abra el matchmaking de ${eventName}!`,
    },
  };

  const subjectLine = subjects[type]?.[language] || subjects[type]?.["en"] || `Update for ${eventName}`;
  
  await resend.emails.send({
    from: "konfetti.app <hello@konfetti.app>",
    to: [to],
    subject: subjectLine,
    html,
  });
}

// Profile completion reminder email template
function createProfileReminderEmail(guestName: string, eventName: string, hostName: string, lang: string): string {
  const content = lang === "es" ? {
    heading: `¡Completa tu perfil antes de que abra el matchmaking de ${eventName}!`,
    p1: `El matchmaking para ${eventName} abrirá en solo 3 días, pero hemos notado que tu perfil aún no está completo.`,
    p2: `Para que otros invitados puedan encontrarte y conectar contigo, asegúrate de:`,
    item1: `Subir al menos una foto`,
    item2: `Seleccionar tu género`,
    item3: `Indicar en quién estás interesado/a`,
    p3: `¡Un perfil completo aumenta significativamente tus posibilidades de hacer matches increíbles!`,
    cta: `Completar Mi Perfil`,
    closing: `Nos vemos pronto,`,
    signature: `${hostName} y konfetti.app`,
    unsubscribe: `¿No quieres recibir estos correos?`,
    unsubscribeLink: `Administrar preferencias`,
  } : {
    heading: `Complete your profile before ${eventName} matchmaking opens!`,
    p1: `Matchmaking for ${eventName} opens in just 3 days, but we noticed your profile isn't complete yet.`,
    p2: `To help other guests find and connect with you, make sure to:`,
    item1: `Upload at least one photo`,
    item2: `Select your gender`,
    item3: `Choose who you're interested in`,
    p3: `A complete profile significantly increases your chances of making amazing matches!`,
    cta: `Complete My Profile`,
    closing: `See you soon,`,
    signature: `${hostName} & konfetti.app`,
    unsubscribe: `Don't want these emails?`,
    unsubscribeLink: `Manage preferences`,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">📸 ${content.heading}</h1>
      <p style="margin-bottom: 16px;">Hi ${guestName},</p>
      <p style="margin-bottom: 16px;">${content.p1}</p>
      <p style="margin-bottom: 8px;">${content.p2}</p>
      <ul style="margin-bottom: 16px; padding-left: 20px;">
        <li style="margin-bottom: 4px;">${content.item1}</li>
        <li style="margin-bottom: 4px;">${content.item2}</li>
        <li style="margin-bottom: 4px;">${content.item3}</li>
      </ul>
      <p style="margin-bottom: 24px;">${content.p3}</p>
      <a href="https://konfetti.app/edit-profile" style="display: inline-block; background-color: #9b87f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 24px;">${content.cta}</a>
      <p style="margin-bottom: 8px;">${content.closing}</p>
      <p style="color: #666; font-size: 14px;">${content.signature}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        ${content.unsubscribe} <a href="https://konfetti.app/auth" style="color: #9b87f5;">${content.unsubscribeLink}</a>
      </p>
    </body>
    </html>
  `;
}

// Helper function to create unsubscribe footer
function createUnsubscribeFooter(lang: string, isMandatory: boolean = false): string {
  const content = lang === "es" ? {
    unsubscribe: isMandatory 
      ? "Este es un correo importante sobre tu evento. Para administrar otras notificaciones:"
      : "¿No quieres recibir estos correos?",
    link: "Administrar preferencias",
  } : {
    unsubscribe: isMandatory 
      ? "This is an important email about your event. To manage other notifications:"
      : "Don't want these emails?",
    link: "Manage preferences",
  };

  return `
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">
      ${content.unsubscribe} <a href="https://konfetti.app/auth" style="color: #9b87f5;">${content.link}</a>
    </p>
  `;
}

// HTML Email Templates
function createGuest24hBeforeOpenEmail(guestName: string, eventName: string, hostName: string, lang: string, eventId: string): string {
  const content = lang === "es" ? {
    heading: `¡Faltan 24 horas! Tu matchmaking de ${eventName} abre pronto en konfetti.app`,
    p1: `¡Ya casi es hora! El matchmaking para ${eventName} abrirá en solo 24 horas.`,
    p2: `Prepárate para conocer a otros invitados increíbles y comenzar a conectar.`,
    p3: `Cuando llegue el momento, solo entra a konfetti.app para unirte a la diversión.`,
    cta: `Ir a konfetti.app`,
    closing: `Nos vemos pronto,`,
    signature: `${hostName} y konfetti.app`,
  } : {
    heading: `24 hours left! Your ${eventName} matchmaking opens soon on konfetti.app`,
    p1: `The wait is almost over — matchmaking for ${eventName} opens in just 24 hours!`,
    p2: `Get ready to meet other amazing guests and start connecting.`,
    p3: `When the time comes, simply log in to konfetti.app to join the fun.`,
    cta: `Go to konfetti.app`,
    closing: `See you soon,`,
    signature: `${hostName} & konfetti.app`,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">⏰ ${content.heading}</h1>
      <p style="margin-bottom: 16px;">Hi ${guestName},</p>
      <p style="margin-bottom: 16px;">${content.p1}</p>
      <p style="margin-bottom: 16px;">${content.p2}</p>
      <p style="margin-bottom: 24px;">${content.p3}</p>
      <a href="https://konfetti.app/matchmaking?event=${eventId}" style="display: inline-block; background-color: #9b87f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 24px;">${content.cta}</a>
      <p style="margin-bottom: 8px;">${content.closing}</p>
      <p style="color: #666; font-size: 14px;">${content.signature}</p>
      ${createUnsubscribeFooter(lang)}
    </body>
    </html>
  `;
}

function createGuestMatchmakingOpenEmail(guestName: string, eventName: string, hostName: string, lang: string, eventId: string): string {
  const content = lang === "es" ? {
    heading: `¡Es hora! El matchmaking de ${eventName} ya está abierto en konfetti.app`,
    p1: `¡El matchmaking para ${eventName} está oficialmente abierto!`,
    p2: `Empieza a descubrir quiénes asistirán y encuentra tu match perfecto antes del evento.`,
    p3: `Entra ahora a konfetti.app y deja que comience la magia.`,
    cta: `Empezar a Hacer Match`,
    closing: `Con cariño,`,
    signature: `${hostName} y konfetti.app`,
  } : {
    heading: `It's time! Matchmaking for ${eventName} is now open on konfetti.app`,
    p1: `The matchmaking for ${eventName} is officially open!`,
    p2: `Start discovering who's attending and find your perfect match before the event begins.`,
    p3: `Join now on konfetti.app and let the magic begin!`,
    cta: `Start Matching Now`,
    closing: `Warm wishes,`,
    signature: `${hostName} & konfetti.app`,
  };

  // This is a MANDATORY email, so we use different footer text
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">💫 ${content.heading}</h1>
      <p style="margin-bottom: 16px;">Hi ${guestName},</p>
      <p style="margin-bottom: 16px;">${content.p1}</p>
      <p style="margin-bottom: 16px;">${content.p2}</p>
      <p style="margin-bottom: 24px;">${content.p3}</p>
      <a href="https://konfetti.app/matchmaking?event=${eventId}" style="display: inline-block; background-color: #9b87f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 24px;">${content.cta}</a>
      <p style="margin-bottom: 8px;">${content.closing}</p>
      <p style="color: #666; font-size: 14px;">${content.signature}</p>
      ${createUnsubscribeFooter(lang, true)}
    </body>
    </html>
  `;
}

function createGuest24hBeforeCloseEmail(guestName: string, eventName: string, hostName: string, lang: string, eventId: string): string {
  const content = lang === "es" ? {
    heading: `¡Última oportunidad para hacer match antes de ${eventName}!`,
    p1: `Tu matchmaking para ${eventName} cerrará en 24 horas — ¡es tu última oportunidad para conectar antes del gran día!`,
    p2: `Revisa tus matches, envía tus últimos mensajes o descubre si hay alguien nuevo que te gustaría conocer.`,
    p3: `Entra ahora a konfetti.app y aprovecha al máximo esta oportunidad.`,
    cta: `Ir al Matchmaking`,
    closing: `¡Nos vemos en el evento!`,
    signature: `${hostName} y konfetti.app`,
  } : {
    heading: `Last chance to match before ${eventName}!`,
    p1: `Your matchmaking for ${eventName} will close in 24 hours — this is your final chance to connect before the big day!`,
    p2: `Check your matches, send your last messages, or see if there's someone new you'd like to meet.`,
    p3: `Join now on konfetti.app and make the most of it!`,
    cta: `Go to Matchmaking`,
    closing: `See you at the event,`,
    signature: `${hostName} & konfetti.app`,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">⏰ ${content.heading}</h1>
      <p style="margin-bottom: 16px;">Hi ${guestName},</p>
      <p style="margin-bottom: 16px;">${content.p1}</p>
      <p style="margin-bottom: 16px;">${content.p2}</p>
      <p style="margin-bottom: 24px;">${content.p3}</p>
      <a href="https://konfetti.app/matchmaking?event=${eventId}" style="display: inline-block; background-color: #9b87f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 24px;">${content.cta}</a>
      <p style="margin-bottom: 8px;">${content.closing}</p>
      <p style="color: #666; font-size: 14px;">${content.signature}</p>
      ${createUnsubscribeFooter(lang)}
    </body>
    </html>
  `;
}

function createGuestMatchmakingClosedEmail(guestName: string, eventName: string, hostName: string, lang: string): string {
  const content = lang === "es" ? {
    heading: `El matchmaking de ${eventName} ha cerrado — ¡gracias por participar!`,
    p1: `El matchmaking para ${eventName} ha cerrado.`,
    p2: `Esperamos que hayas disfrutado de conocer nuevas personas y crear conexiones antes de la celebración.`,
    p3: `Aún puedes ver tus matches anteriores desde tu perfil, y estaremos aquí para que tus próximos eventos sean igual de emocionantes.`,
    closing: `Gracias por ser parte de konfetti.app, donde cada evento comienza con una chispa.`,
    signature: `Con cariño, ${hostName} y konfetti.app`,
  } : {
    heading: `Matchmaking for ${eventName} has closed — thank you for joining!`,
    p1: `The matchmaking for ${eventName} is now closed.`,
    p2: `We hope you enjoyed discovering new people and making connections ahead of the celebration.`,
    p3: `You can still access your past matches from your profile, and we'll be here to help you make future events just as exciting.`,
    closing: `Thanks for being part of konfetti.app — where every event starts with a spark.`,
    signature: `With love, ${hostName} & konfetti.app`,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">💫 ${content.heading}</h1>
      <p style="margin-bottom: 16px;">Hi ${guestName},</p>
      <p style="margin-bottom: 16px;">${content.p1}</p>
      <p style="margin-bottom: 16px;">${content.p2}</p>
      <p style="margin-bottom: 16px;">${content.p3}</p>
      <p style="margin-bottom: 16px;">${content.closing}</p>
      <p style="color: #666; font-size: 14px;">${content.signature}</p>
      ${createUnsubscribeFooter(lang)}
    </body>
    </html>
  `;
}

function createHost24hBeforeOpenEmail(hostName: string, eventName: string, lang: string, eventId: string): string {
  const content = lang === "es" ? {
    heading: `Recordatorio: el matchmaking de ${eventName} abrirá en 24 horas`,
    p1: `Este es un recordatorio amistoso de que el matchmaking para tu evento ${eventName} abrirá en 24 horas.`,
    p2: `Puedes iniciar sesión en konfetti.app para hacer ajustes de último momento o simplemente ver cómo tus invitados se preparan para conectar.`,
    cta: `Ver Panel`,
    closing: `Saludos,`,
    team: `El equipo de konfetti.app`,
  } : {
    heading: `Reminder: matchmaking for ${eventName} opens in 24 hours`,
    p1: `This is a friendly reminder that matchmaking for your event ${eventName} opens in 24 hours.`,
    p2: `You can log in to konfetti.app to make any last-minute edits or simply watch your guests get ready to mingle.`,
    cta: `View Dashboard`,
    closing: `Cheers,`,
    team: `The konfetti.app team`,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">⏰ ${content.heading}</h1>
      <p style="margin-bottom: 16px;">Hi ${hostName},</p>
      <p style="margin-bottom: 16px;">${content.p1}</p>
      <p style="margin-bottom: 24px;">${content.p2}</p>
      <a href="https://konfetti.app/event-dashboard/${eventId}" style="display: inline-block; background-color: #9b87f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 24px;">${content.cta}</a>
      <p style="margin-bottom: 8px;">${content.closing}</p>
      <p style="color: #666; font-size: 14px;">${content.team}</p>
      ${createUnsubscribeFooter(lang)}
    </body>
    </html>
  `;
}

function createHostMatchmakingOpenEmail(hostName: string, eventName: string, lang: string, eventId: string): string {
  const content = lang === "es" ? {
    heading: `¡Ya está activo! Los invitados ya pueden comenzar a hacer match en ${eventName}`,
    p1: `¡El matchmaking para tu evento ${eventName} ya está abierto!`,
    p2: `Tus invitados ya pueden explorar perfiles, deslizar y comenzar a conectar antes del gran día.`,
    p3: `Puedes monitorear la participación o revisar la actividad desde tu panel de anfitrión en konfetti.app.`,
    cta: `Ver Panel`,
    closing: `Gracias nuevamente por confiar en nosotros,`,
    team: `El equipo de konfetti.app`,
  } : {
    heading: `It's live! Guests can now start matching for ${eventName}`,
    p1: `The matchmaking for your event ${eventName} is now open!`,
    p2: `Your guests can now explore profiles, swipe, and start connecting before the big day.`,
    p3: `You can monitor engagement or check activity from your host dashboard on konfetti.app.`,
    cta: `View Dashboard`,
    closing: `Thanks again for hosting with us!`,
    team: `The konfetti.app team`,
  };

  // This is a MANDATORY email for hosts
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">💫 ${content.heading}</h1>
      <p style="margin-bottom: 16px;">Hi ${hostName},</p>
      <p style="margin-bottom: 16px;">${content.p1}</p>
      <p style="margin-bottom: 16px;">${content.p2}</p>
      <p style="margin-bottom: 24px;">${content.p3}</p>
      <a href="https://konfetti.app/event-dashboard/${eventId}" style="display: inline-block; background-color: #9b87f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 24px;">${content.cta}</a>
      <p style="margin-bottom: 8px;">${content.closing}</p>
      <p style="color: #666; font-size: 14px;">${content.team}</p>
      ${createUnsubscribeFooter(lang, true)}
    </body>
    </html>
  `;
}

function createHost24hBeforeCloseEmail(hostName: string, eventName: string, lang: string, eventId: string): string {
  const content = lang === "es" ? {
    heading: `Recordatorio: el matchmaking de ${eventName} cierra en 24 horas`,
    p1: `El matchmaking de ${eventName} cerrará en 24 horas.`,
    p2: `Tus invitados aún tienen tiempo para enviar sus últimos mensajes y matches antes del evento.`,
    p3: `Puedes revisar tu panel en konfetti.app para ver la participación y actividad de los invitados.`,
    cta: `Ver Panel`,
    closing: `Saludos,`,
    team: `El equipo de konfetti.app`,
  } : {
    heading: `Reminder: matchmaking for ${eventName} closes in 24 hours`,
    p1: `Matchmaking for ${eventName} will close in 24 hours.`,
    p2: `Your guests still have time to send their final messages and matches before the event begins.`,
    p3: `You can check your dashboard on konfetti.app to view engagement and see how active your guests have been.`,
    cta: `View Dashboard`,
    closing: `Best,`,
    team: `The konfetti.app team`,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">⏰ ${content.heading}</h1>
      <p style="margin-bottom: 16px;">Hi ${hostName},</p>
      <p style="margin-bottom: 16px;">${content.p1}</p>
      <p style="margin-bottom: 16px;">${content.p2}</p>
      <p style="margin-bottom: 24px;">${content.p3}</p>
      <a href="https://konfetti.app/event-dashboard/${eventId}" style="display: inline-block; background-color: #9b87f5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 24px;">${content.cta}</a>
      <p style="margin-bottom: 8px;">${content.closing}</p>
      <p style="color: #666; font-size: 14px;">${content.team}</p>
      ${createUnsubscribeFooter(lang)}
    </body>
    </html>
  `;
}

function createHostMatchmakingClosedEmail(hostName: string, eventName: string, lang: string): string {
  const content = lang === "es" ? {
    heading: `El matchmaking de ${eventName} ha cerrado — gracias por organizar con konfetti.app`,
    p1: `El matchmaking para ${eventName} ha cerrado oficialmente.`,
    p2: `Esperamos que tus invitados hayan disfrutado de conectar antes del gran día y que konfetti.app haya hecho tu evento aún más especial.`,
    closing: `Gracias por confiar en nosotros para ser parte de tu celebración. Esperamos ayudarte a organizar tu próximo evento inolvidable.`,
    signature: `Gracias por tu confianza! El equipo de konfetti.app`,
  } : {
    heading: `Matchmaking for ${eventName} is now closed — thank you for hosting with konfetti.app`,
    p1: `The matchmaking for ${eventName} has officially closed.`,
    p2: `We hope your guests had fun connecting before the big day and that konfetti.app helped make your event even more special.`,
    closing: `Thank you for trusting us to be part of your celebration. We look forward to helping you host your next unforgettable event.`,
    signature: `With gratitude, The konfetti.app team`,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">💫 ${content.heading}</h1>
      <p style="margin-bottom: 16px;">Hi ${hostName},</p>
      <p style="margin-bottom: 16px;">${content.p1}</p>
      <p style="margin-bottom: 16px;">${content.p2}</p>
      <p style="margin-bottom: 16px;">${content.closing}</p>
      <p style="color: #666; font-size: 14px;">${content.signature}</p>
      ${createUnsubscribeFooter(lang)}
    </body>
    </html>
  `;
}
