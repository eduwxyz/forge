export interface ParsedTask {
  id: string
  title: string
  prompt: string
  depends_on: string[]
}

export interface ParseResult {
  tasks: ParsedTask[]
}

export function parseTasksFromResponse(text: string): ParseResult {
  // Strategy 1: ```json code block
  const codeBlockMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    const parsed = tryParseJSON(codeBlockMatch[1].trim())
    if (parsed) return normalize(parsed)
  }

  // Strategy 2: Regex for object containing "tasks"
  const tasksObjMatch = text.match(/\{[\s\S]*"tasks"\s*:\s*\[[\s\S]*\][\s\S]*\}/)
  if (tasksObjMatch) {
    const parsed = tryParseJSON(tasksObjMatch[0])
    if (parsed) return normalize(parsed)
  }

  // Strategy 3: Balanced braces fallback
  const start = text.indexOf('{')
  if (start !== -1) {
    let depth = 0
    let end = -1
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}') {
        depth--
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    if (end !== -1) {
      const parsed = tryParseJSON(text.slice(start, end + 1))
      if (parsed) return normalize(parsed)
    }
  }

  throw new Error('Failed to parse tasks from response')
}

function tryParseJSON(str: string): unknown | null {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

function normalize(obj: unknown): ParseResult {
  const data = obj as Record<string, unknown>
  if (!Array.isArray(data.tasks)) {
    throw new Error('Response does not contain a tasks array')
  }

  const tasks: ParsedTask[] = data.tasks.map((t: Record<string, unknown>) => ({
    id: String(t.id || ''),
    title: String(t.title || ''),
    prompt: String(t.prompt || ''),
    depends_on: Array.isArray(t.depends_on) ? t.depends_on.map(String) : []
  }))

  if (tasks.length === 0) {
    throw new Error('No tasks found in response')
  }

  return { tasks }
}
