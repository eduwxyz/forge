import { BrowserWindow } from 'electron'
import os from 'os'

// Store active PTY processes
const ptys = new Map<string, import('node-pty').IPty>()

export function createPty(
  id: string,
  cols: number,
  rows: number,
  cwd: string,
  mainWindow: BrowserWindow,
  shellOverride?: string
) {
  // Dynamic import because node-pty is a native module
  const pty = require('node-pty') as typeof import('node-pty')

  const shell = shellOverride || process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/zsh')

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor'
    } as Record<string, string>
  })

  // Forward PTY output to renderer
  ptyProcess.onData((data: string) => {
    mainWindow.webContents.send('pty:data', { id, data })
  })

  ptyProcess.onExit(({ exitCode }) => {
    mainWindow.webContents.send('pty:exit', { id, exitCode })
    ptys.delete(id)
  })

  ptys.set(id, ptyProcess)
}

export function writePty(id: string, data: string) {
  const ptyProcess = ptys.get(id)
  if (ptyProcess) {
    ptyProcess.write(data)
  }
}

export function resizePty(id: string, cols: number, rows: number) {
  const ptyProcess = ptys.get(id)
  if (ptyProcess) {
    try {
      ptyProcess.resize(cols, rows)
    } catch {
      // Ignore resize errors (process may have exited)
    }
  }
}

export function closePty(id: string) {
  const ptyProcess = ptys.get(id)
  if (ptyProcess) {
    ptyProcess.kill()
    ptys.delete(id)
  }
}

export function closeAllPty() {
  for (const [id, ptyProcess] of ptys) {
    ptyProcess.kill()
    ptys.delete(id)
  }
}
