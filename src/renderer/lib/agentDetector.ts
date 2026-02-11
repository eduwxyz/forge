import type { AgentInfo } from '../types'

const BUFFER_MAX = 2000

// Strip ANSI escape sequences
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]|\x1b\].*?\x07|\x1b\[[\?]?[0-9;]*[hlm]/g

// Claude Code startup patterns
const STARTUP_PATTERNS = [
  /╭.*╮/,
  /╰.*╯/,
  /claude/i,
  /anthropic/i
]

// Active indicators (spinners, working states)
const ACTIVE_PATTERNS = [
  /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/,
  /Thinking/,
  /Reading/,
  /Writing/,
  /Searching/,
  /Running/,
  /Editing/
]

// Idle patterns (prompt waiting for input)
const IDLE_PATTERNS = [
  /^>\s*$/m,
  /❯\s*$/m
]

// Shell prompt returned (agent exited)
const EXIT_PATTERNS = [
  /\$\s*$/m,
  /\x1b\[.*\$/, // colored shell prompt ending with $
  /\[Process exited\]/
]

export function createDetector() {
  let buffer = ''
  let currentStatus: AgentInfo['status'] | null = null
  let detected = false

  function feed(data: string): AgentInfo | null {
    const clean = data.replace(ANSI_RE, '')
    buffer = (buffer + clean).slice(-BUFFER_MAX)

    if (!detected) {
      // Need at least 2 startup patterns to confirm Claude Code
      let matches = 0
      for (const pat of STARTUP_PATTERNS) {
        if (pat.test(buffer)) matches++
      }
      if (matches >= 2) {
        detected = true
        return maybeTransition('active')
      }
      return null
    }

    // Already detected — track status changes
    // Check most recent chunk for status signals
    const recent = buffer.slice(-500)

    for (const pat of ACTIVE_PATTERNS) {
      if (pat.test(recent)) {
        return maybeTransition('active')
      }
    }

    for (const pat of EXIT_PATTERNS) {
      if (pat.test(recent)) {
        return maybeTransition('exited')
      }
    }

    for (const pat of IDLE_PATTERNS) {
      if (pat.test(recent)) {
        return maybeTransition('idle')
      }
    }

    return null
  }

  function maybeTransition(newStatus: AgentInfo['status']): AgentInfo | null {
    if (newStatus === currentStatus) return null
    currentStatus = newStatus
    return { type: 'claude', status: newStatus }
  }

  function reset() {
    buffer = ''
    currentStatus = null
    detected = false
  }

  return { feed, reset }
}
