import { useState } from 'react'
import { Plus, X, FolderOpen } from 'lucide-react'
import { useProjectStore } from '../../stores/useProjectStore'
import type { Project } from '../../types'

export default function ProjectSidebar() {
  const { projects, activeProjectId, sidebarOpen, setActiveProject, deleteProject, createProject, loadProjects } = useProjectStore()
  const [formMode, setFormMode] = useState<'new' | 'import' | null>(null)
  const [formName, setFormName] = useState('')
  const [formPath, setFormPath] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (!sidebarOpen) return null

  const openForm = (mode: 'new' | 'import') => {
    setFormMode(mode)
    setFormName('')
    setFormPath('')
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
  }

  const handleCreate = async () => {
    const name = formName.trim()
    const path = formPath.trim()
    if (!name || !path) return
    await createProject(name, path)
    await loadProjects()
    closeForm()
  }

  const handlePickFolder = async () => {
    const selected = await window.api.dialog.openFolder()
    if (!selected) return
    setFormPath(selected)
    // Auto-fill name from folder basename if empty
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
          <button
            onClick={() => formMode ? closeForm() : handleImport()}
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
              Create
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

      {/* Footer */}
      {hasProjects && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--color-border)',
            fontSize: 11,
            color: '#71717A'
          }}
        >
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
