// APNs Push Notification Utility
// Uses HTTP/2 for Apple Push Notification service

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Generate JWT for APNs authentication
async function generateAPNsJWT(): Promise<string> {
  const keyId = Deno.env.get("APNS_KEY_ID")!;
  const teamId = Deno.env.get("APNS_TEAM_ID")!;
  const privateKeyPem = Deno.env.get("APNS_PRIVATE_KEY")!;

  const header = {
    alg: "ES256",
    kid: keyId,
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
  };

  // Import the private key
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Create JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${unsignedToken}.${signatureB64}`;
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's device tokens
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from("device_tokens")
      .select("token")
      .eq("user_id", userId)
      .eq("platform", "ios");

    if (tokensError || !tokens || tokens.length === 0) {
      console.log(`No device tokens found for user ${userId}`);
      return { success: false, error: "No device tokens found" };
    }

    const jwt = await generateAPNsJWT();
    const bundleId = Deno.env.get("APNS_BUNDLE_ID")!;

    // Use production APNs (use api.sandbox.push.apple.com for development)
    const apnsHost = "api.push.apple.com";

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

    let successCount = 0;

    // Send to all user devices
    for (const { token } of tokens) {
      try {
        const response = await fetch(
          `https://${apnsHost}/3/device/${token}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${jwt}`,
              "apns-topic": bundleId,
              "apns-push-type": "alert",
              "apns-priority": "10",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apnsPayload),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`APNs error for token ${token}:`, response.status, errorText);

          // Remove invalid tokens
          if (response.status === 410 || response.status === 400) {
            console.log(`Removing invalid token: ${token}`);
            await supabaseAdmin
              .from("device_tokens")
              .delete()
              .eq("token", token);
          }
        } else {
          successCount++;
          console.log(`Push notification sent successfully to token: ${token.substring(0, 10)}...`);
        }
      } catch (err) {
        console.error(`Failed to send to token ${token}:`, err);
      }
    }

    return { success: successCount > 0 };
  } catch (error: any) {
    console.error("sendPushNotification error:", error);
    return { success: false, error: error.message };
  }
}
