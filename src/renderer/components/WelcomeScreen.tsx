import { Plus, FolderOpen, Terminal, Zap } from 'lucide-react'
import { useProjectStore } from '../stores/useProjectStore'

export default function WelcomeScreen() {
  const { createNewProject, loadProjects, toggleSidebar, sidebarOpen } = useProjectStore()

  const handleNew = async () => {
    if (!sidebarOpen) toggleSidebar()
    // Small delay so sidebar opens first, then show form
    setTimeout(() => {
      // The sidebar will show its empty state with New Project button
    }, 50)
  }

  const handleImport = async () => {
    const selected = await window.api.dialog.openFolder()
    if (!selected) return
    const basename = selected.split('/').filter(Boolean).pop() || ''
    await useProjectStore.getState().createProject(basename, selected)
    await loadProjects()
    useProjectStore.getState().setActiveProject(
      useProjectStore.getState().projects[useProjectStore.getState().projects.length - 1]?.id ?? null
    )
    if (!sidebarOpen) toggleSidebar()
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        background: 'var(--color-bg-main)',
        padding: 40
      }}
    >
      {/* Logo / Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <Zap size={24} style={{ color: '#6366F1' }} />
          <span style={{ fontSize: 24, fontWeight: 600, color: '#D4D4D8' }}>Forge</span>
        </div>
        <p style={{ fontSize: 13, color: '#71717A', maxWidth: 360, lineHeight: '1.5' }}>
          Plan, execute, and ship with AI agents.
          Start by creating a new project or importing an existing repo.
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleNew}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#6366F1',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'opacity 0.12s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={15} /> New Project
        </button>
        <button
          onClick={handleImport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: '#A1A1AA',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.12s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6366F1'
            e.currentTarget.style.color = '#D4D4D8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.color = '#A1A1AA'
          }}
        >
          <FolderOpen size={15} /> Import Repo
        </button>
      </div>

      {/* Keyboard shortcut hints */}
      <div style={{ display: 'flex', gap: 20, color: '#52525B', fontSize: 11 }}>
        <span>
          <kbd style={{ padding: '2px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginRight: 4 }}>
            Cmd+B
          </kbd>
          sidebar
        </span>
        <span>
          <kbd style={{ padding: '2px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginRight: 4 }}>
            Cmd+T
          </kbd>
          terminal
        </span>
        <span>
          <kbd style={{ padding: '2px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginRight: 4 }}>
            Cmd+Shift+O
          </kbd>
          orchestrator
        </span>
      </div>
    </div>
  )
}
