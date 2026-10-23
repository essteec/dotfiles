#!/usr/bin/env bash

set -euo pipefail

ARG="$1"

if [[ "$ARG" == "0" ]]; then
    # get current wallpaper theme directory
    # WALLPAPER_DIR="$(get-wallpaper-path.sh 0)"  # this very line not working when called from hyprland config
    # NAME="$(basename "$WALLPAPER_DIR")"
    SCRIPT_DIR="$(dirname "$0")"
    WALLPAPER_DIR="$("$SCRIPT_DIR/get-wallpaper-path.sh" 0)"
    NAME="$(basename "$WALLPAPER_DIR")"
elif [[ "$ARG" == "1" ]]; then
    # true random across all themes
    WALLPAPER_DIR="$HOME/Pictures/Wallpapers/"
    NAME="random"
else 
    echo "Usage: $0 [0|1]" >&2
    echo "  0: Random wallpaper from current theme" >&2
    echo "  1: Random wallpaper from all themes" >&2
    exit 1
fi

# get outputs
mapfile -t OUTPUTS < <(awww query | awk '{print $2}' | tr -d ':')

(( ${#OUTPUTS[@]} == 0 )) && {
    echo "No outputs detected by awww" >&2
    exit 1
}

# For each output pick and set a random image
for OUTPUT in "${OUTPUTS[@]}"; do
    
    IMG=$(find "$WALLPAPER_DIR" -type f | shuf -n 1)
    awww img -o "$OUTPUT" "$IMG"
    notify-send -a "Wallpaper" "Wallpaper Changed" "$(basename "$IMG")" \
        -r 559 -u low \
        -h string:output:"${OUTPUT}" \
        -h string:image-path:"${IMG}"
done
