# Agentation

AI-powered UI feedback system. Annotate webpage elements and send feedback directly to OpenCode sessions via MCP sampling.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌─────────────┐     WebSocket      ┌─────────────┐     MCP Sampling   │
│  │   Chrome    │ ◄──────────────►  │  Agentation  │ ◄────────────────► │
│  │  Extension  │    localhost:19989 │  MCP Server  │                    │
│  └─────────────┘                    └─────────────┘                    │
│        │                                   │                            │
│        │ User annotations                  │ sampling/createMessage     │
│        ▼                                   ▼                            │
│  ┌─────────────┐                    ┌─────────────┐                    │
│  │  Web Page   │                    │  OpenCode   │ ──► LLM Session    │
│  │  (target)   │                    │   (fork)    │                    │
│  └─────────────┘                    └─────────────┘                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Flow:**
1. User annotates UI elements in Chrome extension
2. Click "AI에게 지시하기" → WebSocket → MCP Server
3. MCP Server sends sampling request to OpenCode
4. OpenCode creates/reuses session and starts LLM conversation
5. User continues conversation in OpenCode TUI

## Quick Start

### 1. Clone with submodule

```bash
git clone --recursive https://github.com/GutMutCode/agentation.git
cd agentation
```

### 2. Install & Build

```bash
# Install dependencies
pnpm install

# Build agentation packages
pnpm build

# Build OpenCode fork
cd external/opencode/packages/opencode && bun run build && cd ../../../..
```

### 3. Configure OpenCode

Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "agentation": {
      "type": "local",
      "command": ["node", "/path/to/agentation/packages/mcp-server/dist/cli.js"]
    }
  },
  "sampling": {
    "agentation": {
      "mode": "prompt",
      "maxTokens": 4096
    }
  }
}
```

**Sampling modes:**
- `"prompt"` - Ask for approval each time (recommended)
- `"auto"` - Auto-approve all requests
- `"deny"` - Block all requests

### 4. Load Chrome Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `packages/extension` directory

### 5. Run OpenCode (fork version)

```bash
./external/opencode/packages/opencode/dist/opencode-darwin-arm64/bin/opencode
```

## Usage

1. Open any webpage
2. Click Agentation toolbar (bottom-right)
3. Toggle annotation mode
4. Click elements to add feedback
5. Click "AI에게 지시하기"
6. Approve in OpenCode TUI → conversation continues in session

## Packages

| Package | Description |
|---------|-------------|
| `packages/extension` | Chrome extension for UI annotation |
| `packages/mcp-server` | MCP server with WebSocket + sampling |
| `packages/shared` | Shared types |
| `external/opencode` | OpenCode fork (submodule) with MCP sampling support |

## Development

```bash
# Watch mode
pnpm dev

# Type check
pnpm typecheck

# Update OpenCode submodule
cd external/opencode
git pull origin dev
cd ../..
git add external/opencode
git commit -m "chore: update opencode submodule"
```

## License

MIT
