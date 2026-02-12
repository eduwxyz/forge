import { BrowserWindow } from 'electron'
import { query } from '@anthropic-ai/claude-code'
import { parseTasksFromResponse } from './parser'
import { addSessionToProject, listProjects as listAllProjects } from './projectStore'

const MAX_CONCURRENT = 3
const TASK_TIMEOUT_MS = 15 * 60 * 1000

interface TaskState {
  id: string
  title: string
  prompt: string
  dependsOn: string[]
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'blocked'
  panelId: string | null
  error?: string
  startedAt?: number
}

interface Session {
  id: string
  idea: string
  status: 'idle' | 'decomposing' | 'running' | 'completed' | 'failed'
  error?: string
  totalCost: number
}

export function createOrchestrator(mainWindow: BrowserWindow) {
  let session: Session | null = null
  let tasks: TaskState[] = []
  let abortController: AbortController | null = null
  let sessionCwd: string = process.env.HOME || '/'
  let currentProjectId: string | undefined
  let sessionStartedAt: string | undefined

  setInterval(() => {
    if (!session || session.status !== 'running') return
    const now = Date.now()
    let changed = false

    for (const task of tasks) {
      if (task.status !== 'running') continue
      if (!task.startedAt) continue
      if (now - task.startedAt < TASK_TIMEOUT_MS) continue

      task.status = 'failed'
      task.error = `Task timed out after ${Math.round(TASK_TIMEOUT_MS / 60000)} minutes`
      changed = true
    }

    if (changed) {
      emitTasks()
      assignNextTasks()
    }
  }, 5000)

  function send(channel: string, data: unknown) {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data)
    }
  }

  function emitSession() {
    send('orchestrator:session-update', session)
  }

  function emitTasks() {
    send('orchestrator:tasks-update', tasks)
  }

  function isTaskFinal(status: TaskState['status']) {
    return status === 'completed' || status === 'failed' || status === 'blocked'
  }

  function blockUnrunnableTasks(): boolean {
    let changed = false
    let keepLooping = true

    while (keepLooping) {
      keepLooping = false
      for (const task of tasks) {
        if (task.status !== 'pending') continue

        let reason: string | null = null
        for (const depId of task.dependsOn) {
          const dep = tasks.find((d) => d.id === depId)
          if (!dep) {
            reason = `Dependency ${depId} not found`
            break
          }
          if (dep.status === 'failed' || dep.status === 'blocked') {
            reason = `Dependency ${dep.id} ended as ${dep.status}`
            break
          }
        }

        if (reason) {
          task.status = 'blocked'
          task.error = reason
          changed = true
          keepLooping = true
        }
      }
    }

    return changed
  }

  function finalizeSessionIfDone() {
    if (!session || session.status === 'completed' || session.status === 'failed') return
    if (tasks.length === 0) return

    const allFinal = tasks.every((t) => isTaskFinal(t.status))
    if (!allFinal) return

    const failedCount = tasks.filter((t) => t.status === 'failed').length
    const blockedCount = tasks.filter((t) => t.status === 'blocked').length

    if (failedCount > 0 || blockedCount > 0) {
      session.status = 'failed'
      session.error = `${failedCount} failed, ${blockedCount} blocked`
      persistSession('failed')
      emitSession()
      send('orchestrator:error', session.error)
      return
    }

    session.status = 'completed'
    persistSession('completed')
    emitSession()
    send('orchestrator:complete', null)
  }

  function persistSession(status: 'completed' | 'failed') {
    if (!currentProjectId || !session || !sessionStartedAt) return

    const sessionRecord = {
      id: session.id,
      idea: session.idea,
      status,
      totalCost: session.totalCost,
      startedAt: sessionStartedAt,
      finishedAt: new Date().toISOString(),
      tasks: tasks.filter((t) => t.status === 'completed' || t.status === 'failed' || t.status === 'blocked').map((t) => ({
        id: t.id,
        title: t.title,
        prompt: t.prompt,
        dependsOn: t.dependsOn,
        status: t.status as 'completed' | 'failed' | 'blocked'
      }))
    }

    addSessionToProject(currentProjectId, sessionRecord)
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('project:list-updated', listAllProjects())
    }
  }

  async function start(idea: string, cwd: string, projectId?: string) {
    abortController = new AbortController()
    sessionCwd = cwd
    currentProjectId = projectId
    sessionStartedAt = new Date().toISOString()

    session = {
      id: crypto.randomUUID(),
      idea,
      status: 'decomposing',
      totalCost: 0
    }
    tasks = []
    emitSession()

    try {
      const prompt = `You are a project orchestrator. Decompose this idea into concrete, independent tasks for AI coding agents. Each task should be self-contained and include enough context in its prompt for an agent to execute it. Output ONLY valid JSON:
{ "tasks": [{ "id": "1", "title": "...", "prompt": "Detailed instructions for the agent...", "depends_on": [] }] }

Rules:
- Keep tasks small and focused (each should take an agent a few minutes)
- Use depends_on to enforce execution precedence whenever one task relies on another
- Only keep depends_on empty for truly independent tasks
- Task prompts should be detailed and self-contained

Idea: ${idea}
Working directory: ${cwd}`

      const allText: string[] = []
      let totalCost = 0

      const conversation = query({
        prompt,
        options: {
          maxTurns: 1,
          model: 'sonnet',
          abortController,
          customSystemPrompt: `You are a task decomposition assistant. You receive an idea and break it into concrete tasks for AI coding agents. You MUST respond with ONLY valid JSON, nothing else. Do not use any tools. Your response must be a single JSON object with a "tasks" array.`,
          allowedTools: []
        }
      })

      // Iterate over the async generator — collect text from all message types
      for await (const msg of conversation) {
        if (msg.type === 'assistant') {
          // Extract text blocks from assistant message content
          const content = (msg as { message?: { content?: unknown[] } }).message?.content
          if (Array.isArray(content)) {
            for (const block of content as Array<{ type: string; text?: string }>) {
              if (block.type === 'text' && typeof block.text === 'string') {
                allText.push(block.text)
              }
            }
          }
        } else if (msg.type === 'result') {
          if ('result' in msg) {
            const result = (msg as { result?: string }).result
            if (typeof result === 'string' && result) {
              allText.push(result)
            }
          }
          totalCost = (msg as { total_cost_usd?: number }).total_cost_usd ?? 0
        }
      }

      if (abortController.signal.aborted) return

      session.totalCost += totalCost
      const responseText = allText.join('\n')
      console.log('[Orchestrator] allText parts:', allText.length)
      console.log('[Orchestrator] Response text length:', responseText.length)
      console.log('[Orchestrator] Response preview:', responseText.slice(0, 500))

      const parsed = parseTasksFromResponse(responseText)

      tasks = parsed.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        prompt: t.prompt,
        dependsOn: t.depends_on,
        status: 'pending',
        panelId: null,
        startedAt: undefined
      }))

      // Fallback precedence: if planner gives no dependencies at all, run sequentially.
      // This avoids blasting all tasks in parallel for inherently ordered work.
      const hasAnyDependency = tasks.some((t) => t.dependsOn.length > 0)
      if (!hasAnyDependency && tasks.length > 1) {
        for (let i = 1; i < tasks.length; i++) {
          tasks[i].dependsOn = [tasks[i - 1].id]
        }
      }

      session.status = 'running'
      emitSession()
      emitTasks()

      // Assign initial batch
      assignNextTasks()
    } catch (err) {
      if (abortController.signal.aborted) return
      session.status = 'failed'
      session.error = err instanceof Error ? err.message : String(err)
      emitSession()
      send('orchestrator:error', session.error)
    }
  }

  function assignNextTasks() {
    const blockedChanged = blockUnrunnableTasks()
    if (blockedChanged) emitTasks()

    const runningCount = tasks.filter((t) => t.status === 'assigned' || t.status === 'running').length
    const available = MAX_CONCURRENT - runningCount

    if (available <= 0) {
      finalizeSessionIfDone()
      return
    }

    const ready = tasks.filter((t) => {
      if (t.status !== 'pending') return false
      return t.dependsOn.every((depId) => {
        const dep = tasks.find((d) => d.id === depId)
        return dep && dep.status === 'completed'
      })
    })

    const toAssign = ready.slice(0, available)
    if (toAssign.length === 0) {
      finalizeSessionIfDone()
      return
    }

    toAssign.forEach((t) => {
      t.status = 'assigned'
    })
    emitTasks()
    send('orchestrator:assign-tasks', { tasks: toAssign, cwd: sessionCwd })
  }

  function onTaskCompleted(taskId: string, panelId: string) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    if (isTaskFinal(task.status)) return
    task.status = 'completed'
    task.panelId = panelId
    task.error = undefined
    task.startedAt = undefined
    emitTasks()
    assignNextTasks()
  }

  function onTaskRunning(taskId: string, panelId: string) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    if (isTaskFinal(task.status)) return
    task.status = 'running'
    task.panelId = panelId
    task.startedAt = Date.now()
    emitTasks()
  }

  function onTaskFailed(taskId: string, panelId: string, reason?: string) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    if (isTaskFinal(task.status)) return
    task.status = 'failed'
    task.panelId = panelId
    task.error = reason || 'Task reported failure'
    task.startedAt = undefined
    emitTasks()
    assignNextTasks()
  }

  function cancel() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    let changed = false
    for (const task of tasks) {
      if (isTaskFinal(task.status)) continue
      task.status = 'failed'
      task.error = 'Cancelled by user'
      task.startedAt = undefined
      changed = true
    }
    if (changed) {
      emitTasks()
    }
    if (session) {
      session.status = 'failed'
      session.error = 'Cancelled by user'
      emitSession()
    }
  }

  return { start, onTaskCompleted, onTaskRunning, onTaskFailed, cancel }
}
