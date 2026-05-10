import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export type StoredEvent = {
  id: number
  received_at: string
  event_type: string
  session_id: string | null
  payload: string
}

const vibelearn = {
  onEvent: (cb: (event: StoredEvent) => void): (() => void) => {
    const listener = (_e: IpcRendererEvent, event: StoredEvent): void => cb(event)
    ipcRenderer.on('event:new', listener)
    return () => {
      ipcRenderer.off('event:new', listener)
    }
  },
  getRecent: (limit = 50): Promise<StoredEvent[]> =>
    ipcRenderer.invoke('vibelearn:getRecent', limit),
  clearEvents: (): Promise<number> => ipcRenderer.invoke('vibelearn:clearEvents'),
  recentSessions: (limit = 20): Promise<string[]> =>
    ipcRenderer.invoke('vibelearn:recentSessions', limit),
  hasApiKey: (): Promise<boolean> => ipcRenderer.invoke('vibelearn:hasApiKey'),
  encryptionAvailable: (): Promise<boolean> =>
    ipcRenderer.invoke('vibelearn:encryptionAvailable'),
  setApiKey: (plainText: string): Promise<{ ok: true } | { ok: false; error: string }> =>
    ipcRenderer.invoke('vibelearn:setApiKey', plainText),
  clearApiKey: (): Promise<boolean> => ipcRenderer.invoke('vibelearn:clearApiKey')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('vibelearn', vibelearn)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.vibelearn = vibelearn
}
