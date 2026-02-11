import { contextBridge, ipcRenderer } from 'electron'

const validChannels = [
  'pty:data',
  'pty:exit',
  'terminal:split-horizontal',
  'terminal:split-vertical',
  'terminal:close-panel',
  'terminal:spawn-agent'
]

contextBridge.exposeInMainWorld('api', {
  pty: {
    create: (id: string, cols: number, rows: number, cwd?: string) =>
      ipcRenderer.invoke('pty:create', { id, cols, rows, cwd }),
    write: (id: string, data: string) =>
      ipcRenderer.invoke('pty:write', { id, data }),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.invoke('pty:resize', { id, cols, rows }),
    close: (id: string) =>
      ipcRenderer.invoke('pty:close', { id })
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    if (!validChannels.includes(channel)) return () => {}
    const listener = (_event: unknown, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  }
})
