// Hyprland Compositor + 1:1 JS Ports of fibonacci.lua, golden.lua, dwindle, master, monocle

(function () {
  const { state, emit, notify } = window.SimState;

  // ── Fibonacci Math (from home/.config/hypr/layouts/fibonacci.lua) ──
  function fib(n) {
    if (n <= 2) return 1;
    let a = 1, b = 1;
    for (let i = 3; i <= n; i++) {
      const c = a + b;
      a = b;
      b = c;
    }
    return b;
  }

  function fibSum(n) {
    return fib(n + 2) - 1;
  }

  const PHI = 1 / 1.618033988749895;

  // Global persistent order list matching fibonacci.lua
  const fibOrder = [];
  const fibState = { offset: 0, flip: false };
  const goldenState = { ratio: PHI, offset: 0, flip: false };
  let lastSlots = [];

  const SIDES = ["left", "top", "right", "bottom"];
  const OPPOSITE = { left: "right", right: "left", top: "bottom", bottom: "top" };

  function splitArea(area, side, ratio, gapIn) {
    const halfGap = gapIn / 2;
    if (side === "left") {
      const w = area.w * ratio - halfGap;
      return { x: area.x, y: area.y, w: Math.max(80, w), h: area.h };
    }
    if (side === "right") {
      const w = area.w * ratio - halfGap;
      return { x: area.x + area.w - w, y: area.y, w: Math.max(80, w), h: area.h };
    }
    if (side === "top") {
      const h = area.h * ratio - halfGap;
      return { x: area.x, y: area.y, w: area.w, h: Math.max(60, h) };
    }
    // bottom
    const h = area.h * ratio - halfGap;
    return { x: area.x, y: area.y + area.h - h, w: area.w, h: Math.max(60, h) };
  }

  function getActiveLayoutName(wsId = state.activeWorkspace) {
    return state.workspaceLayouts[wsId] || "lua:fibonacci";
  }

  function setWorkspaceLayout(layoutName, wsId = state.activeWorkspace) {
    state.workspaceLayouts[wsId] = layoutName;
    notify({
      appName: "Hyprland",
      summary: `Layout: ${layoutName}`,
      body: `Workspace ${wsId}`,
      syncId: "567",
      urgency: "low",
    });
    recalculateLayout();
  }

  function getWorkspaceWindows(wsId = state.activeWorkspace) {
    return state.windows.filter((w) => w.workspace === wsId);
  }

  function getTiledTargets(wsId = state.activeWorkspace) {
    return state.windows.filter(
      (w) => w.workspace === wsId && !w.floating && !w.fullscreen
    );
  }

  function registerFibTargets(targets) {
    const set = new Set(fibOrder);
    for (const t of targets) {
      if (!set.has(t.id)) {
        fibOrder.push(t.id);
        set.add(t.id);
      }
    }
  }

  function layoutFibonacci(targets, area, gapIn) {
    lastSlots = [];
    if (targets.length === 0) return;
    registerFibTargets(targets);

    const map = new Map(targets.map((t) => [t.id, t]));
    const active = fibOrder.filter((id) => map.has(id));
    const na = active.length;
    if (na === 0) return;

    if (na === 1) {
      const t = map.get(active[0]);
      t.rect = { ...area };
      lastSlots.push({ slotIndex: 1, id: active[0], ...area });
      return;
    }

    const idForSlot = (slot) =>
      !fibState.flip ? active[slot - 1] : active[na - slot];

    let curArea = { ...area };
    for (let slot = 1; slot <= na - 1; slot++) {
      const rem = na - slot + 1;
      const ratio = fib(rem) / fibSum(rem);
      const sideIdx = (slot - 1 + fibState.offset) % SIDES.length;
      const side = SIDES[sideIdx];
      const other = OPPOSITE[side];
      const id = idForSlot(slot);
      const t = map.get(id);

      const winArea = splitArea(curArea, side, ratio, gapIn);
      const restArea = splitArea(curArea, other, 1.0 - ratio, gapIn);
      if (t) t.rect = winArea;
      lastSlots.push({ slotIndex: slot, id, ...winArea });
      curArea = restArea;
    }

    const lastId = idForSlot(na);
    const lastT = map.get(lastId);
    if (lastT) lastT.rect = curArea;
    lastSlots.push({ slotIndex: na, id: lastId, ...curArea });
  }

  function layoutGolden(targets, area, gapIn) {
    const n = targets.length;
    if (n === 0) return;
    if (n === 1) {
      targets[0].rect = { ...area };
      return;
    }
    const goldenSides = [
      { big: "left", small: "right" },
      { big: "top", small: "bottom" },
      { big: "right", small: "left" },
      { big: "bottom", small: "top" },
    ];
    let curArea = { ...area };
    if (!goldenState.flip) {
      for (let step = 1; step <= n - 1; step++) {
        const s = goldenSides[(step - 1 + goldenState.offset) % goldenSides.length];
        targets[step - 1].rect = splitArea(curArea, s.big, goldenState.ratio, gapIn);
        curArea = splitArea(curArea, s.small, 1.0 - goldenState.ratio, gapIn);
      }
      targets[n - 1].rect = curArea;
    } else {
      for (let step = 1; step <= n - 1; step++) {
        const s = goldenSides[(step - 1 + goldenState.offset) % goldenSides.length];
        targets[n - step].rect = splitArea(curArea, s.big, goldenState.ratio, gapIn);
        curArea = splitArea(curArea, s.small, 1.0 - goldenState.ratio, gapIn);
      }
      targets[0].rect = curArea;
    }
  }

  function layoutDwindle(targets, area, gapIn) {
    if (targets.length === 0) return;
    if (targets.length === 1) {
      targets[0].rect = { ...area };
      return;
    }
    let cur = { ...area };
    for (let i = 0; i < targets.length - 1; i++) {
      const horiz = i % 2 === 0;
      const side = horiz ? "left" : "top";
      const other = horiz ? "right" : "bottom";
      targets[i].rect = splitArea(cur, side, 0.5, gapIn);
      cur = splitArea(cur, other, 0.5, gapIn);
    }
    targets[targets.length - 1].rect = cur;
  }

  function layoutMaster(targets, area, gapIn) {
    if (targets.length === 0) return;
    if (targets.length === 1) {
      targets[0].rect = { ...area };
      return;
    }
    const masterArea = splitArea(area, "left", 0.55, gapIn);
    const stackArea = splitArea(area, "right", 0.45, gapIn);
    targets[0].rect = masterArea;
    const count = targets.length - 1;
    const eachH = (stackArea.h - gapIn * (count - 1)) / count;
    for (let i = 1; i < targets.length; i++) {
      targets[i].rect = {
        x: stackArea.x,
        y: stackArea.y + (i - 1) * (eachH + gapIn),
        w: stackArea.w,
        h: Math.max(60, eachH),
      };
    }
  }

  function layoutMonocle(targets, area) {
    for (const t of targets) {
      t.rect = { ...area };
    }
  }

  function recalculateLayout() {
    const stage = document.getElementById("hyprland-workspace");
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const gapOut = state.animationsEnabled ? 14 : 0;
    const gapIn = state.animationsEnabled ? 8 : 4;
    const area = {
      x: gapOut,
      y: gapOut,
      w: Math.max(200, rect.width - gapOut * 2),
      h: Math.max(160, rect.height - gapOut * 2),
    };

    const wsId = state.activeSpecial
      ? `special:${state.activeSpecial}`
      : state.activeWorkspace;

    // Fullscreen windows fill the stage
    for (const w of state.windows) {
      if (w.fullscreen && w.workspace === wsId) {
        w.rect = { x: 0, y: 0, w: rect.width, h: rect.height };
      }
    }

    const targets = getTiledTargets(wsId);
    const layoutName = getActiveLayoutName(wsId);
    if (layoutName === "lua:golden") {
      layoutGolden(targets, area, gapIn);
    } else if (layoutName === "dwindle") {
      layoutDwindle(targets, area, gapIn);
    } else if (layoutName === "master") {
      layoutMaster(targets, area, gapIn);
    } else if (layoutName === "monocle") {
      layoutMonocle(targets, area);
    } else {
      layoutFibonacci(targets, area, gapIn);
    }

    emit("windows:render");
  }

  // Window rules from home/.config/hypr/configs/animations.lua
  function getRuleForApp(appId, title, className) {
    const t = (title || "").toLowerCase();
    const c = (className || appId || "").toLowerCase();
    const rule = {
      float: false,
      size: null,
      move: null,
      opacityOverride: false,
    };

    if (
      t.includes("youtube") ||
      c.includes("kick") ||
      c.includes("netflix") ||
      c.includes("primevideo") ||
      c.includes("mpv") ||
      c.includes("haruna")
    ) {
      rule.opacityOverride = true;
    }

    if (c === "pavucontrol" || t === "volume control") {
      rule.float = true;
      rule.size = { w: 480, h: 380 };
      rule.move = "top-right";
    } else if (c === "blueman-manager" || c === "nm-connection-editor") {
      rule.float = true;
      rule.size = { w: 460, h: 370 };
      rule.move = "top-right";
    } else if (c === "nwg-look" || c === "qt6ct" || c === "kvantummanager") {
      rule.float = true;
      rule.size = { w: 620, h: 440 };
    } else if (c === "thunar") {
      rule.float = true;
      rule.size = { w: 875, h: 600 };
    } else if (c === "gnome-clocks" || c === "calculator") {
      rule.float = true;
      rule.size = { w: 420, h: 520 };
      rule.move = "bottom-right";
    } else if (c === "kitty-float") {
      rule.float = true;
      rule.size = { w: 780, h: 420 };
    }

    return rule;
  }

  function openWindow({ appId, title, className, workspace = null, float = null, size = null, data = {} }) {
    // Special case: focus existing single-instance utility or Spotify if already open
    if (appId === "spotify") {
      const existing = state.windows.find((w) => w.appId === "spotify");
      if (existing) {
        focusWorkspace(existing.workspace);
        focusWindow(existing.id);
        return existing;
      }
    }

    const targetWs =
      workspace ?? (state.activeSpecial ? `special:${state.activeSpecial}` : state.activeWorkspace);
    const rule = getRuleForApp(appId, title, className);
    const isFloat = float !== null ? float : rule.float;

    const stage = document.getElementById("hyprland-workspace");
    const stageRect = stage ? stage.getBoundingClientRect() : { width: 1280, height: 760 };

    const winSize = size || rule.size || { w: 720, h: 460 };
    const clampedW = Math.min(winSize.w, Math.max(320, stageRect.width - 40));
    const clampedH = Math.min(winSize.h, Math.max(240, stageRect.height - 40));

    let x = Math.round((stageRect.width - clampedW) / 2);
    let y = Math.round((stageRect.height - clampedH) / 2);
    if (rule.move === "top-right") {
      x = Math.max(16, stageRect.width - clampedW - 20);
      y = 14;
    } else if (rule.move === "bottom-right") {
      x = Math.max(16, stageRect.width - clampedW - 14);
      y = Math.max(14, stageRect.height - clampedH - 14);
    }

    const win = {
      id: `win-${state.nextWinSeq++}`,
      appId,
      title,
      className: className || appId,
      workspace: targetWs,
      floating: isFloat,
      fullscreen: false,
      opacityOverride: rule.opacityOverride,
      rect: { x, y, w: clampedW, h: clampedH },
      floatRect: { x, y, w: clampedW, h: clampedH },
      urgent: false,
      data,
    };

    state.windows.push(win);
    state.activeWindowId = win.id;
    recalculateLayout();
    emit("windows:changed");
    return win;
  }

  function closeWindow(winId = state.activeWindowId) {
    const idx = state.windows.findIndex((w) => w.id === winId);
    if (idx === -1) return;
    const [removed] = state.windows.splice(idx, 1);

    // Remove from fibOrder only on destroy (matches fibonacci.lua)
    const fIdx = fibOrder.indexOf(removed.id);
    if (fIdx !== -1) fibOrder.splice(fIdx, 1);

    const browserApps = ["firefox", "youtube", "kick", "netflix", "primevideo", "twitch"];
    if (removed.appId === "spotify" && !state.windows.some((w) => w.appId === "spotify")) {
      window.SimState.stopMprisPlayer("spotify");
    } else if (
      browserApps.includes(removed.appId) &&
      !state.windows.some((w) => browserApps.includes(w.appId))
    ) {
      window.SimState.stopMprisPlayer("firefox");
    }

    if (state.activeWindowId === removed.id) {
      const wsWins = state.windows.filter((w) => w.workspace === state.activeWorkspace);
      state.activeWindowId = wsWins.length ? wsWins[wsWins.length - 1].id : null;
    }
    recalculateLayout();
    emit("windows:changed");
  }

  function focusWindow(winId) {
    const w = state.windows.find((win) => win.id === winId);
    if (!w) return;
    w.urgent = false;
    state.activeWindowId = w.id;
    emit("windows:changed");
  }

  function toggleFloat(winId = state.activeWindowId) {
    const w = state.windows.find((win) => win.id === winId);
    if (!w) return;
    w.floating = !w.floating;
    if (w.floating && w.floatRect) {
      w.rect = { ...w.floatRect };
    }
    recalculateLayout();
    emit("windows:changed");
  }

  function toggleFullscreen(winId = state.activeWindowId) {
    const w = state.windows.find((win) => win.id === winId);
    if (!w) return;
    w.fullscreen = !w.fullscreen;
    recalculateLayout();
    emit("windows:changed");
  }

  function focusWorkspace(target) {
    if (typeof target === "string" && target.startsWith("special:")) {
      const name = target.slice("special:".length);
      state.activeSpecial = state.activeSpecial === name ? null : name;
      if (state.activeSpecial === "scratchpad") {
        const hasWin = state.windows.some((w) => w.workspace === "special:scratchpad");
        if (!hasWin) {
          openWindow({
            appId: "kitty",
            title: "kitty — scratchpad",
            className: "kitty-float",
            workspace: "special:scratchpad",
            float: true,
            size: { w: 780, h: 420 },
          });
        }
      }
      recalculateLayout();
      emit("workspace:changed");
      return;
    }

    state.activeSpecial = null;
    let wsNum = state.activeWorkspace;
    if (target === "m+1") {
      wsNum = state.activeWorkspace >= 10 ? 1 : state.activeWorkspace + 1;
    } else if (target === "m-1") {
      wsNum = state.activeWorkspace <= 1 ? 10 : state.activeWorkspace - 1;
    } else if (target === "previous") {
      wsNum = state.previousWorkspace || 1;
    } else if (typeof target === "number") {
      wsNum = Math.max(1, Math.min(10, target));
    }

    if (wsNum !== state.activeWorkspace) {
      state.previousWorkspace = state.activeWorkspace;
      state.activeWorkspace = wsNum;
    }

    const wsWins = state.windows.filter((w) => w.workspace === state.activeWorkspace);
    if (!wsWins.some((w) => w.id === state.activeWindowId)) {
      state.activeWindowId = wsWins.length ? wsWins[wsWins.length - 1].id : null;
    }
    recalculateLayout();
    emit("workspace:changed");
  }

  function layoutCommand(cmd) {
    const layout = getActiveLayoutName();
    if (layout === "lua:fibonacci") {
      const aid = state.activeWindowId;
      const idx = fibOrder.indexOf(aid);
      if (cmd === "rotate") fibState.offset = (fibState.offset + 1) % 4;
      else if (cmd === "flip") fibState.flip = !fibState.flip;
      else if (cmd === "swapnext" && idx > 0) {
        [fibOrder[idx], fibOrder[idx - 1]] = [fibOrder[idx - 1], fibOrder[idx]];
      } else if (cmd === "swapprev" && idx !== -1 && idx < fibOrder.length - 1) {
        [fibOrder[idx], fibOrder[idx + 1]] = [fibOrder[idx + 1], fibOrder[idx]];
      }
    } else if (layout === "lua:golden") {
      if (cmd === "rotate") goldenState.offset = (goldenState.offset + 1) % 4;
      else if (cmd === "flip") goldenState.flip = !goldenState.flip;
      else if (cmd === "grow") goldenState.ratio = Math.min(0.9, goldenState.ratio + 0.05);
      else if (cmd === "shrink") goldenState.ratio = Math.max(0.1, goldenState.ratio - 0.05);
    }
    recalculateLayout();
  }

  function swapTiledSlotByPoint(draggedId, clientX, clientY) {
    const stage = document.getElementById("hyprland-workspace");
    if (!stage || lastSlots.length < 2) return;
    const rect = stage.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    let targetId = null;
    let bestDist = Infinity;
    for (const s of lastSlots) {
      if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) {
        targetId = s.id;
        break;
      }
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const d = (px - cx) ** 2 + (py - cy) ** 2;
      if (d < bestDist) {
        bestDist = d;
        targetId = s.id;
      }
    }

    if (targetId && targetId !== draggedId) {
      const i = fibOrder.indexOf(draggedId);
      const j = fibOrder.indexOf(targetId);
      if (i !== -1 && j !== -1) {
        [fibOrder[i], fibOrder[j]] = [fibOrder[j], fibOrder[i]];
        recalculateLayout();
      }
    }
  }

  window.addEventListener("resize", recalculateLayout);

  window.HyprCompositor = {
    openWindow,
    closeWindow,
    focusWindow,
    toggleFloat,
    toggleFullscreen,
    focusWorkspace,
    recalculateLayout,
    getActiveLayoutName,
    setWorkspaceLayout,
    layoutCommand,
    swapTiledSlotByPoint,
  };
})();
