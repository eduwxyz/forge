import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { createPty, writePty, resizePty, closePty, closeAllPty } from './pty'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0D0F12',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Load renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Capture keyboard shortcuts before Chromium processes them
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (!input.meta && !input.control) return
    if (input.type !== 'keyDown') return

    // Cmd+/ → split horizontal
    if (input.key === '/' && !input.shift) {
      _event.preventDefault()
      mainWindow?.webContents.send('terminal:split-horizontal')
      return
    }

    // Cmd+Shift+\ → split vertical
    if (input.key === '\\' && input.shift) {
      _event.preventDefault()
      mainWindow?.webContents.send('terminal:split-vertical')
      return
    }

    // Cmd+Shift+W → close panel
    if ((input.key === 'W' || input.key === 'w') && input.shift) {
      _event.preventDefault()
      mainWindow?.webContents.send('terminal:close-panel')
      return
    }
  })
}

// --- IPC Handlers ---

ipcMain.handle('pty:create', (_event, { id, cols, rows, cwd }) => {
  if (!mainWindow) return
  const resolvedCwd = (!cwd || cwd === '~') ? (process.env.HOME || '/') : cwd
  createPty(id, cols, rows, resolvedCwd, mainWindow)
})

ipcMain.handle('pty:write', (_event, { id, data }) => {
  writePty(id, data)
})

ipcMain.handle('pty:resize', (_event, { id, cols, rows }) => {
  resizePty(id, cols, rows)
})

ipcMain.handle('pty:close', (_event, { id }) => {
  closePty(id)
})

// --- App lifecycle ---

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  closeAllPty()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
