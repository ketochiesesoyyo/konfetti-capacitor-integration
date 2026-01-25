// Shared push notification utility for Supabase Edge Functions
// Supports APNs for iOS push notifications

import * as jose from "https://deno.land/x/jose@v4.15.4/index.ts";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface APNsConfig {
  keyId: string;
  teamId: string;
  privateKey: string;
  bundleId: string;
  production: boolean;
}

// Generate JWT for APNs authentication
async function generateAPNsToken(config: APNsConfig): Promise<string> {
  const privateKey = await jose.importPKCS8(config.privateKey, "ES256");

  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: config.keyId })
    .setIssuer(config.teamId)
    .setIssuedAt()
    .sign(privateKey);

  return jwt;
}

// Send push notification to a single device via APNs
async function sendToAPNs(
  deviceToken: string,
  payload: PushPayload,
  config: APNsConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await generateAPNsToken(config);
    const host = config.production
      ? "api.push.apple.com"
      : "api.sandbox.push.apple.com";

    const url = `https://${host}/3/device/${deviceToken}`;

    const apnsPayload = {
      aps: {
        alert: {
          title: payload.title,
          body: payload.body,
        },
        sound: "default",
        badge: 1,
      },
      ...payload.data,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "authorization": `bearer ${token}`,
        "apns-topic": config.bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      },
      body: JSON.stringify(apnsPayload),
    });

    if (response.status === 200) {
      return { success: true };
    } else {
      const errorBody = await response.text();
      console.error(`[PUSH] APNs error ${response.status}:`, errorBody);
      return { success: false, error: `APNs error: ${response.status}` };
    }
  } catch (error) {
    console.error("[PUSH] Error sending to APNs:", error);
    return { success: false, error: String(error) };
  }
}

// Main function to send push notifications to a user
export async function sendPushNotification(
  supabaseAdmin: any,
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  // Check if APNs is configured
  const apnsKeyId = Deno.env.get("APNS_KEY_ID");
  const apnsTeamId = Deno.env.get("APNS_TEAM_ID");
  const apnsPrivateKey = Deno.env.get("APNS_PRIVATE_KEY");
  const apnsBundleId = Deno.env.get("APNS_BUNDLE_ID") || "app.konfetti.mobile";
  const apnsProduction = Deno.env.get("APNS_PRODUCTION") === "true";

  if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
    console.log("[PUSH] APNs not configured, skipping push notification");
    return { sent: 0, failed: 0 };
  }

  // Get device tokens for the user
  const { data: tokens, error } = await supabaseAdmin
    .from("device_tokens")
    .select("token, platform")
    .eq("user_id", userId);

  if (error) {
    console.error("[PUSH] Error fetching device tokens:", error);
    return { sent: 0, failed: 0 };
  }

  if (!tokens || tokens.length === 0) {
    console.log("[PUSH] No device tokens found for user:", userId);
    return { sent: 0, failed: 0 };
  }

  const config: APNsConfig = {
    keyId: apnsKeyId,
    teamId: apnsTeamId,
    privateKey: apnsPrivateKey.replace(/\\n/g, "\n"), // Handle escaped newlines
    bundleId: apnsBundleId,
    production: apnsProduction,
  };

  let sent = 0;
  let failed = 0;

  for (const { token, platform } of tokens) {
    if (platform === "ios") {
      const result = await sendToAPNs(token, payload, config);
      if (result.success) {
        sent++;
      } else {
        failed++;
        // If token is invalid, remove it
        if (result.error?.includes("BadDeviceToken") || result.error?.includes("Unregistered")) {
          console.log("[PUSH] Removing invalid token:", token);
          await supabaseAdmin
            .from("device_tokens")
            .delete()
            .eq("token", token);
        }
      }
    }
    // TODO: Add FCM support for Android when needed
  }

  console.log(`[PUSH] Notifications sent: ${sent}, failed: ${failed}`);
  return { sent, failed };
}

// Convenience function for new message notification
export async function sendNewMessagePush(
  supabaseAdmin: any,
  recipientId: string,
  senderName: string,
  language: string,
  chatId?: string
): Promise<void> {
  const payload: PushPayload = {
    title: language === "es" ? "Nuevo mensaje" : "New message",
    body: language === "es"
      ? `${senderName} te envió un mensaje`
      : `${senderName} sent you a message`,
    data: {
      type: "message",
      chatId: chatId || "",
    },
  };

  await sendPushNotification(supabaseAdmin, recipientId, payload);
}

// Convenience function for like notification
export async function sendLikePush(
  supabaseAdmin: any,
  likedUserId: string,
  language: string
): Promise<void> {
  const payload: PushPayload = {
    title: language === "es" ? "💜 ¡Alguien te dio like!" : "💜 Someone liked you!",
    body: language === "es"
      ? "Abre Konfetti para ver quién"
      : "Open Konfetti to see who",
    data: {
      type: "like",
    },
  };

  await sendPushNotification(supabaseAdmin, likedUserId, payload);
}

// Convenience function for match notification
export async function sendMatchPush(
  supabaseAdmin: any,
  userId: string,
  matchedUserName: string,
  language: string,
  chatId?: string
): Promise<void> {
  const payload: PushPayload = {
    title: language === "es" ? "🎉 ¡Es un match!" : "🎉 It's a match!",
    body: language === "es"
      ? `Tú y ${matchedUserName} se gustan`
      : `You and ${matchedUserName} like each other`,
    data: {
      type: "match",
      chatId: chatId || "",
    },
  };

  await sendPushNotification(supabaseAdmin, userId, payload);
}
