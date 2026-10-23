#!/usr/bin/env bash
#
# diff-delta.sh - Simple delta wrapper to compare repo dotfiles with $HOME
#
# Usage:
#   ./diff-delta.sh home/.config/hypr/hyprland.lua [delta options...]
#   ./diff-delta.sh .config/hypr/hyprland.lua -s
#

set -euo pipefail

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <file-path> [delta options...]" >&2
    exit 1
fi

TARGET_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/home"
SRC_HOME="$HOME"

input_path="${1#./}"
shift

if [[ "$input_path" =~ ^home/(.*)$ ]]; then
    rel_path="${BASH_REMATCH[1]}"
elif [[ "$input_path" =~ ^"$SRC_HOME"/(.*)$ ]]; then
    rel_path="${BASH_REMATCH[1]}"
else
    rel_path="$input_path"
fi

repo_file="$TARGET_HOME/$rel_path"
src_file="$SRC_HOME/$rel_path"

exec delta "$repo_file" "$src_file" "$@"
