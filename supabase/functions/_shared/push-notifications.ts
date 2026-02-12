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

interface FCMServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
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

// Get OAuth2 access token for FCM using service account credentials
async function getFCMAccessToken(serviceAccount: FCMServiceAccount): Promise<string> {
  const privateKey = await jose.importPKCS8(serviceAccount.private_key, "RS256");

  const jwt = await new jose.SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(serviceAccount.client_email)
    .setSubject(serviceAccount.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to get FCM access token: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Send push notification to a single device via FCM
async function sendToFCM(
  deviceToken: string,
  payload: PushPayload,
  serviceAccount: FCMServiceAccount
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getFCMAccessToken(serviceAccount);
    const url = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

    const fcmPayload = {
      message: {
        token: deviceToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: "high" as const,
          notification: {
            channel_id: "konfetti_messages",
          },
        },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(fcmPayload),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorBody = await response.text();
      console.error(`[PUSH] FCM error ${response.status}:`, errorBody);
      return { success: false, error: `FCM error: ${response.status} ${errorBody}` };
    }
  } catch (error) {
    console.error("[PUSH] Error sending to FCM:", error);
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

  // Parse FCM service account
  const fcmServiceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT");
  let fcmServiceAccount: FCMServiceAccount | null = null;
  if (fcmServiceAccountJson) {
    try {
      fcmServiceAccount = JSON.parse(fcmServiceAccountJson) as FCMServiceAccount;
    } catch (e) {
      console.error("[PUSH] Failed to parse FCM_SERVICE_ACCOUNT:", e);
    }
  }

  const apnsConfigured = !!(apnsKeyId && apnsTeamId && apnsPrivateKey);
  const fcmConfigured = !!fcmServiceAccount;

  if (!apnsConfigured && !fcmConfigured) {
    console.log("[PUSH] Neither APNs nor FCM configured, skipping push notification");
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

  const apnsConfig: APNsConfig | null = apnsConfigured ? {
    keyId: apnsKeyId!,
    teamId: apnsTeamId!,
    privateKey: apnsPrivateKey!.replace(/\\n/g, "\n"),
    bundleId: apnsBundleId,
    production: apnsProduction,
  } : null;

  let sent = 0;
  let failed = 0;

  for (const { token, platform } of tokens) {
    if (platform === "ios" && apnsConfig) {
      const result = await sendToAPNs(token, payload, apnsConfig);
      if (result.success) {
        sent++;
      } else {
        failed++;
        // If token is invalid, remove it
        if (result.error?.includes("BadDeviceToken") || result.error?.includes("Unregistered")) {
          console.log("[PUSH] Removing invalid iOS token:", token);
          await supabaseAdmin
            .from("device_tokens")
            .delete()
            .eq("token", token);
        }
      }
    } else if (platform === "android" && fcmServiceAccount) {
      const result = await sendToFCM(token, payload, fcmServiceAccount);
      if (result.success) {
        sent++;
      } else {
        failed++;
        // If token is invalid, remove it
        if (result.error?.includes("UNREGISTERED") || result.error?.includes("INVALID_ARGUMENT")) {
          console.log("[PUSH] Removing invalid Android token:", token);
          await supabaseAdmin
            .from("device_tokens")
            .delete()
            .eq("token", token);
        }
      }
    }
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
