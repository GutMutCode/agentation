#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory (agentation root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCODE_DIR="$SCRIPT_DIR/external/opencode/packages/opencode"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
CONFIG_FILE="$CONFIG_DIR/opencode.json"

# Options
BUILD_FROM_SOURCE=false
SKIP_BUILD=false

print_step() {
    echo -e "\n${BLUE}==>${NC} ${1}"
}

print_success() {
    echo -e "${GREEN}✓${NC} ${1}"
}

print_warning() {
    echo -e "${YELLOW}!${NC} ${1}"
}

print_error() {
    echo -e "${RED}✗${NC} ${1}"
}

usage() {
    cat <<EOF
Usage: ./setup.sh [OPTIONS]

Options:
    --source        Build OpenCode from source instead of downloading binary
    --skip-build    Skip agentation build (use if already built)
    -h, --help      Show this help message

Examples:
    ./setup.sh              # Download pre-built OpenCode binary
    ./setup.sh --source     # Build OpenCode from source (requires bun)
EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --source)
            BUILD_FROM_SOURCE=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Detect OS and architecture
detect_platform() {
    local os arch target

    case "$(uname -s)" in
        Darwin)
            os="darwin"
            ;;
        Linux)
            os="linux"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            os="windows"
            ;;
        *)
            print_error "Unsupported OS: $(uname -s)"
            exit 1
            ;;
    esac

    case "$(uname -m)" in
        x86_64|amd64)
            arch="x64"
            ;;
        arm64|aarch64)
            arch="arm64"
            ;;
        *)
            print_error "Unsupported architecture: $(uname -m)"
            exit 1
            ;;
    esac

    # macOS Intel doesn't have pre-built binary
    if [[ "$os" == "darwin" && "$arch" == "x64" ]]; then
        print_warning "macOS Intel (x64) doesn't have pre-built binary. Forcing source build."
        BUILD_FROM_SOURCE=true
    fi

    echo "${os}-${arch}"
}

# Check required commands
check_dependencies() {
    print_step "Checking dependencies..."

    local missing=()

    if ! command -v node &> /dev/null; then
        missing+=("node")
    else
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $node_version -lt 20 ]]; then
            print_error "Node.js 20+ required, found v$node_version"
            exit 1
        fi
        print_success "Node.js $(node -v)"
    fi

    if ! command -v pnpm &> /dev/null; then
        missing+=("pnpm")
    else
        print_success "pnpm $(pnpm -v)"
    fi

    if [[ "$BUILD_FROM_SOURCE" == true ]]; then
        if ! command -v bun &> /dev/null; then
            missing+=("bun")
        else
            print_success "bun $(bun -v)"
        fi
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        print_error "Missing dependencies: ${missing[*]}"
        echo ""
        echo "Install missing dependencies:"
        for dep in "${missing[@]}"; do
            case $dep in
                node)
                    echo "  Node.js: https://nodejs.org/ or use nvm"
                    ;;
                pnpm)
                    echo "  pnpm: npm install -g pnpm"
                    ;;
                bun)
                    echo "  bun: curl -fsSL https://bun.sh/install | bash"
                    ;;
            esac
        done
        exit 1
    fi
}

# Build agentation packages
build_agentation() {
    if [[ "$SKIP_BUILD" == true ]]; then
        print_step "Skipping agentation build (--skip-build)"
        return
    fi

    print_step "Building agentation..."

    cd "$SCRIPT_DIR"

    if [[ ! -d "node_modules" ]]; then
        echo "Installing dependencies..."
        pnpm install
    fi

    echo "Building packages..."
    pnpm build

    print_success "Agentation built successfully"
}

# Download pre-built OpenCode binary
download_opencode() {
    local platform="$1"
    local release_url="https://github.com/GutMutCode/opencode/releases/latest/download"
    local dist_dir="$OPENCODE_DIR/dist"

    print_step "Downloading OpenCode binary for $platform..."

    mkdir -p "$dist_dir"

    local archive_name
    local extract_cmd

    if [[ "$platform" == "windows-x64" ]]; then
        archive_name="opencode-${platform}.zip"
        extract_cmd="unzip -o -q"
    else
        archive_name="opencode-${platform}.tar.gz"
        extract_cmd="tar -xzf"
    fi

    local download_url="${release_url}/${archive_name}"
    local archive_path="${dist_dir}/${archive_name}"

    echo "Downloading from: $download_url"

    if command -v curl &> /dev/null; then
        curl -fSL "$download_url" -o "$archive_path"
    elif command -v wget &> /dev/null; then
        wget -q "$download_url" -O "$archive_path"
    else
        print_error "Neither curl nor wget found"
        exit 1
    fi

    echo "Extracting..."
    cd "$dist_dir"
    $extract_cmd "$archive_name"
    rm "$archive_name"

    print_success "OpenCode binary installed to $dist_dir/opencode-$platform"
}

# Build OpenCode from source
build_opencode() {
    print_step "Building OpenCode from source..."

    cd "$OPENCODE_DIR"

    if [[ ! -d "node_modules" ]]; then
        echo "Installing dependencies..."
        bun install
    fi

    echo "Building..."
    bun run build

    print_success "OpenCode built successfully"
}

# Configure opencode.json
configure_opencode() {
    print_step "Configuring OpenCode..."

    mkdir -p "$CONFIG_DIR"

    local mcp_command="$SCRIPT_DIR/packages/mcp-server/dist/cli.js"

    # Check if config exists
    if [[ -f "$CONFIG_FILE" ]]; then
        print_warning "Existing config found: $CONFIG_FILE"

        # Check if agentation is already configured
        if grep -q '"agentation"' "$CONFIG_FILE" 2>/dev/null; then
            print_success "Agentation already configured in opencode.json"
            return
        fi

        echo ""
        echo "Please manually add the following to your opencode.json:"
        echo ""
        cat <<EOF
{
  "mcp": {
    "agentation": {
      "type": "local",
      "command": ["node", "$mcp_command"]
    }
  },
  "sampling": {
    "agentation": {
      "mode": "prompt",
      "maxTokens": 4096
    }
  }
}
EOF
        echo ""
        print_warning "Merge the above into your existing config"
        return
    fi

    # Create new config
    cat > "$CONFIG_FILE" <<EOF
{
  "mcp": {
    "agentation": {
      "type": "local",
      "command": ["node", "$mcp_command"]
    }
  },
  "sampling": {
    "agentation": {
      "mode": "prompt",
      "maxTokens": 4096
    }
  }
}
EOF

    print_success "Created config: $CONFIG_FILE"
}

# Print final instructions
print_instructions() {
    local platform="$1"
    local binary_path

    case "$platform" in
        darwin-arm64|darwin-x64)
            binary_path="./dist/opencode-${platform}/bin/opencode"
            ;;
        linux-arm64|linux-x64)
            binary_path="./dist/opencode-${platform}/bin/opencode"
            ;;
        windows-x64)
            binary_path=".\\dist\\opencode-${platform}\\bin\\opencode.exe"
            ;;
    esac

    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "${YELLOW}Remaining manual step:${NC} Load Chrome Extension"
    echo ""
    echo "  1. Open Chrome and go to: chrome://extensions/"
    echo "  2. Enable 'Developer mode' (top right toggle)"
    echo "  3. Click 'Load unpacked'"
    echo "  4. Select: $SCRIPT_DIR/packages/extension"
    echo ""
    echo -e "${YELLOW}To start OpenCode:${NC}"
    echo ""
    echo "  cd $OPENCODE_DIR"
    echo "  $binary_path"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo ""
    echo "  1. Start OpenCode first"
    echo "  2. Open any webpage in Chrome"
    echo "  3. Click the Agentation toolbar (bottom-right)"
    echo "  4. Annotate elements and send feedback to AI"
    echo ""
}

# Main
main() {
    echo -e "${BLUE}"
    echo "    _                    _        _   _             "
    echo "   / \   __ _  ___ _ __ | |_ __ _| |_(_) ___  _ __  "
    echo "  / _ \ / _\` |/ _ \ '_ \| __/ _\` | __| |/ _ \| '_ \ "
    echo " / ___ \ (_| |  __/ | | | || (_| | |_| | (_) | | | |"
    echo "/_/   \_\__, |\___|_| |_|\__\__,_|\__|_|\___/|_| |_|"
    echo "        |___/                                       "
    echo -e "${NC}"
    echo "AI-powered UI Feedback System"
    echo ""

    local platform
    platform=$(detect_platform)
    echo "Detected platform: $platform"

    check_dependencies
    build_agentation

    if [[ "$BUILD_FROM_SOURCE" == true ]]; then
        build_opencode
    else
        download_opencode "$platform"
    fi

    configure_opencode
    print_instructions "$platform"
}

main "$@"
