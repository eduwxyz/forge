import { useRef, useEffect } from 'react'
import { Send, X, Loader2 } from 'lucide-react'
import { useOrchestratorStore } from '../../stores/useOrchestratorStore'
import { useTerminalStore } from '../../stores/useTerminalStore'
import { useProjectStore } from '../../stores/useProjectStore'

export default function OrchestratorInput() {
  const { session, tasks, showInput, inputValue, submitIdea, cancel, setInputValue } =
    useOrchestratorStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showInput) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [showInput])

  const handleSubmit = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    const termState = useTerminalStore.getState()
    const activeTab = termState.tabs.find((t) => t.id === termState.activeTabId)
    const projectCwd = useProjectStore.getState().getActiveCwd()
    const cwd = activeTab?.cwd || projectCwd || '~'
    submitIdea(trimmed, cwd)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      useOrchestratorStore.getState().toggleInput()
    }
  }

  if (!showInput && !session) return null

  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const totalCount = tasks.length
  const isDecomposing = session?.status === 'decomposing'
  const isRunning = session?.status === 'running'
  const isCompleted = session?.status === 'completed'
  const isFailed = session?.status === 'failed'

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: '100%',
        maxWidth: 600,
        padding: '0 16px'
      }}
    >
      <div
        style={{
          background: 'rgba(13, 15, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        {/* Input row */}
        {showInput && !session && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your idea... (e.g. create a REST API with auth)"
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#D4D4D8',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button
              onClick={handleSubmit}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: 'none',
                background: inputValue.trim() ? '#6366F1' : 'rgba(255, 255, 255, 0.06)',
                color: inputValue.trim() ? '#fff' : '#71717A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s'
              }}
            >
              <Send size={14} />
            </button>
          </div>
        )}

        {/* Status row when session is active */}
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDecomposing && (
              <>
                <Loader2 size={14} style={{ color: '#6366F1', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 12, color: '#A1A1AA' }}>Decomposing idea into tasks...</span>
              </>
            )}
            {isRunning && (
              <>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#6366F1',
                    animation: 'agent-pulse 1.5s ease-in-out infinite'
                  }}
                />
                <span style={{ fontSize: 12, color: '#A1A1AA' }}>
                  Running {completedCount}/{totalCount} tasks
                </span>
              </>
            )}
            {isCompleted && (
              <>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} />
                <span style={{ fontSize: 12, color: '#34D399' }}>
                  All {totalCount} tasks completed
                </span>
              </>
            )}
            {isFailed && (
              <>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F87171' }} />
                <span style={{ fontSize: 12, color: '#F87171' }}>
                  {session.error || 'Failed'}
                </span>
              </>
            )}
            <div style={{ flex: 1 }} />
            <button
              onClick={cancel}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: 'none',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#71717A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}
