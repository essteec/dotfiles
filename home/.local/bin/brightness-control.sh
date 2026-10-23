#!/bin/bash

# This script adjusts brightness and sends a Dunst notification.
# It takes one argument: "up" or "down".

ACTION="$1" # Get the argument passed to the script

# --- Adjust Brightness ---
if [ "$ACTION" = "up" ]; then
    brightnessctl set +5%
elif [ "$ACTION" = "down" ]; then
    brightnessctl set 4.2%-
else 
    echo "Usage: adjust-brightness {up|down}"
    exit 1
fi

# --- Get Current Brightness for Notification ---
# Important: We need a tool that outputs just a number (0-100 or 0-max).
CURRENT_BRIGHTNESS=$(brightnessctl -m | cut -d, -f4 | tr -d '%')

if [ "$CURRENT_BRIGHTNESS" -lt 15 ]; then
    BRIGHTNESS_ICON="notification-display-brightness-off"
elif [ "$CURRENT_BRIGHTNESS" -gt 85 ]; then
    BRIGHTNESS_ICON="notification-display-brightness-full"
elif [ "$CURRENT_BRIGHTNESS" -lt 40 ]; then
    BRIGHTNESS_ICON="notification-display-brightness-low"
elif [ "$CURRENT_BRIGHTNESS" -lt 60 ]; then
    BRIGHTNESS_ICON="notification-display-brightness-medium"
else
    BRIGHTNESS_ICON="notification-display-brightness-high"
fi

# --- Send Dunst Notification ---
# The -r "556" replaces the previous notification of the same ID
# The -h int:value:${CURRENT_BRIGHTNESS} creates the progress bar
notify-send -a "System" "Brightness" "$CURRENT_BRIGHTNESS" -i "$BRIGHTNESS_ICON" \
    -r "557" -u low -h string:x-canonical-private-synchronous:brightness \
    -h int:value:"${CURRENT_BRIGHTNESS}"