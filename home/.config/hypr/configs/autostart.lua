local home = os.getenv("HOME") or ""
local current_path = os.getenv("PATH") or ""

hl.env(
	"PATH",
	home .. "/.local/bin:" .. home .. "/bin:" .. current_path
)

-- hl.env(
--     "PATH",
--     "$HOME/.local/bin:$HOME/bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/usr/bin/site_perl:/usr/bin/vendor_perl:/usr/bin/core_perl"
-- )

hl.on("hyprland.start", function()
	-- Merge the environment variables from the user session into the systemd user session.
	hl.exec_cmd("systemctl --user import-environment PATH HOME DISPLAY WAYLAND_DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE")
	hl.exec_cmd("dbus-update-activation-environment --systemd --all")

	hl.exec_cmd("/usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1")

	hl.exec_cmd("awww-daemon")
	-- hl.exec_cmd("xrdb -merge ~/.Xresources")
	hl.exec_cmd("mpris-proxy")

	hl.exec_cmd("xsettingsd")

	-- Clipboard
	hl.exec_cmd("wl-paste --type image --watch cliphist -max-items=50 store")
	hl.exec_cmd("wl-paste --type text --watch cliphist -max-items=50 store")
	hl.exec_cmd("wl-clip-persist --clipboard regular")

	hl.exec_cmd("swaync")

	-- Hypr apps
	hl.exec_cmd("hypridle")
	hl.exec_cmd("hyprsunset")

	hl.exec_cmd("blueman-applet")
	hl.exec_cmd("nm-applet")

	-- We need the PATH for waybar config to work properly.
	hl.exec_cmd("sleep 1 && waybar")

	hl.exec_cmd("easyeffects -w")

	hl.exec_cmd("battery-notify.sh")

	hl.exec_cmd("kdeconnect-indicator")
	hl.exec_cmd("/usr/share/sddm/themes/silent/random-conf.sh")
end)

