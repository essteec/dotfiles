#!/usr/bin/env bash
#
# sync.sh - Smart synchronization tool from $HOME to dotfiles repo
#
# Usage:
#   ./sync.sh              Perform synchronization from $HOME to home/
#   ./sync.sh --dry-run    Preview files that would be copied without modifying anything
#   ./sync.sh --help       Show help message
#

set -euo pipefail

# --- Color Definitions ---
if [[ -t 1 ]]; then
  BOLD="\033[1m"
  DIM="\033[2m"
  GREEN="\033[0;32m"
  BLUE="\033[0;34m"
  YELLOW="\033[0;33m"
  CYAN="\033[0;36m"
  RED="\033[0;31m"
  RESET="\033[0m"
else
  BOLD=""
  DIM=""
  GREEN=""
  BLUE=""
  YELLOW=""
  CYAN=""
  RED=""
  RESET=""
fi

# --- Helper Output Functions ---
info() { echo -e "${BLUE}${BOLD}[INFO]${RESET} $*"; }
success() { echo -e "${GREEN}${BOLD}[OK]${RESET} $*"; }
warn() { echo -e "${YELLOW}${BOLD}[WARN]${RESET} $*"; }
error() { echo -e "${RED}${BOLD}[ERROR]${RESET} $*" >&2; }
header() { echo -e "\n${CYAN}${BOLD}==> $*${RESET}"; }

# --- Argument Parsing ---
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
  -n | --dry-run)
    DRY_RUN=true
    ;;
  -h | --help)
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Synchronize personal Arch Linux Hyprland dotfiles from \$HOME into this repo."
    echo ""
    echo "Options:"
    echo "  -n, --dry-run    Preview files that would be copied without modifying anything"
    echo "  -h, --help       Show this help message"
    exit 0
    ;;
  *)
    error "Unknown argument: $arg"
    echo "Run '$0 --help' for usage."
    exit 1
    ;;
  esac
done

# --- Root Directory Validation ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR"
TARGET_HOME="$REPO_DIR/home"
SRC_HOME="$HOME"

if [[ ! -d "$TARGET_HOME" || ! -f "$REPO_DIR/AGENTS.md" ]]; then
  error "This script must be executed from the dotfiles repository root."
  exit 1
fi

if [[ "$DRY_RUN" == true ]]; then
  echo -e "${YELLOW}${BOLD}=== DRY RUN MODE (No files will be modified on disk) ===${RESET}"
fi

info "Source: ${SRC_HOME}"
info "Target: ${TARGET_HOME}"

# Common rsync options (-a for archive, -c for checksum/content-only diff, -i for itemized changes)
RSYNC_OPTS=(-a -c -i)
if [[ "$DRY_RUN" == true ]]; then
  RSYNC_OPTS+=(-n)
fi

# Excludes for config directories
CONFIG_EXCLUDES=(
  "--exclude=.git/"
  "--exclude=*.log"
  "--exclude=*.sock"
  "--exclude=*.swp"
  "--exclude=*~"
  "--exclude=__pycache__/"
  "--exclude=.cache/"
)

# Counter for total changed files
TOTAL_CHANGED=0

# Helper to execute rsync and return only changed files (filters out dir mtime-only changes)
run_rsync_itemized() {
  local raw_output
  raw_output=$(rsync "${RSYNC_OPTS[@]}" "$@" 2>/dev/null || true)

  if [[ -z "$raw_output" ]]; then
    return 0
  fi

  # Filter to only actual item changes:
  # >f or <f = file transferred
  # >+ = file/symlink created
  # cL = symlink change
  # cd = directory created
  echo "$raw_output" | grep -E '^>f|^<f|^cL|^cd' || true
}

# ==============================================================================
# 1. Root Dotfiles (~/.zshrc)
# ==============================================================================
header "1. Syncing Root Dotfiles"
ROOT_FILES=(".zshrc")

for f in "${ROOT_FILES[@]}"; do
  src_file="$SRC_HOME/$f"
  dst_file="$TARGET_HOME/$f"

  if [[ -f "$src_file" ]]; then
    changes=$(run_rsync_itemized "$src_file" "$dst_file")
    if [[ -n "$changes" ]]; then
      echo -e "  ${BOLD}$f${RESET}:"
      echo -e "    ${GREEN}+${RESET} $f"
      TOTAL_CHANGED=$((TOTAL_CHANGED + 1))
    else
      echo -e "  ${BOLD}$f${RESET} ${DIM}(up to date)${RESET}"
    fi
  else
    warn "Source file '$src_file' not found in \$HOME (skipping)"
  fi
done

# ==============================================================================
# 2. .local/bin/ Personal Scripts (*.sh only)
# ==============================================================================
header "2. Syncing Scripts in .local/bin/ (*.sh only)"
mkdir -p "$TARGET_HOME/.local/bin"

if [[ -d "$SRC_HOME/.local/bin" ]]; then
  bin_changes=()
  bin_total=0

  while IFS= read -r -d '' sh_file; do
    bin_total=$((bin_total + 1))
    filename="$(basename "$sh_file")"
    src_sh="$sh_file"
    dst_sh="$TARGET_HOME/.local/bin/$filename"

    changes=$(run_rsync_itemized "$src_sh" "$dst_sh")
    if [[ -n "$changes" ]]; then
      bin_changes+=("$filename")
      TOTAL_CHANGED=$((TOTAL_CHANGED + 1))
    fi
  done < <(find "$SRC_HOME/.local/bin" -maxdepth 1 -type f -name "*.sh" -print0 | sort -z)

  if [[ ${#bin_changes[@]} -gt 0 ]]; then
    echo -e "  Checked ${bin_total} script(s) in ~/.local/bin/:"
    for updated_script in "${bin_changes[@]}"; do
      echo -e "    ${GREEN}+${RESET} $updated_script"
    done
  else
    echo -e "  Checked ${bin_total} script(s) in ~/.local/bin/ ${DIM}(all up to date)${RESET}"
  fi
else
  warn "Directory '$SRC_HOME/.local/bin' not found (skipping)"
fi

# ==============================================================================
# 3. .config/ Application Directories (Dynamic based on repo's home/.config/)
# ==============================================================================
header "3. Syncing Config Folders in .config/"

if [[ -d "$TARGET_HOME/.config" ]]; then
  for app_dir in "$TARGET_HOME/.config"/*/; do
    [[ -d "$app_dir" ]] || continue
    app_name="$(basename "$app_dir")"
    src_app_dir="$SRC_HOME/.config/$app_name"
    dst_app_dir="$TARGET_HOME/.config/$app_name"

    if [[ -d "$src_app_dir" ]]; then
      changes=$(run_rsync_itemized "${CONFIG_EXCLUDES[@]}" "$src_app_dir/" "$dst_app_dir/")
      if [[ -n "$changes" ]]; then
        echo -e "  ${BOLD}.config/$app_name/${RESET}:"
        while IFS= read -r line; do
          file_path="${line:12}"
          echo -e "    ${GREEN}+${RESET} $file_path"
          TOTAL_CHANGED=$((TOTAL_CHANGED + 1))
        done <<<"$changes"
      else
        echo -e "  ${BOLD}.config/$app_name/${RESET} ${DIM}(up to date)${RESET}"
      fi
    else
      warn "Source config directory '$src_app_dir' not found on system (skipping)"
    fi
  done
else
  warn "No '.config' directory found in '$TARGET_HOME' (skipping)"
fi

# ==============================================================================
# 4. .local/share/applications/ Custom Webapps (Dynamic based on repo's desktop files)
# ==============================================================================
header "4. Syncing Webapps in .local/share/applications/"
mkdir -p "$TARGET_HOME/.local/share/applications"

app_changes=()
app_total=0

while IFS= read -r -d '' desktop_file; do
  app_total=$((app_total + 1))
  filename="$(basename "$desktop_file")"
  src_desktop="$SRC_HOME/.local/share/applications/$filename"
  dst_desktop="$TARGET_HOME/.local/share/applications/$filename"

  if [[ -f "$src_desktop" ]]; then
    changes=$(run_rsync_itemized "$src_desktop" "$dst_desktop")
    if [[ -n "$changes" ]]; then
      app_changes+=("$filename")
      TOTAL_CHANGED=$((TOTAL_CHANGED + 1))
    fi
  else
    warn "Source webapp '$src_desktop' not found on system (skipping)"
  fi
done < <(find "$TARGET_HOME/.local/share/applications" -maxdepth 1 -type f -name "*.desktop" -print0 | sort -z)

if [[ ${#app_changes[@]} -gt 0 ]]; then
  echo -e "  Checked ${app_total} webapp entry/entries:"
  for updated_app in "${app_changes[@]}"; do
    echo -e "    ${GREEN}+${RESET} $updated_app"
  done
else
  echo -e "  Checked ${app_total} webapp entry/entries ${DIM}(all up to date)${RESET}"
fi

# ==============================================================================
# 5. .icons/ Selective Theme Files & Fixes (Dynamic based on repo's icons)
# ==============================================================================
header "5. Syncing Selective Icon Overrides in .icons/"

if [[ -d "$TARGET_HOME/.icons" ]]; then
  icon_changes=()
  icon_total=0

  while IFS= read -r -d '' icon_file; do
    icon_total=$((icon_total + 1))
    rel_path="${icon_file#"$TARGET_HOME/.icons/"}"
    src_icon="$SRC_HOME/.icons/$rel_path"
    dst_icon="$TARGET_HOME/.icons/$rel_path"

    if [[ -f "$src_icon" ]]; then
      changes=$(run_rsync_itemized "$src_icon" "$dst_icon")
      if [[ -n "$changes" ]]; then
        icon_changes+=("$rel_path")
        TOTAL_CHANGED=$((TOTAL_CHANGED + 1))
      fi
    else
      warn "Source icon file '$src_icon' not found on system (skipping)"
    fi
  done < <(find "$TARGET_HOME/.icons" -type f ! -name "*.md" -print0 | sort -z)

  if [[ ${#icon_changes[@]} -gt 0 ]]; then
    echo -e "  Checked ${icon_total} custom icon override file(s):"
    for updated_icon in "${icon_changes[@]}"; do
      echo -e "    ${GREEN}+${RESET} $updated_icon"
    done
  else
    echo -e "  Checked ${icon_total} custom icon override file(s) ${DIM}(all up to date)${RESET}"
  fi
else
  warn "Directory '$TARGET_HOME/.icons' not found (skipping)"
fi

# ==============================================================================
# Summary & Status
# ==============================================================================
header "Summary"

if [[ "$DRY_RUN" == true ]]; then
  success "Dry run complete! ${TOTAL_CHANGED} file(s) would be updated/copied."
else
  success "Sync complete! ${TOTAL_CHANGED} file(s) updated/copied."

  if command -v git &>/dev/null && [[ -d "$REPO_DIR/.git" ]]; then
    echo -e "\n${BOLD}Git status for home/:${RESET}"
    git -C "$REPO_DIR" status --short home/ || true
  fi
fi
