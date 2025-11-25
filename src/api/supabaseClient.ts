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
