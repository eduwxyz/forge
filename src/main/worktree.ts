import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const FORGE_DIR = path.join(process.env.HOME || '/', '.forge')
const WORKTREES_DIR = path.join(FORGE_DIR, 'worktrees')

function isGitRepo(dir: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: dir, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function getGitRoot(dir: string): string {
  return execSync('git rev-parse --show-toplevel', { cwd: dir, encoding: 'utf-8' }).trim()
}

function hasAnyCommits(dir: string): boolean {
  try {
    execSync('git rev-parse HEAD', { cwd: dir, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Create a git worktree for a task.
 * Returns the worktree path, or null if the cwd is not a git repo.
 */
export function createWorktree(
  cwd: string,
  sessionId: string,
  taskId: string
): string | null {
  if (!isGitRepo(cwd)) return null
  if (!hasAnyCommits(cwd)) return null

  const gitRoot = getGitRoot(cwd)
  const worktreePath = path.join(WORKTREES_DIR, sessionId, `task-${taskId}`)

  if (!fs.existsSync(path.dirname(worktreePath))) {
    fs.mkdirSync(path.dirname(worktreePath), { recursive: true })
  }

  const branchName = `forge/task-${taskId}`

  try {
    execSync(`git worktree add -b "${branchName}" "${worktreePath}"`, {
      cwd: gitRoot,
      stdio: 'ignore'
    })
  } catch {
    // Branch may already exist — try without -b
    try {
      execSync(`git worktree add "${worktreePath}" "${branchName}"`, {
        cwd: gitRoot,
        stdio: 'ignore'
      })
    } catch (err) {
      console.error(`[Worktree] Failed to create worktree for task ${taskId}:`, err)
      return null
    }
  }

  return worktreePath
}

/**
 * Remove a worktree and its branch.
 */
export function removeWorktree(cwd: string, sessionId: string, taskId: string): void {
  const worktreePath = path.join(WORKTREES_DIR, sessionId, `task-${taskId}`)

  if (!isGitRepo(cwd)) return

  const gitRoot = getGitRoot(cwd)
  const branchName = `forge/task-${taskId}`

  try {
    execSync(`git worktree remove "${worktreePath}" --force`, {
      cwd: gitRoot,
      stdio: 'ignore'
    })
  } catch {
    // Worktree may not exist anymore — force cleanup
    if (fs.existsSync(worktreePath)) {
      fs.rmSync(worktreePath, { recursive: true, force: true })
    }
    try {
      execSync('git worktree prune', { cwd: gitRoot, stdio: 'ignore' })
    } catch { /* ignore */ }
  }

  // Clean up the branch
  try {
    execSync(`git branch -D "${branchName}"`, { cwd: gitRoot, stdio: 'ignore' })
  } catch { /* branch may not exist */ }
}

/**
 * Clean up all worktrees for a session.
 */
export function cleanupSessionWorktrees(cwd: string, sessionId: string): void {
  const sessionDir = path.join(WORKTREES_DIR, sessionId)
  if (!fs.existsSync(sessionDir)) return

  if (!isGitRepo(cwd)) {
    // Just remove the directory
    fs.rmSync(sessionDir, { recursive: true, force: true })
    return
  }

  const gitRoot = getGitRoot(cwd)

  // List task dirs and remove each worktree
  try {
    const entries = fs.readdirSync(sessionDir)
    for (const entry of entries) {
      const taskIdMatch = entry.match(/^task-(.+)$/)
      if (taskIdMatch) {
        const taskId = taskIdMatch[1]
        removeWorktree(gitRoot, sessionId, taskId)
      }
    }
  } catch { /* ignore */ }

  // Remove session dir
  try {
    fs.rmSync(sessionDir, { recursive: true, force: true })
  } catch { /* ignore */ }

  try {
    execSync('git worktree prune', { cwd: gitRoot, stdio: 'ignore' })
  } catch { /* ignore */ }
}

/**
 * Copy .env and other gitignored config files from the main repo to a worktree.
 */
export function copyIgnoredFiles(gitRoot: string, worktreePath: string): void {
  const filesToCopy = ['.env', '.env.local', '.env.development', '.env.production']

  for (const file of filesToCopy) {
    const src = path.join(gitRoot, file)
    const dst = path.join(worktreePath, file)
    if (fs.existsSync(src)) {
      try {
        fs.copyFileSync(src, dst)
      } catch (err) {
        console.error(`[Worktree] Failed to copy ${file}:`, err)
      }
    }
  }
}
