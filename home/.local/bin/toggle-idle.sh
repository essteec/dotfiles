#!/bin/bash

# if there is a argument 'get' get status of idle inhibitor and exit
if [[ "$1" == "get" ]]; then
  if pgrep -x hypridle >/dev/null; then
    echo "off"
  else
    echo "on"
  fi
  exit 0
fi

# there is no argument then toggle:

if pgrep -x hypridle >/dev/null; then
  pkill -x hypridle
  notify-send -a "System" "Screen Lock" "Off - Display will stay on" -i "caffeine-cup-full"
else
  hypridle >/dev/null 2>&1 &
  notify-send -a "System" "Screen Lock" "On - Display will sleep when inactive" -i "caffeine-cup-empty"
fi

# pkill -RTMIN+9 waybar for refresh custom waybar modules?
