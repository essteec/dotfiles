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
LOW_BAT_THRESHOLD=24
SOUND_FILE="$HOME/.local/share/sounds/steereeo/stereo/low-battery.wav"
# SOUND_FILE="/usr/share/sounds/freedesktop/stereo/service-logout.oga"

# Track AC state to change power profiles on plug/unplug only
LAST_AC_STATE=$(cat /sys/class/power_supply/ACAD/online 2>/dev/null)

if [ $LAST_AC_STATE -eq 1 ]; then
    tlpctl balanced
else
    tlpctl power-saver
fi

# Wrapper loop
while true; do

    # Get battery status
    BAT_CAPACITY=$(cat /sys/class/power_supply/BAT1/capacity 2>/dev/null | head -n 1)
    BAT_STATUS=$(cat /sys/class/power_supply/BAT1/status 2>/dev/null | head -n 1)
    
    # Check for AC transitions (plugged in vs unplugged)
    CURRENT_AC_STATE=$(cat /sys/class/power_supply/ACAD/online 2>/dev/null)
    
    # If the file returned a value, and it differs from last state
    if [ -n "$CURRENT_AC_STATE" ] && [ "$CURRENT_AC_STATE" != "$LAST_AC_STATE" ]; then
        if [ "$CURRENT_AC_STATE" -eq 1 ]; then
            tlpctl balanced
            notify-send -a "Battery" "Power Profile" "Switched to  Balanced" -i "battery-profile-balanced"
        elif [ "$CURRENT_AC_STATE" -eq 0 ]; then
            tlpctl power-saver
            notify-send -a "Battery" "Power Profile" "Switched to 󰌪 Power Saver Mode" -i "battery-profile-powersave"
        fi
        LAST_AC_STATE="$CURRENT_AC_STATE"
    fi

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
        # - App name (-a "Battery Monitor")
        notify-send -a "Battery" "Low Battery" "${BAT_CAPACITY}%" -i "battery-010"  \
            -r "558" -u critical -h string:x:canonical-private-synchronous:battery

        # Play sound if file exists
        if [ -f "$SOUND_FILE" ]; then
            pw-play "$SOUND_FILE" --volume 1.4 &
        else
            echo "Warning: Sound file not found ($SOUND_FILE)" >&2
        fi
    fi

    sleep $((BAT_CAPACITY * 5))
done

