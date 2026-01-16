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

export async function saveLiveEventRsvp(willAttend: LiveEventRsvpValue): Promise<LiveEventRsvp> {
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError) throw sessionError
  if (!user) throw new Error('You must be signed in to RSVP')

  const { data, error } = await supabase
    .from('rsvps')
    .upsert({ user_id: user.id, will_attend: willAttend }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw error
  return data as LiveEventRsvp
}

export async function getLiveEventRsvp(): Promise<LiveEventRsvp | null> {
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError) throw sessionError
  if (!user) return null

  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return (data as LiveEventRsvp | null) ?? null
}
