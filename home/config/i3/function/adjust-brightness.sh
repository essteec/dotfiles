#!/bin/bash

# This script adjusts brightness and sends a Dunst notification.
# It takes one argument: "up" or "down".

ACTION="$1" # Get the argument passed to the script

# --- Adjust Brightness ---
if [ "$ACTION" = "up" ]; then
    brightnessctl set +3% # Or use 'xbacklight -inc 5' if brightnessctl doesn't work for you
elif [ "$ACTION" = "down" ]; then
    brightnessctl set 4.2%- # Or use 'xbacklight -dec 5'
fi

# --- Get Current Brightness for Notification ---
# Important: We need a tool that outputs just a number (0-100 or 0-max).
# You confirmed `xbacklight -get | grep -P -o "^\\d{1,3}"` works well.
# If `brightnessctl get` outputs just a number, you could use that instead.
CURRENT_BRIGHTNESS=$(xbacklight -get | grep -P -o "^\\d{1,3}")

# --- Send Dunst Notification ---
# The -r "556" replaces the previous notification of the same ID
# The -h int:value:${CURRENT_BRIGHTNESS} creates the progress bar
notify-send "brightness" "${CURRENT_BRIGHTNESS}%" -r "556" -h int:value:"${CURRENT_BRIGHTNESS}"