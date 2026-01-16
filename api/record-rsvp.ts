import { createClient } from '@supabase/supabase-js'

declare const process: {
  env: Record<string, string | undefined>
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const OTP_SALT = process.env.OTP_SALT ?? SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

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

type ApiRequest = {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
}

type ApiResponse = {
  status: (code: number) => ApiResponse
  json: (payload: Record<string, unknown>) => ApiResponse
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !OTP_SALT) {
    return res.status(500).json({
      ok: false,
      message: 'Missing server configuration (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OTP_SALT)',
    })
  }

  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const payload = (rawBody ?? {}) as Payload
    const headerAuth = req.headers?.authorization
    const bearerToken = typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')
      ? headerAuth.slice('Bearer '.length)
      : undefined
    const token = payload.token ?? bearerToken
    const { action, will_attend } = payload

    if (!token) {
      return res.status(401).json({ ok: false, message: 'Missing token' })
    }

    const claims = await verifyToken(token)
    if (!claims) {
      return res.status(401).json({ ok: false, message: 'Invalid token' })
    }

    if (claims.exp * 1000 < Date.now()) {
      return res.status(401).json({ ok: false, message: 'Token expired' })
    }

    if (action === 'set') {
      if (!will_attend || (will_attend !== 'yes' && will_attend !== 'no')) {
        return res.status(400).json({ ok: false, message: 'will_attend required' })
      }

      const { data, error } = await supabase
        .from('rsvps')
        .upsert({ user_id: claims.sub, will_attend }, { onConflict: 'user_id' })
        .select('user_id, will_attend, updated_at')
        .single()

      if (error) {
        return res.status(500).json({ ok: false, message: error.message })
      }
      return res.status(200).json({ ok: true, rsvp: data })
    }

    const { data, error } = await supabase
      .from('rsvps')
      .select('user_id, will_attend, updated_at')
      .eq('user_id', claims.sub)
      .maybeSingle()

    if (error) {
      return res.status(500).json({ ok: false, message: error.message })
    }
    return res.status(200).json({ ok: true, rsvp: data ?? null })
  } catch (error) {
    console.error('record-rsvp api error', error)
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to process RSVP',
    })
  }
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, bodyB64, sigB64] = parts

  const headerJson = decodeBase64UrlToString(headerB64)
  const bodyJson = decodeBase64UrlToString(bodyB64)

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
    new TextEncoder().encode(OTP_SALT),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${headerB64}.${bodyB64}`),
  )
  const expectedSig = base64UrlFromBuffer(signature)

  if (expectedSig !== sigB64) return null
  return body
}

function decodeBase64UrlToString(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function base64UrlFromBuffer(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
