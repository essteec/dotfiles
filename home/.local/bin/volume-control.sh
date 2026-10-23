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
    micmute)
        wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle
    
        mic=$(wpctl get-volume @DEFAULT_AUDIO_SOURCE@ | grep -q MUTED && echo "Muted" || echo "Unmuted")

        if [ "$mic" = "Muted" ]; then
            icon="microphone-sensitivity-muted"
        else
            icon="microphone-sensitivity-high"
        fi

        notify-send -a "System" "Microphone" "$mic" -i $icon \
            -r "562" -u low -h string:x-canonical-private-synchronous:microphone

        exit 0
        ;;
    *)
        echo "Usage: volume-control.sh {up|down|mute}"
        exit 1
        ;;
esac

# Get volume & mute state
VOLUME=$(pactl get-sink-volume "$SINK" | grep -oP '\d+%' | head -1 | tr -d '%')
MUTED=$(pactl get-sink-mute "$SINK" | awk '{print $2}')
if [ "$VOLUME" -lt 20 ]; then
    VOLUME_ICON="audio-volume-low"
elif [ "$VOLUME" -lt 60 ]; then
    VOLUME_ICON="audio-volume-medium"
else
    VOLUME_ICON="audio-volume-high"
fi

# Notification
if [ "$MUTED" = "yes" ]; then
    notify-send -a "System" "Volume muted" "$VOLUME" -i "audio-volume-muted" \
    -r "556" -u low -h string:x-canonical-private-synchronous:volume \
    -h int:value:"${VOLUME}"
else
    notify-send -a "System" "Volume" "$VOLUME" -i "$VOLUME_ICON" \
    -r "556" -u low -h string:x-canonical-private-synchronous:volume \
    -h int:value:"${VOLUME}"
fi
