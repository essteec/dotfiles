#!/bin/bash

# Get a list of all available sinks and their names
SINK_LIST=($(pactl list short sinks | awk '{print $2}'))

# Get the name of the current default sink
CURRENT_SINK=$(pactl get-default-sink)

# Find the index of the current sink in the list
for i in "${!SINK_LIST[@]}"; do
    if [[ "${SINK_LIST[$i]}" = "$CURRENT_SINK" ]]; then
        CURRENT_INDEX=$i
        break
    fi
done

# Calculate the index of the next sink, wrapping around to 0 if at the end of the list
NEXT_INDEX=$(( (CURRENT_INDEX + 1) % ${#SINK_LIST[@]} ))
NEXT_SINK="${SINK_LIST[$NEXT_INDEX]}"

# Set the next sink as the new default
pactl set-default-sink "$NEXT_SINK"

# Move all current audio streams to the new sink
pactl list short sink-inputs | cut -f1 | while read -r id; do
    pactl move-sink-input "$id" "$NEXT_SINK"
done

# update $NEXT_SINK to a more user-friendly name cut it till the first _
# NEXT_SINK_FRIENDLY=$(echo "$NEXT_SINK" | cut -d'_' -f1)

# echo NEXT_SINK_FRIENDLY: "$NEXT_SINK"

if [[ "$NEXT_SINK" == alsa*hdmi* ]]; then
    ICON="computer-laptop" # system-symbolic, computer-symbolic, display-symbolic
    NAME="hdmi device"
elif [[ "$NEXT_SINK" == bluez* ]]; then
    ICON="bluetooth"
    NAME="bluetooth device"
else 
    ICON="audio-speakers"
    NAME="speakers"
fi

# Notify the user of the new sink
notify-send -a "System" "Audio output" "$NAME" -i "$ICON" \
    -r "558" -u low -h string:x-canonical-private-synchronous:audio-sink \
    -h string:sink-name:"${NEXT_SINK}"