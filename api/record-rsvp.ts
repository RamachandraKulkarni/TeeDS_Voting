import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const OTP_SALT = process.env.OTP_SALT ?? SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const encoder = new TextEncoder()

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

export default async function handler(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return withCors(NextResponse.json({ ok: true }))
  }

  if (req.method !== 'POST') {
    return withCors(NextResponse.json({ ok: false, message: 'Method not allowed' }, { status: 405 }))
  }

  try {
    const { action, token, will_attend } = (await req.json()) as Payload

    if (!token) {
      return withCors(NextResponse.json({ ok: false, message: 'Missing token' }, { status: 401 }))
    }

    const claims = await verifyToken(token)
    if (!claims) {
      return withCors(NextResponse.json({ ok: false, message: 'Invalid token' }, { status: 401 }))
    }

    if (claims.exp * 1000 < Date.now()) {
      return withCors(NextResponse.json({ ok: false, message: 'Token expired' }, { status: 401 }))
    }

    if (action === 'set') {
      if (!will_attend || (will_attend !== 'yes' && will_attend !== 'no')) {
        return withCors(NextResponse.json({ ok: false, message: 'will_attend required' }, { status: 400 }))
      }

      const { data, error } = await supabase
        .from('rsvps')
        .upsert({ user_id: claims.sub, will_attend }, { onConflict: 'user_id' })
        .select('user_id, will_attend, updated_at')
        .single()

      if (error) throw error
      return withCors(NextResponse.json({ ok: true, rsvp: data }))
    }

    const { data, error } = await supabase
      .from('rsvps')
      .select('user_id, will_attend, updated_at')
      .eq('user_id', claims.sub)
      .maybeSingle()

    if (error) throw error
    return withCors(NextResponse.json({ ok: true, rsvp: data ?? null }))
  } catch (error) {
    console.error('record-rsvp api error', error)
    return withCors(NextResponse.json({ ok: false, message: 'Failed to process RSVP' }, { status: 500 }))
  }
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, bodyB64, sigB64] = parts
  const headerJson = Buffer.from(headerB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
  const bodyJson = Buffer.from(bodyB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')

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
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function withCors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type')
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  return res
}
