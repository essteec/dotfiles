#!/usr/bin/env bash

selected="${1:-2}"

BIN_DIR="$HOME/.local/bin/"

player="$($BIN_DIR/switch-target-player.sh 0)"

status_function () {
	if playerctl --player="$player" status > /dev/null; then
		echo -e "$(playerctl --player="$player" status -f "{{playerName}}") | $(playerctl --player="$player" metadata --format "{{duration(position)}}") -> $(playerctl --player="$player" metadata --format "{{duration(mpris:length)}}" | awk '{print substr($0, length($0)-7)}') \n$(playerctl --player="$player" metadata -f "{{trunc(default(title, \"[Unknown]\"), 41)}} \n{{trunc(default(artist, \"[Unknown]\"), 41)}}")"
	else
		echo "Nothing is playing"
	fi
}

status=$(status_function)

# debug lines
# echo "<ctl>$(playerctl --player="$player" status)"
# echo "<player>$player"
# echo "<status>$status"
# echo "<player number>$(cat "$HOME/.cache/playerctl-current")"
# echo "==="

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

toggle=""
if [[ "$(playerctl --player="$player" status)" == "Playing" ]]; then
    toggle=""
fi

# Variable passed to rofi
if [[ $player == "" ]]; then
    options="$chrom\n$youtube\n$spotify\n$kick\n$netflix\n$aprime"
else 
    options="$prev\n$seekminus\n$toggle\n$seekplus\n$next\n$switch"
fi

if [[ "$player" == "spotify" || "$player" == "haruna" || $player == "mpv" ]]; then
    loop="$(playerctl --player="$player" loop)"

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

    again="$(playerctl --player="$player" shuffle)"

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
	    playerctl --player="$player" play-pause
	    #if [[ $toggle  == "" ]]; then
	    sleep 0.15 && exec "$0" 2
	    #fi
	    ;;
    $next)
	    playerctl --player="$player" next
	    sleep 0.05 && exec "$0" 4
	    ;;
    $prev)
	    playerctl --player="$player" previous
	    exec "$0" 0
            ;;
    $seekminus)
	    playerctl --player="$player" position 15-
	    exec "$0" 1
	    ;;
    $seekplus)
	    playerctl --player="$player" position 15+
	    exec "$0" 3
            ;;
    $switch)
        $BIN_DIR/switch-target-player.sh 1 
        exec "$0" 5  # to start this script again
        ;;
    $shuffle)
        playerctl --player="$player" shuffle Toggle
        
	    exec "$0" 6
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

        exec "$0" 7
        ;;
    $spotify|s)
        spotify-launcher
        ;;
    $youtube|y)
        # chromium --app=https://youtube.com
        gtk-launch youtube
	    ;;
    $kick|k)
        # chromium --app=https://kick.com
        gtk-launch kick
	    ;;
    "t")
        # chromium --app=https://twitch.com
        gtk-launch twitch
        ;;
    $netflix|n)
        # chromium --app=https://netflix.com/browse
        gtk-launch netflix
	    ;;
    $aprime|a)
        # chromium --app=https://primevideo.com/tv
	# now: https://www.primevideo.com/storefront
        gtk-launch primevideo
	    ;;
    $chrom|"c")
	    # chromium
	    gtk-launch chromium
	    ;;
    "Q")
        hyprctl dispatch "hl.dsp.window.close({ window = \"class:(?i)^${player}$\" })"
        ;;
esac
