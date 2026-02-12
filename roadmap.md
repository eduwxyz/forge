# Forge — Roadmap

## O que é o Forge

Um terminal bonito que orquestra múltiplos agentes de IA pra construir software sozinho.

O problema: você tem uma ideia → quer ver ela funcionando → não quer microgerenciar cada passo.

O Forge combina três capacidades que nenhum produto faz junto:

1. **Terminal turbinado** — terminal real com superpoderes: command blocks, histórico inteligente, contexto entre sessões
2. **Orquestração automática** — digita "build a recipe app" → decompõe em tasks → abre terminais → executa tudo em paralelo
3. **Hub multi-agente** — conecta Claude Code, Codex, Gemini CLI no mesmo lugar, manda cada task pro agente mais adequado

## Público-alvo

**Dev solo / indie hacker** que quer construir um projeto inteiro sozinho, do zero ao deploy, com automação máxima.

## Competidores e diferenciação

| Produto | Foco | O que faz |
|---------|------|-----------|
| **BridgeSpace** | Multi-terminal paralelo | Terminal real, até 16 painéis em grid, clean UI, $20/mês |
| **Cursor/Windsurf** | IDE com IA | Full IDE experience |
| **Warp** | Terminal bonito | Terminal only, sem automação |
| **Forge** | Terminal + automação + multi-agente | Os três combinados |

BridgeSpace é a referência mais próxima — terminal desktop Electron com multi-painel e integração com Claude Code/Codex. Mas o Forge se diferencia pela **orquestração automática** (decomposição → plan → implement → test → review → done) e pelo **hub multi-agente** que roteia tasks pro agente ideal.

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

- [x] Executar `claude`, `codex`,
 `gemini` CLI nos painéis
- [x] Detectar quando um agente está rodando (parser de output)
- [x] Indicador visual de agente ativo por painel
- [x] Auto-spawn: abrir agente direto num painel novo

### Fase 4 — Orquestrador

- [ ] Input: digitar uma ideia em linguagem natural
- [ ] Decomposição automática em tasks via Claude Code SDK
- [ ] Executar tasks em paralelo nos terminais
- [ ] Monitorar progresso de cada task
- [ ] Realocar tasks quando um agente termina
- [ ] Dashboard de progresso (tasks pendentes, rodando, concluídas)

### Fase 5 — Configuração de agentes

- [ ] Definir qual agente usar por tipo de task (Claude pra plan/review, Codex pra implement)
- [ ] Seleção automática de agente baseada no tipo de task
- [ ] Perfis de agente customizáveis (model, system prompt, budget)
- [ ] Fallback entre agentes (se um falha, tenta outro)

### Fase 6 — Kanban integrado

- [ ] Board visual com colunas (backlog → plan → implement → test → review → done)
- [ ] Tasks do orquestrador viram cards automaticamente
- [ ] Drag-and-drop entre colunas
- [ ] Card mostra: agente atribuído, status, custo, terminal vinculado
- [ ] Clicar num card abre/foca o terminal correspondente
- [ ] Progress dots por card (estágio atual do workflow)
- [ ] Filtro e busca de cards

### Fase 7 — UX & visual

- [ ] Sidebar: workspaces/projetos, lista de tasks, file tree
- [ ] Status bar: modelo ativo, tokens, custo, diretório atual
- [ ] Command blocks: agrupar comando + output em blocos colapsáveis (estilo Warp)
- [ ] Múltiplos temas visuais

### Fase 8 — Integrações

- [ ] GitHub (PRs, issues, code review)
- [ ] CI/CD pipeline monitoring
- [ ] Notificações desktop
- [ ] Histórico de sessões persistente

---

## Momento mágico

O usuário abre o Forge, digita "build a todo app with auth and dark mode", e assiste múltiplos terminais abrindo automaticamente — um planejando a arquitetura, outro implementando o backend, outro o frontend — todos rodando em paralelo, cada um com o agente mais adequado pra aquela task. Em minutos, o projeto está pronto.
