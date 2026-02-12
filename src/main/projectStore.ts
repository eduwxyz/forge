import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

interface ProjectTaskRecord {
  id: string
  title: string
  prompt: string
  dependsOn: string[]
  status: 'completed' | 'failed' | 'blocked'
}

interface ProjectSessionRecord {
  id: string
  idea: string
  status: 'completed' | 'failed'
  totalCost: number
  startedAt: string
  finishedAt: string
  tasks: ProjectTaskRecord[]
}

type ProjectStatus = 'active' | 'archived'

interface Project {
  id: string
  name: string
  path: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  sessions: ProjectSessionRecord[]
}

interface StoreFile {
  version: number
  projects: Project[]
}

const FORGE_DIR = path.join(process.env.HOME || '/', '.forge')
const STORE_PATH = path.join(FORGE_DIR, 'projects.json')

function ensureDir(): void {
  if (!fs.existsSync(FORGE_DIR)) {
    fs.mkdirSync(FORGE_DIR, { recursive: true })
  }
}

function readStore(): StoreFile {
  ensureDir()
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8')
    const data = JSON.parse(raw) as StoreFile
    if (!Array.isArray(data.projects)) {
      return { version: 1, projects: [] }
    }
    return data
  } catch {
    return { version: 1, projects: [] }
  }
}

function writeStore(store: StoreFile): void {
  ensureDir()
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8')
}

export function listProjects(): Project[] {
  return readStore().projects
}

export function getProject(id: string): Project | null {
  return readStore().projects.find((p) => p.id === id) ?? null
}

export function createProject(name: string, projectPath: string): Project {
  const store = readStore()
  const now = new Date().toISOString()
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    path: projectPath,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    sessions: []
  }
  store.projects.push(project)
  writeStore(store)
  return project
}

export function updateProject(
  id: string,
  data: Partial<Pick<Project, 'name' | 'status'>>
): Project | null {
  const store = readStore()
  const project = store.projects.find((p) => p.id === id)
  if (!project) return null
  if (data.name !== undefined) project.name = data.name
  if (data.status !== undefined) project.status = data.status
  project.updatedAt = new Date().toISOString()
  writeStore(store)
  return project
}

export function deleteProject(id: string): void {
  const store = readStore()
  store.projects = store.projects.filter((p) => p.id !== id)
  writeStore(store)
}

export function addSessionToProject(
  projectId: string,
  session: ProjectSessionRecord
): void {
  const store = readStore()
  const project = store.projects.find((p) => p.id === projectId)
  if (!project) return
  project.sessions.push(session)
  project.updatedAt = new Date().toISOString()
  writeStore(store)
}
