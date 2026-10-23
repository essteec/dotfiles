#!/usr/bin/env bash

CACHE_DIR="$HOME/.cache"
JSON_FILE="$CACHE_DIR/wallpaper-paths.json"

ARG="$1"
CHANGED=0

# create json if missing
if [[ ! -f "$JSON_FILE" ]]; then
    cat > "$JSON_FILE" <<EOF
{
  "wallpapers_path": "$HOME/Pictures/Wallpapers/",
  "current_theme_index": 0
}
EOF
fi

WP_PATH=$(jq -r '.wallpapers_path' "$JSON_FILE")
CURRENT_INDEX=$(jq -r '.current_theme_index' "$JSON_FILE")

# collect theme folders
mapfile -t THEMES < <(find "$WP_PATH" -mindepth 1 -maxdepth 1 -type d -printf '%f\n')
THEME_COUNT="${#THEMES[@]}"

(( THEME_COUNT == 0 )) && exit 1

# -------- argument handling --------

if [[ "$ARG" == "1" ]]; then
    ((CURRENT_INDEX++))
    (( CURRENT_INDEX >= THEME_COUNT )) && CURRENT_INDEX=0
    CHANGED=1
elif [[ "$ARG" != "0" ]]; then
    for i in "${!THEMES[@]}"; do
        if [[ "${THEMES[$i]}" == "$ARG" ]]; then
            CURRENT_INDEX="$i"
            CHANGED=1
            break
        fi
    done
fi

# -------- persist only if changed --------

THEME="${THEMES[$CURRENT_INDEX]}"

if (( CHANGED )); then  # if theme changed
    tmpfile=$(mktemp)
    jq ".current_theme_index = $CURRENT_INDEX" "$JSON_FILE" > "$tmpfile" \
        && mv "$tmpfile" "$JSON_FILE"

    notify-send -a "Theme" "Wallpaper" "$THEME" -i "wallpaper" \
        -r 559 -u low -h string:x-canonical-private-synchronous:theme
    # folder-theme-symbolic, mimetype-theme
fi

echo "${WP_PATH}${THEME}"
