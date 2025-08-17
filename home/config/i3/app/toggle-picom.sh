#!/bin/bash

# launch picom if not working already; else kill picom

if pgrep -x picom >/dev/null; then
    pkill -x picom && echo "picom killed"
else
    echo "Launching picom"
    nohup picom --config ~/.config/picom/picom.conf >/dev/null 2>&1 &
fi