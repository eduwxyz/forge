# Forge — Roadmap

## O que é o Forge

O único app que **pensa antes de executar**.

O problema: você tem uma ideia → quer ver ela funcionando → não quer microgerenciar cada passo.

Outros produtos rodam agentes em paralelo. O Forge é o único que **decompõe a ideia em tasks, monta um plano editável, e executa tudo autonomamente** — com isolamento via git worktrees e review integrado do resultado.

Fluxo core: **plan → execute → review → ship**.

1. **Plan** — descreve o que quer, faz brainstorm com IA, revisa o plano de tasks antes de executar
2. **Execute** — orquestrador spawna agentes em terminais paralelos, cada task num worktree isolado
3. **Review** — vê o que mudou (diff viewer, file tree), aprova ou pede ajustes
4. **Ship** — commit + PR direto do Forge

## Público-alvo

**Dev solo / indie hacker** que quer construir projetos inteiros (do zero ou features em repos existentes) com automação máxima.

## Competidores e diferenciação

| Produto | Foco | Limitação |
|---------|------|-----------|
| **Supacode** | Gerenciador de worktrees + terminal nativo | Sem inteligência — dev decide tudo manualmente |
| **Constellagent** | IDE multi-agente (terminal + editor + diff) | Sem planejamento com IA — dev lança agentes um por um |
| **Cursor/Windsurf** | IDE com IA | Single-agent, sem orquestração paralela |
| **BridgeSpace** | Multi-terminal paralelo | Sem decomposição, sem planejamento |
| **Forge** | **Plan → Execute → Review → Ship** | O único que pensa antes de executar |

O Forge se diferencia pela **inteligência**: decomposição automática de ideias em tasks com dependências, plano editável antes de executar, execução paralela com worktrees isolados, e review integrado do resultado.

## Stack técnico

- Electron + React 18 + TypeScript
- xterm.js (terminal real com WebGL rendering)
- node-pty (processos shell nativos)
- Tailwind CSS 4 + Framer Motion
- Zustand (state management)
- Lucide (ícones)

## Arquitetura

```
Claude Code SDK
  → decompõe ideia em tasks

node-pty spawna processos:
  Terminal 1: claude "task 1"
  Terminal 2: codex "task 2"
  Terminal 3: gemini "task 3"

xterm.js mostra output de cada terminal

Orquestrador monitora progresso e coordena tasks
```

---

## Roadmap

### Fase 1 — Terminal base ✅

- [x] Terminal real conectado ao shell (zsh)
- [x] Tabs (Cmd+T nova, Cmd+W fecha)
- [x] Tema escuro, cursor pulsando, 256 cores, true color
- [x] WebGL rendering

### Fase 2 — Split panels ✅

- [x] Dividir terminal em painéis (horizontal/vertical)
- [x] Recursive panel tree (splits aninhados)
- [x] Resize com drag no divider
- [x] Click-to-focus com borda visual
- [x] Cada painel com seu próprio PTY
- [x] Shortcuts: Cmd+/ (split h), Cmd+Shift+\ (split v), Cmd+Shift+W (fechar)

### Fase 3 — Rodar agentes no terminal ✅

- [x] Executar `claude`, `codex`, `gemini` CLI nos painéis
- [x] Detectar quando um agente está rodando (parser de output)
- [x] Indicador visual de agente ativo por painel
- [x] Auto-spawn: abrir agente direto num painel novo

### Fase 4 — Orquestrador ✅

- [x] Input: digitar uma ideia em linguagem natural (Cmd+Shift+O)
- [x] Decomposição automática em tasks via Claude Code SDK
- [x] Executar tasks em paralelo nos terminais (max 3 concurrent)
- [x] Monitorar progresso de cada task (FORGE_TASK_DONE/FAIL markers)
- [x] Realocar tasks quando um agente termina (dependency tracking)
- [x] Dashboard de progresso (tasks pendentes, rodando, concluídas)

### Fase 5 — Project Workspace + Worktrees

- [ ] Sidebar de projetos (toggle) coexistindo com terminal
- [ ] Criar novo projeto: `git init` + pasta em `~/Projects/<nome>`
- [ ] Importar projeto existente (apontar pra repo git)
- [ ] Git worktrees: cada task do orquestrador roda num worktree isolado
- [ ] Auto-copy `.env` e arquivos ignorados pro worktree
- [ ] Persistência de workspaces em disco (JSON em `~/.forge/`)
- [ ] Listar projetos recentes na sidebar com status (running/paused/done)
- [ ] Retomar workspace anterior (reabrir projeto com histórico de tasks)
- [ ] Welcome state quando não há projetos abertos
- [ ] Settings básico (shell, tema, terminal font size)

### Fase 6 — Plan & Brainstorm

- [ ] Tela de ideação: textarea + botões "Brainstorm" e "Decompor"
- [ ] Modo brainstorm: chat livre com IA pra refinar a ideia antes de decompor
- [ ] Decomposição mostra plano editável (editar, deletar, reordenar tasks)
- [ ] Subtasks: poder quebrar uma task em subtasks menores
- [ ] Botão "Adicionar task" manual
- [ ] Botão "Redecompor" pra pedir nova decomposição
- [ ] "Aprovar e Executar" vs "Auto-execute" (skip review)
- [ ] Cada task aprovada → cria worktree + spawna terminal

### Fase 7 — Review layer

- [ ] File tree read-only do worktree ativo (painel lateral direito)
- [ ] Diff viewer: o que o agente mudou no worktree (staged + unstaged)
- [ ] Click no arquivo do diff → abre no editor padrão do sistema
- [ ] Unread indicator: saber quando um agente terminou sem estar olhando
- [ ] Notification sound/visual quando task completa
- [ ] Task summary: IA gera resumo do que foi feito em cada task

### Fase 8 — Git & Ship

- [ ] Staging UI: ver changed files, stage/unstage individual
- [ ] Commit com mensagem direto do Forge
- [ ] Criar PR via `gh` CLI direto do Forge
- [ ] Status do PR na sidebar (open/merged/closed)
- [ ] CI check status básico (passing/failing)
- [ ] Merge worktree de volta pro branch principal após aprovação

### Fase 9+ — Futuro

- [ ] Configuração de agentes (routing por tipo de task, fallback, budget)
- [ ] Cron/automações (agendar agentes pra rodar periodicamente)
- [ ] Command palette (fuzzy search de projetos, tasks, ações)
- [ ] Command blocks estilo Warp (comando + output colapsável)
- [ ] Múltiplos temas visuais
- [ ] Multi-agente (Codex, Gemini CLI além do Claude)

---

## Momento mágico

O dev abre o Forge e vê seus projetos na sidebar. Clica "New Project", descreve "build a recipe app with auth and search". Faz brainstorm com a IA pra refinar o escopo — "PostgreSQL ou SQLite? Social features?". Quando está pronto, a IA decompõe em tasks editáveis. O dev revisa, ajusta a ordem, adiciona uma subtask, e clica "Executar".

O Forge cria worktrees isolados, spawna Claude Code em paralelo em cada um. O dev assiste o progresso no dashboard — ou vai tomar um café. Quando volta, vê as tasks concluídas, abre o diff viewer pra revisar o que cada agente fez, faz um commit, e cria um PR — tudo sem sair do Forge.

No dia seguinte, abre o projeto e continua de onde parou.
