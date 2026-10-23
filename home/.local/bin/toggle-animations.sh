#!/usr/bin/env sh
HYPRGAMEMODE=$(hyprctl getoption animations:enabled | awk 'NR==1{print $2}')
if [ "$HYPRGAMEMODE" = "true" ] ; then
    hyprctl eval 'hl.config({
        animations = { enabled = false },
        decoration = {
            shadow = { enabled = false },
            blur = { enabled = false },
            fullscreen_opacity = 1,
            active_opacity = 1,
            inactive_opacity = 1,
            rounding = 0,
        },
        general = {
            gaps_in = 4,
            gaps_out = 0,
            border_size = 0,
        },
    })'

    notify-send -a "Hypr" "Animations Disabled" "Game Mode On" -i "input-gaming" \
        -r "560" -u normal -h string:x-canonical-private-synchronous:game-mode
    exit
fi

hyprctl reload

notify-send -a "Hypr" "Animations Enabled" "Game Mode Off" -i "input-gaming-symbolic" \
    -r "560" -u normal -h string:x-canonical-private-synchronous:game-mode
