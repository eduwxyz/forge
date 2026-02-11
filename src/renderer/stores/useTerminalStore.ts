import { create } from 'zustand'
import type { TerminalTab } from '../types'

interface TerminalState {
  tabs: TerminalTab[]
  activeTabId: string | null
  addTab: (cwd?: string) => TerminalTab
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabTitle: (id: string, title: string) => void
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (cwd?: string) => {
    const tab: TerminalTab = {
      id: crypto.randomUUID(),
      title: 'Terminal',
      cwd: cwd || '~'
    }
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id
    }))
    return tab
  },

  removeTab: (id: string) => {
    const { tabs, activeTabId } = get()
    const newTabs = tabs.filter((t) => t.id !== id)
    let newActive = activeTabId
    if (activeTabId === id) {
      const idx = tabs.findIndex((t) => t.id === id)
      newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id || null
    }
    set({ tabs: newTabs, activeTabId: newActive })
    window.api.pty.close(id)
  },

  setActiveTab: (id: string) => set({ activeTabId: id }),

  updateTabTitle: (id: string, title: string) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, title } : t))
    }))
}))
