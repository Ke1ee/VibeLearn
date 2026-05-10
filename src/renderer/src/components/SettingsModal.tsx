import { useEffect, useState } from 'react'

type Props = {
  onClose: () => void
  onChange: () => void
}

export function SettingsModal({ onClose, onChange }: Props): React.JSX.Element {
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [encOk, setEncOk] = useState<boolean | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const [k, e] = await Promise.all([
        window.vibelearn.hasApiKey(),
        window.vibelearn.encryptionAvailable()
      ])
      setHasKey(k)
      setEncOk(e)
    })()
  }, [])

  const refresh = async (): Promise<void> => {
    setHasKey(await window.vibelearn.hasApiKey())
    onChange()
  }

  const save = async (): Promise<void> => {
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      const res = await window.vibelearn.setApiKey(input)
      if (res.ok) {
        setSuccess('Saved.')
        setInput('')
        await refresh()
      } else {
        setError(res.error)
      }
    } finally {
      setBusy(false)
    }
  }

  const remove = async (): Promise<void> => {
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      await window.vibelearn.clearApiKey()
      setSuccess('API key removed.')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <section className="modal-section">
          <h3>Anthropic API key</h3>
          <p className="modal-help">
            Used in v1.5+ for Haiku translation. Stored encrypted in the OS keychain via
            Electron's <code>safeStorage</code>. Never leaves your machine.
          </p>

          {encOk === false && (
            <p className="modal-error">
              OS encryption is unavailable on this system. Cannot save an API key securely.
            </p>
          )}

          {hasKey === true && (
            <p className="modal-status modal-status-good">
              ✓ An encrypted API key is currently saved.
            </p>
          )}
          {hasKey === false && (
            <p className="modal-status modal-status-warn">
              No API key saved yet.
            </p>
          )}

          <label className="modal-field">
            <span>{hasKey ? 'Replace key' : 'Paste your key'}</span>
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-ant-..."
              value={input}
              disabled={busy || encOk === false}
              onChange={(e) => setInput(e.target.value)}
            />
          </label>

          <div className="modal-actions">
            <button
              className="btn btn-primary"
              disabled={busy || input.trim().length === 0 || encOk === false}
              onClick={() => void save()}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            {hasKey && (
              <button className="btn btn-danger" disabled={busy} onClick={() => void remove()}>
                Remove saved key
              </button>
            )}
          </div>

          {error && <p className="modal-error">{error}</p>}
          {success && <p className="modal-success">{success}</p>}
        </section>
      </div>
    </div>
  )
}
