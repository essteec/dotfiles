hl.config({
    input = {
        kb_layout = "us,tr",
        kb_variant = "altgr-intl,",
        kb_model = "",
        kb_options = "caps:swapescape,grp:alt_altgr_toggle",
        kb_rules = "",
        follow_mouse = 1,
        sensitivity = 0,
        numlock_by_default = true,
        touchpad = {
            natural_scroll = true,
        },
    },
})

hl.gesture({
    fingers = 3,
    direction = "horizontal",
    action = "workspace",
})

-- Example per-device config
-- hl.device({
--     name = "epic-mouse-v1",
--     sensitivity = -0.5,
-- })