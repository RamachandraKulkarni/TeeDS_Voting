import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OTP_SALT = Deno.env.get('OTP_SALT') ?? SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') ?? '';
const SENDGRID_SENDER_EMAIL = Deno.env.get('SENDGRID_SENDER_EMAIL') ?? '';
const SENDGRID_SENDER_NAME = Deno.env.get('SENDGRID_SENDER_NAME') ?? 'TEEDS Design Voting';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});
const encoder = new TextEncoder();
const OTP_EXP_MINUTES = 10;
// build CORS headers for a given origin (avoid inline spread)
function buildCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && origin.length ? origin : '*';
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };
  return headers;
}
Deno.serve(async (req)=>{
  const origin = req.headers.get('origin') ?? '';
  // handle preflight
  if (req.method === 'OPTIONS') {
    const headers = buildCorsHeaders(origin);
    return new Response(null, {
      status: 204,
      headers
    });
  }
  if (req.method !== 'POST') {
    const headers = buildCorsHeaders(origin);
    return jsonResponse({
      ok: false,
      message: 'Method not allowed'
    }, 405, headers);
  }
  try {
    const body = await req.json().catch(()=>({}));
    const email = (body?.email || '').toString().trim().toLowerCase();
    if (!email || !email.endsWith('@asu.edu')) {
      const headers = buildCorsHeaders(origin);
      return jsonResponse({
        ok: false,
        message: 'ASU email required'
      }, 400, headers);
    }
    const otp = generateOtp();
    const otpHash = await hashOtp(email, otp);
    const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000).toISOString();
    const { error } = await supabase.from('otps').insert({
      id: crypto.randomUUID(),
      email,
      otp_hash: otpHash,
      expires_at: expiresAt
    });
    if (error) throw error;
    // attempt to send; on failure we still succeed but log and return an informative message
    const sent = await sendOtpEmail(email, otp);
    const headers = buildCorsHeaders(origin);
    if (sent) {
      return jsonResponse({
        ok: true,
        message: 'OTP sent to your inbox'
      }, 200, headers);
    } else {
      // in dev mode or if SMTP fails, include a helpful message
      console.warn('Email provider missing or send failed, OTP logged for debugging:', otp);
      return jsonResponse({
        ok: false,
        message: 'Unable to send OTP'
      }, 500, headers);
    }
  } catch (err) {
    console.error('request-otp error', err);
    const headers = buildCorsHeaders(origin);
    return jsonResponse({
      ok: false,
      message: 'Unable to send OTP'
    }, 500, headers);
  }
});
function generateOtp() {
  const random = crypto.getRandomValues(new Uint32Array(1))[0];
  return String(random % 1_000_000).padStart(6, '0');
}
async function hashOtp(email: string, otp: string) {
  const data = encoder.encode(`${email}:${otp}:${OTP_SALT}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((byte)=>byte.toString(16).padStart(2, '0')).join('');
}
async function sendOtpEmail(recipient: string, otp: string) {
  if (!SENDGRID_API_KEY || !SENDGRID_SENDER_EMAIL) {
    console.warn('SENDGRID env vars missing; logging OTP instead:', otp);
    return false;
  }
  const response = await fetch(SENDGRID_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [
            {
              email: recipient
            }
          ],
          subject: 'Your TEEDS Design Voting OTP'
        }
      ],
      from: {
        email: SENDGRID_SENDER_EMAIL,
        name: SENDGRID_SENDER_NAME
      },
      content: [
        {
          type: 'text/plain',
          value: `Here is your 6-digit OTP: ${otp}\n\nIt expires in ${OTP_EXP_MINUTES} minutes.`
        }
      ]
    })
  });
  if (!response.ok) {
    const details = await response.text();
    console.error('SendGrid API failed', response.status, details);
    return false;
  }
  return true;
}
function jsonResponse(body: Record<string, unknown>, status = 200, extraHeaders?: Record<string, string>) {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });
  if (extraHeaders) for (const k of Object.keys(extraHeaders))headers.set(k, extraHeaders[k]);
  return new Response(JSON.stringify(body), {
    status,
    headers
  });
}
