#!/bin/bash

# MUST DO to make this script work:
# sudo visudo -f /etc/sudoers.d/tlp-charge
# [username] ALL=(root) NOPASSWD: /usr/bin/tlp setcharge 0 60
# [username] ALL=(root) NOPASSWD: /usr/bin/tlp setcharge 0 80
# [username] ALL=(root) NOPASSWD: /usr/bin/tlp setcharge 0 100

# todo add icons for each profile
# battery profiles: performance, balanced, power-saver
bat_profile=$(tlpctl get) # status

performance=" 󱐋 Performance" # 󱐌 󰠠
balanced="  Balanced"  #  󰗑
powersave=" 󰌪 Power Saver"  #   󱤅

lines=2
if [[ "$bat_profile" == "performance" ]]; then
    options="$balanced\n$powersave"
elif [[ "$bat_profile" == "balanced" ]]; then
    options="$performance\n$powersave"
elif [[ "$bat_profile" == "power-saver" ]]; then
    options="$performance\n$balanced"
else 
    lines=3
    options="$performance\n$balanced\n$powersave"
fi

# battery charge thresold: 100, 80, 60
bat_thresold=$(cat /sys/class/power_supply/BAT1/charge_control_end_threshold) # status

full=" 󰠇 Full Charge"  # 󰂅
partial=" 󰠏 80% Charge"  # 󰂊
low=" 󰠍 60% Charge"  # 󰂉

if [[ "$bat_thresold" == "60" ]]; then
    options="$options\n$full\n$partial"
elif [[ "$bat_thresold" == "80" ]]; then
    options="$options\n$full\n$low"
elif [[ "$bat_thresold" == "100" ]]; then
    options="$options\n$partial\n$low"
else
    options="$options\n$full\n$partial\n$low"
fi

# stay awake options: on, off
idle_status=$(toggle-idle.sh get) # status

enable_awake=" 󰈈 Enable Idle Awake"  # 󰅶 󰛊   󰛐 󰍹 󰔂
disable_awake=" 󰈉 Disable Idle Awake"  # 󰾪 󰾫   󰛑 󰶐 󰠻


if [[ "$idle_status" == "on" ]]; then
    options="$options\n$disable_awake"
elif [[ "$idle_status" == "off" ]]; then
    options="$options\n$enable_awake"
else
    options="$options\n$disable_awake\n$enable_awake"
fi

# finally rofi menu
rofi_cmd="rofi -dmenu -theme-str 'listview { lines: $lines; }' -i -mesg \"Profile: $bat_profile-$bat_thresold%-$idle_status\" -theme \"$HOME/.config/rofi/themes/power_menu.rasi\""

chosen="$(echo -e "$options" | eval $rofi_cmd)"

case $chosen in
    "$performance")
        tlpctl performance
        notify-send -a "Battery" "Power Profile" "Switched to $performance mode" -i "battery-profile-performance"
        ;;
    "$balanced")
        tlpctl balanced
        notify-send -a "Battery" "Power Profile" "Switched to $balanced mode" -i "battery-profile-balanced"
        ;;
    "$powersave")
        tlpctl power-saver
        notify-send -a "Battery" "Power Profile" "Switched to $powersave mode" -i "battery-profile-powersave"
        ;;
    "$full")
        sudo tlp setcharge 0 100
        notify-send -a "Battery" "Battery Charge Threshold" "Set to $full"
        ;;
    "$partial")
        sudo tlp setcharge 0 80
        notify-send -a "Battery" "Battery Charge Threshold" "Set to $partial"
        ;;
    "$low")
        sudo tlp setcharge 0 60
        notify-send -a "Battery" "Battery Charge Threshold" "Set to $low"
        ;;
    "$enable_awake"|"$disable_awake")
        toggle-idle.sh  # this script will handle toggling and notification
        ;;
    *)
        exit 0
        ;;
esac
