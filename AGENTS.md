# AGENTS.md — Agentation

AI-powered UI feedback system. pnpm monorepo (Turborepo): Chrome Extension + MCP Server + shared types.

## Architecture

```
packages/
  shared/        → TypeScript shared types (ESM, zero runtime deps)
  mcp-server/    → MCP server + WebSocket server (ESM, Node.js)
  extension/     → Chrome Extension (vanilla JS, CommonJS, no build step)
external/
  opencode/      → Git submodule (OpenCode fork) — do NOT modify
```

Extension ↔ MCP Server via WebSocket (port 19989). MCP Server → OpenCode/LLM via MCP SDK sampling (`server.createMessage()`).

## Build & Run

```bash
pnpm install                                    # install all
pnpm build                                      # build all (shared → mcp-server)
pnpm --filter @agentation/shared build          # build single package
pnpm --filter @agentation/mcp-server build      # build single package
pnpm typecheck                                  # type check all
pnpm --filter @agentation/mcp-server typecheck  # type check single
pnpm dev                                        # watch mode
pnpm format                                     # prettier (all files)
pnpm clean                                      # clean dist/
pnpm --filter @agentation/mcp-server start      # start MCP server
```

**Build order**: `shared` → `mcp-server` (via `dependsOn: ["^build"]`). Always build shared first when changing shared types.

**Tests**: No test framework configured. `pnpm test` exists in turbo.json but no packages define test runners.

## TypeScript

Both `shared` and `mcp-server` use identical tsconfig: target ES2022, module/moduleResolution NodeNext, strict: true, declaration + sourceMap enabled. All packages use `"type": "module"` (ESM). Extension uses `"type": "commonjs"`.

**Import rules** — `.js` extension required on all relative imports (NodeNext resolution):

```typescript
import { AgentationMCPServer } from "./mcp-server.js"; // CORRECT
import { AgentationMCPServer } from "./mcp-server"; // WRONG
import { DEFAULT_MCP_SERVER_PORT } from "@agentation/shared"; // package imports: no extension
import type { Annotation } from "@agentation/shared"; // type-only: use `import type`
```

Import order: Node built-ins → external packages → `@agentation/*` → relative imports.

## Code Style

### Formatting (Prettier only — no ESLint)

No `.prettierrc` — uses Prettier v3 defaults: double quotes, semicolons, trailing commas, 2-space indent. Run: `pnpm format`.

### Naming

| Kind             | Convention            | Example                                  |
| ---------------- | --------------------- | ---------------------------------------- |
| Variables/funcs  | camelCase             | `pendingFeedback`, `buildFeedbackPrompt` |
| Classes          | PascalCase            | `AgentationMCPServer`                    |
| Interfaces/Types | PascalCase            | `ExtensionClient`, `StatusPayload`       |
| Constants        | UPPER_SNAKE           | `DEFAULT_MCP_SERVER_PORT`, `ERROR_CODES` |
| Files            | kebab-case            | `mcp-server.ts`, `websocket-server.ts`   |
| CSS classes      | `agentation-*` prefix | `agentation-toolbar`                     |

### Types

- `interface` for object shapes; `type` for unions/computed types
- All shared types in `packages/shared/src/index.ts`
- Discriminated unions with `type` field for message protocols
- Zod schemas for runtime validation at MCP tool input boundaries
- `as const` for constant objects serving as enums

### Error Handling

- `console.error` with bracketed prefix tags: `[MCP]`, `[WS]`, `[CLI]`
- Check `error instanceof Error` before accessing `.message`/`.stack`
- Propagate errors up; never swallow silently
- Structured error payloads: `{ code, message }` for WebSocket errors

```typescript
} catch (error) {
  console.error("[MCP] Sampling request failed:");
  console.error("[MCP] Error message:", error instanceof Error ? error.message : String(error));
  throw error;
}
```

### Logging Tags

```
[MCP]          — MCP server operations
[WS]           — WebSocket server operations
[CLI]          — CLI entry point
[Agentation]   — Extension client-side
[WS Client]    — Extension WebSocket client
```

### Server-Side Patterns (TypeScript)

- Class-based architecture (`AgentationMCPServer`, `AgentationWebSocketServer`)
- `private` keyword for private members (not `#`)
- JSDoc `/** */` on public API methods
- Constructor takes config params with sensible defaults

### Extension Patterns (Vanilla JS)

- Content scripts wrapped in IIFE: `(function() { "use strict"; ... })();`
- No build step — loaded directly by Chrome (Manifest V3)
- `chrome.runtime.sendMessage` / `chrome.storage.local` for state
- Cross-script communication via `window.*` (e.g., `window.agentationWS`)
- i18n via `window.agentationI18n.t(key)` helper
- All CSS classes prefixed `agentation-` to avoid page conflicts

## Dependencies

| Package      | Key Dependencies                                               |
| ------------ | -------------------------------------------------------------- |
| `shared`     | none (types only)                                              |
| `mcp-server` | `@modelcontextprotocol/sdk`, `ws`, `zod`, `@agentation/shared` |
| `extension`  | `playwright` (devDep only — screenshot capture)                |

## Key Protocols

- **WebSocket messages**: `{ type: WebSocketMessageType, id?, payload?, timestamp }` — discriminated union on `type`
- **MCP sampling**: `server.createMessage()` from `@modelcontextprotocol/sdk`
- **Internal deps**: `"workspace:*"` references in package.json

## Do NOT

- Modify anything under `external/opencode/` (git submodule)
- Use `as any`, `@ts-ignore`, or `@ts-expect-error`
- Add ESLint — project intentionally uses Prettier only
- Change module resolution from NodeNext
- Omit `.js` extensions on relative TypeScript imports
- Break the `shared → mcp-server` build dependency order
