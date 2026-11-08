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
  notify-send -a "System" "Screen Lock" "Off - Display will stay on" -i "caffeine-cup-full" \
      -r "569" -u low -h string:x-canonical-private-synchronous:awake
else
  hypridle >/dev/null 2>&1 &
  notify-send -a "System" "Screen Lock" "On - Display would not stay on" -i "caffeine-cup-empty" \
      -r "569" -u low -h string:x-canonical-private-synchronous:awake
fi
