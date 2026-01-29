# Agentation

[English](README.md)

AI 기반 UI 피드백 시스템. 웹페이지 요소에 어노테이션을 달고, MCP 샘플링을 통해 OpenCode 세션으로 직접 피드백을 전송합니다.

> **[benjitaylor/agentation](https://github.com/benjitaylor/agentation)에서 영감을 받았습니다** — AI 에이전트를 위한 원조 시각적 피드백 도구.
> Chrome Extension 버전에 대한 [제안서](https://github.com/benjitaylor/agentation/issues/26)를 참고하세요.

## 💡 빠른 시작: Extension만 사용

> **기본 사용에는 설정이 필요 없습니다!**
>
> Chrome Extension은 **독립적으로 작동**합니다 — 로드하고 **클립보드에 복사**를 사용하세요.
> ChatGPT, Claude, 또는 다른 AI 채팅에 붙여넣기만 하면 됩니다.
>
> MCP 설정은 **AI에게 전송** (OpenCode 직접 연동) 기능에만 필요합니다.

| 기능               | Extension만 | MCP 설정 포함 |
| ------------------ | ----------- | ------------- |
| 요소 어노테이션    | ✅          | ✅            |
| 클립보드에 복사    | ✅          | ✅            |
| AI에게 전송 (직접) | ❌          | ✅            |

**Extension만 설치:**

```bash
git clone https://github.com/GutMutCode/agentation.git
# 그 다음: chrome://extensions/ → 개발자 모드 → 압축해제된 확장 프로그램 로드 → packages/extension
```

## 왜 이 Fork인가?

|            | [원본](https://github.com/benjitaylor/agentation) | 이 프로젝트                 |
| ---------- | ------------------------------------------------- | --------------------------- |
| **타입**   | React 컴포넌트                                    | Chrome Extension            |
| **사용법** | 앱에 `npm install`                                | **모든 웹사이트**에서 작동  |
| **출력**   | 클립보드에 복사                                   | MCP를 통해 AI로 직접 전송   |
| **연동**   | AI에 수동 붙여넣기                                | OpenCode 세션으로 자동 전송 |

## 설치

```bash
git clone https://github.com/GutMutCode/agentation.git && cd agentation && ./setup.sh
```

그 다음 Chrome Extension 로드: `chrome://extensions/` → 개발자 모드 → 압축해제된 확장 프로그램 로드 → `packages/extension`

> **참고:** `--recursive` 플래그는 OpenCode를 소스에서 빌드할 때만 필요합니다 (`./setup.sh --source`). 기본적으로 `setup.sh`는 사전 빌드된 바이너리를 다운로드합니다.

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌─────────────┐     WebSocket      ┌─────────────┐     MCP Sampling   │
│  │   Chrome    │ ◄──────────────►  │  Agentation  │ ◄────────────────► │
│  │  Extension  │    localhost:19989 │  MCP Server  │                    │
│  └─────────────┘                    └─────────────┘                    │
│        │                                   │                            │
│        │ 사용자 어노테이션                  │ sampling/createMessage     │
│        ▼                                   ▼                            │
│  ┌─────────────┐                    ┌─────────────┐                    │
│  │  Web Page   │                    │  OpenCode   │ ──► LLM Session    │
│  │  (대상)      │                    │   (fork)    │                    │
│  └─────────────┘                    └─────────────┘                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 사전 요구사항

- **Node.js** 20+
- **pnpm** 또는 **npm** (pnpm 권장: `npm install -g pnpm`)
- **Chrome** 브라우저
- **bun** - OpenCode를 소스에서 빌드할 때만 필요 (`curl -fsSL https://bun.sh/install | bash`)

> **참고:** Windows 지원은 실험적입니다. macOS와 Linux는 완전히 지원됩니다.
>
> **패키지 매니저:** 예제는 `pnpm`을 사용하지만 `npm`도 작동합니다. 명령어에서 `pnpm`을 `npm`으로 대체하세요.

## 설정 옵션

```bash
./setup.sh              # 사전 빌드된 바이너리 다운로드 (기본값)
./setup.sh --source     # 소스에서 OpenCode 빌드 (bun 필요)
./setup.sh --force      # 이미 설치되어 있어도 다시 다운로드/빌드
```

### 업데이트

Agentation은 **매 실행 시 자동으로 업데이트**됩니다. agentation 코드와 OpenCode 바이너리 모두 자동으로 확인하고 업데이트합니다.

**기존 사용자** (자동 업데이트 기능 추가 전에 설치한 경우):

```bash
cd agentation
git pull
./setup.sh --force      # 자동 업데이트가 포함된 wrapper 스크립트 재생성
```

**수동 업데이트** (필요한 경우):

```bash
./update.sh             # 지금 확인하고 업데이트
./update.sh --force     # 최신 버전이어도 강제 다운로드
```

### 수동 설정

<details>
<summary>수동 설정 방법 보기</summary>

#### 1. Clone

```bash
# 사전 빌드된 바이너리 사용 (권장)
git clone https://github.com/GutMutCode/agentation.git
cd agentation

# 소스에서 빌드 (bun 필요)
git clone --recursive https://github.com/GutMutCode/agentation.git
cd agentation
```

#### 2. Agentation 빌드

```bash
pnpm install
pnpm build
```

#### 3. OpenCode Fork 설치

**옵션 A: 사전 빌드된 바이너리 다운로드**

[OpenCode Fork Releases](https://github.com/GutMutCode/opencode/releases)에서 다운로드:

| 플랫폼              | 파일                           |
| ------------------- | ------------------------------ |
| macOS Apple Silicon | `opencode-darwin-arm64.tar.gz` |
| Linux x64           | `opencode-linux-x64.tar.gz`    |
| Linux ARM64         | `opencode-linux-arm64.tar.gz`  |
| Windows x64         | `opencode-windows-x64.zip`     |

```bash
# macOS Apple Silicon 예시
tar -xzf opencode-darwin-arm64.tar.gz
mv opencode-darwin-arm64 external/opencode/packages/opencode/dist/

# Windows 예시 (PowerShell)
Expand-Archive -Path opencode-windows-x64.zip -DestinationPath external/opencode/packages/opencode/dist/
```

> **참고:** macOS Intel 사용자는 소스에서 빌드해야 합니다 (옵션 B).

**옵션 B: 소스에서 빌드**

```bash
cd external/opencode/packages/opencode && bun run build && cd ../../../..
```

#### 4. Agentation 설정

`~/.config/opencode/agentation.json` 생성:

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

**`AGENTATION_PATH`를 실제 경로로 교체:**

```bash
pwd  # 예시 출력: /Users/yourname/agentation
```

> **참고:** 이 설정은 `opencode.json`과 별개입니다. `agentation` 실행 시 기존 OpenCode 설정(plugins, providers 등)과 병합됩니다.

**샘플링 모드:**
| 모드 | 동작 |
|------|------|
| `auto` | 모든 요청 자동 승인 (기본값) |
| `prompt` | 매번 승인 요청 |
| `deny` | 모든 요청 차단 |

> **보안 참고:** AI 요청마다 수동 승인을 원하면 `"mode": "auto"`를 `"mode": "prompt"`로 변경하세요. 각 피드백 처리 전에 Allow/Deny 대화상자가 표시됩니다.

#### 5. Chrome Extension 로드

1. `chrome://extensions/` 열기
2. **개발자 모드** 활성화 (오른쪽 상단 토글)
3. **압축해제된 확장 프로그램 로드** 클릭
4. `packages/extension` 폴더 선택

</details>

### 시작

```bash
agentation
```

> **참고:** `agentation`을 찾을 수 없으면 `~/.local/bin`을 PATH에 추가하세요 (setup.sh에서 안내 표시됨).

## 사용법

> **중요:** Extension을 사용하기 전에 Agentation이 실행 중이어야 합니다.

1. **Agentation 시작**
2. Chrome에서 **아무 웹페이지나 열기**
3. **Agentation 툴바 찾기** (우측 하단 플로팅 버튼)
4. **어노테이션 모드 활성화** (토글 아이콘 클릭)
5. **아무 요소나 클릭**하여 피드백 어노테이션 추가
6. 팝업에 **피드백 입력**
7. **"AI에게 전송"** 클릭
8. **OpenCode TUI에서:** 샘플링 요청 승인 (Allow/Deny 대화상자)
9. OpenCode 세션에서 **대화 계속**

## 문제 해결

### WebSocket 연결 안됨

- OpenCode가 실행 중인지 확인
- agentation MCP 서버가 로드되었는지 확인: OpenCode TUI에서 `Ctrl+M` 누르기

### 샘플링 요청이 나타나지 않음

- `opencode.json`의 `sampling` 설정 확인
- 모드가 `deny`가 아닌지 확인

### Extension 툴바가 안 보임

- 웹페이지 새로고침
- `chrome://extensions/`에서 Extension이 활성화되어 있는지 확인

### 여러 브라우저 탭 사용

여러 브라우저 탭에서 동시에 Agentation을 사용하는 것이 완벽히 지원됩니다. 각 탭은 독립적인 연결을 유지하며, 피드백은 해당 탭으로 정확히 라우팅됩니다.

### 여러 OpenCode 인스턴스 실행

한 번에 하나의 Agentation 세션만 실행할 수 있습니다 (포트 19989 공유). 두 번째 인스턴스를 시작하려고 하면 포트 바인딩에 실패합니다. 다른 세션을 시작하기 전에 첫 번째 세션을 종료하세요.

## 패키지

| 패키지                | 설명                                 |
| --------------------- | ------------------------------------ |
| `packages/extension`  | UI 어노테이션용 Chrome Extension     |
| `packages/mcp-server` | WebSocket + 샘플링이 포함된 MCP 서버 |
| `packages/shared`     | 공유 타입                            |
| `external/opencode`   | OpenCode fork (서브모듈)             |

## 제거

```bash
./uninstall.sh              # 바이너리와 빌드 결과물 제거
./uninstall.sh --keep-project  # wrapper 스크립트만 제거
```

> **참고:** `agentation.json`만 삭제됩니다. `opencode.json` 설정은 건드리지 않습니다.

Chrome Extension은 수동 제거: `chrome://extensions/` → Agentation 찾기 → 삭제

## 권장: Playwriter와 함께 사용

최상의 경험을 위해 [Playwriter](https://github.com/remorses/playwriter)와 함께 사용하세요 — 기존 Chrome을 제어하는 브라우저 자동화 MCP입니다.

| 도구           | 역할                                        |
| -------------- | ------------------------------------------- |
| **Agentation** | UI 요소 어노테이션 → AI에게 피드백 전송     |
| **Playwriter** | AI가 브라우저 제어 → 테스트, 검증, 상호작용 |

### 왜 Playwriter인가?

| 기능            | Playwright MCP    | Playwriter           |
| --------------- | ----------------- | -------------------- |
| 브라우저        | 새 Chrome 실행    | 기존 Chrome 사용     |
| 로그인 상태     | 새로 (로그아웃됨) | 이미 로그인됨        |
| 확장 프로그램   | 없음              | 기존 것 사용         |
| 봇 탐지         | 항상 탐지됨       | 우회 가능            |
| 컨텍스트 사용량 | 스크린샷 (100KB+) | A11y 스냅샷 (5-20KB) |

### 설정

1. [Playwriter Chrome Extension](https://chromewebstore.google.com/detail/playwriter-mcp/jfeammnjpkecdekppnclgkkffahnhfhe) 설치
2. 탭에서 확장 프로그램 아이콘 클릭 (연결되면 녹색으로 변함)
3. `~/.config/opencode/agentation.json`에 추가:

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

> **참고:** `PLAYWRITER_AUTO_ENABLE=1`은 필요할 때 자동으로 탭을 생성합니다 (수동으로 확장 프로그램 클릭 불필요).

### 워크플로우 예시

```
1. 웹사이트 탐색 → UI 문제 발견
2. Agentation으로 문제 어노테이션
3. "AI에게 전송" 클릭 → AI가 시각적 피드백 수신
4. AI가 Playwriter로 페이지와 상호작용하여 수정/검증
```

## 개발

```bash
pnpm dev        # Watch 모드
pnpm typecheck  # 타입 체크
```

## 감사의 말

- [benjitaylor/agentation](https://github.com/benjitaylor/agentation) — 원본 컨셉과 영감
- [opencode-ai/opencode](https://github.com/opencode-ai/opencode) — 터미널 기반 AI 코딩 어시스턴트

## 라이선스

MIT — [LICENSE](LICENSE) 참조

이 프로젝트는 [benjitaylor/agentation](https://github.com/benjitaylor/agentation)에서 영감을 받은 **독립적인 구현**입니다. 원본 프로젝트에서 코드를 복사하지 않았습니다.
