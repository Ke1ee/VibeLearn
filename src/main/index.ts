import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { startEventServer, type ServerHandle, type RawHookEvent } from './eventServer'
import { openEventStore, type EventStore, type StoredEvent } from './eventStore'

const EVENT_SERVER_PORT = 9999

let mainWindow: BrowserWindow | null = null
let eventServer: ServerHandle | null = null
let eventStore: EventStore | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function handleHookEvent(raw: RawHookEvent): void {
  if (!eventStore) return

  const event_type =
    typeof raw.hook_event_name === 'string'
      ? raw.hook_event_name
      : typeof raw.event === 'string'
        ? raw.event
        : 'Unknown'
  const session_id =
    typeof raw.session_id === 'string' && raw.session_id.length > 0 ? raw.session_id : null

  const stored: StoredEvent = eventStore.insertEvent({
    event_type,
    session_id,
    payload: raw
  })

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('event:new', stored)
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.ke1ee.vibelearn')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  eventStore = openEventStore(app.getPath('userData'))

  try {
    eventServer = await startEventServer(EVENT_SERVER_PORT, handleHookEvent)
    console.log(`[vibelearn] event server listening on port ${eventServer.port}`)
  } catch (err) {
    console.error('[vibelearn] failed to start event server:', err)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', async () => {
  if (eventServer) {
    await eventServer.stop()
    eventServer = null
  }
  if (eventStore) {
    eventStore.close()
    eventStore = null
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
