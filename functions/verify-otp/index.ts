import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const OTP_SALT = Deno.env.get('OTP_SALT') ?? SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const encoder = new TextEncoder()
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405)
  }

  try {
    const { email, otp } = (await req.json()) as { email?: string; otp?: string }
    const normalizedEmail = email?.trim().toLowerCase()

    if (!normalizedEmail || !otp) {
      return jsonResponse({ ok: false, message: 'Email and OTP required' }, 400)
    }

    const { data: otpRow, error: otpError } = await supabase
      .from('otps')
      .select('id, email, otp_hash, expires_at, used')
      .eq('email', normalizedEmail)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError || !otpRow) {
      return jsonResponse({ ok: false, message: 'Invalid or expired OTP' }, 400)
    }

    const now = Date.now()
    if (new Date(otpRow.expires_at).getTime() < now) {
      return jsonResponse({ ok: false, message: 'OTP expired' }, 400)
    }

    const hashed = await hashOtp(normalizedEmail, otp)
    if (hashed !== otpRow.otp_hash) {
      return jsonResponse({ ok: false, message: 'Invalid OTP' }, 400)
    }

    await supabase.from('otps').update({ used: true }).eq('id', otpRow.id)

    let { data: user } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (!user) {
      const { data: created } = await supabase
        .from('users')
        .insert({ email: normalizedEmail })
        .select()
        .single()
      user = created ?? null
    }

    if (!user) {
      throw new Error('Unable to create user record')
    }

    const { data: adminRecord } = await supabase
      .from('admins')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const isAdmin = adminRecord !== null || user.is_admin === true
    if (isAdmin && user.is_admin !== true) {
      await supabase.from('users').update({ is_admin: true }).eq('id', user.id)
    }

    const session = await createSessionToken({
      sub: user.id,
      email: normalizedEmail,
      isAdmin,
    })

    return jsonResponse({
      ok: true,
      session: {
        token: session,
        user: { id: user.id, email: normalizedEmail, isAdmin },
      },
    })
  } catch (error) {
    console.error('verify-otp error', error)
    return jsonResponse({ ok: false, message: 'OTP verification failed' }, 500)
  }
})

async function hashOtp(email: string, otp: string) {
  const data = encoder.encode(`${email}:${otp}:${OTP_SALT}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

type TokenPayload = {
  sub: string
  email: string
  isAdmin: boolean
}

async function createSessionToken(payload: TokenPayload) {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 12
  const body = base64urlEncode(JSON.stringify({ ...payload, exp }))
  const signature = await sign(`${header}.${body}`)
  return `${header}.${body}.${signature}`
}

async function sign(message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(OTP_SALT),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return base64urlEncode(signature)
}

function base64urlEncode(data: string | ArrayBuffer) {
  const buffer = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data)
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
