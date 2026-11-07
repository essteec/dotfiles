#!/usr/bin/env bash

BAT_PATH="/sys/class/power_supply/BAT1"

# Get the current battery percentage
# battery_percentage=$(cat "$BAT_PATH/capacity")
read -r battery_percentage < "$BAT_PATH/capacity"

# Get the battery status:
# "Not charging" "Discharging" "Charging" "Full" "Unknown"
# battery_status=$(cat "$BAT_PATH/status")  
read -r battery_status < "$BAT_PATH/status"

# Define the battery icons for each 10% segment
battery_icons=("󱃍" "󰁺" "󰁻" "󰁼" "󰁽" "󰁾" "󰁿" "󰂀" "󰂁" "󰂂" "󰁹")
charging_icons=("󰢟" "󰢜" "󰂆" "󰂇" "󰂈" "󰢝" "󰢝" "󰢞" "󰂊" "󰂋" "󰂅")

plugged_icon=""
unknown_icon="󰂑"

battery_icon="󱟩"

# Calculate the index for the icon array
icon_index=$((battery_percentage / 9))
((icon_index > 10)) && icon_index=10

# Select icon based on battery status
case "$battery_status" in
  Charging)
    battery_icon=${charging_icons[icon_index]}
    ;;
  Discharging)
    battery_icon=${battery_icons[icon_index]}
    ;;
  Full | "Not charging")
    battery_icon=$plugged_icon
    ;;
  Unknown)
    battery_icon=$unknown_icon
    ;;
esac

# Output the battery percentage and icon
echo "$battery_percentage% $battery_icon" 
