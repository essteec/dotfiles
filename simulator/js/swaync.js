// SwayNC Control Center + Toast Notification Engine (home/.config/swaync/config.json & style.css)

(function () {
  const { state, on, emit, setVolume, setBrightness, mprisToggle, mprisNext, mprisPrev } = window.SimState;

  let activeMenubarTab = null;
  let perAppExpanded = false;
  const toastTimers = new Map();

  function formatRelTime(ts) {
    const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diff < 10) return "now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  function createNotificationCard(n, isToast = false) {
    const card = document.createElement("div");
    card.className = `notification-card ${n.urgency || "normal"}`;

    const main = document.createElement("div");
    main.className = "notification-main";

    if (n.imagePath || n.icon) {
      const img = document.createElement("img");
      img.className = n.imagePath ? "notification-img wide" : "notification-img";
      img.src = n.imagePath || n.icon;
      img.alt = "";
      main.appendChild(img);
    }

    const box = document.createElement("div");
    box.className = "notification-text-box";

    const topRow = document.createElement("div");
    topRow.className = "notification-top-row";

    const summary = document.createElement("div");
    summary.className = "notification-summary";
    summary.textContent = n.summary || n.appName;

    const time = document.createElement("div");
    time.className = "notification-time";
    time.textContent = formatRelTime(n.timestamp);

    topRow.append(summary, time);
    box.appendChild(topRow);

    if (n.body !== undefined && n.body !== null && n.body !== "") {
      const body = document.createElement("div");
      body.className = "notification-body";
      body.textContent = n.progress !== null && n.progress !== undefined ? `${n.body}%` : n.body;
      box.appendChild(body);
    }

    if (n.progress !== null && n.progress !== undefined) {
      const track = document.createElement("div");
      track.className = "notification-progress";
      const fill = document.createElement("div");
      fill.className = "notification-progress-fill";
      fill.style.width = `${Math.max(0, Math.min(100, n.progress))}%`;
      track.appendChild(fill);
      box.appendChild(track);
    }

    main.appendChild(box);
    card.appendChild(main);

    const closeBtn = document.createElement("button");
    closeBtn.className = "notification-close-btn";
    closeBtn.textContent = "✕";
    closeBtn.title = "Dismiss";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isToast) {
        state.toasts = state.toasts.filter((t) => t.id !== n.id);
        renderToasts();
      } else {
        state.notifications = state.notifications.filter((x) => x.id !== n.id);
        renderControlCenter();
      }
    });
    card.appendChild(closeBtn);

    if (n.actions && n.actions.length) {
      const actRow = document.createElement("div");
      actRow.className = "notification-actions";
      for (const act of n.actions) {
        const b = document.createElement("button");
        b.textContent = act.label;
        b.addEventListener("click", () => {
          act.onClick?.();
          if (isToast) {
            state.toasts = state.toasts.filter((t) => t.id !== n.id);
            renderToasts();
          }
        });
        actRow.appendChild(b);
      }
      card.appendChild(actRow);
    }

    return card;
  }

  function renderToasts() {
    const stack = document.getElementById("swaync-toast-stack");
    if (!stack) return;
    stack.innerHTML = "";

    for (const t of state.toasts) {
      stack.appendChild(createNotificationCard(t, true));
      if (!toastTimers.has(t.id)) {
        const timeoutMs = t.urgency === "low" ? 4500 : t.urgency === "critical" ? 0 : 7500;
        if (timeoutMs > 0) {
          const timer = setTimeout(() => {
            toastTimers.delete(t.id);
            state.toasts = state.toasts.filter((x) => x.id !== t.id);
            renderToasts();
          }, timeoutMs);
          toastTimers.set(t.id, timer);
        }
      }
    }
  }

  // Menubar structure directly from home/.config/swaync/config.json
  const MENUS = {
    launchers: {
      label: "󰀻  Launchers",
      actions: [
        { label: "󰀻  Run App", run: () => window.RofiUI.open("drun") },
        { label: "󰖯  Window Switcher", run: () => window.RofiUI.open("window") },
        { label: "󰞅  Emoji Pick", run: () => window.RofiUI.open("emoji") },
        { label: "󰅌  Clipboard", run: () => window.RofiUI.open("clipboard") },
        { label: "󰎈  Media Player", run: () => window.RofiUI.open("media-player") },
      ],
    },
    monitor: {
      label: "󰟌  Monitor",
      actions: [
        { label: "󰍛  Mission Center", run: () => window.AppLauncher.launch("missioncenter") },
        { label: "󰻠  Btop", run: () => window.AppLauncher.launch("btop") },
        { label: "󰢮  Nvidia-smi", run: () => window.AppLauncher.launch("nvidia-smi") },
        { label: "󰍹  Nvtop", run: () => window.AppLauncher.launch("nvtop") },
        { label: "  Htop", run: () => window.AppLauncher.launch("htop") },
      ],
    },
    appearance: {
      label: "󰏘  Look & Feel",
      actions: [
        { label: "󰏘  Gtk theme", run: () => window.AppLauncher.launch("nwg-look") },
        { label: "󰔎  Kvantum theme", run: () => window.AppLauncher.launch("kvantummanager") },
        { label: "󰛖  Fonts", run: () => window.AppLauncher.launch("font-manager") },
        { label: "󰒓  Qt theme", run: () => window.AppLauncher.launch("qt6ct") },
        { label: "󰀻  Icons", run: () => window.AppLauncher.launch("icon-browser") },
      ],
    },
    system: {
      label: "󰒓  System",
      actions: [
        { label: "󰐥  Power", run: () => window.RofiUI.open("power-menu") },
        { label: "󰁹  Battery", run: () => window.RofiUI.open("battery-menu") },
        { label: "󰌵  Blue Light", run: () => window.RofiUI.open("bluelight-menu") },
        { label: "󰸉  Wallpaper", run: () => window.RofiUI.open("wallpaper") },
        { label: "󰁯  Backup", run: () => window.AppLauncher.launch("timeshift") },
      ],
    },
  };

  function toggleControlCenter(force) {
    document.getElementById("waybar-tooltip")?.classList.add("hidden");
    state.swayncOpen = typeof force === "boolean" ? force : !state.swayncOpen;
    if (state.swayncOpen) {
      state.toasts = [];
      renderToasts();
    }
    const cc = document.getElementById("swaync-control-center");
    if (cc) {
      cc.classList.toggle("hidden", !state.swayncOpen);
    }
    if (state.swayncOpen) renderControlCenter();
  }

  function renderControlCenter() {
    const cc = document.getElementById("swaync-control-center");
    if (!cc) return;
    cc.innerHTML = "";

    // 1. Menubar
    const menubar = document.createElement("div");
    menubar.className = "widget-menubar";
    const barRow = document.createElement("div");
    barRow.className = "menu-button-bar";

    const leftGroup = document.createElement("div");
    leftGroup.className = "widget-menubar-container";
    const rightGroup = document.createElement("div");
    rightGroup.className = "widget-menubar-container";

    for (const [key, cfg] of Object.entries(MENUS)) {
      const btn = document.createElement("button");
      btn.textContent = cfg.label;
      if (activeMenubarTab === key) btn.classList.add("checked");
      btn.addEventListener("click", () => {
        activeMenubarTab = activeMenubarTab === key ? null : key;
        renderControlCenter();
      });
      if (key === "launchers" || key === "monitor") leftGroup.appendChild(btn);
      else rightGroup.appendChild(btn);
    }

    barRow.append(leftGroup, rightGroup);
    menubar.appendChild(barRow);

    const revealer = document.createElement("div");
    revealer.className = `menubar-revealer ${activeMenubarTab ? "" : "hidden"}`;
    if (activeMenubarTab && MENUS[activeMenubarTab]) {
      for (const act of MENUS[activeMenubarTab].actions) {
        const b = document.createElement("button");
        b.textContent = act.label;
        b.addEventListener("click", () => {
          toggleControlCenter(false);
          act.run();
        });
        revealer.appendChild(b);
      }
    }
    menubar.appendChild(revealer);
    cc.appendChild(menubar);

    // 2. Backlight Slider
    const bl = document.createElement("div");
    bl.className = "widget-backlight";
    const blRow = document.createElement("div");
    blRow.className = "swaync-slider-row";
    const blIcon = document.createElement("span");
    blIcon.className = "slider-icon";
    blIcon.textContent = "󰃠";
    const blRange = document.createElement("input");
    blRange.type = "range";
    blRange.min = 1;
    blRange.max = 100;
    blRange.value = state.brightness;
    blRange.className = "swaync-range";
    blRange.addEventListener("input", (e) => {
      setBrightness(Number(e.target.value), false);
    });
    blRow.append(blIcon, blRange);
    bl.appendChild(blRow);
    cc.appendChild(bl);

    // 3. Volume Slider + Per-App Volume
    const vol = document.createElement("div");
    vol.className = "widget-volume";
    const volRow = document.createElement("div");
    volRow.className = "swaync-slider-row";
    const volIcon = document.createElement("span");
    volIcon.className = "slider-icon";
    volIcon.textContent = state.muted ? "" : "󰕾";
    volIcon.style.cursor = "pointer";
    volIcon.addEventListener("click", () => window.SimState.toggleMute());
    const volRange = document.createElement("input");
    volRange.type = "range";
    volRange.min = 0;
    volRange.max = 120;
    volRange.value = state.volume;
    volRange.className = "swaync-range";
    volRange.addEventListener("input", (e) => {
      setVolume(Number(e.target.value));
    });
    const expBtn = document.createElement("button");
    expBtn.className = "expand-btn";
    expBtn.textContent = perAppExpanded ? "󰅃" : "󰅀";
    expBtn.addEventListener("click", () => {
      perAppExpanded = !perAppExpanded;
      renderControlCenter();
    });
    volRow.append(volIcon, volRange, expBtn);
    vol.appendChild(volRow);

    const perAppBox = document.createElement("div");
    perAppBox.className = `per-app-volume ${perAppExpanded ? "" : "hidden"}`;
    for (const [appName, appVal] of Object.entries(state.perAppVolumes)) {
      const row = document.createElement("div");
      row.className = "per-app-row";
      const lbl = document.createElement("span");
      lbl.className = "app-label";
      lbl.textContent = appName;
      const r = document.createElement("input");
      r.type = "range";
      r.min = 0;
      r.max = 100;
      r.value = appVal;
      r.className = "swaync-range";
      r.addEventListener("input", (e) => {
        state.perAppVolumes[appName] = Number(e.target.value);
        window.SimState.updateAudioVolume();
      });
      row.append(lbl, r);
      perAppBox.appendChild(row);
    }
    vol.appendChild(perAppBox);
    cc.appendChild(vol);

    // 4. MPRIS Widget
    const meta = window.SimState.getMprisMetadata();
    if (meta) {
      const mprisWrap = document.createElement("div");
      mprisWrap.className = "widget-mpris";
      const playerCard = document.createElement("div");
      playerCard.className = "widget-mpris-player";

      const bgArt = document.createElement("div");
      bgArt.className = "mpris-bg-art";
      bgArt.style.backgroundImage = `url("${meta.artUrl}")`;

      const overlay = document.createElement("div");
      overlay.className = "mpris-overlay";

      const artImg = document.createElement("img");
      artImg.className = "widget-mpris-album-art";
      artImg.src = meta.artUrl;
      artImg.alt = "";

      const info = document.createElement("div");
      info.className = "widget-mpris-info";
      const t = document.createElement("div");
      t.className = "widget-mpris-title";
      t.textContent = meta.cleanTitle;
      const sub = document.createElement("div");
      sub.className = "widget-mpris-subtitle";
      sub.textContent = meta.artist;
      info.append(t, sub);

      const ctrls = document.createElement("div");
      ctrls.className = "widget-mpris-controls";
      const prevBtn = document.createElement("button");
      prevBtn.textContent = "󰒮";
      prevBtn.addEventListener("click", mprisPrev);

      const playBtn = document.createElement("button");
      playBtn.textContent = meta.status === "Playing" ? "" : "";
      playBtn.addEventListener("click", () => mprisToggle());

      const nextBtn = document.createElement("button");
      nextBtn.textContent = "󰒭";
      nextBtn.addEventListener("click", () => mprisNext(false));

      ctrls.append(prevBtn, playBtn, nextBtn);
      overlay.append(artImg, info, ctrls);
      playerCard.append(bgArt, overlay);
      mprisWrap.appendChild(playerCard);
      cc.appendChild(mprisWrap);
    }

    // 5. Title + Clear All
    const titleBar = document.createElement("div");
    titleBar.className = "widget-title";
    const titleLbl = document.createElement("span");
    titleLbl.className = "widget-title-label";
    titleLbl.textContent = "󰂚  Notifications";
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "󰎟  Clear All";
    clearBtn.addEventListener("click", () => {
      state.notifications = [];
      renderControlCenter();
    });
    titleBar.append(titleLbl, clearBtn);
    cc.appendChild(titleBar);

    // 6. Do Not Disturb Switch
    const dndBar = document.createElement("div");
    dndBar.className = "widget-dnd";
    const dndLbl = document.createElement("label");
    dndLbl.textContent = "󰂛  Do Not Disturb";
    const sw = document.createElement("div");
    sw.className = `swaync-switch ${state.dnd ? "checked" : ""}`;
    sw.innerHTML = '<div class="swaync-switch-knob"></div>';
    sw.addEventListener("click", () => {
      state.dnd = !state.dnd;
      renderControlCenter();
    });
    dndBar.append(dndLbl, sw);
    cc.appendChild(dndBar);

    // 7. Notifications List
    const list = document.createElement("div");
    list.className = "control-center-list";
    if (state.notifications.length === 0) {
      const empty = document.createElement("div");
      empty.className = "control-center-list-placeholder";
      empty.textContent = "󰂛  No Notifications";
      list.appendChild(empty);
    } else {
      for (const n of state.notifications) {
        list.appendChild(createNotificationCard(n, false));
      }
    }
    cc.appendChild(list);
  }

  on("toast:update", renderToasts);
  on("notifications:changed", () => {
    if (state.swayncOpen) renderControlCenter();
  });
  on("mpris:changed", () => {
    if (state.swayncOpen) renderControlCenter();
  });
  on("audio:changed", () => {
    if (state.swayncOpen) renderControlCenter();
  });

  // Close Control Center when clicking outside on the workspace
  document.addEventListener("mousedown", (e) => {
    if (!state.swayncOpen) return;
    const cc = document.getElementById("swaync-control-center");
    const powerMod = document.getElementById("custom-power");
    if (cc && !cc.contains(e.target) && (!powerMod || !powerMod.contains(e.target))) {
      toggleControlCenter(false);
    }
  });

  window.SwayNC = {
    toggleControlCenter,
    renderControlCenter,
    renderToasts,
  };
})();
