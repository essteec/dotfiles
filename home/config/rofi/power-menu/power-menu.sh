#!/bin/bash

# Get uptime cleanly
uptime="$(uptime -p | sed 's/^up //' || echo "unknown")"

# Confirmation function
confirm() {
    echo -e "Yes\nNo" | rofi -dmenu -l 2 -i -p "Are you sure?" -hover-select "true" -me-select-entry "Return" -me-accept-entry "MousePrimary" -theme "$HOME/.config/rofi/themes/power_menu.rasi"
}

# tlp battery/ac mode
if [[ "$(sudo tlp-stat -s | grep "Mode" | awk '{print $3$4}')" == "battery(manual)" ]]; then
    mode="󱐥  Performance Mode"
    mode_action="auto"
else
    mode="󱐤  Battery Mode"
    mode_action="bat"
fi

# charge to 100 or 80
if [[ "$(sudo tlp-stat -b | grep "charge_control_end_threshold" | awk '{print $3}')" -lt 100 ]]; then
    charge="󰂅  Full Charge"
    charge_action="full"
else
    charge="󰢞  80% Charge"
    charge_action="partial"
fi

# enable/disable screensaver - stay awake/allow sleep 
if xset q | grep -q "DPMS is Enabled"; then
    screen="󰒳  Disable Auto Sleep"
    screen_action="disable"
else
    screen="󰒲  Enable Auto Sleep"
    screen_action="enable"
fi

# Menu options
shutdown="  Shutdown"
reboot="  Reboot"
lock="  Lock"
suspend="  Suspend"
logout="󰍃  Logout"

# Rofi command
rofi_cmd="rofi -dmenu -i -p 'Power:' -mesg \"Uptime: $uptime\"i -hover-select "true" -me-select-entry "Return" -me-accept-entry "MousePrimary" -theme \"$HOME/.config/rofi/themes/power_menu.rasi\""

# Combine options
options="$shutdown\n$reboot\n$suspend\n$logout\n$lock\n$screen\n$mode\n$charge"

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
    "$screen")
        if [[ "$screen_action" == "disable" ]]; then
            xset s off -dpms
            notify-send "🖥️ Screen sleep disabled" "DPMS and screen blanking are now OFF."
        else
            xset s on +dpms
            notify-send "💤 Screen sleep enabled" "Screen will blank after 10 minutes."
        fi
        ;;
    "$mode")
        if [[ "$mode_action" == "auto" ]]; then
            sudo tlp start
            notify-send "🔋 Power Mode" "TLP switched to Auto Mode"
        else
            sudo tlp bat
            notify-send "󱐤 Power Mode" "TLP switched to Battery Mode"
        fi
        ;;
    "$charge")
        if [[ "$charge_action" == "full" ]]; then
            sudo tlp fullcharge
            notify-send "⚡ Charging" "Battery set to full charge (100%)"
        else
            sudo tlp setcharge 0 80
            notify-send "🔋 Battery Saving" "Battery charging limited to 80%"
        fi
        ;;
    *)
        exit 0
        ;;
esac
