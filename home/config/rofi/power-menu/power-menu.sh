#!/bin/bash

# Get uptime cleanly
uptime="$(uptime -p | sed 's/^up //')"

# Confirmation function
confirm() {
    echo -e "Yes\nNo" | rofi -dmenu -l 2 -i -p "Are you sure?" -theme "$HOME/.config/rofi/themes/power_menu.rasi"
}

# Menu options
shutdown="  Shutdown"
reboot="  Reboot"
lock="  Lock"
suspend="  Suspend"
logout="󰍃  Logout"

# Rofi command
rofi_cmd="rofi -dmenu -i -p 'Power:' -mesg \"Uptime: $uptime\" -theme \"$HOME/.config/rofi/themes/power_menu.rasi\""

# Combine options
options="$shutdown\n$reboot\n$suspend\n$logout\n$lock"

# Show menu and store choice
chosen="$(echo -e "$options" | eval $rofi_cmd)"

# Confirm and execute
case "$chosen" in
    "$shutdown")
        ans=$(confirm)
        if [[ "$ans" == "Yes" ]]; then
            systemctl poweroff
        fi
        ;;
    "$reboot")
        ans=$(confirm)
        if [[ "$ans" == "Yes" ]]; then
            systemctl reboot
        fi
        ;;
    "$lock")
        light-locker-command -l
        ;;
    "$suspend")
        ans=$(confirm)
        if [[ "$ans" == "Yes" ]]; then
            playerctl pause
            amixer set Master mute
            systemctl suspend
        fi
        ;;
    "$logout")
        ans=$(confirm)
        if [[ "$ans" == "Yes" ]]; then
            i3-msg exit
        fi
        ;;
    *)
        exit 0
        ;;
esac
