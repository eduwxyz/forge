import { useState } from 'react'
import { X } from 'lucide-react'
import { useSettingsStore } from '../../stores/useSettingsStore'

const SHELL_OPTIONS = [
  { label: 'zsh', value: '/bin/zsh' },
  { label: 'bash', value: '/bin/bash' },
  { label: 'fish', value: '/opt/homebrew/bin/fish' },
  { label: 'sh', value: '/bin/sh' }
]

const FONT_SIZES = [11, 12, 13, 14, 15, 16, 18]

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useSettingsStore()
  const [shell, setShell] = useState(settings.shell)
  const [fontSize, setFontSize] = useState(settings.fontSize)

  const handleShellChange = (value: string) => {
    setShell(value)
    updateSettings({ shell: value })
  }

  const handleFontSizeChange = (value: number) => {
    setFontSize(value)
    updateSettings({ fontSize: value })
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--color-bg-surface)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
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
        <span style={{ fontSize: 11, color: '#71717A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Settings
        </span>
        <button
          onClick={onClose}
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
          <X size={13} />
        </button>
      </div>

      {/* Settings form */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Shell */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Default Shell
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {SHELL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleShellChange(opt.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 5,
                  border: shell === opt.value ? '1px solid #6366F1' : '1px solid var(--color-border)',
                  background: shell === opt.value ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: shell === opt.value ? '#A5B4FC' : '#71717A',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.12s'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={shell}
            onChange={(e) => handleShellChange(e.target.value)}
            style={{
              width: '100%',
              marginTop: 6,
              fontSize: 11,
              padding: '5px 8px',
              borderRadius: 5,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-main)',
              color: '#D4D4D8',
              outline: 'none'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Font Size */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Terminal Font Size
          </label>
          <div style={{ display: 'flex', gap: 4 }}>
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => handleFontSizeChange(size)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 5,
                  border: fontSize === size ? '1px solid #6366F1' : '1px solid var(--color-border)',
                  background: fontSize === size ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: fontSize === size ? '#A5B4FC' : '#71717A',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  minWidth: 28,
                  textAlign: 'center'
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Theme (read-only for now) */}
        <div>
          <label style={{ fontSize: 11, color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Theme
          </label>
          <div
            style={{
              padding: '5px 10px',
              borderRadius: 5,
              border: '1px solid #6366F1',
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#A5B4FC',
              fontSize: 11,
              display: 'inline-block'
            }}
          >
            Dark
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)', fontSize: 10, color: '#52525B' }}>
        Changes apply to new terminals
      </div>
    </div>
  )
}
