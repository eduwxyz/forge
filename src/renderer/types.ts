export interface TerminalTab {
  id: string
  title: string
  cwd: string
}

declare global {
  interface Window {
    api: {
      pty: {
        create: (id: string, cols: number, rows: number, cwd?: string) => Promise<void>
        write: (id: string, data: string) => Promise<void>
        resize: (id: string, cols: number, rows: number) => Promise<void>
        close: (id: string) => Promise<void>
      }
      on: (channel: string, callback: (...args: unknown[]) => void) => () => void
    }
  }
}
