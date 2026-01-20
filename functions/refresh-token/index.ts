import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const OTP_SALT = Deno.env.get('OTP_SALT') ?? SERVICE_ROLE_KEY

createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const encoder = new TextEncoder()
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const { token } = (await req.json()) as { token?: string }
    if (!token) {
      return jsonResponse({ ok: false, message: 'Missing token' }, 401)
    }

    const claims = await verifyToken(token)
    if (!claims) {
      return jsonResponse({ ok: false, message: 'Invalid token' }, 401)
    }

    const now = Date.now()
    if (claims.exp * 1000 < now) {
      return jsonResponse({ ok: false, message: 'Token expired' }, 401)
    }

    const refreshed = await createSessionToken({
      sub: claims.sub,
      email: claims.email,
      isAdmin: claims.isAdmin,
    })

    return jsonResponse({ ok: true, token: refreshed })
  } catch (error) {
    console.error('refresh-token error', error)
    return jsonResponse({ ok: false, message: 'Failed to refresh token' }, 500)
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

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(OTP_SALT),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${headerB64}.${bodyB64}`))
  const expectedSig = base64urlEncode(signature)
  if (expectedSig !== sigB64) return null

  return body
}

type TokenSeed = {
  sub: string
  email: string
  isAdmin: boolean
}

async function createSessionToken(payload: TokenSeed) {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
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
