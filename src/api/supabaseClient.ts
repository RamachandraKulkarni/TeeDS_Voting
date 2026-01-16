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

export async function invokeEdgeFunction<TResponse>(name: string, body: Record<string, unknown>): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke<TResponse>(name, {
    body,
  })

  if (error) {
    throw new Error(error.message || `Edge function ${name} failed`)
  }

  return data as TResponse
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
  const response = await invokeEdgeFunction<{ ok: boolean; rsvp?: LiveEventRsvp; message?: string }>('record-rsvp', {
    action: 'set',
    token,
    will_attend: willAttend,
  })

  if (!response.ok || !response.rsvp) {
    throw new Error(response.message ?? 'Unable to save RSVP')
  }
  return response.rsvp
}

export async function getLiveEventRsvpViaEdge(token: string): Promise<LiveEventRsvp | null> {
  const response = await invokeEdgeFunction<{ ok: boolean; rsvp?: LiveEventRsvp | null; message?: string }>('record-rsvp', {
    action: 'get',
    token,
  })

  if (!response.ok) {
    throw new Error(response.message ?? 'Unable to load RSVP')
  }
  return response.rsvp ?? null
}
