import { create } from 'zustand'
import type { Project } from '../types'

interface ProjectState {
  projects: Project[]
  activeProjectId: string | null
  loading: boolean
  loaded: boolean
  sidebarOpen: boolean

  loadProjects: () => Promise<void>
  createProject: (name: string, path: string) => Promise<Project>
  createNewProject: (name: string) => Promise<Project>
  updateProject: (id: string, data: Partial<Pick<Project, 'name' | 'status'>>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setActiveProject: (id: string | null) => void
  toggleSidebar: () => void
  getActiveCwd: () => string | undefined
  _setProjects: (projects: Project[]) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  loading: false,
  loaded: false,
  sidebarOpen: false,

  loadProjects: async () => {
    set({ loading: true })
    try {
      const projects = await window.api.project.list()
      set({ projects, loading: false, loaded: true })
    } catch (err) {
      console.error('[ProjectStore] loadProjects failed:', err)
      set({ loading: false, loaded: true })
    }
  },

  createProject: async (name, path) => {
    const project = await window.api.project.create(name, path)
    return project
  },

  createNewProject: async (name) => {
    const project = await window.api.project.createNew(name)
    return project
  },

  updateProject: async (id, data) => {
    await window.api.project.update(id, data)
  },

  deleteProject: async (id) => {
    await window.api.project.delete(id)
    set((state) => ({
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId
    }))
  },

  setActiveProject: (id) => {
    set({ activeProjectId: id })
  },

  toggleSidebar: () => {
    set((s) => ({ sidebarOpen: !s.sidebarOpen }))
  },

  getActiveCwd: () => {
    const { projects, activeProjectId } = get()
    if (!activeProjectId) return undefined
    const project = projects.find((p) => p.id === activeProjectId)
    return project?.path
  },

  _setProjects: (projects) => {
    set({ projects })
  }
}))
