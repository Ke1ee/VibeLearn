/**
 * Throwaway hook validation server for the pre-week assignment.
 *
 * Run with: bun scripts/dev-hook-server.ts
 *
 * Listens on http://localhost:9999 and prints any JSON event POSTed to /event.
 * Pair with dev-hooks/settings.json copied into a test project's .claude/
 * directory, then run `claude` in that test project to see CC's hooks fire.
 *
 * This script is NOT part of VibeLearn the app. It's a 30-line throwaway
 * to validate that CC's hooks system actually broadcasts events end-to-end.
 * Once that's proven, this script can be deleted.
 */

const PORT = 9999

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'POST' && url.pathname === '/event') {
      const body = await req.text()
      const ts = new Date().toISOString()
      try {
        const event = JSON.parse(body)
        console.log(`\n[${ts}]`)
        console.log(JSON.stringify(event, null, 2))
      } catch {
        console.log(`\n[${ts}] non-JSON body (${body.length} bytes):`)
        console.log(body)
      }
      return new Response('ok')
    }

    if (req.method === 'GET' && url.pathname === '/') {
      return new Response('vibelearn dev hook server — POST events to /event')
    }

    return new Response('not found', { status: 404 })
  }
})

console.log(`vibelearn dev hook server listening on http://localhost:${server.port}`)
console.log(`POST events to http://localhost:${server.port}/event`)
console.log(`Ctrl-C to stop.\n`)
