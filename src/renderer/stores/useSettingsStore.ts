import { create } from 'zustand'
import type { AppSettings } from '../types'

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  loadSettings: () => Promise<void>
  updateSettings: (data: Partial<AppSettings>) => Promise<void>
  _setSettings: (settings: AppSettings) => void
}

const DEFAULT_SETTINGS: AppSettings = {
  shell: '/bin/zsh',
  fontSize: 13,
  theme: 'dark'
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    try {
      const settings = await window.api.settings.get()
      set({ settings, loaded: true })
    } catch (err) {
      console.error('[SettingsStore] loadSettings failed:', err)
      set({ loaded: true })
    }
  },

  updateSettings: async (data) => {
    try {
      const updated = await window.api.settings.update(data)
      set({ settings: updated })
    } catch (err) {
      console.error('[SettingsStore] updateSettings failed:', err)
    }
  },

  _setSettings: (settings) => {
    set({ settings })
  }
}))
