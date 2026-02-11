import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { WebLinksAddon } from '@xterm/addon-web-links'

interface XTerminalProps {
  id: string
  isActive: boolean
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

export default function XTerminal({ id, isActive }: XTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const initialized = useRef(false)

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

    // Forward user input to PTY
    terminal.onData((data) => {
      window.api.pty.write(id, data)
    })

    // Listen for PTY output
    const unsubData = window.api.on('pty:data', (...args: unknown[]) => {
      const event = args[0] as { id: string; data: string }
      if (event.id === id) {
        terminal.write(event.data)
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

  // Re-fit when tab becomes active
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      requestAnimationFrame(() => {
        try {
          fitAddonRef.current?.fit()
        } catch {
          // Ignore
        }
      })
    }
  }, [isActive])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: isActive ? 'block' : 'none',
        padding: '8px 0 0 12px'
      }}
    />
  )
}
