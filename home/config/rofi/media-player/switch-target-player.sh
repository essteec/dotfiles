#!/usr/bin/env bash

# Get all players
PLAYERS=($(playerctl -l))
TOTAL=${#PLAYERS[@]}

# Store last used player in a cache file
CACHE_FILE="$HOME/.cache/playerctl_current"

# Determine the current index
if [[ -f "$CACHE_FILE" ]]; then
    CURRENT=$(cat "$CACHE_FILE")
else
    CURRENT=0
fi

if [[ $PLAYERS == "" ]]; then
    NEXT=-1
else 
    # Move to next player (wrap around if needed)
    
    NEXT=$(( ((CURRENT + $1)) % TOTAL ))
    
    # Save the new index
    echo "$NEXT" > "$CACHE_FILE"

    echo "${PLAYERS[$NEXT]}"
fi
