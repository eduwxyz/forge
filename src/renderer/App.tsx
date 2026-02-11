import { useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { useTerminalStore, getAllTerminalIds, findNode } from './stores/useTerminalStore'
import PanelTree from './components/terminal/PanelTree'
import type { AgentType, PanelNode, TerminalPanel } from './types'

function hasActiveAgent(root: PanelNode): boolean {
  if (root.type === 'terminal') {
    const panel = root as TerminalPanel
    return panel.agent != null && panel.agent.status !== 'exited'
  }
  return hasActiveAgent(root.first) || hasActiveAgent(root.second)
}

export default function App() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTerminalStore()

  const activeTab = tabs.find((t) => t.id === activeTabId)

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

      {/* Terminal area — render PanelTree for active tab */}
      <div className="flex-1" style={{ position: 'relative', overflow: 'hidden' }}>
        {activeTab && (
          <PanelTree
            node={activeTab.root}
            focusedPanelId={activeTab.focusedPanelId}
          />
        )}
      </div>
    </div>
  )
}
