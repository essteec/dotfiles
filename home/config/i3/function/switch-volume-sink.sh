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

# Notify the user of the new sink
notify-send "Audio Output:" "$NEXT_SINK" -r "557"