import { Hono } from 'hono'
import { serve, type ServerType } from '@hono/node-server'

export type RawHookEvent = {
  event?: string
  hook_event_name?: string
  session_id?: string
  [key: string]: unknown
}

export type ServerHandle = {
  stop: () => Promise<void>
  port: number
}

export function startEventServer(
  port: number,
  onEvent: (raw: RawHookEvent) => void
): Promise<ServerHandle> {
  const app = new Hono()

  app.get('/', (c) => c.text('vibelearn event server'))

  app.post('/event', async (c) => {
    let raw: RawHookEvent
    try {
      raw = (await c.req.json()) as RawHookEvent
    } catch {
      return c.text('invalid json', 400)
    }
    try {
      onEvent(raw)
    } catch (err) {
      // never let downstream errors block CC's hook from returning
      console.error('[vibelearn] onEvent threw:', err)
    }
    return c.text('ok')
  })

  return new Promise<ServerHandle>((resolve, reject) => {
    let server: ServerType
    try {
      server = serve({ fetch: app.fetch, port }, (info) => {
        resolve({
          port: info.port,
          stop: () =>
            new Promise<void>((res) => {
              server.close(() => res())
            })
        })
      })
    } catch (err) {
      reject(err)
    }
  })
}
