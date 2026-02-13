import { useState } from 'react'
import { Plus, X, FolderOpen, ChevronDown, ChevronRight, CheckCircle2, XCircle, Settings } from 'lucide-react'
import { useProjectStore } from '../../stores/useProjectStore'
import SettingsPanel from './SettingsPanel'
import type { Project, ProjectSessionRecord } from '../../types'

export default function ProjectSidebar() {
  const { projects, activeProjectId, sidebarOpen, setActiveProject, deleteProject, createProject, createNewProject, loadProjects } = useProjectStore()
  const [formMode, setFormMode] = useState<'new' | 'import' | null>(null)
  const [formName, setFormName] = useState('')
  const [formPath, setFormPath] = useState('')
  const [formError, setFormError] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  if (!sidebarOpen) return null

  const openForm = (mode: 'new' | 'import') => {
    setFormMode(mode)
    setFormName('')
    setFormPath('')
    setFormError('')
  }

  const handleImport = async () => {
    const selected = await window.api.dialog.openFolder()
    if (!selected) return
    const basename = selected.split('/').filter(Boolean).pop() || ''
    setFormPath(selected)
    setFormName(basename)
    setFormMode('import')
  }

  const closeForm = () => {
    setFormMode(null)
    setFormName('')
    setFormPath('')
    setFormError('')
  }

  const handleCreate = async () => {
    const name = formName.trim()
    if (!name) return
    setFormError('')

    try {
      if (formMode === 'new') {
        await createNewProject(name)
      } else {
        const path = formPath.trim()
        if (!path) return
        await createProject(name, path)
      }
      await loadProjects()
      closeForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create project')
    }
  }

  const handlePickFolder = async () => {
    const selected = await window.api.dialog.openFolder()
    if (!selected) return
    setFormPath(selected)
    if (!formName) {
      const basename = selected.split('/').filter(Boolean).pop() || ''
      setFormName(basename)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteProject(id)
    await loadProjects()
  }

  const hasProjects = projects.length > 0
  const activeProject = activeProjectId ? projects.find((p) => p.id === activeProjectId) : null

  return (
    <div
      style={{
        width: 240,
        height: '100%',
        borderRight: '1px solid var(--color-border)',
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
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: '#71717A',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Projects
        </span>
        {hasProjects && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => formMode === 'new' ? closeForm() : openForm('new')}
              title="New project"
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#71717A',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#D4D4D8'
                e.currentTarget.style.borderColor = '#52525B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#71717A'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <Plus size={13} />
            </button>
            <button
              onClick={() => formMode === 'import' ? closeForm() : handleImport()}
              title="Import repo"
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#71717A',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#D4D4D8'
                e.currentTarget.style.borderColor = '#52525B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#71717A'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <FolderOpen size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Inline form */}
      {formMode && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <input
            type="text"
            placeholder="Project name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            style={{
              width: '100%',
              fontSize: 12,
              padding: '6px 8px',
              borderRadius: 5,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-main)',
              color: '#D4D4D8',
              outline: 'none',
              marginBottom: 6
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />
          {formMode === 'import' ? (
            <button
              onClick={handlePickFolder}
              style={{
                width: '100%',
                fontSize: 12,
                padding: '6px 8px',
                borderRadius: 5,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-main)',
                color: formPath ? '#D4D4D8' : '#52525B',
                cursor: 'pointer',
                marginBottom: 8,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                overflow: 'hidden',
                transition: 'border-color 0.12s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <FolderOpen size={12} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formPath || 'Select folder...'}
              </span>
            </button>
          ) : (
            <div style={{ fontSize: 11, color: '#52525B', marginBottom: 8 }}>
              ~/Projects/{formName || '...'}
            </div>
          )}
          {formError && (
            <div style={{ fontSize: 11, color: '#F87171', marginBottom: 6 }}>{formError}</div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleCreate}
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: 500,
                padding: '5px 0',
                borderRadius: 5,
                border: 'none',
                background: '#6366F1',
                color: '#fff',
                cursor: 'pointer',
                transition: 'opacity 0.12s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {formMode === 'new' ? 'Create' : 'Import'}
            </button>
            <button
              onClick={closeForm}
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: 500,
                padding: '5px 0',
                borderRadius: 5,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: '#71717A',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#D4D4D8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#71717A')}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Project list or welcome */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {hasProjects ? (
          projects.map((project: Project) => {
            const isActive = project.id === activeProjectId
            const isHovered = project.id === hoveredId
            return (
              <div
                key={project.id}
                onClick={() => setActiveProject(isActive ? null : project.id)}
                onMouseEnter={(e) => {
                  setHoveredId(project.id)
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
                onMouseLeave={(e) => {
                  setHoveredId(null)
                  e.currentTarget.style.background = 'transparent'
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  transition: 'background 0.1s'
                }}
              >
                {/* Status dot */}
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isActive ? '#6366F1' : '#52525B',
                    flexShrink: 0
                  }}
                />
                {/* Name */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 12,
                    color: isActive ? '#D4D4D8' : '#A1A1AA',
                    fontWeight: isActive ? 500 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={project.path}
                >
                  {project.name}
                </div>
                {/* Delete button on hover */}
                {isHovered && (
                  <div
                    onClick={(e) => handleDelete(e, project.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#52525B',
                      cursor: 'pointer',
                      transition: 'color 0.12s',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#F87171')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#52525B')}
                  >
                    <X size={12} />
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: '32px 16px',
              color: '#52525B'
            }}
          >
            <span style={{ fontSize: 12, color: '#71717A' }}>No projects yet</span>
            <button
              onClick={() => openForm('new')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                padding: '8px 0',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: '#A1A1AA',
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
              <Plus size={13} /> New Project
            </button>
            <button
              onClick={handleImport}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                padding: '8px 0',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: '#A1A1AA',
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
              <FolderOpen size={13} /> Import Repo
            </button>
          </div>
        )}
      </div>

      {/* Session history for active project */}
      {activeProject && activeProject.sessions.length > 0 && (
        <SessionHistory sessions={activeProject.sessions} />
      )}

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--color-border)',
          fontSize: 11,
          color: '#71717A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>
          {hasProjects && `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        </span>
        <button
          onClick={() => setShowSettings(true)}
          title="Settings"
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#71717A',
            transition: 'all 0.12s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#D4D4D8' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#71717A' }}
        >
          <Settings size={12} />
        </button>
      </div>

      {/* Settings overlay */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}

// ─── Session History ─────────────────────────────────────────────

function SessionHistory({ sessions }: { sessions: ProjectSessionRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const sorted = [...sessions].reverse() // newest first

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border)',
        overflow: 'auto',
        maxHeight: 200
      }}
    >
      <div
        style={{
          padding: '10px 16px 6px',
          fontSize: 11,
          color: '#71717A',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        Sessions
      </div>
      {sorted.map((session) => {
        const isExpanded = session.id === expandedId
        const completedTasks = session.tasks.filter((t) => t.status === 'completed').length
        const date = new Date(session.startedAt)
        const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        const isSuccess = session.status === 'completed'

        return (
          <div key={session.id}>
            <div
              onClick={() => setExpandedId(isExpanded ? null : session.id)}
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {isExpanded ? (
                <ChevronDown size={11} style={{ color: '#52525B', flexShrink: 0 }} />
              ) : (
                <ChevronRight size={11} style={{ color: '#52525B', flexShrink: 0 }} />
              )}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 11,
                  color: '#A1A1AA',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={session.idea}
              >
                {session.idea}
              </div>
              <span style={{ fontSize: 10, color: '#52525B', flexShrink: 0 }}>{dateStr}</span>
            </div>
            {isExpanded && (
              <div style={{ padding: '2px 16px 8px 33px' }}>
                <div style={{ fontSize: 10, color: '#52525B', marginBottom: 4 }}>
                  {completedTasks}/{session.tasks.length} tasks
                  {session.totalCost > 0 && ` · $${session.totalCost.toFixed(3)}`}
                  {' · '}
                  <span style={{ color: isSuccess ? '#34D399' : '#F87171' }}>
                    {session.status}
                  </span>
                </div>
                {session.tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '2px 0',
                      fontSize: 11,
                      color: '#71717A'
                    }}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 size={10} style={{ color: '#34D399', flexShrink: 0 }} />
                    ) : (
                      <XCircle size={10} style={{ color: '#F87171', flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
