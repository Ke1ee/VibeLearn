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
}

declare global {
  interface Window {
    electron: ElectronAPI
    vibelearn: VibeLearnAPI
  }
}
