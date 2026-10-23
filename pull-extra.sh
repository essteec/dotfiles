#!/usr/bin/env bash
set -euo pipefail

# Target the .extra directory from the project root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTRA_DIR="$ROOT_DIR/.extra"

# Ensure .extra exists and enter it
mkdir -p "$EXTRA_DIR"
cd "$EXTRA_DIR"

# Colors
BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
YELLOW="\033[33m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}==> Updating local reference wikis & documentation in .extra/...${RESET}\n"

# Standard reference repositories to track
declare -A REPOS=(
  ["hyprland-wiki"]="https://github.com/hyprwm/hyprland-wiki"
  ["waybar-wiki"]="https://github.com/Alexays/Waybar.wiki.git"
)

# 1. Update or clone predefined repositories
for name in "${!REPOS[@]}"; do
  url="${REPOS[$name]}"
  if [[ -d "$name/.git" ]]; then
    echo -e "${BOLD}Updating $name...${RESET}"
    git -C "$name" pull --ff-only || git -C "$name" pull
    echo -e "  ${GREEN}✓${RESET} $name is up to date.\n"
  elif [[ -d "$name" ]]; then
    echo -e "  ${YELLOW}!${RESET} Directory '$name' exists but is not a git repository. Skipping.\n"
  else
    echo -e "${BOLD}Directory '$name' not found. Creating and cloning from $url...${RESET}"
    git clone "$url" "$name"
    echo -e "  ${GREEN}✓${RESET} $name cloned successfully.\n"
  fi
done

# 2. Auto-discover and pull any other git repos added to .extra/
for dir in "$EXTRA_DIR"/*/; do
  [[ -d "$dir/.git" ]] || continue
  name="$(basename "$dir")"
  [[ -n "${REPOS[$name]:-}" ]] && continue # already updated above

  echo -e "${BOLD}Updating $name...${RESET}"
  git -C "$name" pull
  echo -e "  ${GREEN}✓${RESET} $name is up to date.\n"
done

# 3. Update SwayNC manpages and config schema
SWAYNC_DIR="$EXTRA_DIR/swaync-man"
mkdir -p "$SWAYNC_DIR"
echo -e "${BOLD}Updating swaync-man reference docs...${RESET}"
if command -v man >/dev/null 2>&1; then
  man swaync > "$SWAYNC_DIR/manual.txt" 2>/dev/null && echo -e "  ${GREEN}✓${RESET} manual.txt updated" || true
  man 5 swaync > "$SWAYNC_DIR/manual5.txt" 2>/dev/null && echo -e "  ${GREEN}✓${RESET} manual5.txt updated" || true
fi
if command -v curl >/dev/null 2>&1; then
  curl -sS -f "https://raw.githubusercontent.com/ErikReider/SwayNotificationCenter/main/src/configSchema.json" \
    -o "$SWAYNC_DIR/configSchema.json" 2>/dev/null && echo -e "  ${GREEN}✓${RESET} configSchema.json updated" || true
fi
echo ""

echo -e "${BOLD}${GREEN}All .extra references are up to date!${RESET}"
