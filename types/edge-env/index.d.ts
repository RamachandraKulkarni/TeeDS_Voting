declare const Deno: {
  serve: (handler: (request: Request) => Response | Promise<Response>) => void
  env: {
    get: (key: string) => string | undefined
  }
}

declare module 'https://deno.land/std@0.207.0/http/server.ts' {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void | Promise<void>
}

declare module 'https://deno.land/x/smtp@v0.7.0/mod.ts' {
  export class SmtpClient {
    connect(options: Record<string, unknown>): Promise<void>
    connectTLS(options: Record<string, unknown>): Promise<void>
    send(options: { from: string; to: string; subject?: string; content: string }): Promise<void>
    close(): Promise<void>
  }
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js'
}
