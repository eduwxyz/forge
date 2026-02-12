import { useOrchestratorStore } from '../../stores/useOrchestratorStore'
import { useTerminalStore, findNode } from '../../stores/useTerminalStore'
import type { TaskStatus } from '../../types'

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: '#52525B',
  assigned: '#FBBF24',
  running: '#6366F1',
  completed: '#34D399',
  failed: '#F87171',
  blocked: '#A78BFA'
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  running: 'Running',
  completed: 'Done',
  failed: 'Failed',
  blocked: 'Blocked'
}

export default function TaskDashboard() {
  const { session, tasks } = useOrchestratorStore()
  const { tabs, setActiveTab } = useTerminalStore()

  if (!session) return null

  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const totalCount = tasks.length

  const handleTaskClick = (panelId: string | null) => {
    if (!panelId) return
    // Find the tab containing this panel and focus it
    for (const tab of tabs) {
      const node = findNode(tab.root, panelId)
      if (node) {
        setActiveTab(tab.id)
        useTerminalStore.getState().setFocusedPanel(panelId)
        break
      }
    }
  }

  return (
    <div
      style={{
        width: 280,
        height: '100%',
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div style={{ fontSize: 11, color: '#71717A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          Orchestrator
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#D4D4D8',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={session.idea}
        >
          {session.idea}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <StatusPill status={session.status} />
          {session.totalCost > 0 && (
            <span style={{ fontSize: 10, color: '#71717A' }}>
              ${session.totalCost.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* Task list */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 0'
        }}
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleTaskClick(task.panelId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              cursor: task.panelId ? 'pointer' : 'default',
              transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => {
              if (task.panelId) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {/* Status dot */}
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: STATUS_COLORS[task.status],
                flexShrink: 0,
                animation: task.status === 'running' ? 'agent-pulse 1.5s ease-in-out infinite' : 'none'
              }}
            />
            {/* Task info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  color: task.status === 'completed' ? '#71717A' : '#D4D4D8',
                  fontWeight: 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                }}
              >
                {task.title}
              </div>
            </div>
            {/* Status label */}
            <span
              style={{
                fontSize: 10,
                color: STATUS_COLORS[task.status],
                fontWeight: 500,
                flexShrink: 0
              }}
            >
              {STATUS_LABELS[task.status]}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ fontSize: 11, color: '#71717A' }}>
          Progress: {completedCount}/{totalCount}
        </span>
        {/* Progress bar */}
        <div
          style={{
            width: 80,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%',
              height: '100%',
              background: '#6366F1',
              borderRadius: 2,
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    idle: { bg: 'rgba(113, 113, 122, 0.15)', text: '#71717A' },
    decomposing: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8' },
    running: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8' },
    completed: { bg: 'rgba(52, 211, 153, 0.15)', text: '#34D399' },
    failed: { bg: 'rgba(248, 113, 113, 0.15)', text: '#F87171' }
  }
  const c = colors[status] || colors.idle

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 4,
        background: c.bg,
        color: c.text,
        textTransform: 'capitalize'
      }}
    >
      {status}
    </span>
  )
}
