import { useEffect, useState } from 'react'

type StoredEvent = {
  id: number
  received_at: string
  event_type: string
  session_id: string | null
  payload: string
}

const MAX_EVENTS = 50

function EventRow({ event }: { event: StoredEvent }): React.JSX.Element {
  const time = event.received_at.slice(11, 19)
  const parsed = (() => {
    try {
      return JSON.parse(event.payload) as Record<string, unknown>
    } catch {
      return {}
    }
  })()
  const toolName = typeof parsed.tool_name === 'string' ? parsed.tool_name : null
  const promptPreview =
    typeof parsed.prompt === 'string' ? parsed.prompt.slice(0, 80) : null
  const finalMessage =
    typeof parsed.last_assistant_message === 'string'
      ? parsed.last_assistant_message.slice(0, 80)
      : null

  return (
    <li className={`event-row event-${event.event_type}`}>
      <span className="event-time">{time}</span>
      <span className="event-type">{event.event_type}</span>
      {toolName && <span className="event-tool">{toolName}</span>}
      {promptPreview && <span className="event-detail">"{promptPreview}"</span>}
      {finalMessage && <span className="event-detail">→ {finalMessage}</span>}
    </li>
  )
}

export function EventList(): React.JSX.Element {
  const [events, setEvents] = useState<StoredEvent[]>([])

  useEffect(() => {
    const unsubscribe = window.vibelearn.onEvent((event) => {
      setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS))
    })
    return unsubscribe
  }, [])

  return (
    <div className="event-list">
      <header className="event-list-header">
        <h1>VibeLearn</h1>
        <p>
          Waiting for Claude Code events on <code>localhost:9999</code>.
        </p>
      </header>
      {events.length === 0 ? (
        <div className="event-list-empty">
          <p>No events yet. Drop <code>dev-hooks/settings.json</code> into a project's <code>.claude/</code> dir and run <code>claude</code>.</p>
        </div>
      ) : (
        <ul className="event-list-items">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  )
}
