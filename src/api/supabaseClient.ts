import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables')
}

export const publicAnonKey = anonKey as string

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: false,
  },
})

export const functionsBaseUrl = `${supabaseUrl}/functions/v1`

export async function invokeEdgeFunction<TResponse>(
  name: string,
  body: Record<string, unknown>,
  token?: string,
): Promise<TResponse> {
  const authToken = token ?? publicAnonKey
  const response = await fetch(`${functionsBaseUrl}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: publicAnonKey,
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorPayload = await response.text()
    throw new Error(errorPayload || `Edge function ${name} failed (${response.status})`)
  }

  return (await response.json()) as TResponse
}

export function getDesignPublicUrl(storagePath: string) {
  const { data } = supabase.storage.from('designs').getPublicUrl(storagePath)
  return data.publicUrl
}

export type LiveEventRsvpValue = 'yes' | 'no'

export type LiveEventRsvp = {
  user_id: string
  will_attend: LiveEventRsvpValue
  updated_at: string
}

export async function saveLiveEventRsvpViaEdge(token: string, willAttend: LiveEventRsvpValue): Promise<LiveEventRsvp> {
  const response = await fetch('/api/record-rsvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set', token, will_attend: willAttend }),
  })

  const payload = (await response.json()) as { ok: boolean; rsvp?: LiveEventRsvp; message?: string }
  if (!payload.ok || !payload.rsvp) {
    throw new Error(payload.message ?? 'Unable to save RSVP')
  }
  return payload.rsvp
}

export async function getLiveEventRsvpViaEdge(token: string): Promise<LiveEventRsvp | null> {
  const response = await fetch('/api/record-rsvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get', token }),
  })

  const payload = (await response.json()) as { ok: boolean; rsvp?: LiveEventRsvp | null; message?: string }
  if (!payload.ok) {
    throw new Error(payload.message ?? 'Unable to load RSVP')
  }
  return payload.rsvp ?? null
}
