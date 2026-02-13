import fs from 'fs'
import path from 'path'

export interface AppSettings {
  shell: string
  fontSize: number
  theme: 'dark'
}

const FORGE_DIR = path.join(process.env.HOME || '/', '.forge')
const SETTINGS_PATH = path.join(FORGE_DIR, 'settings.json')

const DEFAULT_SETTINGS: AppSettings = {
  shell: process.env.SHELL || '/bin/zsh',
  fontSize: 13,
  theme: 'dark'
}

function ensureDir(): void {
  if (!fs.existsSync(FORGE_DIR)) {
    fs.mkdirSync(FORGE_DIR, { recursive: true })
  }
}

export function getSettings(): AppSettings {
  ensureDir()
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    const data = JSON.parse(raw) as Partial<AppSettings>
    return { ...DEFAULT_SETTINGS, ...data }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function updateSettings(data: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated = { ...current, ...data }
  ensureDir()
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}
