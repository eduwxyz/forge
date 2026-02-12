import { create } from 'zustand'
import type { AgentInfo, AgentType, PanelNode, SplitPanel, TerminalPanel, TerminalTab } from '../types'

// ─── Tree utilities ───────────────────────────────────────────────

export function findNode(root: PanelNode, id: string): PanelNode | null {
  if (root.id === id) return root
  if (root.type === 'split') {
    return findNode(root.first, id) || findNode(root.second, id)
  }
  return null
}

export function findParent(
  root: PanelNode,
  id: string
): { parent: SplitPanel; which: 'first' | 'second' } | null {
  if (root.type === 'split') {
    if (root.first.id === id) return { parent: root, which: 'first' }
    if (root.second.id === id) return { parent: root, which: 'second' }
    return findParent(root.first, id) || findParent(root.second, id)
  }
  return null
}

export function replaceNode(root: PanelNode, id: string, replacement: PanelNode): PanelNode {
  if (root.id === id) return replacement
  if (root.type === 'split') {
    return {
      ...root,
      first: replaceNode(root.first, id, replacement),
      second: replaceNode(root.second, id, replacement)
    }
  }
  return root
}

export function getAllTerminalIds(root: PanelNode): string[] {
  if (root.type === 'terminal') return [root.id]
  return [...getAllTerminalIds(root.first), ...getAllTerminalIds(root.second)]
}

// ─── Store ────────────────────────────────────────────────────────

interface TerminalState {
  tabs: TerminalTab[]
  activeTabId: string | null

  addTab: (cwd?: string) => TerminalTab
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabTitle: (id: string, title: string) => void

  splitPanel: (panelId: string, direction: 'horizontal' | 'vertical') => string | null
  closePanel: (panelId: string) => void
  setFocusedPanel: (panelId: string) => void
  setSplitRatio: (splitId: string, ratio: number) => void

  setAgentInfo: (panelId: string, agent: AgentInfo) => void
  addAgentTab: (agentType: AgentType, cwd?: string) => TerminalTab
  addTaskTab: (taskId: string, taskTitle: string, taskPrompt: string, cwd?: string) => TerminalTab
  addTaskTabs: (tasks: Array<{ id: string; title: string; prompt: string }>, cwd?: string) => void
}

function makeTerminalPanel(): TerminalPanel {
  return { type: 'terminal', id: crypto.randomUUID() }
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (cwd?: string) => {
    const panel = makeTerminalPanel()
    const tab: TerminalTab = {
      id: crypto.randomUUID(),
      title: 'Terminal',
      cwd: cwd || '~',
      root: panel,
      focusedPanelId: panel.id
    }
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id
    }))
    return tab
  },

  removeTab: (id: string) => {
    const { tabs, activeTabId } = get()
    const tab = tabs.find((t) => t.id === id)
    if (tab) {
      // Close all PTYs in this tab
      const terminalIds = getAllTerminalIds(tab.root)
      terminalIds.forEach((tid) => window.api.pty.close(tid))
    }
    const newTabs = tabs.filter((t) => t.id !== id)
    let newActive = activeTabId
    if (activeTabId === id) {
      const idx = tabs.findIndex((t) => t.id === id)
      newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id || null
    }
    set({ tabs: newTabs, activeTabId: newActive })
  },

  setActiveTab: (id: string) => set({ activeTabId: id }),

  updateTabTitle: (id: string, title: string) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, title } : t))
    })),

  splitPanel: (panelId, direction) => {
    const state = get()
    const tab = state.tabs.find((t) => t.id === state.activeTabId)
    if (!tab) return null

    const target = findNode(tab.root, panelId)
    if (!target) return null

    const newPanel = makeTerminalPanel()
    const split: SplitPanel = {
      type: 'split',
      id: crypto.randomUUID(),
      direction,
      first: target,
      second: newPanel,
      ratio: 0.5
    }

    const newRoot = replaceNode(tab.root, panelId, split)
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tab.id ? { ...t, root: newRoot, focusedPanelId: newPanel.id } : t
      )
    }))
    return newPanel.id
  },

  closePanel: (panelId) => {
    const state = get()
    const tab = state.tabs.find((t) => t.id === state.activeTabId)
    if (!tab) return

    // If root is the panel itself, close the tab
    if (tab.root.id === panelId) {
      get().removeTab(tab.id)
      return
    }

    // Find parent split, promote sibling
    const result = findParent(tab.root, panelId)
    if (!result) return

    // Close the PTY for the removed panel
    const closedNode = result.which === 'first' ? result.parent.first : result.parent.second
    getAllTerminalIds(closedNode).forEach((tid) => window.api.pty.close(tid))

    const sibling = result.which === 'first' ? result.parent.second : result.parent.first
    const newRoot = replaceNode(tab.root, result.parent.id, sibling)

    // Pick new focus
    const terminalIds = getAllTerminalIds(sibling)
    const newFocusId = terminalIds[0] || sibling.id

    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tab.id ? { ...t, root: newRoot, focusedPanelId: newFocusId } : t
      )
    }))
  },

  setFocusedPanel: (panelId) => {
    const state = get()
    const tab = state.tabs.find((t) => t.id === state.activeTabId)
    if (!tab) return
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tab.id ? { ...t, focusedPanelId: panelId } : t))
    }))
  },

  setSplitRatio: (splitId, ratio) => {
    const clamped = Math.min(0.9, Math.max(0.1, ratio))
    const state = get()
    const tab = state.tabs.find((t) => t.id === state.activeTabId)
    if (!tab) return

    const node = findNode(tab.root, splitId)
    if (!node || node.type !== 'split') return

    const updated = { ...node, ratio: clamped }
    const newRoot = replaceNode(tab.root, splitId, updated)
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tab.id ? { ...t, root: newRoot } : t))
    }))
  },

  setAgentInfo: (panelId, agent) => {
    const state = get()
    for (const tab of state.tabs) {
      const node = findNode(tab.root, panelId)
      if (node && node.type === 'terminal') {
        const updated: TerminalPanel = { ...node, agent }
        const newRoot = replaceNode(tab.root, panelId, updated)
        const newTitle = agent.type === 'claude' ? 'Claude Code' : tab.title
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === tab.id ? { ...t, root: newRoot, title: newTitle } : t
          )
        }))
        return
      }
    }
  },

  addAgentTab: (agentType, cwd?) => {
    const panel: TerminalPanel = {
      type: 'terminal',
      id: crypto.randomUUID(),
      agent: { type: agentType, status: 'starting' }
    }
    const tab: TerminalTab = {
      id: crypto.randomUUID(),
      title: 'Claude Code',
      cwd: cwd || '~',
      root: panel,
      focusedPanelId: panel.id
    }
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id
    }))
    return tab
  },

  addTaskTab: (taskId, taskTitle, taskPrompt, cwd?) => {
    const panel: TerminalPanel = {
      type: 'terminal',
      id: crypto.randomUUID(),
      agent: { type: 'claude', status: 'starting' },
      taskId,
      taskPrompt
    }
    const tab: TerminalTab = {
      id: crypto.randomUUID(),
      title: taskTitle,
      cwd: cwd || '~',
      root: panel,
      focusedPanelId: panel.id
    }
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id
    }))
    return tab
  },

  addTaskTabs: (tasks, cwd?) => {
    const newTabs: TerminalTab[] = tasks.map((t) => {
      const panel: TerminalPanel = {
        type: 'terminal',
        id: crypto.randomUUID(),
        agent: { type: 'claude', status: 'starting' },
        taskId: t.id,
        taskPrompt: t.prompt
      }
      return {
        id: crypto.randomUUID(),
        title: t.title,
        cwd: cwd || '~',
        root: panel,
        focusedPanelId: panel.id
      }
    })
    if (newTabs.length === 0) return
    // Single set() call — one re-render
    set((state) => ({
      tabs: [...state.tabs, ...newTabs],
      activeTabId: newTabs[0].id
    }))
  }
}))
