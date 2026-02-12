import { Component, useEffect, type ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import { useTerminalStore, getAllTerminalIds, findNode } from './stores/useTerminalStore'
import { useOrchestratorStore } from './stores/useOrchestratorStore'
import { useProjectStore } from './stores/useProjectStore'
import PanelTree from './components/terminal/PanelTree'
import OrchestratorInput from './components/orchestrator/OrchestratorInput'
import TaskDashboard from './components/orchestrator/TaskDashboard'
import ProjectSidebar from './components/sidebar/ProjectSidebar'
import type { AgentType, OrchestratorSession, OrchestratorTask, PanelNode, Project, TerminalPanel } from './types'

// ─── Error Boundary ──────────────────────────────────────────────

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#F87171', fontFamily: 'monospace', fontSize: 13, background: '#0D0F12', height: '100%' }}>
          <h2 style={{ color: '#D4D4D8', marginBottom: 12 }}>Something crashed</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#FCA5A5' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#71717A', marginTop: 8, fontSize: 11 }}>{this.state.error.stack}</pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 20, padding: '8px 16px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── App ─────────────────────────────────────────────────────────

function hasActiveAgent(root: PanelNode): boolean {
  if (root.type === 'terminal') {
    const panel = root as TerminalPanel
    return panel.agent != null && panel.agent.status !== 'exited'
  }
  return hasActiveAgent(root.first) || hasActiveAgent(root.second)
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  )
}

function AppInner() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTerminalStore()

  // Load projects on mount + listen for updates
  useEffect(() => {
    useProjectStore.getState().loadProjects()

    const unsub = window.api.on('project:list-updated', (...args: unknown[]) => {
      const projects = args[0] as Project[]
      useProjectStore.getState()._setProjects(projects)
    })

    return unsub
  }, [])

  // Create first terminal on mount
  useEffect(() => {
    if (tabs.length === 0) {
      addTab()
    }
  }, [])

  // Listen for IPC-driven shortcuts from main process
  useEffect(() => {
    const unsubs: (() => void)[] = []

    unsubs.push(
      window.api.on('terminal:split-horizontal', () => {
        const store = useTerminalStore.getState()
        const tab = store.tabs.find((t) => t.id === store.activeTabId)
        if (tab) {
          store.splitPanel(tab.focusedPanelId, 'horizontal')
        }
      })
    )

    unsubs.push(
      window.api.on('terminal:split-vertical', () => {
        const store = useTerminalStore.getState()
        const tab = store.tabs.find((t) => t.id === store.activeTabId)
        if (tab) {
          store.splitPanel(tab.focusedPanelId, 'vertical')
        }
      })
    )

    unsubs.push(
      window.api.on('terminal:close-panel', () => {
        const store = useTerminalStore.getState()
        const tab = store.tabs.find((t) => t.id === store.activeTabId)
        if (!tab) return
        const terminalIds = getAllTerminalIds(tab.root)
        if (terminalIds.length <= 1) {
          // Last panel — don't close if it's the only tab
          if (store.tabs.length > 1) {
            store.removeTab(tab.id)
          }
        } else {
          store.closePanel(tab.focusedPanelId)
        }
      })
    )

    unsubs.push(
      window.api.on('terminal:spawn-agent', (...args: unknown[]) => {
        const agentType = (args[0] as AgentType) || 'claude'
        useTerminalStore.getState().addAgentTab(agentType)
      })
    )

    unsubs.push(
      window.api.on('sidebar:toggle', () => {
        useProjectStore.getState().toggleSidebar()
      })
    )

    return () => unsubs.forEach((u) => u())
  }, [])

  // Listen for orchestrator IPC events
  useEffect(() => {
    const unsubs: (() => void)[] = []

    unsubs.push(
      window.api.on('orchestrator:toggle-input', () => {
        useOrchestratorStore.getState().toggleInput()
      })
    )

    unsubs.push(
      window.api.on('orchestrator:session-update', (...args: unknown[]) => {
        try {
          const session = args[0] as OrchestratorSession | null
          setTimeout(() => useOrchestratorStore.getState()._setSession(session), 0)
        } catch (err) {
          console.error('[Orchestrator] session-update error:', err)
        }
      })
    )

    unsubs.push(
      window.api.on('orchestrator:tasks-update', (...args: unknown[]) => {
        try {
          const tasks = args[0] as OrchestratorTask[]
          setTimeout(() => useOrchestratorStore.getState()._setTasks(tasks || []), 0)
        } catch (err) {
          console.error('[Orchestrator] tasks-update error:', err)
        }
      })
    )

    unsubs.push(
      window.api.on('orchestrator:assign-tasks', (...args: unknown[]) => {
        try {
          const payload = args[0] as {
            tasks: Array<{ id: string; title: string; prompt: string }>
            cwd: string
          }
          const tasksToAssign = payload.tasks
          const cwd = payload.cwd
          if (!Array.isArray(tasksToAssign) || tasksToAssign.length === 0) return
          setTimeout(() => {
            useTerminalStore.getState().addTaskTabs(tasksToAssign, cwd)
          }, 50)
        } catch (err) {
          console.error('[Orchestrator] assign-tasks error:', err)
        }
      })
    )

    unsubs.push(
      window.api.on('orchestrator:complete', () => {
        // Session completed — store already updated via session-update
      })
    )

    unsubs.push(
      window.api.on('orchestrator:error', (...args: unknown[]) => {
        const error = args[0] as string
        console.error('[Orchestrator]', error)
      })
    )

    return () => unsubs.forEach((u) => u())
  }, [])

  // Keyboard shortcut: Cmd+T for new tab, Cmd+W to close tab
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 't') {
        e.preventDefault()
        addTab()
      }
      if (e.metaKey && !e.shiftKey && e.key === 'w') {
        e.preventDefault()
        if (activeTabId && tabs.length > 1) {
          removeTab(activeTabId)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTabId, tabs.length])

  const orchestratorSession = useOrchestratorStore((s) => s.session)
  const showDashboard = orchestratorSession != null

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg-main)' }}>
      {/* Title bar + tabs */}
      <div
        className="drag-region flex items-center"
        style={{
          height: 46,
          paddingLeft: 80, // space for traffic lights
          paddingRight: 12,
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
          flexShrink: 0
        }}
      >
        {/* Tabs */}
        <div
          className="no-drag flex items-center gap-1"
          style={{
            flex: 1,
            overflow: 'auto',
            scrollbarWidth: 'none',
            paddingRight: 8
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            const panelCount = getAllTerminalIds(tab.root).length
            const tabHasAgent = hasActiveAgent(tab.root)
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 group"
                style={{
                  padding: '5px 10px',
                  borderRadius: 7,
                  background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                  border: isActive
                    ? '1px solid var(--color-border-active)'
                    : '1px solid transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.12s ease'
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: tabHasAgent
                      ? '#6366F1'
                      : isActive
                        ? 'var(--color-success)'
                        : 'var(--color-text-tertiary)',
                    flexShrink: 0
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap',
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {tab.title}
                </span>
                {panelCount > 1 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--color-text-tertiary)',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '1px 5px',
                      borderRadius: 4
                    }}
                  >
                    {panelCount}
                  </span>
                )}
                {tabs.length > 1 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      removeTab(tab.id)
                    }}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isActive ? 0.5 : 0,
                      transition: 'opacity 0.12s'
                    }}
                    className="group-hover:!opacity-50 hover:!opacity-100"
                  >
                    <X size={11} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* New tab button */}
        <button
          onClick={() => addTab()}
          className="no-drag"
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
            transition: 'all 0.12s',
            flexShrink: 0
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Sidebar + Terminal area + dashboard */}
      <div className="flex-1 flex" style={{ overflow: 'hidden' }}>
        {/* Project sidebar */}
        <ProjectSidebar />

        {/* Terminal area */}
        <div className="flex-1" style={{ position: 'relative', overflow: 'hidden' }}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            return (
              <div
                key={tab.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  visibility: isActive ? 'visible' : 'hidden',
                  zIndex: isActive ? 1 : 0
                }}
              >
                <PanelTree
                  node={tab.root}
                  focusedPanelId={tab.focusedPanelId}
                />
              </div>
            )
          })}
          {/* Orchestrator floating input */}
          <OrchestratorInput />
        </div>

        {/* Task dashboard sidebar */}
        {showDashboard && <TaskDashboard />}
      </div>
    </div>
  )
}
