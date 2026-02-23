#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCODE_BIN_DIR="$SCRIPT_DIR/.opencode"
VERSION_FILE="$OPENCODE_BIN_DIR/version"
GITHUB_REPO="GutMutCode/opencode"
GITHUB_API="https://api.github.com/repos/$GITHUB_REPO/releases/latest"
GITHUB_RELEASE="https://github.com/$GITHUB_REPO/releases/latest/download"

QUIET=false
INLINE=false
FORCE=false

CODE_STATUS="skip"
RUNTIME_STATUS="skip"
CODE_UPDATED=false
RUNTIME_UPDATED=false

print_inline() {
    [[ "$INLINE" == true ]] && echo -e "${CYAN}agentation >${NC} ${1}"
}

print_info() {
    if [[ "$INLINE" == true ]]; then
        print_inline "$1"
    elif [[ "$QUIET" == false ]]; then
        echo -e "${CYAN}[update]${NC} ${1}"
    fi
}

print_success() {
    if [[ "$INLINE" == true ]]; then
        print_inline "$1"
    elif [[ "$QUIET" == false ]]; then
        echo -e "${GREEN}[update]${NC} ${1}"
    fi
}

print_warning() {
    if [[ "$INLINE" == true ]]; then
        print_inline "$1"
    elif [[ "$QUIET" == false ]]; then
        echo -e "${YELLOW}[update]${NC} ${1}"
    fi
}

print_error() {
    if [[ "$INLINE" == true ]]; then
        echo -e "${RED}agentation >${NC} ${1}" >&2
    else
        echo -e "${RED}[update]${NC} ${1}" >&2
    fi
}

usage() {
    cat <<EOF
Usage: ./update.sh [OPTIONS]

Options:
    --quiet, -q     Suppress all output
    --inline, -i    Show progress in "agentation > message" format
    --force, -f     Force update even if up-to-date
    -h, --help      Show this help message

Examples:
    ./update.sh             # Check and update if needed
    ./update.sh --quiet     # Silent mode
    ./update.sh --inline    # Progress mode for wrapper script
    ./update.sh --force     # Force re-download
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --quiet|-q)
            QUIET=true
            shift
            ;;
        --inline|-i)
            INLINE=true
            shift
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            shift
            ;;
    esac
done

detect_platform() {
    local os arch

    case "$(uname -s)" in
        Darwin) os="darwin" ;;
        Linux) os="linux" ;;
        MINGW*|MSYS*|CYGWIN*) os="windows" ;;
        *) echo "unknown"; return ;;
    esac

    case "$(uname -m)" in
        x86_64|amd64) arch="x64" ;;
        arm64|aarch64) arch="arm64" ;;
        *) echo "unknown"; return ;;
    esac

    echo "${os}-${arch}"
}

get_current_version() {
    if [[ -f "$VERSION_FILE" ]]; then
        cat "$VERSION_FILE"
    else
        echo "unknown"
    fi
}

get_latest_version() {
    local response version
    
    if command -v curl &> /dev/null; then
        response=$(curl -fsSL "$GITHUB_API" 2>/dev/null)
    elif command -v wget &> /dev/null; then
        response=$(wget -qO- "$GITHUB_API" 2>/dev/null)
    fi
    
    version=$(echo "$response" | grep -o '"tag_name"[^,]*' | head -1 | cut -d'"' -f4)
    
    echo "${version:-unknown}"
}

update_code() {
    cd "$SCRIPT_DIR"
    
    if [[ ! -d ".git" ]]; then
        CODE_STATUS="skip"
        return 0
    fi
    
    git fetch origin main --quiet 2>/dev/null || {
        CODE_STATUS="skip"
        return 0
    }
    
    local LOCAL_HEAD REMOTE_HEAD
    LOCAL_HEAD=$(git rev-parse HEAD 2>/dev/null)
    REMOTE_HEAD=$(git rev-parse origin/main 2>/dev/null)
    
    if [[ "$LOCAL_HEAD" == "$REMOTE_HEAD" && "$FORCE" == false ]]; then
        CODE_STATUS="ok"
        return 0
    fi
    
    print_info "Updating code..."
    
    if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
        git stash push -m "auto-stash before update" --quiet
        local STASHED=true
    fi
    
    git pull origin main --quiet || {
        print_error "Code update failed"
        [[ "${STASHED:-false}" == true ]] && git stash pop --quiet
        CODE_STATUS="fail"
        return 1
    }
    
    if [[ -f "package.json" ]]; then
        local PKG_MANAGER
        if command -v pnpm &> /dev/null; then
            PKG_MANAGER="pnpm"
        else
            PKG_MANAGER="npm"
        fi
        
        $PKG_MANAGER install >/dev/null 2>&1
        $PKG_MANAGER run build >/dev/null 2>&1 || {
            print_error "Build failed"
            [[ "${STASHED:-false}" == true ]] && git stash pop --quiet
            CODE_STATUS="fail"
            return 1
        }
    fi
    
    [[ "${STASHED:-false}" == true ]] && git stash pop --quiet
    
    CODE_STATUS="ok"
    CODE_UPDATED=true
    return 0
}

update_runtime() {
    local platform="$1"
    
    if [[ "$platform" == "unknown" ]]; then
        RUNTIME_STATUS="skip"
        return 0
    fi
    
    if [[ "$platform" == "darwin-x64" ]]; then
        RUNTIME_STATUS="skip"
        return 0
    fi
    
    local current_version latest_version
    current_version=$(get_current_version)
    latest_version=$(get_latest_version)
    
    if [[ "$latest_version" == "unknown" ]]; then
        RUNTIME_STATUS="skip"
        return 0
    fi
    
    if [[ "$current_version" == "$latest_version" && "$FORCE" == false ]]; then
        RUNTIME_STATUS="ok"
        return 0
    fi
    
    print_info "Updating runtime: $current_version → $latest_version"
    
    local archive_name extract_cmd
    
    case "$platform" in
        darwin-*|windows-*)
            archive_name="opencode-${platform}.zip"
            extract_cmd="unzip -o -q"
            ;;
        *)
            archive_name="opencode-${platform}.tar.gz"
            extract_cmd="tar -xzf"
            ;;
    esac
    
    local download_url="${GITHUB_RELEASE}/${archive_name}"
    local archive_path="${OPENCODE_BIN_DIR}/${archive_name}"
    
    mkdir -p "$OPENCODE_BIN_DIR"
    
    if command -v curl &> /dev/null; then
        curl -fsSL "$download_url" -o "$archive_path" || {
            print_error "Download failed"
            RUNTIME_STATUS="fail"
            return 1
        }
    elif command -v wget &> /dev/null; then
        wget -q "$download_url" -O "$archive_path" || {
            print_error "Download failed"
            RUNTIME_STATUS="fail"
            return 1
        }
    else
        print_error "Neither curl nor wget found"
        RUNTIME_STATUS="fail"
        return 1
    fi
    
    cd "$OPENCODE_BIN_DIR"
    $extract_cmd "$archive_name"
    rm -f "$archive_name"
    chmod +x "$OPENCODE_BIN_DIR/opencode" 2>/dev/null || true
    
    echo "$latest_version" > "$VERSION_FILE"
    
    RUNTIME_STATUS="ok"
    RUNTIME_UPDATED=true
    return 0
}

update_wrapper() {
    local platform="$1"
    local bin_dir="$HOME/.local/bin"
    local wrapper="$bin_dir/agentation"
    local config_file="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/agentation.json"
    local source_bin="$OPENCODE_BIN_DIR/opencode"
    local update_script="$SCRIPT_DIR/update.sh"
    
    [[ ! -f "$wrapper" ]] && return 0
    
    local expected_wrapper
    expected_wrapper=$(cat <<EOF
#!/bin/bash
if [[ -f "$update_script" ]]; then
    "$update_script" --inline || true
fi
export OPENCODE_CONFIG="$config_file"
exec "$source_bin" "\$@"
EOF
)
    
    local current_wrapper
    current_wrapper=$(cat "$wrapper" 2>/dev/null || echo "")
    
    if [[ "$current_wrapper" != "$expected_wrapper" ]]; then
        echo "$expected_wrapper" > "$wrapper"
        chmod +x "$wrapper"
    fi
}

print_summary() {
    if [[ "$INLINE" != true && "$QUIET" == true ]]; then
        return 0
    fi

    local code_icon runtime_icon
    
    case "$CODE_STATUS" in
        ok) code_icon="✓" ;;
        skip) code_icon="-" ;;
        fail) code_icon="✗" ;;
    esac
    
    case "$RUNTIME_STATUS" in
        ok) runtime_icon="✓" ;;
        skip) runtime_icon="-" ;;
        fail) runtime_icon="✗" ;;
    esac
    
    if [[ "$CODE_UPDATED" == true || "$RUNTIME_UPDATED" == true ]]; then
        print_success "Updated (code: $code_icon, runtime: $runtime_icon)"
    elif [[ "$CODE_STATUS" == "fail" || "$RUNTIME_STATUS" == "fail" ]]; then
        print_error "Update failed (code: $code_icon, runtime: $runtime_icon)"
    else
        print_info "Up-to-date (code: $code_icon, runtime: $runtime_icon)"
    fi
}

main() {
    local platform
    platform=$(detect_platform)
    
    print_info "Checking for updates..."
    
    update_code || true
    update_runtime "$platform" || true
    update_wrapper "$platform"
    
    print_summary
    
    if [[ "$CODE_STATUS" == "fail" || "$RUNTIME_STATUS" == "fail" ]]; then
        return 1
    fi
    return 0
}

main "$@"
