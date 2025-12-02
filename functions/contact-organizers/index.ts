import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type ContactRequest = {
  name?: string
  email?: string
  topic?: string
  message?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_MESSAGE_LENGTH = 2000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405)
  }

  try {
    const { name, email, topic, message } = (await req.json()) as ContactRequest

    const trimmedName = name?.trim() ?? ''
    const trimmedEmail = email?.trim().toLowerCase() ?? ''
    const trimmedTopic = topic?.trim() || null
    const trimmedMessage = message?.trim() ?? ''

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return jsonResponse({ ok: false, message: 'Name, email, and message are required.' }, 400)
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      return jsonResponse({ ok: false, message: 'Enter a valid email address.' }, 400)
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse({ ok: false, message: 'Message is too long.' }, 400)
    }

    const { error } = await supabase.from('contact_messages').insert({
      sender_name: trimmedName,
      sender_email: trimmedEmail,
      topic: trimmedTopic,
      message: trimmedMessage,
    })

    if (error) {
      throw error
    }

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('contact-organizers error', error)
    return jsonResponse({ ok: false, message: 'Unable to submit message right now.' }, 500)
  }
})

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
