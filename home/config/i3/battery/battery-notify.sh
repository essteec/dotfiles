#!/bin/bash

# Prevent multiple instances
LOCK_PID=$(pgrep -fx "$0" | grep -v $$)
if [ -n "$LOCK_PID" ]; then
    echo "Another instance (PID $LOCK_PID) is already running. Exiting."
    exit 0
fi

# Initial delay
sleep 60

# Main Shell Variables
LOW_BAT_THRESHOLD=20
SOUND_FILE="$HOME/.config/i3/meow.wav"

# Wrapper loop
while true; do

    # Get battery status
    BAT_CAPACITY=$(cat /sys/class/power_supply/BAT1/capacity 2>/dev/null | head -n 1)
    BAT_STATUS=$(cat /sys/class/power_supply/BAT1/status 2>/dev/null | head -n 1)

    # Exit if no battery found
    if [ -z "$BAT_CAPACITY" ]; then
        echo "Error: Could not read battery info!" >&2
        exit 1
    fi

    # For debug
    # echo $BAT_CAPACITY 
    # echo $(date)

    # Only alert if:
    # - Battery ≤ threshold
    # - Not charging
    # - Not full
    if [ "$BAT_CAPACITY" -le "$LOW_BAT_THRESHOLD" ] && 
    [ "$BAT_STATUS" = "Discharging" ]; then
    
        # Better notify-send with:
        # - Critical urgency (-u critical)
        # - Expire time (-t 26000 = 26 sec)
        # - App name (-a "Battery Monitor")
        notify-send -u critical -t 26000 -a "Battery Monitor" \
            "⚠️ Low Battery: ${BAT_CAPACITY}%" \
            "Plug in your charger soon!" \
            --icon=battery-caution

        # Play sound if file exists
        if [ -f "$SOUND_FILE" ]; then
            paplay "$SOUND_FILE" &
        else
            echo "Warning: Sound file not found ($SOUND_FILE)" >&2
        fi
    fi

    sleep $((BAT_CAPACITY * 6))
done

