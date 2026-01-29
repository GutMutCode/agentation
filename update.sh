#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory (agentation root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCODE_BIN_DIR="$SCRIPT_DIR/.opencode"
VERSION_FILE="$OPENCODE_BIN_DIR/version"
GITHUB_REPO="GutMutCode/opencode"
GITHUB_API="https://api.github.com/repos/$GITHUB_REPO/releases/latest"
GITHUB_RELEASE="https://github.com/$GITHUB_REPO/releases/latest/download"

# Options
QUIET=false
FORCE=false

print_info() {
    [[ "$QUIET" == false ]] && echo -e "${CYAN}[update]${NC} ${1}"
}

print_success() {
    [[ "$QUIET" == false ]] && echo -e "${GREEN}[update]${NC} ${1}"
}

print_warning() {
    [[ "$QUIET" == false ]] && echo -e "${YELLOW}[update]${NC} ${1}"
}

print_error() {
    echo -e "${RED}[update]${NC} ${1}" >&2
}

usage() {
    cat <<EOF
Usage: ./update.sh [OPTIONS]

Options:
    --quiet, -q     Suppress non-error output
    --force, -f     Force update even if up-to-date
    -h, --help      Show this help message

Examples:
    ./update.sh             # Check and update if needed
    ./update.sh --quiet     # Silent mode (for wrapper script)
    ./update.sh --force     # Force re-download
EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --quiet|-q)
            QUIET=true
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

# Detect OS and architecture
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

# Get current OpenCode version from version file
get_current_version() {
    if [[ -f "$VERSION_FILE" ]]; then
        cat "$VERSION_FILE"
    else
        echo "unknown"
    fi
}

# Get latest OpenCode version from GitHub
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

# Update agentation code from git
update_agentation() {
    cd "$SCRIPT_DIR"
    
    # Check if git repo
    if [[ ! -d ".git" ]]; then
        print_warning "Not a git repository, skipping agentation update"
        return 0
    fi
    
    # Fetch latest changes
    print_info "Checking for agentation updates..."
    git fetch origin main --quiet 2>/dev/null || {
        print_warning "Failed to fetch from origin, skipping git update"
        return 0
    }
    
    local LOCAL_HEAD REMOTE_HEAD
    LOCAL_HEAD=$(git rev-parse HEAD 2>/dev/null)
    REMOTE_HEAD=$(git rev-parse origin/main 2>/dev/null)
    
    if [[ "$LOCAL_HEAD" == "$REMOTE_HEAD" && "$FORCE" == false ]]; then
        print_info "Agentation is up-to-date"
        return 0
    fi
    
    print_info "Updating agentation..."
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
        print_warning "Uncommitted changes detected, stashing..."
        git stash push -m "auto-stash before update" --quiet
        local STASHED=true
    fi
    
    # Pull latest
    git pull origin main --quiet || {
        print_error "Failed to pull updates"
        [[ "${STASHED:-false}" == true ]] && git stash pop --quiet
        return 1
    }
    
    # Rebuild if needed
    if [[ -f "package.json" ]]; then
        print_info "Rebuilding agentation..."
        
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
            return 1
        }
    fi
    
    # Restore stash
    [[ "${STASHED:-false}" == true ]] && git stash pop --quiet
    
    print_success "Agentation updated successfully"
    return 0
}

# Update OpenCode binary
update_opencode() {
    local platform="$1"
    
    if [[ "$platform" == "unknown" ]]; then
        print_warning "Unknown platform, skipping OpenCode update"
        return 0
    fi
    
    # macOS Intel must build from source
    if [[ "$platform" == "darwin-x64" ]]; then
        print_warning "macOS Intel requires building from source, skipping binary update"
        return 0
    fi
    
    print_info "Checking for OpenCode updates..."
    
    local current_version latest_version
    current_version=$(get_current_version)
    latest_version=$(get_latest_version)
    
    if [[ "$latest_version" == "unknown" ]]; then
        print_warning "Could not fetch latest version, skipping OpenCode update"
        return 0
    fi
    
    if [[ "$current_version" == "$latest_version" && "$FORCE" == false ]]; then
        print_info "OpenCode is up-to-date ($current_version)"
        return 0
    fi
    
    print_info "Updating OpenCode: $current_version -> $latest_version"
    
    local archive_name extract_cmd
    local binary_dir="$OPENCODE_BIN_DIR/opencode-$platform"
    
    if [[ "$platform" == "windows-x64" ]]; then
        archive_name="opencode-${platform}.zip"
        extract_cmd="unzip -o -q"
    else
        archive_name="opencode-${platform}.tar.gz"
        extract_cmd="tar -xzf"
    fi
    
    local download_url="${GITHUB_RELEASE}/${archive_name}"
    local archive_path="${OPENCODE_BIN_DIR}/${archive_name}"
    
    mkdir -p "$OPENCODE_BIN_DIR"
    
    # Download
    print_info "Downloading $archive_name..."
    if command -v curl &> /dev/null; then
        curl -fsSL "$download_url" -o "$archive_path" || {
            print_error "Download failed"
            return 1
        }
    elif command -v wget &> /dev/null; then
        wget -q "$download_url" -O "$archive_path" || {
            print_error "Download failed"
            return 1
        }
    else
        print_error "Neither curl nor wget found"
        return 1
    fi
    
    # Remove old binary
    [[ -d "$binary_dir" ]] && rm -rf "$binary_dir"
    
    # Extract
    print_info "Extracting..."
    cd "$OPENCODE_BIN_DIR"
    $extract_cmd "$archive_name"
    rm -f "$archive_name"
    
    # Save version
    echo "$latest_version" > "$VERSION_FILE"
    
    print_success "OpenCode updated to $latest_version"
    return 0
}

# Main
main() {
    local platform
    platform=$(detect_platform)
    
    local agentation_result=0
    local opencode_result=0
    
    # Update agentation
    update_agentation || agentation_result=$?
    
    # Update OpenCode binary
    update_opencode "$platform" || opencode_result=$?
    
    # Return success if at least one succeeded or both skipped
    if [[ $agentation_result -eq 0 && $opencode_result -eq 0 ]]; then
        return 0
    else
        return 1
    fi
}

main "$@"
