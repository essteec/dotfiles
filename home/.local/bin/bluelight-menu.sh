#!/usr/bin/env bash

# --- CONFIGURATION ---
TEMP_STEP=100
GAMMA_STEP=5        # Gamma is handled as 0-100 or 0.1-1.0; hyprctl uses 0-100
MIN_TEMP=1000       # Very red
MAX_TEMP=10000      # Very blue
MIN_GAMMA=50       # Don't go below 50% to avoid total darkness
MAX_GAMMA=150       # Some people like it boosted

DEFAULT_TEMP=6000
DEFAULT_GAMMA=100

# --- HELPER FUNCTIONS ---
get_current_temp() {
    hyprctl hyprsunset temperature | tr -d '[:space:]'
}

get_current_gamma() {
    hyprctl hyprsunset gamma | tr -d '[:space:]'
}

# --- MAIN GUI ---
selected="${1:-0}"

show_menu() {
    curr_t=$(get_current_temp)
    curr_g=$(get_current_gamma)
    # remove after points to make it decimal
    # input curr_g = 104.999 -> 104 = output, input curr_g = 0.850 -> 85 output
    curr_g=$(printf "%.0f" "$curr_g")
    curr_t=$(printf "%.0f" "$curr_t")

    status="current settings: ${curr_t}K, ${curr_g}% gamma"

    inc_temp=" +${TEMP_STEP}K"
    dec_temp=" -${TEMP_STEP}K"
    inc_gamma=" +${GAMMA_STEP}"
    dec_gamma="󰖔 -${GAMMA_STEP}"
    defaults="󰁯 reset"
    disable="󰈆 disable"

    options="$inc_temp\n$dec_temp\n$inc_gamma\n$dec_gamma\n$defaults\n$disable"

    # Use rofi to select action
    # Note: 'dmenu' mode is used for simplicity
    rofi_cmd="rofi -dmenu -i -mesg '${status}' -theme $HOME/.config/rofi/themes/media_player.rasi -selected-row $selected -theme-str 'configuration { font: \"JetBrainsMono Nerd Font Propo 12\"; }'"

    selection=$(echo -e "$options" | eval $rofi_cmd)

    case "$selection" in
        $inc_temp)
            new_val=$((curr_t + TEMP_STEP))
            [[ $new_val -gt MAX_TEMP ]] && new_val=$MAX_TEMP
            hyprctl hyprsunset temperature "$new_val"
            exec "$0" 0
            ;;
        $dec_temp)
            new_val=$((curr_t - TEMP_STEP))
            [[ $new_val -lt MIN_TEMP ]] && new_val=$MIN_TEMP
            hyprctl hyprsunset temperature "$new_val"
            exec "$0" 1
            ;;
        $inc_gamma)
            new_val=$((curr_g + GAMMA_STEP))
            [[ $new_val -gt MAX_GAMMA ]] && new_val=$MAX_GAMMA
            hyprctl hyprsunset gamma "$new_val"
            exec "$0" 2
            ;;
        $dec_gamma)
            new_val=$((curr_g - GAMMA_STEP))
            [[ $new_val -lt MIN_GAMMA ]] && new_val=$MIN_GAMMA
            hyprctl hyprsunset gamma "$new_val"
            exec "$0" 3
            ;;
        $defaults)
            pkill hyprsunset; sleep 0.5; hyprsunset & disown  # sometimes end up with cannot connect to hyprsunset
            exec "$0" 4
            ;;
        $disable)
            hyprctl hyprsunset temperature $DEFAULT_TEMP
            hyprctl hyprsunset gamma $DEFAULT_GAMMA
            exec "$0" 5
            ;;
        *)
            exit 0
            ;;
    esac
}

# Check if hyprsunset is running (via hyprctl test)
if ! hyprctl hyprsunset temperature &>/dev/null; then
    hyprsunset & disown
    sleep 0.5 # Give it a moment to start
fi

show_menu
