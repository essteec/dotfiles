-- See https://wiki.hypr.land/Configuring/Start/

hl.env("XCURSOR_SIZE", "24")
hl.env("XCURSOR_THEME", "phinger-cursors-dark")
hl.env("HYPRCURSOR_SIZE", "24")
hl.env("HYPRCURSOR_THEME", "phinger-cursors-dark")
hl.env("QT_QPA_PLATFORMTHEME", "qt6ct") -- change to qt6ct if you have that
hl.env("QT_QPA_PLATFORM", "wayland")
hl.env("GDK_BACKEND", "wayland")

-- Nvidia specific
hl.env("LIBVA_DRIVER_NAME", "nvidia")
hl.env("__GLX_VENDOR_LIBRARY_NAME", "nvidia")
hl.env("ELECTRON_OZONE_PLATFORM_HINT", "auto")

hl.monitor({ output = "eDP-1", mode = "1920x1080@144", position = "auto", scale = 1 })
hl.monitor({ output = "HDMI-A-1", mode = "1920x1080@144", position = "0x0", scale = 1 })  -- Default. 144 Hz support for external monitor
-- hl.monitor({ output = "HDMI-A-1", mode = "1920x1080@60", position = "0x0", scale = 1 })  -- 60 Hz support for external monitor
-- hl.monitor({ output = "HDMI-A-1", mode = "1920x1080@60", position = "0x0", scale = 1, mirror = "eDP-1"  })  -- mirror projector/TV support 60 fps
-- hl.monitor({ output = "HDMI-A-1", mode = "1920x1080@120", position = "0x0", scale = 1, mirror = "eDP-1" })  -- mirror projector/TV support 120 fps

-- todo make a auto cycle with preconfigured monitor settings

-- Permissions require a restart to take effect.
-- hl.config({ ecosystem = { enforce_permissions = true } })
-- hl.permission({ binary = "/usr/(bin|local/bin)/grim", type = "screencopy", mode = "allow" })
-- hl.permission({ binary = "/usr/(lib|libexec|lib64)/xdg-desktop-portal-hyprland", type = "screencopy", mode = "allow" })
-- hl.permission({ binary = "/usr/(bin|local/bin)/hyprpm", type = "plugin", mode = "allow" })

require("layouts.golden")
require("layouts.fibonacci")
require("configs.autostart")
require("configs.animations")

hl.config({
    general = {
        layout = "lua:fibonacci",
    },
    dwindle = {
        preserve_split = true,
    },

})

hl.config({
    misc = {
        force_default_wallpaper = -1,
        session_lock_xray = true,
        focus_on_activate = true,
    },
})

require("configs.input")

local mainMod = "SUPER"
local altMod = "ALT"

hl.bind(mainMod .. " + Return", hl.dsp.exec_cmd("kitty --hold sh -c fastfetch"))
hl.bind(mainMod .. " + T", hl.dsp.exec_cmd("kitty", { float = true }))
hl.bind(mainMod .. " + D", hl.dsp.exec_cmd("rofi -show drun"))
hl.bind(altMod .. " + Tab", hl.dsp.exec_cmd("rofi -show window -selected-row $(hyprctl activeworkspace -j | jq -r .windows) -kb-accept-entry Alt_L -kb-row-down Alt_L+Tab -kb-row-up Shift-Tab -theme ~/.config/rofi/themes/style5_variant.rasi"))
hl.bind(mainMod .. " + X", hl.dsp.exec_cmd("rofi -show filebrowser"))
hl.bind(mainMod .. " + B", hl.dsp.exec_cmd([[rofi -modi emoji -show emoji -matching "normal" -theme ~/.config/rofi/themes/launcher/style-1.rasi]]))
hl.bind(mainMod .. " + M", hl.dsp.exec_cmd("media-player.sh"))
hl.bind(mainMod .. " + G", hl.dsp.exec_cmd("thunar", { float = true }))

hl.bind(mainMod .. " + Q", hl.dsp.window.close())
hl.bind(mainMod .. " + SHIFT + Q", hl.dsp.exec_cmd("hyprctl kill"))
hl.bind(mainMod .. " + SHIFT + " .. altMod .. " + R", hl.dsp.exec_cmd("command -v hyprshutdown >/dev/null 2>&1 && hyprshutdown || hyprctl dispatch exit"))
hl.bind(mainMod .. " + SHIFT + R", hl.dsp.exec_cmd([[hyprctl reload && notify-send -a "Hyprland" "Hyprland" "Configuration reloaded" -i "reload3" -r "565"]]))
hl.bind(mainMod .. " + SHIFT + D", hl.dsp.exec_cmd([[pkill waybar; waybar > /dev/null 2>&1 & disown; notify-send -a "Hyprland" "Waybar" "Restarted" -i "reload3" -r "566"]]))

hl.bind(mainMod .. " + F", hl.dsp.window.fullscreen())
hl.bind(mainMod .. " + SHIFT + F", hl.dsp.window.fullscreen_state({ internal = 1, client = 0 }))
hl.bind(mainMod .. " + SHIFT + Space", hl.dsp.window.float({ action = "toggle" }))
hl.bind(mainMod .. " + Space", hl.dsp.group.next())
hl.bind(mainMod .. " + A", hl.dsp.focus( {workspace = "previous_per_monitor"} ))
hl.bind(mainMod .. " + W", hl.dsp.window.pseudo())
hl.bind(mainMod .. " + I", hl.dsp.group.toggle())

local workspace_layouts = {}

local function get_active_layout()
    local ws = hl.get_active_workspace()

    if ws ~= nil and ws.tiled_layout ~= nil then
        return ws.tiled_layout
    end
    return hl.get_config("general.layout")
end

local function notify_active_layout()
    local layout = get_active_layout()
    hl.exec_cmd("notify-send -a Hyprland -r 567 -u low -h string:x-canonical-private-synchronous:layout 'Layout: " .. layout .. "'")
end

hl.bind(mainMod .. " + U", notify_active_layout)

hl.bind(mainMod .. " + slash", function()
    local layout = get_active_layout()
    if layout == "master" then
        hl.dispatch(hl.dsp.layout("swapwithmaster master"))
    elseif  layout == "lua:fibonacci" then
        hl.dispatch(hl.dsp.layout("rotate"))
    elseif layout == "lua:golden" then
        hl.dispatch(hl.dsp.layout("rotate"))
    elseif layout == "dwindle" then
        hl.dispatch(hl.dsp.layout("rotatesplit"))
    elseif layout == "scrolling" then
        hl.dispatch(hl.dsp.layout("promote"))
    else
        hl.exec_cmd("notify-send -a Hyprland -r 567 -u low -h string:x-canonical-private-synchronous:layout 'Layout: " .. layout .. "'")
    end
end)

hl.bind(mainMod .. " + period", function()
    local layout = get_active_layout()
    if layout == "dwindle" then
        hl.dispatch(hl.dsp.layout("togglesplit"))
    elseif layout == "master" or layout == "lua:fibonacci" then
        hl.dispatch(hl.dsp.layout("swapnext"))
    elseif layout == "monocle" then
        hl.dispatch(hl.dsp.layout("cyclenext"))
    elseif layout == "scrolling" then
        hl.dispatch(hl.dsp.layout("swapcol r"))
    elseif layout == "lua:golden" then
        hl.dispatch(hl.dsp.layout("grow"))
    else
        hl.exec_cmd("notify-send -a Hyprland -r 567 -u low -h string:x-canonical-private-synchronous:layout 'Layout: " .. layout .. "'")
    end
end)

hl.bind(mainMod .. " + comma", function()
    local layout = get_active_layout()
    if layout == "dwindle" then
        hl.dispatch(hl.dsp.layout("swapsplit"))
    elseif layout == "master" or layout == "lua:fibonacci" then
        hl.dispatch(hl.dsp.layout("swapprev"))
    elseif layout == "monocle" then
        hl.dispatch(hl.dsp.layout("cycleprev"))
    elseif layout == "scrolling" then
        hl.dispatch(hl.dsp.layout("swapcol l"))
    elseif layout == "lua:golden" then
        hl.dispatch(hl.dsp.layout("shrink"))
    else
        hl.exec_cmd("notify-send -a Hyprland -r 567 -u low -h string:x-canonical-private-synchronous:layout 'Layout: " .. layout .. "'")
    end
end)

local function set_active_workspace_layout(layout)
    local ws = hl.get_active_workspace()
    if ws == nil or ws.id == nil then
        return
    end

    if workspace_layouts[ws.id] == layout then
        return
    end

    workspace_layouts[ws.id] = layout
    hl.workspace_rule({ workspace = tostring(ws.id), layout = layout })

    hl.exec_cmd("notify-send -a Hyprland -r 567 -u low -h string:x-canonical-private-synchronous:layout 'Layout: " .. layout .. "'")
end

hl.bind(mainMod .. " + Z", hl.dsp.submap("layout"))
hl.define_submap("layout", function()
    hl.bind("Z", function() set_active_workspace_layout("master") end)
    hl.bind("X", function() set_active_workspace_layout("dwindle") end)
    hl.bind("C", function() set_active_workspace_layout("scrolling") end)
    hl.bind("V", function() set_active_workspace_layout("monocle") end)
    hl.bind("G", function() set_active_workspace_layout("lua:golden") end)
    hl.bind("F", function() set_active_workspace_layout("lua:fibonacci") end)
    
    hl.bind("Return", hl.dsp.submap("reset"))
    hl.bind("Escape", hl.dsp.submap("reset"))
end)

hl.bind(mainMod .. " + left", hl.dsp.focus({ direction = "left" }))
hl.bind(mainMod .. " + right", hl.dsp.focus({ direction = "right" }))
hl.bind(mainMod .. " + up", hl.dsp.focus({ direction = "up" }))
hl.bind(mainMod .. " + down", hl.dsp.focus({ direction = "down" }))

hl.bind(mainMod .. " + h", hl.dsp.focus({ direction = "left" }))
hl.bind(mainMod .. " + l", hl.dsp.focus({ direction = "right" }))
hl.bind(mainMod .. " + k", hl.dsp.focus({ direction = "up" }))
hl.bind(mainMod .. " + j", hl.dsp.focus({ direction = "down" }))

hl.bind(mainMod .. " + SHIFT + left", hl.dsp.window.move({ direction = "left" }))
hl.bind(mainMod .. " + SHIFT + right", hl.dsp.window.move({ direction = "right" }))
hl.bind(mainMod .. " + SHIFT + up", hl.dsp.window.move({ direction = "up" }))
hl.bind(mainMod .. " + SHIFT + down", hl.dsp.window.move({ direction = "down" }))

hl.bind(mainMod .. " + SHIFT + h", hl.dsp.window.move({ direction = "left" }))
hl.bind(mainMod .. " + SHIFT + l", hl.dsp.window.move({ direction = "right" }))
hl.bind(mainMod .. " + SHIFT + k", hl.dsp.window.move({ direction = "up" }))
hl.bind(mainMod .. " + SHIFT + j", hl.dsp.window.move({ direction = "down" }))

hl.bind(mainMod .. " + 1", hl.dsp.focus({ workspace = 1 }))
hl.bind(mainMod .. " + 2", hl.dsp.focus({ workspace = 2 }))
hl.bind(mainMod .. " + 3", hl.dsp.focus({ workspace = 3 }))
hl.bind(mainMod .. " + 4", hl.dsp.focus({ workspace = 4 }))
hl.bind(mainMod .. " + 5", hl.dsp.focus({ workspace = 5 }))
hl.bind(mainMod .. " + 6", hl.dsp.focus({ workspace = 6 }))
hl.bind(mainMod .. " + 7", hl.dsp.focus({ workspace = 7 }))
hl.bind(mainMod .. " + 8", hl.dsp.focus({ workspace = 8 }))
hl.bind(mainMod .. " + 9", hl.dsp.focus({ workspace = 9 }))
hl.bind(mainMod .. " + 0", hl.dsp.focus({ workspace = 10 }))
hl.bind(mainMod .. " + minus", hl.dsp.focus({ workspace = 11 }))

hl.bind(mainMod .. " + SHIFT + 1", hl.dsp.window.move({ workspace = 1 }))
hl.bind(mainMod .. " + SHIFT + 2", hl.dsp.window.move({ workspace = 2 }))
hl.bind(mainMod .. " + SHIFT + 3", hl.dsp.window.move({ workspace = 3 }))
hl.bind(mainMod .. " + SHIFT + 4", hl.dsp.window.move({ workspace = 4 }))
hl.bind(mainMod .. " + SHIFT + 5", hl.dsp.window.move({ workspace = 5 }))
hl.bind(mainMod .. " + SHIFT + 6", hl.dsp.window.move({ workspace = 6 }))
hl.bind(mainMod .. " + SHIFT + 7", hl.dsp.window.move({ workspace = 7 }))
hl.bind(mainMod .. " + SHIFT + 8", hl.dsp.window.move({ workspace = 8 }))
hl.bind(mainMod .. " + SHIFT + 9", hl.dsp.window.move({ workspace = 9 }))
hl.bind(mainMod .. " + SHIFT + 0", hl.dsp.window.move({ workspace = 10 }))
hl.bind(mainMod .. " + SHIFT + minus", hl.dsp.window.move({ workspace = 11 }))

hl.bind(mainMod .. " + Tab", hl.dsp.focus({ workspace = "m+1" }))
hl.bind(mainMod .. " + SHIFT + Tab", hl.dsp.focus({ workspace = "m-1" }))

hl.bind(mainMod .. " + S", function()  -- if workspace is odd go to next, if even go to previous.
    local ws = hl.get_active_workspace()
    if ws == nil or ws.id == nil or ws.special then
        hl.exec_cmd("notify-send -a Hyprland -r 570 -u low 'No active workspace or special workspace'")
        return
    end
    
    -- No renumbering. just check current workspace id
    -- if ws.id % 2 == 1 then
    --     hl.dispatch(hl.dsp.focus({ workspace = "m+1" }))
    -- else
    --     hl.dispatch(hl.dsp.focus({ workspace = "m-1" }))
    -- end

    -- Renumber workspaces and do the same thing
    local workspaces = hl.get_workspaces()
    local before = 0
    for i, w in ipairs(workspaces) do
        if w.id < ws.id then
            before = before + 1
        end
    end
    if before % 2 == 1 then
        hl.dispatch(hl.dsp.focus({ workspace = "m+1" }))
    else
        hl.dispatch(hl.dsp.focus({ workspace = "m-1" }))
    end
end)

hl.bind(mainMod .. " + N", hl.dsp.focus({ workspace = "emptyn" }), { repeating = true })
hl.bind(mainMod .. " + SHIFT + N", hl.dsp.window.move({ workspace = "emptyn" }), { repeating = true })

hl.bind(mainMod .. " + grave", hl.dsp.workspace.toggle_special("magic"))
hl.bind(mainMod .. " + SHIFT + grave", hl.dsp.window.move({ workspace = "special:magic" }))
hl.bind(mainMod .. " + equal", hl.dsp.workspace.toggle_special("scratchpad"))
hl.bind(mainMod .. " + SHIFT + equal", hl.dsp.window.move({ workspace = "special:scratchpad", follow = false }))

hl.bind(mainMod .. " + mouse_down", hl.dsp.focus({ workspace = "m-1" }))
hl.bind(mainMod .. " + mouse_up", hl.dsp.focus({ workspace = "m+1" }))

hl.bind(mainMod .. " + mouse:272", hl.dsp.window.drag(), { mouse = true })
hl.bind(mainMod .. " + mouse:273", hl.dsp.window.resize(), { mouse = true })

hl.bind(mainMod .. " + R", hl.dsp.submap("resize"))

-- Start a submap called "resize".
hl.define_submap("resize", function()

    -- Set repeating binds for resizing the active window.
    hl.bind("right", hl.dsp.window.resize({ x = 10, y = 0, relative = true}), { repeating = true })
    hl.bind("left", hl.dsp.window.resize({ x = -10, y = 0, relative = true}), { repeating = true })
    hl.bind("up", hl.dsp.window.resize({ x = 0, y = 10, relative = true}), { repeating = true })
    hl.bind("down", hl.dsp.window.resize({ x = 0, y = -10, relative = true}), { repeating = true })
    hl.bind("h", hl.dsp.window.resize({ x = -22, y = 0, relative = true}), { repeating = true })
    hl.bind("l", hl.dsp.window.resize({ x = 22, y = 0, relative = true}), { repeating = true })
    hl.bind("k", hl.dsp.window.resize({ x = 0, y = -22, relative = true}), { repeating = true })
    hl.bind("j", hl.dsp.window.resize({ x = 0, y = 22, relative = true}), { repeating = true })

    -- Use `reset` to go back to the global submap
    hl.bind("Return", hl.dsp.submap("reset"))
    hl.bind("escape", hl.dsp.submap("reset"))

end)

hl.bind(mainMod .. " + V", hl.dsp.exec_cmd([[cliphist list | rofi -dmenu -theme ~/.config/rofi/themes/style5_variant.rasi | cliphist decode | wl-copy]]))
hl.bind(mainMod .. " + " .. altMod .. " + V", hl.dsp.exec_cmd("cliphist wipe"))
hl.bind(mainMod .. " + SHIFT + V", hl.dsp.exec_cmd([[sh -c 'last="$(cliphist list | head -n1 | cliphist decode 2>/dev/null)"; sel="$(wl-paste --primary 2>/dev/null)"; [ -n "$sel" ] && printf "%s\n%s" "$last" "$sel" | wl-copy']]))

hl.bind(mainMod .. " + O", hl.dsp.exec_cmd("hyprpicker -a"))

hl.bind(mainMod .. " + P", hl.dsp.exec_cmd("set-random-wallpaper.sh 0"))
hl.bind(mainMod .. " + SHIFT + P", hl.dsp.exec_cmd("get-wallpaper-path.sh 1"))
hl.bind(mainMod .. " + " .. altMod .. " + P", hl.dsp.exec_cmd("set-random-wallpaper.sh 1"))

hl.bind("XF86Calculator", hl.dsp.exec_cmd([[grim -g "$(myslurp.sh)" ~/Pictures/Screenshots/ss-c_$(date +%Y-%m-%d_%H-%M-%S).png; wl-copy < $(ls -t ~/Pictures/Screenshots/ss-*.png 2>/dev/null | head -n 1)]]))
hl.bind(mainMod .. " + SHIFT + S", hl.dsp.exec_cmd([[grim -g "$(myslurp.sh)" - | wl-copy]]))
hl.bind("SHIFT + XF86Calculator", hl.dsp.exec_cmd([[grim ~/Pictures/Screenshots/ss-f_$(date +%Y-%m-%d_%H-%M-%S).png && wl-copy < $(ls -t ~/Pictures/Screenshots/ss-*.png 2>/dev/null | head -n 1); grim ~/Pictures/Screenshots/ss-w_$(date +%Y-%m-%d_%H-%M-%S) -g "$(hyprctl activewindow -j | jq -r '"\(.at[0]),\(.at[1]) \(.size[0])x\(.size[1])"')"]]), { locked = true })
hl.bind(altMod .. " + XF86Calculator", hl.dsp.exec_cmd([[wl-copy < $(ls -t ~/Pictures/Screenshots/ss-*.png 2>/dev/null | head -n 1)]]))

-- hl.bind(mainMod .. " + SHIFT + O", hl.dsp.exec_cmd([[normcap --screenshot-handler grim --clipboard-handler wlclipboard --notification-handler notify_send]]))

hl.bind("XF86AudioRaiseVolume", hl.dsp.exec_cmd("volume-control.sh up"), { locked = true, repeating = true })
hl.bind("XF86AudioLowerVolume", hl.dsp.exec_cmd("volume-control.sh down"), { locked = true, repeating = true })
hl.bind("XF86AudioMute", hl.dsp.exec_cmd("volume-control.sh mute"), { locked = true, repeating = true })
hl.bind("SHIFT + XF86AudioMute", hl.dsp.exec_cmd("switch-volume-sink.sh"), { locked = true })
hl.bind("XF86AudioMicMute", hl.dsp.exec_cmd("volume-control.sh micmute"), { locked = true, repeating = true })

hl.bind(mainMod .. " + XF86TouchpadToggle", hl.dsp.exec_cmd("toggle-touchpad.sh"), { locked = true, ignore_mods = true })

hl.bind("XF86MonBrightnessUp", hl.dsp.exec_cmd("brightness-control.sh up"), { locked = true, repeating = true })
hl.bind("XF86MonBrightnessDown", hl.dsp.exec_cmd("brightness-control.sh down"), { locked = true, repeating = true })

-- FN + right arrow = XF86Launch4
hl.bind("XF86Launch4", hl.dsp.exec_cmd("playerctl next"), { locked = true })

hl.bind("XF86AudioNext", hl.dsp.exec_cmd("playerctl next"), { locked = true })
hl.bind("XF86AudioPause", hl.dsp.exec_cmd("playerctl play-pause"), { locked = true })
hl.bind("XF86AudioPlay", hl.dsp.exec_cmd("playerctl play-pause"), { locked = true })
hl.bind("XF86AudioPrev", hl.dsp.exec_cmd("playerctl previous"), { locked = true })

hl.bind(mainMod .. " + bracketleft", hl.dsp.exec_cmd("swaync-client -t"))

hl.bind(mainMod .. " + bracketright", hl.dsp.exec_cmd("power-menu.sh"))
hl.bind(mainMod .. " + SHIFT + BracketRight", hl.dsp.exec_cmd("hyprlock"))

hl.bind(mainMod .. " + semicolon", hl.dsp.window.pin())
hl.bind(mainMod .. " + apostrophe", hl.dsp.window.tag({ tag = "disable-opacity" }))
hl.bind(mainMod .. " + SHIFT + apostrophe", hl.dsp.exec_cmd("toggle-animations.sh"))

hl.workspace_rule({
    workspace = "special:scratchpad",
    on_created_empty = "[float; size 780 420; move 2 480] kitty",
    persistent = false,
})

-- Smart gaps / no gaps when only
-- hl.workspace_rule({ workspace = "w[tv1]", gaps_out = 0, gaps_in = 0 })
-- hl.workspace_rule({ workspace = "f[1]", gaps_out = 0, gaps_in = 0 })
-- hl.window_rule({ match = { float = false, workspace = "w[tv1]" }, border_size = 0 })
-- hl.window_rule({ match = { float = false, workspace = "w[tv1]" }, rounding = 0 })
-- hl.window_rule({ match = { float = false, workspace = "f[1]" }, border_size = 0 })
-- hl.window_rule({ match = { float = false, workspace = "f[1]" }, rounding = 0 })
