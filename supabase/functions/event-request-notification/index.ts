import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Notification recipient email
const NOTIFICATION_EMAIL = "ketochiesesoyyo@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EventRequestData {
  submitter_type: 'couple' | 'wedding_planner';
  partner1_name: string;
  partner2_name: string;
  wedding_date: string;
  expected_guests: number;
  email: string;
  phone: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EventRequestData = await req.json();

    const formattedDate = new Date(data.wedding_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const submitterLabel = data.submitter_type === 'wedding_planner' ? 'Wedding Planner' : 'The Couple';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Event Request</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 24px; }
          .header h1 { color: #9b2c2c; margin: 0; font-size: 24px; }
          .header p { color: #666; margin-top: 8px; }
          .badge { display: inline-block; background: #f0f0f0; color: #666; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; margin-top: 8px; }
          .badge.planner { background: #e8f4fd; color: #1e88e5; }
          .section { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #eee; }
          .section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
          .section-title { font-size: 14px; font-weight: 600; color: #9b2c2c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
          .info-row { display: flex; margin-bottom: 8px; }
          .info-label { font-weight: 500; color: #666; width: 140px; flex-shrink: 0; }
          .info-value { color: #333; }
          .message-box { background: #f9f9f9; border-radius: 8px; padding: 16px; font-style: italic; color: #555; }
          .footer { text-align: center; margin-top: 24px; color: #999; font-size: 12px; }
          .cta-button { display: inline-block; background: #9b2c2c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>🎉 New Event Request!</h1>
              <p>${data.partner1_name} & ${data.partner2_name} want to use Konfetti</p>
              <span class="badge ${data.submitter_type === 'wedding_planner' ? 'planner' : ''}">Submitted by: ${submitterLabel}</span>
            </div>
            
            <div class="section">
              <div class="section-title">Couple Information</div>
              <div class="info-row">
                <span class="info-label">Partner 1:</span>
                <span class="info-value">${data.partner1_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Partner 2:</span>
                <span class="info-value">${data.partner2_name}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Event Details</div>
              <div class="info-row">
                <span class="info-label">Wedding Date:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Expected Singles:</span>
                <span class="info-value">${data.expected_guests} people</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Contact Information</div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value"><a href="mailto:${data.email}" style="color: #9b2c2c;">${data.email}</a></span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value"><a href="tel:${data.phone}" style="color: #9b2c2c;">${data.phone}</a></span>
              </div>
            </div>
            
            ${data.message ? `
            <div class="section">
              <div class="section-title">Additional Message</div>
              <div class="message-box">${data.message}</div>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="mailto:${data.email}?subject=Re: Konfetti for your wedding" class="cta-button">Reply to ${data.partner1_name}</a>
            </div>
          </div>
          
          <div class="footer">
            <p>This notification was sent from the Konfetti contact form.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const payload = {
      from: "Konfetti <info@konfetti.app>",
      to: [NOTIFICATION_EMAIL],
      subject: `🎉 New Event Request: ${data.partner1_name} & ${data.partner2_name}`,
      html: emailHtml,
      reply_to: data.email,
    };

    console.log("RESEND_PAYLOAD:", JSON.stringify(payload, null, 2));

    const emailResponse = await resend.emails.send(payload);
    console.log("Notification email sent successfully:", emailResponse);

    // Send confirmation email to the submitter
    const isWeddingPlanner = data.submitter_type === 'wedding_planner';
    const confirmationSubject = isWeddingPlanner
      ? `¡Recibimos tu solicitud para ${data.partner1_name} & ${data.partner2_name}!`
      : `¡Hemos recibido tu solicitud, ${data.partner1_name} & ${data.partner2_name}!`;

    const greeting = isWeddingPlanner
      ? 'Hola,'
      : `Hola ${data.partner1_name} & ${data.partner2_name},`;

    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Solicitud Recibida</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 24px; }
          .header h1 { color: #9b2c2c; margin: 0; font-size: 28px; }
          .content { margin-bottom: 24px; }
          .content p { margin: 0 0 16px 0; }
          .highlight { background: #fef2f2; border-left: 4px solid #9b2c2c; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0; }
          .highlight p { margin: 0; font-weight: 500; color: #9b2c2c; }
          .details { background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0; }
          .details-title { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .details-row { display: flex; margin-bottom: 4px; }
          .details-label { color: #666; width: 120px; }
          .details-value { color: #333; font-weight: 500; }
          .footer { text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; }
          .footer p { color: #999; font-size: 14px; margin: 0 0 8px 0; }
          .social-links { margin-top: 16px; }
          .social-links a { color: #9b2c2c; text-decoration: none; margin: 0 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>🎉 ¡Solicitud Recibida!</h1>
            </div>
            
            <div class="content">
              <p>${greeting}</p>
              <p>¡Gracias por tu interés en <strong>Konfetti</strong>! Hemos recibido tu solicitud y estamos emocionados de poder ser parte de este día tan especial.</p>
              
              <div class="highlight">
                <p>📞 Nos pondremos en contacto contigo en un máximo de <strong>24 horas</strong>.</p>
              </div>
              
              <div class="details">
                <div class="details-title">Resumen de tu solicitud</div>
                <div class="details-row">
                  <span class="details-label">Pareja:</span>
                  <span class="details-value">${data.partner1_name} & ${data.partner2_name}</span>
                </div>
                <div class="details-row">
                  <span class="details-label">Fecha:</span>
                  <span class="details-value">${formattedDate}</span>
                </div>
                <div class="details-row">
                  <span class="details-label">Invitados:</span>
                  <span class="details-value">${data.expected_guests} solteros</span>
                </div>
              </div>
              
              <p>Si tienes alguna pregunta mientras tanto, no dudes en responder a este correo.</p>
              
              <p>¡Saludos!<br><strong>El equipo de Konfetti</strong> 🎊</p>
            </div>
            
            <div class="footer">
              <p>Konfetti - El matchmaking para bodas</p>
              <div class="social-links">
                <a href="https://konfetti.app">konfetti.app</a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const confirmationResponse = await resend.emails.send({
        from: "Konfetti <info@konfetti.app>",
        to: [data.email],
        subject: confirmationSubject,
        html: confirmationHtml,
      });
      console.log("Confirmation email sent successfully:", confirmationResponse);
    } catch (confirmError) {
      // Log but don't fail the request if confirmation email fails
      console.error("Failed to send confirmation email:", confirmError);
    }

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in event-request-notification function:", error);
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
