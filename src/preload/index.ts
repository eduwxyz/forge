import { contextBridge, ipcRenderer } from 'electron'

const validChannels = [
  'pty:data',
  'pty:exit',
  'terminal:split-horizontal',
  'terminal:split-vertical',
  'terminal:close-panel',
  'terminal:spawn-agent',
  'orchestrator:session-update',
  'orchestrator:tasks-update',
  'orchestrator:assign-tasks',
  'orchestrator:complete',
  'orchestrator:error',
  'orchestrator:toggle-input',
  'project:list-updated',
  'sidebar:toggle'
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
  orchestrator: {
    submitIdea: (idea: string, cwd: string) =>
      ipcRenderer.invoke('orchestrator:submit-idea', { idea, cwd: cwd || '~' }),
    taskCompleted: (taskId: string, panelId: string) =>
      ipcRenderer.invoke('orchestrator:task-completed', { taskId, panelId }),
    taskRunning: (taskId: string, panelId: string) =>
      ipcRenderer.invoke('orchestrator:task-running', { taskId, panelId }),
    taskFailed: (taskId: string, panelId: string, reason?: string) =>
      ipcRenderer.invoke('orchestrator:task-failed', { taskId, panelId, reason }),
    cancel: () =>
      ipcRenderer.invoke('orchestrator:cancel')
  },
  project: {
    list: () =>
      ipcRenderer.invoke('project:list'),
    get: (id: string) =>
      ipcRenderer.invoke('project:get', { id }),
    create: (name: string, path: string) =>
      ipcRenderer.invoke('project:create', { name, path }),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('project:update', { id, data }),
    delete: (id: string) =>
      ipcRenderer.invoke('project:delete', { id })
  },
  dialog: {
    openFolder: () =>
      ipcRenderer.invoke('dialog:open-folder') as Promise<string | null>
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    if (!validChannels.includes(channel)) return () => {}
    const listener = (_event: unknown, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  }
})
