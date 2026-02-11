import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  user_id: string;
  subject: string;
  body: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create a client with the caller's JWT to verify identity
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      throw new Error("Unauthorized");
    }

    const callerUserId = claimsData.claims.sub;

    // Check admin role using service role client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: callerUserId,
      _role: "admin",
    });

    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    // Parse request
    const { user_id, subject, body }: SendEmailRequest = await req.json();

    if (!user_id || !subject || !body) {
      throw new Error("Missing required fields: user_id, subject, body");
    }

    // Look up user's email from auth.users using service role
    const { data: { user: targetUser }, error: userError } = await adminClient.auth.admin.getUserById(user_id);

    if (userError || !targetUser?.email) {
      throw new Error("User not found or has no email");
    }

    // Get user's name from profiles
    const { data: profile } = await adminClient
      .from("profiles")
      .select("name")
      .eq("user_id", user_id)
      .single();

    const userName = profile?.name || "Usuario";

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Konfetti <info@konfetti.app>",
      to: [targetUser.email],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #9b87f5 0%, #7c3aed 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">konfetti</h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
              <h2 style="color: #333; margin-top: 0;">Hola ${userName},</h2>

              <div style="white-space: pre-wrap; margin: 20px 0;">${body}</div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

              <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                Con cariño,<br>
                <strong style="color: #9b87f5;">El equipo de Konfetti</strong> 💜
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent to user:", targetUser.email, emailResponse);

    return new Response(
      JSON.stringify({ success: true, email: targetUser.email }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-user-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
