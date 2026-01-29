# Agentation

[한국어](README.ko.md)

AI-powered UI feedback system. Annotate webpage elements and send feedback directly to OpenCode sessions via MCP sampling.

> **Inspired by [benjitaylor/agentation](https://github.com/benjitaylor/agentation)** — the original visual feedback tool for AI agents.
> See [my proposal](https://github.com/benjitaylor/agentation/issues/26) for a Chrome Extension version.

## 💡 Quick Start: Extension Only

> **No setup required for basic usage!**
>
> The Chrome Extension works **standalone** — just load it and use **Copy to Clipboard**.
> Paste into ChatGPT, Claude, or any AI chat.
>
> MCP setup is only needed for **Send to AI** (direct OpenCode integration).

| Feature             | Extension Only | With MCP Setup |
| ------------------- | -------------- | -------------- |
| Annotate elements   | ✅             | ✅             |
| Copy to Clipboard   | ✅             | ✅             |
| Send to AI (direct) | ❌             | ✅             |

**Extension-only install:**

```bash
git clone https://github.com/GutMutCode/agentation.git
# Then: chrome://extensions/ → Developer mode → Load unpacked → packages/extension
```

## Why This Fork?

|                 | [Original](https://github.com/benjitaylor/agentation) | This Project                   |
| --------------- | ----------------------------------------------------- | ------------------------------ |
| **Type**        | React component                                       | Chrome Extension               |
| **Usage**       | `npm install` in your app                             | Works on **any website**       |
| **Output**      | Copy to clipboard                                     | Direct to AI via MCP           |
| **Integration** | Manual paste to AI                                    | Auto-sends to OpenCode session |

## Installation

```bash
git clone https://github.com/GutMutCode/agentation.git && cd agentation && ./setup.sh
```

Then load Chrome extension: `chrome://extensions/` → Developer mode → Load unpacked → `packages/extension`

> **Note:** The `--recursive` flag is only needed if you want to build OpenCode from source (`./setup.sh --source`). By default, `setup.sh` downloads pre-built binaries.

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

## Prerequisites

- **Node.js** 20+
- **pnpm** or **npm** (pnpm recommended: `npm install -g pnpm`)
- **Chrome** browser
- **bun** - Only if building OpenCode from source (`curl -fsSL https://bun.sh/install | bash`)

> **Note:** Windows support is experimental. macOS and Linux are fully supported.
>
> **Package Manager:** Examples use `pnpm`, but `npm` works too. Replace `pnpm` with `npm` in commands.

## Setup Options

```bash
./setup.sh              # Download pre-built binary (default)
./setup.sh --source     # Build OpenCode from source (requires bun)
./setup.sh --force      # Re-download/rebuild even if already installed
```

### Updating

Agentation **auto-updates on every startup**. Both the agentation code and OpenCode binary are automatically checked and updated.

**For existing users** (installed before auto-update feature):

```bash
cd agentation
git pull
./setup.sh --force      # Regenerate wrapper script with auto-update
```

**Manual update** (if needed):

```bash
./update.sh             # Check and update now
./update.sh --force     # Force re-download even if up-to-date
```

### Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### 1. Clone

```bash
# For pre-built binary (recommended)
git clone https://github.com/GutMutCode/agentation.git
cd agentation

# For building from source (requires bun)
git clone --recursive https://github.com/GutMutCode/agentation.git
cd agentation
```

#### 2. Build Agentation

```bash
pnpm install
pnpm build
```

#### 3. Install OpenCode Fork

**Option A: Download pre-built binary**

Download from [OpenCode Fork Releases](https://github.com/GutMutCode/opencode/releases):

| Platform            | File                           |
| ------------------- | ------------------------------ |
| macOS Apple Silicon | `opencode-darwin-arm64.tar.gz` |
| Linux x64           | `opencode-linux-x64.tar.gz`    |
| Linux ARM64         | `opencode-linux-arm64.tar.gz`  |
| Windows x64         | `opencode-windows-x64.zip`     |

```bash
# Example for macOS Apple Silicon
tar -xzf opencode-darwin-arm64.tar.gz
mv opencode-darwin-arm64 external/opencode/packages/opencode/dist/

# Example for Windows (PowerShell)
Expand-Archive -Path opencode-windows-x64.zip -DestinationPath external/opencode/packages/opencode/dist/
```

> **Note:** macOS Intel users must build from source (Option B).

**Option B: Build from source**

```bash
cd external/opencode/packages/opencode && bun run build && cd ../../../..
```

#### 4. Configure Agentation

Create `~/.config/opencode/agentation.json`:

```json
{
  "mcp": {
    "agentation": {
      "type": "local",
      "command": ["node", "AGENTATION_PATH/packages/mcp-server/dist/cli.js"]
    }
  },
  "sampling": {
    "agentation": {
      "mode": "auto",
      "maxTokens": 4096
    }
  }
}
```

**Replace `AGENTATION_PATH`** with your actual path:

```bash
pwd  # Example output: /Users/yourname/agentation
```

> **Note:** This config is separate from `opencode.json`. When running `agentation`, it will be merged with your existing OpenCode settings (plugins, providers, etc.).

**Sampling modes:**
| Mode | Behavior |
|------|----------|
| `auto` | Auto-approve all requests (default) |
| `prompt` | Ask for approval each time |
| `deny` | Block all requests |

> **Security Note:** If you want manual approval for each AI request, change `"mode": "auto"` to `"mode": "prompt"`. This shows an Allow/Deny dialog before processing each feedback.

#### 5. Load Chrome Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select `packages/extension` folder

</details>

### Start

```bash
agentation
```

> **Note:** If `agentation` is not found, add `~/.local/bin` to your PATH (setup.sh shows instructions).

## Usage

> **Important:** Agentation must be running before using the extension.

1. **Start Agentation**
2. **Open any webpage** in Chrome
3. **Find Agentation toolbar** (floating button, bottom-right corner)
4. **Enable annotation mode** (click the toggle icon)
5. **Click any element** to add feedback annotation
6. **Enter your feedback** in the popup
7. **Click "AI에게 지시하기"** (Send to AI)
8. **In OpenCode TUI:** Approve the sampling request (Allow/Deny dialog)
9. **Continue conversation** in the OpenCode session

## Troubleshooting

### WebSocket not connected

- Check if OpenCode is running
- Check if agentation MCP server is loaded: Press `Ctrl+M` in OpenCode TUI

### Sampling request not appearing

- Verify `sampling` config in `opencode.json`
- Check mode is not `deny`

### Extension not showing toolbar

- Refresh the webpage
- Check extension is enabled in `chrome://extensions/`

### Multiple browser tabs

Using Agentation on multiple browser tabs simultaneously is fully supported. Each tab maintains its own connection, and feedback is routed back to the correct tab.

### Running multiple OpenCode instances

Only one Agentation session can run at a time (port 19989 is shared). If you try to start a second instance, it will fail to bind to the port. Close the first session before starting another.

## Packages

| Package               | Description                          |
| --------------------- | ------------------------------------ |
| `packages/extension`  | Chrome extension for UI annotation   |
| `packages/mcp-server` | MCP server with WebSocket + sampling |
| `packages/shared`     | Shared types                         |
| `external/opencode`   | OpenCode fork (submodule)            |

## Uninstall

```bash
./uninstall.sh              # Remove binaries and build artifacts
./uninstall.sh --keep-project  # Only remove wrapper scripts
```

> **Note:** This removes `agentation.json` only. Your `opencode.json` settings are untouched.

Then manually remove Chrome extension: `chrome://extensions/` → Find Agentation → Remove

## Recommended: Use with Playwriter

For the best experience, use Agentation together with [Playwriter](https://github.com/remorses/playwriter) — a browser automation MCP that controls your existing Chrome.

| Tool           | Role                                         |
| -------------- | -------------------------------------------- |
| **Agentation** | Annotate UI elements → Send feedback to AI   |
| **Playwriter** | AI controls browser → Test, verify, interact |

### Why Playwriter?

| Feature       | Playwright MCP       | Playwriter              |
| ------------- | -------------------- | ----------------------- |
| Browser       | Spawns new Chrome    | Uses your Chrome        |
| Login state   | Fresh (logged out)   | Already logged in       |
| Extensions    | None                 | Your existing ones      |
| Bot detection | Always detected      | Can bypass              |
| Context usage | Screenshots (100KB+) | A11y snapshots (5-20KB) |

### Setup

1. Install [Playwriter Chrome Extension](https://chromewebstore.google.com/detail/playwriter-mcp/jfeammnjpkecdekppnclgkkffahnhfhe)
2. Click extension icon on a tab (turns green when connected)
3. Add to `~/.config/opencode/agentation.json`:

```json
{
  "mcp": {
    "agentation": {
      "type": "local",
      "command": ["node", "AGENTATION_PATH/packages/mcp-server/dist/cli.js"]
    },
    "playwriter": {
      "type": "local",
      "command": ["npx", "-y", "playwriter@latest"],
      "environment": {
        "PLAYWRITER_AUTO_ENABLE": "1"
      }
    }
  },
  "sampling": {
    "agentation": {
      "mode": "auto",
      "maxTokens": 4096
    }
  }
}
```

> **Note:** `PLAYWRITER_AUTO_ENABLE=1` auto-creates a tab when needed (no manual extension click required).

### Workflow Example

```
1. Browse website → spot UI issue
2. Use Agentation to annotate the problem
3. Click "Send to AI" → AI receives visual feedback
4. AI uses Playwriter to interact with the page and fix/verify
```

## Development

```bash
pnpm dev        # Watch mode
pnpm typecheck  # Type check
```

## Acknowledgments

- [benjitaylor/agentation](https://github.com/benjitaylor/agentation) — Original concept and inspiration
- [opencode-ai/opencode](https://github.com/opencode-ai/opencode) — Terminal-based AI coding assistant

## License

MIT — See [LICENSE](LICENSE)

This project is an **independent implementation** inspired by [benjitaylor/agentation](https://github.com/benjitaylor/agentation). No code was copied from the original project.
