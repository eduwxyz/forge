import { useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { useTerminalStore } from './stores/useTerminalStore'
import XTerminal from './components/terminal/XTerminal'

export default function App() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTerminalStore()

  // Create first terminal on mount
  useEffect(() => {
    if (tabs.length === 0) {
      addTab()
    }
  }, [])

  // Keyboard shortcut: Cmd+T for new tab, Cmd+W to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 't') {
        e.preventDefault()
        addTab()
      }
      if (e.metaKey && e.key === 'w') {
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
                    background: isActive ? 'var(--color-success)' : 'var(--color-text-tertiary)',
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

      {/* Terminal area */}
      <div className="flex-1" style={{ position: 'relative', overflow: 'hidden' }}>
        {tabs.map((tab) => (
          <XTerminal key={tab.id} id={tab.id} isActive={tab.id === activeTabId} />
        ))}
      </div>
    </div>
  )
}
