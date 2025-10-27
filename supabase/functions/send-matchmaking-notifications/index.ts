import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@4.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { GuestWelcomeEmail } from "./_templates/guest-welcome.tsx";
import { Guest24hBeforeOpenEmail } from "./_templates/guest-24h-before-open.tsx";
import { GuestMatchmakingOpenEmail } from "./_templates/guest-matchmaking-open.tsx";
import { Guest24hBeforeCloseEmail } from "./_templates/guest-24h-before-close.tsx";
import { GuestMatchmakingClosedEmail } from "./_templates/guest-matchmaking-closed.tsx";
import { HostEventLiveEmail } from "./_templates/host-event-live.tsx";
import { Host24hBeforeOpenEmail } from "./_templates/host-24h-before-open.tsx";
import { HostMatchmakingOpenEmail } from "./_templates/host-matchmaking-open.tsx";
import { Host24hBeforeCloseEmail } from "./_templates/host-24h-before-close.tsx";
import { HostMatchmakingClosedEmail } from "./_templates/host-matchmaking-closed.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // 1. Check for events where matchmaking opens tomorrow (24h before)
    const { data: events24hBeforeOpen } = await supabase
      .from("events")
      .select("*, profiles!events_created_by_fkey(name, user_id)")
      .eq("matchmaking_start_date", tomorrow)
      .eq("status", "active");

    if (events24hBeforeOpen && events24hBeforeOpen.length > 0) {
      console.log(`Found ${events24hBeforeOpen.length} events opening in 24h`);
      
      for (const event of events24hBeforeOpen) {
        // Send to guests
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("user_id, profiles!event_attendees_user_id_fkey(name, user_id)")
          .eq("event_id", event.id);

        for (const attendee of attendees || []) {
          const alreadySent = await checkIfSent(supabase, event.id, attendee.user_id, "guest_24h_before_open");
          if (alreadySent) continue;

          const { data: authUser } = await supabase.auth.admin.getUserById(attendee.user_id);
          const userLang = authUser?.user?.user_metadata?.language || "en";

          const html = await renderAsync(
            React.createElement(Guest24hBeforeOpenEmail, {
              guestName: attendee.profiles.name,
              eventName: event.name,
              hostName: event.profiles.name,
              language: userLang,
              eventId: event.id,
            })
          );

          await sendEmail(resend, authUser?.user?.email!, html, event.name, userLang, "24h_before_open");
          await logNotification(supabase, event.id, attendee.user_id, "guest_24h_before_open");
          totalSent++;
        }

        // Send to host
        const alreadySentHost = await checkIfSent(supabase, event.id, event.created_by, "host_24h_before_open");
        if (!alreadySentHost) {
          const { data: hostAuthUser } = await supabase.auth.admin.getUserById(event.created_by);
          const hostLang = hostAuthUser?.user?.user_metadata?.language || "en";

          const html = await renderAsync(
            React.createElement(Host24hBeforeOpenEmail, {
              hostName: event.profiles.name,
              eventName: event.name,
              language: hostLang,
              eventId: event.id,
            })
          );

          await sendEmail(resend, hostAuthUser?.user?.email!, html, event.name, hostLang, "host_24h_before_open");
          await logNotification(supabase, event.id, event.created_by, "host_24h_before_open");
          totalSent++;
        }
      }
    }

    // 2. Check for events where matchmaking opens today
    const { data: eventsOpeningToday } = await supabase
      .from("events")
      .select("*, profiles!events_created_by_fkey(name, user_id)")
      .eq("matchmaking_start_date", today)
      .eq("status", "active");

    if (eventsOpeningToday && eventsOpeningToday.length > 0) {
      console.log(`Found ${eventsOpeningToday.length} events opening today`);
      
      for (const event of eventsOpeningToday) {
        // Send to guests
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("user_id, profiles!event_attendees_user_id_fkey(name, user_id)")
          .eq("event_id", event.id);

        for (const attendee of attendees || []) {
          const alreadySent = await checkIfSent(supabase, event.id, attendee.user_id, "guest_matchmaking_open");
          if (alreadySent) continue;

          const { data: authUser } = await supabase.auth.admin.getUserById(attendee.user_id);
          const userLang = authUser?.user?.user_metadata?.language || "en";

          const html = await renderAsync(
            React.createElement(GuestMatchmakingOpenEmail, {
              guestName: attendee.profiles.name,
              eventName: event.name,
              hostName: event.profiles.name,
              language: userLang,
              eventId: event.id,
            })
          );

          await sendEmail(resend, authUser?.user?.email!, html, event.name, userLang, "matchmaking_open");
          await logNotification(supabase, event.id, attendee.user_id, "guest_matchmaking_open");
          totalSent++;
        }

        // Send to host
        const alreadySentHost = await checkIfSent(supabase, event.id, event.created_by, "host_matchmaking_open");
        if (!alreadySentHost) {
          const { data: hostAuthUser } = await supabase.auth.admin.getUserById(event.created_by);
          const hostLang = hostAuthUser?.user?.user_metadata?.language || "en";

          const html = await renderAsync(
            React.createElement(HostMatchmakingOpenEmail, {
              hostName: event.profiles.name,
              eventName: event.name,
              language: hostLang,
              eventId: event.id,
            })
          );

          await sendEmail(resend, hostAuthUser?.user?.email!, html, event.name, hostLang, "host_matchmaking_open");
          await logNotification(supabase, event.id, event.created_by, "host_matchmaking_open");
          totalSent++;
        }
      }
    }

    // 3. Check for events closing tomorrow (24h before)
    const { data: eventsClosingTomorrow } = await supabase
      .from("events")
      .select("*, profiles!events_created_by_fkey(name, user_id)")
      .eq("matchmaking_close_date", tomorrow)
      .eq("status", "active");

    if (eventsClosingTomorrow && eventsClosingTomorrow.length > 0) {
      console.log(`Found ${eventsClosingTomorrow.length} events closing in 24h`);
      
      for (const event of eventsClosingTomorrow) {
        // Send to guests
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("user_id, profiles!event_attendees_user_id_fkey(name, user_id)")
          .eq("event_id", event.id);

        for (const attendee of attendees || []) {
          const alreadySent = await checkIfSent(supabase, event.id, attendee.user_id, "guest_24h_before_close");
          if (alreadySent) continue;

          const { data: authUser } = await supabase.auth.admin.getUserById(attendee.user_id);
          const userLang = authUser?.user?.user_metadata?.language || "en";

          const html = await renderAsync(
            React.createElement(Guest24hBeforeCloseEmail, {
              guestName: attendee.profiles.name,
              eventName: event.name,
              hostName: event.profiles.name,
              language: userLang,
              eventId: event.id,
            })
          );

          await sendEmail(resend, authUser?.user?.email!, html, event.name, userLang, "24h_before_close");
          await logNotification(supabase, event.id, attendee.user_id, "guest_24h_before_close");
          totalSent++;
        }

        // Send to host
        const alreadySentHost = await checkIfSent(supabase, event.id, event.created_by, "host_24h_before_close");
        if (!alreadySentHost) {
          const { data: hostAuthUser } = await supabase.auth.admin.getUserById(event.created_by);
          const hostLang = hostAuthUser?.user?.user_metadata?.language || "en";

          const html = await renderAsync(
            React.createElement(Host24hBeforeCloseEmail, {
              hostName: event.profiles.name,
              eventName: event.name,
              language: hostLang,
              eventId: event.id,
            })
          );

          await sendEmail(resend, hostAuthUser?.user?.email!, html, event.name, hostLang, "host_24h_before_close");
          await logNotification(supabase, event.id, event.created_by, "host_24h_before_close");
          totalSent++;
        }
      }
    }

    // 4. Check for events closing today
    const { data: eventsClosingToday } = await supabase
      .from("events")
      .select("*, profiles!events_created_by_fkey(name, user_id)")
      .eq("matchmaking_close_date", today)
      .eq("status", "active");

    if (eventsClosingToday && eventsClosingToday.length > 0) {
      console.log(`Found ${eventsClosingToday.length} events closing today`);
      
      for (const event of eventsClosingToday) {
        // Send to guests
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("user_id, profiles!event_attendees_user_id_fkey(name, user_id)")
          .eq("event_id", event.id);

        for (const attendee of attendees || []) {
          const alreadySent = await checkIfSent(supabase, event.id, attendee.user_id, "guest_matchmaking_closed");
          if (alreadySent) continue;

          const { data: authUser } = await supabase.auth.admin.getUserById(attendee.user_id);
          const userLang = authUser?.user?.user_metadata?.language || "en";

          const html = await renderAsync(
            React.createElement(GuestMatchmakingClosedEmail, {
              guestName: attendee.profiles.name,
              eventName: event.name,
              hostName: event.profiles.name,
              language: userLang,
            })
          );

          await sendEmail(resend, authUser?.user?.email!, html, event.name, userLang, "matchmaking_closed");
          await logNotification(supabase, event.id, attendee.user_id, "guest_matchmaking_closed");
          totalSent++;
        }

        // Send to host
        const alreadySentHost = await checkIfSent(supabase, event.id, event.created_by, "host_matchmaking_closed");
        if (!alreadySentHost) {
          const { data: hostAuthUser } = await supabase.auth.admin.getUserById(event.created_by);
          const hostLang = hostAuthUser?.user?.user_metadata?.language || "en";

          const html = await renderAsync(
            React.createElement(HostMatchmakingClosedEmail, {
              hostName: event.profiles.name,
              eventName: event.name,
              language: hostLang,
            })
          );

          await sendEmail(resend, hostAuthUser?.user?.email!, html, event.name, hostLang, "host_matchmaking_closed");
          await logNotification(supabase, event.id, event.created_by, "host_matchmaking_closed");
          totalSent++;
        }

        // Update event status to closed
        await supabase
          .from("events")
          .update({ status: "closed" })
          .eq("id", event.id);
      }
    }

    console.log(`Notification job complete. Sent ${totalSent} emails.`);

    return new Response(
      JSON.stringify({ success: true, emailsSent: totalSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-matchmaking-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    .single();
  
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
  };

  await resend.emails.send({
    from: "konfetti.app <hello@konfetti.app>",
    to: [to],
    subject: subjects[type]?.[language] || subjects[type]?.["en"] || `Update for ${eventName}`,
    html,
  });
}
