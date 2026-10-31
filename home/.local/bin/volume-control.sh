#!/bin/bash

SINK=@DEFAULT_AUDIO_SINK@
SOURCE=@DEFAULT_AUDIO_SOURCE@

case "$1" in
up)
    # -l 1.2 caps at 120%; drop it if you want to allow over-amplification
    wpctl set-volume -l 1.2 "$SINK" 4%+
    ;;
down)
    wpctl set-volume "$SINK" 5%-
    ;;
mute)
    wpctl set-mute "$SINK" toggle
    ;;
micmute)
    wpctl set-mute "$SOURCE" toggle

    if wpctl get-volume "$SOURCE" | grep -q MUTED; then
        mic="Muted"
        icon="microphone-sensitivity-muted"
    else
        mic="Unmuted"
        icon="microphone-sensitivity-high"
    fi

    notify-send -a "System" "Microphone" "$mic" -i "$icon" \
        -r "562" -u low -h string:x-canonical-private-synchronous:microphone

    exit 0
    ;;
*)
    echo "Usage: volume-control.sh {up|down|mute|micmute}"
    exit 1
    ;;
esac

# Get volume & mute state
# wpctl prints e.g. "Volume: 0.45" or "Volume: 0.45 [MUTED]"
VOL_RAW=$(wpctl get-volume "$SINK")
VOLUME=$(awk '{printf "%.0f", $2 * 100}' <<< "$VOL_RAW")

BODY="Volume"

if grep -q MUTED <<< "$VOL_RAW"; then
    MUTED="yes"
    BODY="$BODY muted"
    VOLUME_ICON="audio-volume-muted"
else
    MUTED="no"
    if [ "$VOLUME" -lt 20 ]; then
        VOLUME_ICON="audio-volume-low"
    elif [ "$VOLUME" -lt 60 ]; then
        VOLUME_ICON="audio-volume-medium"
    else
        VOLUME_ICON="audio-volume-high"
    fi
fi

# Notification
notify-send -a "System" "$BODY" "$VOLUME" -i "$VOLUME_ICON" \
    -r "556" -u low -h string:x-canonical-private-synchronous:volume \
    -h int:value:"${VOLUME}"