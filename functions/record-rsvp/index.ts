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

type Action = 'get' | 'set'

type Payload = {
  action?: Action
  token?: string
  will_attend?: 'yes' | 'no'
}

type TokenPayload = {
  sub: string
  email: string
  isAdmin: boolean
  exp: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405)
  }

  try {
    const { action, token, will_attend } = (await req.json()) as Payload

    if (!token) {
      return jsonResponse({ ok: false, message: 'Missing token' }, 401)
    }

    const claims = await verifyToken(token)
    if (!claims) {
      return jsonResponse({ ok: false, message: 'Invalid token' }, 401)
    }

    if (claims.exp * 1000 < Date.now()) {
      return jsonResponse({ ok: false, message: 'Token expired' }, 401)
    }

    if (action === 'set') {
      if (!will_attend || (will_attend !== 'yes' && will_attend !== 'no')) {
        return jsonResponse({ ok: false, message: 'will_attend required' }, 400)
      }
      const { data, error } = await supabase
        .from('rsvps')
        .upsert({ user_id: claims.sub, will_attend }, { onConflict: 'user_id' })
        .select('user_id, will_attend, updated_at')
        .single()

      if (error) throw error
      return jsonResponse({ ok: true, rsvp: data })
    }

    // default to get
    const { data, error } = await supabase
      .from('rsvps')
      .select('user_id, will_attend, updated_at')
      .eq('user_id', claims.sub)
      .maybeSingle()

    if (error) throw error
    return jsonResponse({ ok: true, rsvp: data ?? null })
  } catch (error) {
    console.error('record-rsvp error', error)
    return jsonResponse({ ok: false, message: 'Failed to process RSVP' }, 500)
  }
})

async function verifyToken(token: string): Promise<TokenPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, bodyB64, sigB64] = parts
  const headerJson = atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'))
  const bodyJson = atob(bodyB64.replace(/-/g, '+').replace(/_/g, '/'))

  let header: { alg?: string; typ?: string }
  let body: TokenPayload
  try {
    header = JSON.parse(headerJson)
    body = JSON.parse(bodyJson)
  } catch {
    return null
  }

  if (header.alg !== 'HS256') return null

  const key = await crypto.subtle.importKey('raw', encoder.encode(OTP_SALT), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const data = encoder.encode(`${headerB64}.${bodyB64}`)
  const signature = await crypto.subtle.sign('HMAC', key, data)
  const expectedSig = base64url(new Uint8Array(signature))
  if (expectedSig !== sigB64) return null

  return body
}

function base64url(data: Uint8Array) {
  return btoa(String.fromCharCode(...data))
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
