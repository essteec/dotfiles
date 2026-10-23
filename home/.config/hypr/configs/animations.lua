local colors = require("configs.colors")

hl.config({
    general = {
        gaps_in = 8,
        gaps_out = 14,
        border_size = 0,
        col = {
            active_border = colors.mauve,
            inactive_border = colors.passive,
        },
        allow_tearing = false,
    },
    decoration = {
        rounding = 8,
        rounding_power = 2,
        fullscreen_opacity = 0.9,
        active_opacity = 0.88,
        inactive_opacity = 0.86,
        shadow = {
            enabled = true,
            range = 4,
            render_power = 3,
            color = "rgba(1a1a1aee)",
        },
        blur = {
            enabled = true,
            size = 3,
            passes = 2,
        },
    },
    animations = {
        enabled = true,
    },
})

hl.curve("easeOutQuint", { type = "bezier", points = { { 0.23, 1 }, { 0.32, 1 } } })
hl.curve("easeInOutCubic", { type = "bezier", points = { { 0.65, 0.05 }, { 0.36, 1 } } })
hl.curve("linear", { type = "bezier", points = { { 0, 0 }, { 1, 1 } } })
hl.curve("almostLinear", { type = "bezier", points = { { 0.5, 0.5 }, { 0.75, 1 } } })
hl.curve("quick", { type = "bezier", points = { { 0.15, 0 }, { 0.1, 1 } } })

hl.animation({ leaf = "global", enabled = true, speed = 10, bezier = "default" })
hl.animation({ leaf = "border", enabled = true, speed = 5.39, bezier = "easeOutQuint" })
hl.animation({ leaf = "windows", enabled = true, speed = 4.79, bezier = "easeOutQuint" })
hl.animation({ leaf = "windowsIn", enabled = true, speed = 4.1, bezier = "easeOutQuint", style = "popin 87%" })
hl.animation({ leaf = "windowsOut", enabled = true, speed = 1.49, bezier = "linear", style = "popin 87%" })
hl.animation({ leaf = "fadeIn", enabled = true, speed = 1.73, bezier = "almostLinear" })
hl.animation({ leaf = "fadeOut", enabled = true, speed = 1.46, bezier = "almostLinear" })
hl.animation({ leaf = "fade", enabled = true, speed = 3.03, bezier = "quick" })
hl.animation({ leaf = "layers", enabled = true, speed = 3.81, bezier = "easeOutQuint" })
hl.animation({ leaf = "layersIn", enabled = true, speed = 4, bezier = "easeOutQuint", style = "fade" })
hl.animation({ leaf = "layersOut", enabled = true, speed = 1.5, bezier = "linear", style = "fade" })
hl.animation({ leaf = "fadeLayersIn", enabled = true, speed = 1.79, bezier = "almostLinear" })
hl.animation({ leaf = "fadeLayersOut", enabled = true, speed = 1.39, bezier = "almostLinear" })
hl.animation({ leaf = "workspaces", enabled = true, speed = 1.94, bezier = "almostLinear", style = "fade" })
hl.animation({ leaf = "workspacesIn", enabled = true, speed = 1.21, bezier = "almostLinear", style = "fade" })
hl.animation({ leaf = "workspacesOut", enabled = true, speed = 1.94, bezier = "almostLinear", style = "fade" })
hl.animation({ leaf = "zoomFactor", enabled = true, speed = 7, bezier = "quick" })

hl.window_rule({
    name = "youtube-opacity",
    match = {
        title = "(?i).*youtube.*",
        class = "(?i).*((firefox)|(chrome)).*",
    },
    opacity = "1.0 override",
})
hl.window_rule({ match = { title = "Kick — Original profile — Mozilla Firefox" }, opacity = "1.0 override" })
hl.window_rule({ match = { class = "chrome-kick.com__-Default" }, opacity = "1.0 override" })
hl.window_rule({ match = { class = "chrome-netflix.com__browse-Default" }, opacity = "1.0 override" })
hl.window_rule({ match = { class = "chrome-primevideo.com__tv-Default" }, opacity = "1.0 override" })

hl.window_rule({
    match = { title = "(?i)Picture.in.Picture" },
    float = true,
    size = { 560, 315 },
    opacity = "1.0 override",
    keep_aspect_ratio = true,
    move = { "monitor_w-580", "40" },
})

hl.window_rule({ match = { class = "^org.kde.haruna$" }, opacity = "1.0 override" })
hl.window_rule({ match = { class = "^mpv$" }, opacity = "1.0 override" })
hl.window_rule({ match = { class = ".*Loupe" }, opacity = "1.0 override" })
hl.window_rule({ match = { class = ".*gThumb" }, opacity = "1.0 override" })
hl.window_rule({ match = { class = "^libreoffice-.*" }, opacity = "1.0 override" })
-- hl.window_rule({ match = { class = "" }, opacity = "1.0 override" })

-- hl.window_rule({ match = { title = ".*(y|Y)outube.*", class = ".*((F|f)irefox|(C|c)hrome).*" }, opacity = "1.0 override" })

hl.window_rule({ match = { title = "Rename.*" }, float = true })
hl.window_rule({ match = { title = "Open (File|Folder)" }, float = true })  
hl.window_rule({ match = { title = "File Operation Progress" }, float = true })
hl.window_rule({ match = { class = "xdg-desktop-portal-gtk" }, float = true, move = { "monitor_w-window_w-10", "monitor_h-window_h-10" } })

hl.window_rule({ match = { title = ".*- Thunar" }, size = { 875, 600 } })


hl.window_rule({
    match = { class = ".*Calculator" },
    float = true,
    size = { 400, 640 },
    move = { "monitor_w-window_w-10", "monitor_h-window_h-10" },
})

hl.window_rule({ match = { class = "nwg-look" }, float = true })

hl.window_rule({
    match = { class = "blueman-manager" },
    float = true,
    move = { "monitor_w-window_w-20", "40" },
})
hl.window_rule({
    match = { title = "Volume Control" },
    float = true,
    move = { "monitor_w-window_w-20", "40" },
})
hl.window_rule({
    match = { class = "nm-connection-editor" },
    float = true,
    move = { "monitor_w-window_w-20", "40" },
})

-- hl.window_rule({ match = { class = ".*floating" }, float = true, size = { 820, 480 } })
-- hl.layer_rule({ match = { namespace = "swaync" }, blur = false })
-- hl.layer_rule({ match = { namespace = "swaync-notification-window" }, blur = false })
-- hl.layer_rule({ match = { namespace = "^(rofi)$" }, no_anim = true })

hl.window_rule({
    name = "floating-windows",
    match = { float = true },
    border_size = 2,
})

hl.window_rule({
    name = "suppress-maximize-events",
    match = { class = ".*" },
    suppress_event = "maximize",
})

hl.window_rule({
    name = "fix-xwayland-drags",
    match = {
        class = "^$",
        title = "^$",
        xwayland = true,
        float = true,
        fullscreen = false,
        pin = false,
    },
    no_focus = true,
})

-- Hyprland-run windowrule
-- hl.window_rule({
--     name = "move-hyprland-run",
--     match = { class = "hyprland-run" },
--     move = { "20", "monitor_h-120" },
--     float = true,
-- })

hl.window_rule({ match = { tag = "disable-opacity" }, opacity = "1.0 override" })
