// Sends one queued notification email via Brevo's transactional email API.
//
// Note on SMTP vs. API, since this uses Brevo's HTTP API here, not raw
// SMTP: Supabase Auth's own emails (the login OTP) go through Brevo's SMTP
// relay, configured directly in the Supabase dashboard's Auth settings —
// that's literally the field Supabase asks for (host/port/user/pass), and
// exactly what was asked for. For *this* function — emails our own trigger
// decides to send — a plain HTTPS POST to Brevo's API is more robust than
// hand-rolling SMTP's wire protocol inside a Deno function, and it's the
// same Brevo account, same free tier (300/day), just the right tool for
// something invoked over HTTP rather than through a mail client.
//
// Deploy: `supabase functions deploy send-notification-email`
// Secrets needed (`supabase secrets set NAME=value`):
//   BREVO_API_KEY        — from Brevo dashboard → SMTP & API → API Keys
//   NOTIFICATION_SENDER   — a verified sender email in your Brevo account
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase,
// nothing to set for those.

import { createClient } from "jsr:@supabase/supabase-js@2";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

Deno.serve(async (req) => {
  try {
    const { notification_id } = await req.json();
    if (!notification_id) {
      return new Response(JSON.stringify({ error: "notification_id required" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: notification, error: fetchError } = await supabase
      .from("notification_queue")
      .select()
      .eq("id", notification_id)
      .single();

    if (fetchError || !notification) {
      return new Response(JSON.stringify({ error: "notification not found" }), { status: 404 });
    }

    const brevoRes = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": Deno.env.get("BREVO_API_KEY")!,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: Deno.env.get("NOTIFICATION_SENDER") },
        to: [{ email: notification.recipient_email }],
        subject: notification.subject,
        htmlContent: `<p>${notification.body}</p>`,
      }),
    });

    const status = brevoRes.ok ? "sent" : "failed";
    await supabase
      .from("notification_queue")
      .update({ status, sent_at: brevoRes.ok ? new Date().toISOString() : null })
      .eq("id", notification_id);

    if (!brevoRes.ok) {
      const errorBody = await brevoRes.text();
      console.error("Brevo send failed", errorBody);
      return new Response(JSON.stringify({ error: errorBody }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("send-notification-email failed", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
