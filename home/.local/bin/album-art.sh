#!/bin/bash

# 1. Get the Art URL from the CURRENT player (avoid -a to prevent duplicates)
artUrl=$(playerctl metadata --format '{{mpris:artUrl}}' 2>/dev/null)

# 2. If no art URL, remove the image so hyprlock clears it (or keep a fallback)
if [ -z "$artUrl" ]; then
    rm -f /tmp/lockscreen-art*.png
    echo "" # Return empty to hide or handle fallback
    exit
fi

# 3. Create a unique filename based on the URL hash
#    This ensures the filename changes ONLY when the album art changes.
urlHash=$(echo -n "$artUrl" | md5sum | cut -d' ' -f1)
targetFile="/tmp/lockscreen-art-${urlHash}.png"

# 4. Only download if we don't already have this specific art cached
if [ ! -f "$targetFile" ]; then
    # Clean up old art files to prevent /tmp filling up
    rm -f /tmp/lockscreen-art*.png
    
    # Download the new art
    curl -s "$artUrl" -o "$targetFile"
fi

# 5. Echo the path. Hyprlock sees a NEW path and updates the image.
echo "$targetFile"
