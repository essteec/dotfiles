#!/usr/bin/env bash

selected="${1:-2}"

BIN_DIR="$HOME/.local/bin/"

status_function () {
    if playerctl --player="$player" status > /dev/null; then
        echo -e "$(playerctl --player="$player" status -f "{{playerName}}") | $(playerctl --player="$player" metadata --format "{{duration(position)}}") -> $(playerctl --player="$player" metadata --format "{{duration(mpris:length)}}" | awk '{print substr($0, length($0)-7)}') \n$(playerctl --player="$player" metadata -f "{{trunc(default(title, \"[Unknown]\"), 41)}} \n{{trunc(default(artist, \"[Unknown]\"), 41)}}")"
    else
        echo "Nothing is playing"
    fi
}

next="󰼧"
prev="󰼨"
seekminus="󱥆"
seekplus="󱤺"
switch="󱤵"

spotify=""
youtube=""
chrom=""
kick="󰻏"

netflix="󰝆"
aprime=""

# pause button: ||  
# play button: > 

optimistic_toggle=""

while true; do
    player="$($BIN_DIR/switch-target-player.sh 0)"

    status=$(status_function)

    # debug lines
    # echo "<ctl>$(playerctl --player="$player" status)"
    # echo "<player>$player"
    # echo "<status>$status"
    # echo "<player number>$(cat "$HOME/.cache/playerctl-current")"
    # echo "==="

    if [[ -n "$optimistic_toggle" ]]; then
        toggle="$optimistic_toggle"
        optimistic_toggle=""
    else
        toggle=""
        if [[ "$(playerctl --player="$player" status 2>/dev/null)" == "Playing" ]]; then
            toggle=""
        fi
    fi

    # Variable passed to rofi
    if [[ $player == "" ]]; then
        options="$chrom\n$youtube\n$spotify\n$kick\n$netflix\n$aprime"
    else 
        options="$prev\n$seekminus\n$toggle\n$seekplus\n$next\n$switch"
    fi

    if [[ "$player" == "spotify" || "$player" == "haruna" || $player == "mpv" ]]; then
        loop="$(playerctl --player="$player" loop 2>/dev/null)"

        case "$loop" in
            "None")
                repeat="󰑗"
                ;;
            "Track")
                repeat="󰑘"
                ;;
            "Playlist")
                repeat="󰑖"
                ;;
            *)
                echo "cannot get repeat status!"
                repeat=""
                ;;
        esac

        again="$(playerctl --player="$player" shuffle 2>/dev/null)"

        case "$again" in
            "On")
                shuffle=""
                ;;
            "Off")
                shuffle="󰒞"
                ;;
            *)
                echo "cannot get shuffle status!"
                shuffle=""
                ;;
        esac

        options+="\n$shuffle\n$repeat"
    fi

    chosen="$(echo -e "$options" | rofi -show -mesg "${status^}" -dmenu -selected-row "$selected" -theme ~/.config/rofi/themes/media_player.rasi)"

    [[ -z "$chosen" ]] && exit 0

    case $chosen in
        $toggle)
            playerctl --player="$player" play-pause &
            if [[ "$toggle" == "" ]]; then
                optimistic_toggle=""
            else
                optimistic_toggle=""
            fi
            selected=2
            ;;
        $next)
            playerctl --player="$player" next
            sleep 0.05
            selected=4
            ;;
        $prev)
            playerctl --player="$player" previous
            selected=0
            ;;
        $seekminus)
            playerctl --player="$player" position 15-
            selected=1
            ;;
        $seekplus)
            playerctl --player="$player" position 15+
            selected=3
            ;;
        $switch)
            $BIN_DIR/switch-target-player.sh 1 
            selected=5  # to start this script again
            ;;
        $shuffle)
            playerctl --player="$player" shuffle Toggle
            selected=6
            ;;
        $repeat)
            modes=("None" "Playlist" "Track")

            current=$(playerctl --player="$player" loop)

            # Find index of current mode
            for i in "${!modes[@]}"; do
                if [[ "${modes[$i]}" == "$current" ]]; then
                    next_index=$(( (i + 1) % ${#modes[@]} ))
                    break
                fi
            done

            playerctl --player="$player" loop "${modes[$next_index]}"
            selected=7
            ;;
        $spotify|s)
            spotify-launcher
            break
            ;;
        $youtube|y)
            # chromium --app=https://youtube.com
            gtk-launch youtube
            break
            ;;
        $kick|k)
            # chromium --app=https://kick.com
            gtk-launch kick
            break
            ;;
        "t")
            # chromium --app=https://twitch.com
            gtk-launch twitch
            break
            ;;
        $netflix|n)
            # chromium --app=https://netflix.com/browse
            gtk-launch netflix
            break
            ;;
        $aprime|a)
            # chromium --app=https://primevideo.com/tv
            # now: https://www.primevideo.com/storefront
            gtk-launch primevideo
            break
            ;;
        $chrom|"c")
            # chromium
            gtk-launch chromium
            break
            ;;
        "Q")
            hyprctl dispatch "hl.dsp.window.close({ window = \"class:(?i)^${player}$\" })"
            break
            ;;
    esac
done
