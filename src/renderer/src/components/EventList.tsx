import { useCallback, useEffect, useMemo, useState } from 'react'
import { SettingsModal } from './SettingsModal'

type StoredEvent = {
  id: number
  received_at: string
  event_type: string
  session_id: string | null
  payload: string
}

const MAX_EVENTS = 200
const EVENT_TYPES = ['UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop'] as const
type EventType = (typeof EVENT_TYPES)[number]

type Filter = {
  types: Set<EventType>
  sessionId: string | null
}

function EventRow({ event }: { event: StoredEvent }): React.JSX.Element {
  const time = event.received_at.slice(11, 19)
  const parsed = useMemo<Record<string, unknown>>(() => {
    try {
      return JSON.parse(event.payload) as Record<string, unknown>
    } catch {
      return {}
    }
  }, [event.payload])
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
  const [sessions, setSessions] = useState<string[]>([])
  const [filter, setFilter] = useState<Filter>({
    types: new Set(EVENT_TYPES),
    sessionId: null
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  const refreshSessions = useCallback(async () => {
    setSessions(await window.vibelearn.recentSessions(20))
  }, [])

  const refreshKey = useCallback(async () => {
    setHasKey(await window.vibelearn.hasApiKey())
  }, [])

  // Replay on mount + subscribe to live events
  useEffect(() => {
    let mounted = true
    void (async () => {
      const recent = await window.vibelearn.getRecent(MAX_EVENTS)
      if (!mounted) return
      setEvents(recent)
      await refreshSessions()
      await refreshKey()
    })()
    const unsubscribe = window.vibelearn.onEvent((event) => {
      setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS))
      // Sessions may have changed if this is a new one — cheap refresh
      void refreshSessions()
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [refreshSessions, refreshKey])

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (!filter.types.has(e.event_type as EventType) && filter.types.size < EVENT_TYPES.length) {
        return false
      }
      if (filter.sessionId && e.session_id !== filter.sessionId) return false
      return true
    })
  }, [events, filter])

  const toggleType = (t: EventType): void => {
    setFilter((prev) => {
      const next = new Set(prev.types)
      if (next.has(t)) {
        next.delete(t)
      } else {
        next.add(t)
      }
      // If user deselected everything, treat as "all" (avoid empty-state confusion)
      if (next.size === 0) {
        return { ...prev, types: new Set(EVENT_TYPES) }
      }
      return { ...prev, types: next }
    })
  }

  const clearAll = async (): Promise<void> => {
    if (!confirm('Clear all stored events? This cannot be undone.')) return
    await window.vibelearn.clearEvents()
    setEvents([])
    await refreshSessions()
  }

  const allTypesActive = filter.types.size === EVENT_TYPES.length

  return (
    <div className="event-list">
      <header className="event-list-header">
        <div className="header-top">
          <h1>VibeLearn</h1>
          <div className="header-actions">
            <button
              className="btn btn-ghost"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
            >
              ⚙ Settings{hasKey ? ' ✓' : ''}
            </button>
            <button className="btn btn-ghost" onClick={() => void clearAll()} title="Clear">
              Clear
            </button>
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-chips">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                className={`chip chip-${t} ${filter.types.has(t) || allTypesActive ? 'active' : ''}`}
                onClick={() => toggleType(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {sessions.length > 0 && (
            <select
              className="session-select"
              value={filter.sessionId ?? ''}
              onChange={(e) =>
                setFilter((f) => ({ ...f, sessionId: e.target.value || null }))
              }
            >
              <option value="">All sessions</option>
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s.slice(0, 8)}…
                </option>
              ))}
            </select>
          )}
        </div>
        <p className="status-line">
          Listening on <code>localhost:9999</code> · {events.length} stored ·{' '}
          {filtered.length} shown
        </p>
      </header>

      {filtered.length === 0 ? (
        <div className="event-list-empty">
          {events.length === 0 ? (
            <p>
              No events yet. Drop <code>dev-hooks/settings.json</code> into a project's{' '}
              <code>.claude/</code> dir and run <code>claude</code>.
            </p>
          ) : (
            <p>No events match the current filter.</p>
          )}
        </div>
      ) : (
        <ul className="event-list-items">
          {filtered.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} onChange={() => void refreshKey()} />
      )}
    </div>
  )
}
