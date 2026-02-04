import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactFormData = await req.json();

    console.log("Received contact form submission:", { name, email, subject });

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Konfetti <info@konfetti.app>",
      to: ["ketochiesesoyyo@gmail.com"],
      subject: `[Konfetti Contact] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #9b87f5 0%, #7c3aed 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💬 New Contact Message</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
              <div style="margin-bottom: 24px;">
                <h2 style="color: #9b87f5; font-size: 18px; margin-bottom: 8px;">From</h2>
                <p style="margin: 0;"><strong>${name}</strong></p>
                <p style="margin: 0; color: #666;">${email}</p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h2 style="color: #9b87f5; font-size: 18px; margin-bottom: 8px;">Subject</h2>
                <p style="margin: 0;">${subject}</p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h2 style="color: #9b87f5; font-size: 18px; margin-bottom: 8px;">Message</h2>
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              
              <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                Reply directly to this email to respond to ${name}
              </p>
            </div>
          </body>
        </html>
      `,
      reply_to: email,
    });

    console.log("Admin email sent:", adminEmailResponse);

    // Send confirmation to user
    const userEmailResponse = await resend.emails.send({
      from: "Konfetti <info@konfetti.app>",
      to: [email],
      subject: "We received your message! 💜",
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
              <h2 style="color: #333; margin-top: 0;">Hi ${name}! 👋</h2>
              
              <p>Thank you for reaching out to us! We've received your message and our team will get back to you as soon as possible.</p>
              
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;"><strong>Your message:</strong></p>
                <p style="margin: 8px 0 0 0; color: #333;">${subject}</p>
              </div>
              
              <p>We typically respond within 24-48 hours. In the meantime, feel free to explore our website!</p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              
              <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                With love,<br>
                <strong style="color: #9b87f5;">The Konfetti Team</strong> 💜
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("User confirmation email sent:", userEmailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in contact-form function:", error);
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
