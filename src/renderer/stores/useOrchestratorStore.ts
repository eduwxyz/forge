import { create } from 'zustand'
import type { OrchestratorSession, OrchestratorTask, TaskStatus } from '../types'

interface OrchestratorState {
  session: OrchestratorSession | null
  tasks: OrchestratorTask[]
  showInput: boolean
  inputValue: string

  submitIdea: (idea: string, cwd: string) => void
  cancel: () => void
  toggleInput: () => void
  setInputValue: (v: string) => void

  _setSession: (session: OrchestratorSession | null) => void
  _setTasks: (tasks: OrchestratorTask[]) => void
  _updateTaskStatus: (taskId: string, status: TaskStatus, panelId?: string) => void
}

export const useOrchestratorStore = create<OrchestratorState>((set, get) => ({
  session: null,
  tasks: [],
  showInput: false,
  inputValue: '',

  submitIdea: (idea: string, cwd: string) => {
    window.api.orchestrator.submitIdea(idea, cwd)
    set({ inputValue: '', showInput: false })
  },

  cancel: () => {
    window.api.orchestrator.cancel()
    set({ session: null, tasks: [] })
  },

  toggleInput: () => {
    set((s) => ({ showInput: !s.showInput }))
  },

  setInputValue: (v: string) => set({ inputValue: v }),

  _setSession: (session) => set({ session }),

  _setTasks: (rawTasks) => {
    const tasks: OrchestratorTask[] = rawTasks.map((t) => ({
      id: t.id,
      title: t.title,
      prompt: t.prompt,
      dependsOn: t.dependsOn || [],
      status: t.status || 'pending',
      panelId: t.panelId || null
    }))
    set({ tasks })
  },

  _updateTaskStatus: (taskId, status, panelId) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status, panelId: panelId || t.panelId } : t
      )
    }))
  }
}))
