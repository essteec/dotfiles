-- fibonacci.lua — Hyprland 0.55+ custom Fibonacci layout
--
-- True Fibonacci tiling: each window's area is proportional to its
-- Fibonacci number. Oldest window = largest, newest = smallest.
--
-- FIX: order is a single global list, never pruned inside recalculate().
-- Windows are only removed from the order list when window.destroy fires.
-- This means switching workspaces (which empties ctx.targets temporarily)
-- never wipes the saved order. When you return to a workspace the windows
-- find their old positions intact.
--
-- LAYOUTMSG COMMANDS
-- hyprctl dispatch layoutmsg lua:fibonacci <command>
--
--   movetotop      make active window the largest (slot 1)
--   movetobottom   make active window the smallest (slot n)
--   swapnext       swap active with next-larger neighbour
--   swapprev       swap active with next-smaller neighbour
--   rotate         rotate spiral direction 90°
--   flip           toggle: newest window becomes largest

-- ── Fibonacci math ────────────────────────────────────────────────────────────

local function fib(n)
    if n <= 2 then return 1 end
    local a, b = 1, 1
    for _ = 3, n do a, b = b, a + b end
    return b
end

local function fib_sum(n)       -- sum of fib(1)…fib(n) = fib(n+2)-1
    return fib(n + 2) - 1
end

-- ── Global order (persists across workspace switches) ─────────────────────────
--
-- One flat list of stable_id strings across all workspaces.
-- Index 1 = largest slot, index #order = smallest slot.
-- Windows absent from the current ctx.targets are simply skipped during
-- recalculate — their position in the list is preserved for when they
-- come back (e.g. after a workspace switch).
-- Removal happens ONLY in the window.destroy event handler below.

local order  = {}   -- list of stable_id strings

local state = {
    offset = 0,     -- spiral start direction offset
    flip   = false, -- when true: slot 1 = newest/smallest
}

-- Slot rectangles from last recalculate() for drag hit-testing.
local last_slots = {}

-- ── Spiral geometry ───────────────────────────────────────────────────────────

local sides    = { "left", "top", "right", "bottom" }
local opposite = { left="right", right="left", top="bottom", bottom="top" }

-- ── Order helpers ─────────────────────────────────────────────────────────────

local function target_id(target)
    local w = target.window
    return w and tostring(w.stable_id) or tostring(target.index)
end

local function active_id(ctx)
    for _, t in ipairs(ctx.targets) do
        local w = t.window
        if w and w.active then return target_id(t) end
    end
end

local function index_of(id)
    for i, v in ipairs(order) do
        if v == id then return i end
    end
end

local function remove_from_order(id)
    local i = index_of(id)
    if i then table.remove(order, i) end
end

-- Called each recalculate: add any new windows (not yet in order) at the tail.
-- Does NOT remove anything — removal is handled by window.destroy only.
local function register_new_targets(ctx)
    local in_order = {}
    for _, id in ipairs(order) do in_order[id] = true end

    for _, t in ipairs(ctx.targets) do
        local id = target_id(t)
        if not in_order[id] then
            table.insert(order, id)   -- new window → smallest slot
            in_order[id] = true
        end
    end
end

local function build_map(ctx)
    local map = {}
    for _, t in ipairs(ctx.targets) do map[target_id(t)] = t end
    return map
end

local function swap_slots(i, j)
    local n = #order
    if n < 2 then return end
    if j < 1 then j = n elseif j > n then j = 1 end
    if i ~= j then order[i], order[j] = order[j], order[i] end
end

local function move_to_pos(id, pos)
    local i = index_of(id)
    if not i then return end
    table.remove(order, i)
    pos = math.max(1, math.min(pos, #order + 1))
    table.insert(order, pos, id)
end

-- ── Layout registration ───────────────────────────────────────────────────────

hl.layout.register("fibonacci", {

    recalculate = function(ctx)
        local n = #ctx.targets
        last_slots = {}
        if n == 0 then return end

        -- Register any new windows; never prune here.
        register_new_targets(ctx)

        local map = build_map(ctx)

        -- Build the active slot list: walk `order` in sequence,
        -- keeping only ids present in the current ctx.targets (this workspace).
        -- This naturally skips windows on other workspaces without touching order.
        local active = {}
        for _, id in ipairs(order) do
            if map[id] then
                table.insert(active, id)
            end
        end

        local na = #active
        if na == 0 then return end

        if na == 1 then
            local t = map[active[1]]
            if t then
                t:place(ctx.area)
                last_slots[1] = {
                    slot_index = 1, id = active[1],
                    x = ctx.area.x, y = ctx.area.y,
                    w = ctx.area.w, h = ctx.area.h,
                }
            end
            return
        end

        -- slot_index → id, respecting flip
        local function id_for_slot(slot)
            if not state.flip then return active[slot]
            else return active[na - slot + 1] end
        end
        local function target_for_slot(slot)
            return map[id_for_slot(slot)]
        end

        local split_area = ctx.area

        for slot = 1, na - 1 do
            local rem      = na - slot + 1
            local ratio    = fib(rem) / fib_sum(rem)
            local side_idx = ((slot - 1 + state.offset) % #sides) + 1
            local side     = sides[side_idx]
            local other    = opposite[side]
            local t        = target_for_slot(slot)
            local id       = id_for_slot(slot)

            local win_area  = ctx:split(split_area, side, ratio)
            local rest_area = ctx:split(split_area, other, 1.0 - ratio)

            if t then t:place(win_area) end

            last_slots[slot] = {
                slot_index = slot, id = id,
                x = win_area.x, y = win_area.y,
                w = win_area.w, h = win_area.h,
            }

            split_area = rest_area
        end

        local last_id = id_for_slot(na)
        local last_t  = target_for_slot(na)
        if last_t then last_t:place(split_area) end
        last_slots[na] = {
            slot_index = na, id = last_id,
            x = split_area.x, y = split_area.y,
            w = split_area.w, h = split_area.h,
        }
    end,

-- ── layoutmsg ─────────────────────────────────────────────────────────────────

    layout_msg = function(ctx, msg)
        local cmd = msg:match("^(%S+)")
        local aid = active_id(ctx)
        local n   = #ctx.targets

        if cmd == "swapnext" then
            -- Find aid's position among the *active* (on this workspace) slots
            -- then swap with the slot before it in order
            local i = aid and index_of(aid)
            if i then swap_slots(i, i - 1) end

        elseif cmd == "swapprev" then
            local i = aid and index_of(aid)
            if i then swap_slots(i, i + 1) end

        elseif cmd == "movetotop" then
            local i = aid and index_of(aid)
            if i then
                if i == 1 then swap_slots(i, i + 1)
                else move_to_pos(aid, 1) end
            end

        elseif cmd == "movetobottom" then
            local i = aid and index_of(aid)
            if i then
                if i == #order then swap_slots(i, i - 1)
                else move_to_pos(aid, #order) end
            end

        elseif cmd == "rotate" then
            state.offset = (state.offset + 1) % #sides

        elseif cmd == "flip" then
            state.flip = not state.flip

        else
            return "fibonacci: unknown command '" .. (cmd or "?") ..
                   "'. Valid: movetotop, movetobottom, swapnext, swapprev, rotate, flip"
        end

        return true
    end,
})

-- ── window.destroy: the ONLY place we remove from order ──────────────────────
--
-- This fires when a window is actually closed, not when it switches workspace.
-- So switching away from a workspace never prunes the order list.

hl.on("window.destroy", function(w)
    if not w then return end
    remove_from_order(tostring(w.stable_id))
end)

-- ── Drag-and-drop ─────────────────────────────────────────────────────────────
--
-- Hyprland floats a tiled window during drag, re-tiles on drop.
-- window.update_rules: detect float (drag start), record id.
-- window.active:       detect re-tile (drag end), cursor-hit-test last_slots,
--                      swap dragged window into the slot under the cursor.

local drag = {
    id        = nil,
    was_tiled = {},
}

hl.on("window.update_rules", function(w)
    if not w then return end
    local id = tostring(w.stable_id)
    if w.floating and drag.was_tiled[id] then
        drag.id = id
    elseif not w.floating then
        drag.was_tiled[id] = true
    end
end)

hl.on("window.active", function(w)
    if not w or not drag.id then return end
    local id = tostring(w.stable_id)
    if id ~= drag.id or w.floating then return end

    local pos = hl.get_cursor_pos()
    if pos then
        local target_id_val = nil
        local best_dist     = math.huge

        for _, s in ipairs(last_slots) do
            if pos.x >= s.x and pos.x <= s.x + s.w and
               pos.y >= s.y and pos.y <= s.y + s.h then
                target_id_val = s.id
                best_dist     = 0
                break
            end
            local cx = s.x + s.w / 2
            local cy = s.y + s.h / 2
            local d  = (pos.x - cx)^2 + (pos.y - cy)^2
            if d < best_dist then
                best_dist     = d
                target_id_val = s.id
            end
        end

        if target_id_val then
            local di = index_of(drag.id)
            local ti = index_of(target_id_val)
            if di and ti and di ~= ti then
                order[di], order[ti] = order[ti], order[di]
            end
        end
    end

    drag.id = nil
end)