import { ElectronAPI } from '@electron-toolkit/preload'

export type StoredEvent = {
  id: number
  received_at: string
  event_type: string
  session_id: string | null
  payload: string
}

export interface VibeLearnAPI {
  onEvent: (cb: (event: StoredEvent) => void) => () => void
  getRecent: (limit?: number) => Promise<StoredEvent[]>
  clearEvents: () => Promise<number>
  recentSessions: (limit?: number) => Promise<string[]>
  hasApiKey: () => Promise<boolean>
  encryptionAvailable: () => Promise<boolean>
  setApiKey: (
    plainText: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  clearApiKey: () => Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
    vibelearn: VibeLearnAPI
  }
}
