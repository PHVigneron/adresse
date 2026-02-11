import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailNotificationRequest {
  to: string;
  subject: string;
  html: string;
  type: 'contact_request' | 'contact_response' | 'notification';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, html, type }: EmailNotificationRequest = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`Sending ${type} email to ${to} with subject: ${subject}`);
    console.log(`Email content:`, html);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email notification logged successfully',
        note: 'To actually send emails, integrate with Resend, SendGrid, or another email service provider. Add your API key to Supabase Edge Function secrets.'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing email notification:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process email notification' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
