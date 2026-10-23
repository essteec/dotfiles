#!/bin/bash

if [[ ! -f .cache/touchpad ]]; then
    echo 1 > .cache/touchpad
fi

if [[ $(cat .cache/touchpad) == 0 ]]; then
    echo 1 > .cache/touchpad
    hyprctl eval 'hl.device({ name = "elan1203:00-04f3:307a-touchpad", enabled = true })'
    notify-send -a "System" "Touchpad" "Enabled" -i touchpad-indicator-light \
        -r "561" -u normal -h string:x-canonical-private-synchronous:touchpad
else
    echo 0 > .cache/touchpad
    hyprctl eval 'hl.device({ name = "elan1203:00-04f3:307a-touchpad", enabled = false })'
    notify-send -a "System" "Touchpad" "Disabled" -i touchpad-indicator-light-disabled \
        -r "561" -u normal -h string:x-canonical-private-synchronous:touchpad
fi
