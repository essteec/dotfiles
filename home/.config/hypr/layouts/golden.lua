-- golden.lua — Hyprland custom layout
-- Windows tile in golden proportions
--
-- Ordering rule:
--   ctx.targets[1]   = oldest window  → gets the LARGEST slice (the remainder)
--   ctx.targets[n]   = newest window  → gets the SMALLEST slice (split off last)
--
-- Each step splits `ratio` off the current area for the OLDEST remaining
-- window and passes the smaller remainder on. The newest window ends up
-- with whatever tiny rectangle is left at the end.
--
-- Usage: require/include this file from your hyprland.lua, then:
--   hl.config({ general = { layout = "lua:golden" } })
--
-- layoutmsg commands (hyprctl dispatch layoutmsg <cmd>):
--   ratio <n>  — set split ratio directly (0.1 – 0.9, default ≈ 0.618)
--   grow       — increase ratio by 0.05 (older windows get more space)
--   shrink     — decrease ratio by 0.05
--   rotate     — rotate spiral starting direction 90°
--   flip       — swap: newest window becomes the large one instead

local PHI = 1 / 1.618033988749895  -- ≈ 0.618

local state = {
    ratio  = PHI,
    offset = 0,
    flip   = false,
}

-- Each step: split direction cycles through these four sides.
-- `big` = the side the OLDER (larger) window occupies.
-- `small` = the remainder passed on to newer (smaller) windows.
local sides = {
    { big = "left",   small = "right"  },
    { big = "top",    small = "bottom" },
    { big = "right",  small = "left"   },
    { big = "bottom", small = "top"    },
}

local function clamp(x, lo, hi)
    return math.max(lo, math.min(hi, x))
end

hl.layout.register("golden", {
    recalculate = function(ctx)
        local n = #ctx.targets
        if n == 0 then return end
        if n == 1 then
            ctx.targets[1]:place(ctx.area)
            return
        end

        -- When flip is off (default):
        --   iterate oldest → newest (index 1 … n)
        --   each step gives the big `ratio` slice to the current (older) window
        --   the tiny remainder is finally given to the newest window (index n)
        --
        -- When flip is on:
        --   iterate newest → oldest (index n … 1)
        --   the newest window gets the big slice each time

        local area = ctx.area

        if not state.flip then
            -- oldest windows first — they eat the large slice each round
            for step = 1, n - 1 do
                local side_idx = ((step - 1 + state.offset) % #sides) + 1
                local s        = sides[side_idx]
                local target   = ctx.targets[step]   -- step 1 = oldest

                target:place(ctx:split(area, s.big, state.ratio))
                area = ctx:split(area, s.small, 1.0 - state.ratio)
            end
            -- newest window (index n) gets the tiny remainder
            ctx.targets[n]:place(area)
        else
            -- flipped: newest windows first — they eat the large slice
            for step = 1, n - 1 do
                local side_idx = ((step - 1 + state.offset) % #sides) + 1
                local s        = sides[side_idx]
                local target   = ctx.targets[n - step + 1]   -- n = newest

                target:place(ctx:split(area, s.big, state.ratio))
                area = ctx:split(area, s.small, 1.0 - state.ratio)
            end
            -- oldest window (index 1) gets the tiny remainder
            ctx.targets[1]:place(area)
        end
    end,

    layout_msg = function(ctx, msg)
        local cmd, arg = msg:match("^(%S+)%s*(.*)$")

        if cmd == "ratio" then
            local v = tonumber(arg)
            if v then
                state.ratio = clamp(v, 0.1, 0.9)
            else
                return "golden: ratio requires a number between 0.1 and 0.9"
            end

        elseif cmd == "grow" then
            state.ratio = clamp(state.ratio + 0.05, 0.1, 0.9)

        elseif cmd == "shrink" then
            state.ratio = clamp(state.ratio - 0.05, 0.1, 0.9)

        elseif cmd == "rotate" then
            state.offset = (state.offset + 1) % #sides

        elseif cmd == "flip" then
            state.flip = not state.flip

        else
            return "golden: expected ratio <n>, grow, shrink, rotate, or flip"
        end

        return true
    end,
})
