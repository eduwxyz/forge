// === Agent types ===

export type AgentType = 'claude' // futuro: | 'codex' | 'gemini'
export type AgentStatus = 'starting' | 'active' | 'idle' | 'exited'
export interface AgentInfo {
  type: AgentType
  status: AgentStatus
}

// === Orchestrator types ===

export type TaskStatus = 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'blocked'

export interface OrchestratorTask {
  id: string
  title: string
  prompt: string
  dependsOn: string[]
  status: TaskStatus
  panelId: string | null
}

export interface OrchestratorSession {
  id: string
  idea: string
  status: 'idle' | 'decomposing' | 'running' | 'completed' | 'failed'
  error?: string
  totalCost: number
}

// === Panel tree types ===

export interface TerminalPanel {
  type: 'terminal'
  id: string // unique panel id, also used as PTY id
  agent?: AgentInfo // undefined = shell normal
  taskId?: string
  taskPrompt?: string
}

export interface SplitPanel {
  type: 'split'
  id: string
  direction: 'horizontal' | 'vertical'
  first: PanelNode
  second: PanelNode
  ratio: number // 0-1, divider position
}

export type PanelNode = TerminalPanel | SplitPanel

export interface TerminalTab {
  id: string
  title: string
  cwd: string
  root: PanelNode
  focusedPanelId: string
}

// === Window API ===

declare global {
  interface Window {
    api: {
      pty: {
        create: (id: string, cols: number, rows: number, cwd?: string) => Promise<void>
        write: (id: string, data: string) => Promise<void>
        resize: (id: string, cols: number, rows: number) => Promise<void>
        close: (id: string) => Promise<void>
      }
      orchestrator: {
        submitIdea: (idea: string, cwd: string) => Promise<void>
        taskCompleted: (taskId: string, panelId: string) => Promise<void>
        taskRunning: (taskId: string, panelId: string) => Promise<void>
        taskFailed: (taskId: string, panelId: string, reason?: string) => Promise<void>
        cancel: () => Promise<void>
      }
      on: (channel: string, callback: (...args: unknown[]) => void) => () => void
    }
  }
}
