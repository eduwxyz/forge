import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { useTerminalStore, findNode } from '../../stores/useTerminalStore'
import { createDetector } from '../../lib/agentDetector'
import type { AgentInfo, TerminalPanel } from '../../types'

interface XTerminalProps {
  id: string
  isFocused: boolean
}

// Terminal theme — dark, warm, easy on the eyes
const THEME = {
  background: '#0D0F12',
  foreground: '#D4D4D8',
  cursor: '#6366F1',
  cursorAccent: '#0D0F12',
  selectionBackground: 'rgba(99, 102, 241, 0.25)',
  selectionForeground: '#FFFFFF',
  black: '#27272A',
  red: '#F87171',
  green: '#34D399',
  yellow: '#FBBF24',
  blue: '#60A5FA',
  magenta: '#C084FC',
  cyan: '#22D3EE',
  white: '#D4D4D8',
  brightBlack: '#52525B',
  brightRed: '#FCA5A5',
  brightGreen: '#6EE7B7',
  brightYellow: '#FDE68A',
  brightBlue: '#93C5FD',
  brightMagenta: '#D8B4FE',
  brightCyan: '#67E8F9',
  brightWhite: '#FAFAFA'
}

export default function XTerminal({ id, isFocused }: XTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const initialized = useRef(false)
  const detectorRef = useRef(createDetector())
  const setFocusedPanel = useTerminalStore((s) => s.setFocusedPanel)
  const setAgentInfo = useTerminalStore((s) => s.setAgentInfo)

  // Read agent info for this panel from the store
  const agentInfo = useTerminalStore((s) => {
    for (const tab of s.tabs) {
      const node = findNode(tab.root, id)
      if (node && node.type === 'terminal') return (node as TerminalPanel).agent ?? null
    }
    return null
  })

  useEffect(() => {
    if (!containerRef.current || initialized.current) return
    initialized.current = true

    const terminal = new Terminal({
      theme: THEME,
      fontFamily: "'SF Mono', 'Cascadia Code', 'JetBrains Mono', Menlo, monospace",
      fontSize: 13,
      lineHeight: 1.4,
      letterSpacing: 0,
      cursorStyle: 'bar',
      cursorBlink: true,
      cursorWidth: 2,
      allowProposedApi: true,
      scrollback: 10000,
      smoothScrollDuration: 100
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(new WebLinksAddon())

    terminal.open(containerRef.current)

    // Try WebGL rendering
    try {
      terminal.loadAddon(new WebglAddon())
    } catch {
      // Fallback to canvas if WebGL not available
    }

    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    // Create PTY with terminal dimensions
    window.api.pty.create(id, terminal.cols, terminal.rows)

    // Auto-launch agent if panel has agent set
    const currentState = useTerminalStore.getState()
    for (const tab of currentState.tabs) {
      const node = findNode(tab.root, id)
      if (node && node.type === 'terminal' && (node as TerminalPanel).agent) {
        setTimeout(() => window.api.pty.write(id, 'claude\n'), 300)
        break
      }
    }

    // Forward user input to PTY
    terminal.onData((data) => {
      window.api.pty.write(id, data)
    })

    // Listen for PTY output
    const unsubData = window.api.on('pty:data', (...args: unknown[]) => {
      const event = args[0] as { id: string; data: string }
      if (event.id === id) {
        terminal.write(event.data)
        const change = detectorRef.current.feed(event.data)
        if (change) {
          useTerminalStore.getState().setAgentInfo(id, change)
        }
      }
    })

    const unsubExit = window.api.on('pty:exit', (...args: unknown[]) => {
      const event = args[0] as { id: string; exitCode: number }
      if (event.id === id) {
        terminal.write('\r\n\x1b[90m[Process exited]\x1b[0m\r\n')
      }
    })

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (fitAddonRef.current && containerRef.current) {
          try {
            fitAddonRef.current.fit()
            if (terminalRef.current) {
              window.api.pty.resize(id, terminalRef.current.cols, terminalRef.current.rows)
            }
          } catch {
            // Ignore fit errors during transitions
          }
        }
      })
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      unsubData()
      unsubExit()
      resizeObserver.disconnect()
      terminal.dispose()
    }
  }, [id])

  // Re-fit when panel gains focus or becomes visible
  useEffect(() => {
    if (isFocused && fitAddonRef.current) {
      requestAnimationFrame(() => {
        try {
          fitAddonRef.current?.fit()
          if (terminalRef.current) {
            terminalRef.current.focus()
          }
        } catch {
          // Ignore
        }
      })
    }
  }, [isFocused])

  const handleClick = () => {
    setFocusedPanel(id)
    terminalRef.current?.focus()
  }

  const hasAgent = agentInfo != null
  const agentActive = agentInfo?.status === 'active'
  const agentExited = agentInfo?.status === 'exited'

  // Agent border: subtle indigo when active and not focused
  const borderColor = isFocused
    ? 'rgba(99, 102, 241, 0.4)'
    : hasAgent && agentActive
      ? 'rgba(99, 102, 241, 0.15)'
      : 'rgba(255, 255, 255, 0.06)'

  return (
    <div
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        border: `1px solid ${borderColor}`,
        boxShadow: isFocused ? '0 0 12px rgba(99, 102, 241, 0.1)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s'
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          padding: '8px 0 0 12px'
        }}
      />

      {/* Agent badge */}
      {hasAgent && (
        <AgentBadge status={agentInfo!.status} exited={agentExited} />
      )}
    </div>
  )
}

// ─── Agent badge overlay ─────────────────────────────────────────

const DOT_COLORS: Record<AgentInfo['status'], string> = {
  starting: '#FBBF24',
  active: '#6366F1',
  idle: '#F59E0B',
  exited: '#52525B'
}

function AgentBadge({ status, exited }: { status: AgentInfo['status']; exited: boolean }) {
  const pulses = status === 'active' || status === 'starting'

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        borderRadius: 6,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none',
        opacity: exited ? 0.4 : 0.85,
        transition: 'opacity 0.3s'
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: DOT_COLORS[status],
          animation: pulses ? 'agent-pulse 1.5s ease-in-out infinite' : 'none'
        }}
      />
      <span style={{ fontSize: 11, color: '#D4D4D8', fontWeight: 500 }}>Claude</span>
      <style>{`
        @keyframes agent-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  )
}
