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
  }
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
