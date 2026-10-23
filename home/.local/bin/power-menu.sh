#!/bin/bash

# Get uptime and open window count
status="Uptime: $(uptime -p | sed 's/^up //' || echo "unknown")"
status+=$'\nWindows: $(hyprctl clients | grep "^Window" | wc -l)'

# Confirmation function
confirm() {
    echo -e "Yes\nNo" | rofi -dmenu -l 2 -i -mesg "Are you sure to  $chosen?" -theme "$HOME/.config/rofi/themes/power_menu.rasi"
}

# Menu options
shutdown="  Shutdown"
reboot="  Reboot"
lock="  Lock"
suspend="  Suspend"
hibernate="󰒲  Hibernate"
logout="󰍃  Logout"

# Rofi command
rofi_cmd="rofi -dmenu -i -mesg \"$status\" -theme \"$HOME/.config/rofi/themes/power_menu.rasi\""

# Combine options
options="$shutdown\n$reboot\n$suspend\n$hibernate\n$lock\n$logout"

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
        hyprlock
        ;;
    "$suspend")
        ans=$(confirm)
        if [[ "$ans" == "Yes" ]]; then
            playerctl pause
            amixer set Master mute
            systemctl suspend
        fi
        ;;
    "$hibernate")
        ans=$(confirm)
        if [[ "$ans" == "Yes" ]]; then
            playerctl pause
            amixer set Master mute
            systemctl hibernate
        fi
        ;;
    "$logout")
        ans=$(confirm)
        if [[ "$ans" == "Yes" ]]; then
            hyprshutdown
        fi
        ;;
    *)
        exit 0
        ;;
esac
