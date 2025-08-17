#!/bin/bash

# export DISPLAY=:0
# export XDG_RUNTIME_DIR="/run/user/$(id -u)"
# export DBUS_SESSION_BUS_ADDRESS="unix:path=${XDG_RUNTIME_DIR}/bus"

# Default sink (output device)
SINK=$(pactl get-default-sink)

# Volume change logic
case "$1" in
    up)
        pactl set-sink-volume "$SINK" +4%
        ;;
    down)
        pactl set-sink-volume "$SINK" -5%
        ;;
    mute)
        pactl set-sink-mute "$SINK" toggle
        ;;
    *)
        echo "Usage: $0 {up|down|mute}"
        exit 1
        ;;
esac

# Get volume & mute state
VOLUME=$(pactl get-sink-volume "$SINK" | grep -oP '\d+%' | head -1)
MUTED=$(pactl get-sink-mute "$SINK" | awk '{print $2}')

# Notification
if [ "$MUTED" = "yes" ]; then
    notify-send "volume" "$VOLUME" -r "556" -h int:value:"${VOLUME}"
else
    notify-send "volume" "$VOLUME" -r "556" -h int:value:"${VOLUME}"
fi