#!/usr/bin/env bash

# ignore players (for some bluetooth devices) seperated with ,
ignore="-i JBL_Go_4"
# or just keep it blank
# ignore=""

# Get all players
PLAYERS=($(playerctl -l $ignore))
TOTAL=${#PLAYERS[@]}

# Store last used player in a cache file
CACHE_FILE="$HOME/.cache/playerctl-current"

# Determine the current index
if [[ -f "$CACHE_FILE" ]]; then
    CURRENT_PLAYER=$(cat "$CACHE_FILE")
else
    CURRENT_PLAYER=""
fi

if [[ $TOTAL -eq 0 ]]; then
    NEXT=-1
else 
    CURRENT=0

    for i in "${!PLAYERS[@]}"; do
        if [[ "${PLAYERS[$i]}" == "$CURRENT_PLAYER" ]]; then
            CURRENT=$i
            break
        fi
    done

    # Move to next player (wrap around if needed)
    
    NEXT=$(( ((CURRENT + $1)) % TOTAL ))
    
    # Save the new index
    echo "${PLAYERS[$NEXT]}" > "$CACHE_FILE"

    echo "${PLAYERS[$NEXT]}"
fi
