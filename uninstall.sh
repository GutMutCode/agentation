#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/agentation.json"
BIN_DIR="$HOME/.local/bin"

print_step() { echo -e "\n${BLUE}==>${NC} ${1}"; }
print_success() { echo -e "${GREEN}✓${NC} ${1}"; }
print_warning() { echo -e "${YELLOW}!${NC} ${1}"; }
print_error() { echo -e "${RED}✗${NC} ${1}"; }

KEEP_PROJECT=false

usage() {
    cat <<EOF
Usage: ./uninstall.sh [OPTIONS]

Options:
    --keep-project  Keep project folder (only remove symlinks and binaries)
    -h, --help      Show this help message

Note: This removes agentation.json only. Your opencode.json settings are untouched.
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-project) KEEP_PROJECT=true; shift ;;
        -h|--help) usage ;;
        *) print_error "Unknown option: $1"; usage ;;
    esac
done

echo -e "${RED}"
echo "    _   _       _           _        _ _ "
echo "   | | | |_ __ (_)_ __  ___| |_ __ _| | |"
echo "   | | | | '_ \| | '_ \/ __| __/ _\` | | |"
echo "   | |_| | | | | | | | \__ \ || (_| | | |"
echo "    \___/|_| |_|_|_| |_|___/\__\__,_|_|_|"
echo -e "${NC}"
echo "Agentation Uninstaller"
echo ""

print_step "Removing wrapper scripts..."

if [[ -L "$BIN_DIR/agentation" ]]; then
    rm -f "$BIN_DIR/agentation"
    print_success "Removed: $BIN_DIR/agentation"
elif [[ -e "$BIN_DIR/agentation" ]]; then
    rm -f "$BIN_DIR/agentation"
    print_success "Removed: $BIN_DIR/agentation"
else
    print_warning "Not found: $BIN_DIR/agentation"
fi

if [[ -e "$BIN_DIR/agentation.cmd" ]]; then
    rm -f "$BIN_DIR/agentation.cmd"
    print_success "Removed: $BIN_DIR/agentation.cmd"
fi

print_step "Removing downloaded binaries..."

if [[ -d "$SCRIPT_DIR/.opencode" ]]; then
    rm -rf "$SCRIPT_DIR/.opencode"
    print_success "Removed: $SCRIPT_DIR/.opencode"
else
    print_warning "Not found: $SCRIPT_DIR/.opencode"
fi

print_step "Removing configuration..."

if [[ -f "$CONFIG_FILE" ]]; then
    rm -f "$CONFIG_FILE"
    print_success "Removed: $CONFIG_FILE"
else
    print_warning "Not found: $CONFIG_FILE"
fi

print_step "Cleaning build artifacts..."

if [[ -d "$SCRIPT_DIR/node_modules" ]]; then
    rm -rf "$SCRIPT_DIR/node_modules"
    print_success "Removed: node_modules/"
fi

if [[ -d "$SCRIPT_DIR/packages/mcp-server/dist" ]]; then
    rm -rf "$SCRIPT_DIR/packages/mcp-server/dist"
    print_success "Removed: packages/mcp-server/dist/"
fi

if [[ -d "$SCRIPT_DIR/packages/shared/dist" ]]; then
    rm -rf "$SCRIPT_DIR/packages/shared/dist"
    print_success "Removed: packages/shared/dist/"
fi

rm -rf "$SCRIPT_DIR/.turbo" 2>/dev/null || true

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Uninstall Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Manual step:${NC} Remove Chrome Extension"
echo ""
echo "  1. Open chrome://extensions/"
echo "  2. Find 'Agentation'"
echo "  3. Click 'Remove'"
echo ""

if [[ "$KEEP_PROJECT" == false ]]; then
    echo -e "${YELLOW}To completely remove:${NC}"
    echo ""
    echo "  rm -rf $SCRIPT_DIR"
    echo ""
fi
