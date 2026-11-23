// Waybar — 100% interactive modules, drawers, tooltips, clicks & scroll actions

(function () {
  const {
    state,
    on,
    adjustVolume,
    toggleMute,
    switchVolumeSink,
    adjustBrightness,
    toggleIdleAwake,
    mprisToggle,
    mprisNext,
    mprisPrev,
  } = window.SimState;

  const tooltipEl = document.getElementById("waybar-tooltip");
  const ctxMenuEl = document.getElementById("waybar-context-menu");

  function hideTooltip() {
    tooltipEl?.classList.add("hidden");
  }

  function showTooltip(targetEl, content, isHtml = false) {
    if (!tooltipEl || !targetEl) return;
    if (isHtml) tooltipEl.innerHTML = content;
    else tooltipEl.textContent = content;
    tooltipEl.classList.remove("hidden");

    const r = targetEl.getBoundingClientRect();
    const tr = tooltipEl.getBoundingClientRect();
    let left = r.left + r.width / 2 - tr.width / 2;
    left = Math.max(8, Math.min(window.innerWidth - tr.width - 8, left));
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${r.bottom + 6}px`;
  }

  function bindTooltip(el, getContent, isHtml = false) {
    if (!el) return;
    el.addEventListener("mouseenter", () => {
      const c = typeof getContent === "function" ? getContent() : getContent;
      if (c) showTooltip(el, c, isHtml);
    });
    el.addEventListener("mouseleave", hideTooltip);
    el.addEventListener("click", () => {
      const c = typeof getContent === "function" ? getContent() : getContent;
      if (c) showTooltip(el, c, isHtml);
    });
    el.addEventListener("contextmenu", hideTooltip);
  }

  // Pango Calendar Generator matching clock tooltip in config.jsonc
  function buildCalendarHtml() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `<div class="wb-cal"><div class="wb-cal-month">${monthName}</div><div class="wb-cal-grid">`;
    html += `<span class="wb-cal-hdr">Mo</span><span class="wb-cal-hdr">Tu</span><span class="wb-cal-hdr">We</span><span class="wb-cal-hdr">Th</span><span class="wb-cal-hdr">Fr</span><span class="wb-cal-hdr">Sa</span><span class="wb-cal-hdr">Su</span>`;

    let dayCursor = 1 - startOffset;
    for (let row = 0; row < 6 && dayCursor <= daysInMonth; row++) {
      for (let col = 0; col < 7; col++) {
        if (dayCursor < 1 || dayCursor > daysInMonth) {
          html += `<span class="wb-cal-day muted"> </span>`;
        } else {
          const isToday = dayCursor === today;
          html += `<span class="wb-cal-day ${isToday ? "today" : ""}">${dayCursor}</span>`;
        }
        dayCursor++;
      }
    }
    html += `</div></div>`;
    return html;
  }

  function renderWorkspaces() {
    const wsContainer = document.getElementById("workspaces");
    if (!wsContainer) return;
    wsContainer.innerHTML = "";

    const occupied = new Set(
      state.windows
        .filter((w) => typeof w.workspace === "number")
        .map((w) => w.workspace)
    );
    const maxWs = Math.max(4, state.activeWorkspace, ...occupied);

    for (let id = 1; id <= maxWs; id++) {
      const btn = document.createElement("button");
      btn.textContent = String(id);
      const isOccupied = occupied.has(id);
      const isUrgent = state.windows.some((w) => w.workspace === id && w.urgent);
      if (!isOccupied) btn.classList.add("empty");
      if (state.activeWorkspace === id && !state.activeSpecial) btn.classList.add("active");
      if (isUrgent) btn.classList.add("urgent");
      btn.addEventListener("click", () => window.HyprCompositor.focusWorkspace(id));
      wsContainer.appendChild(btn);
    }

    if (state.activeSpecial) {
      const sp = document.createElement("button");
      sp.className = "special active";
      sp.textContent = "";
      sp.title = `special:${state.activeSpecial}`;
      sp.addEventListener("click", () =>
        window.HyprCompositor.focusWorkspace(`special:${state.activeSpecial}`)
      );
      wsContainer.appendChild(sp);
    }
  }

  function renderActiveWindow() {
    const el = document.getElementById("window");
    if (!el) return;
    const active = state.windows.find((w) => w.id === state.activeWindowId);
    if (state.windowTitleAlt || !active) {
      el.textContent = " ❯ ";
    } else {
      el.textContent = ` ❯ ${active.title}`;
    }
  }

  function renderClock() {
    const el = document.getElementById("clock");
    if (!el) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    if (state.clockAlt) {
      const dd = String(now.getDate()).padStart(2, "0");
      const mo = String(now.getMonth() + 1).padStart(2, "0");
      el.textContent = `${dd}.${mo}.${now.getFullYear()}, ${hh}:${mm}`;
    } else {
      const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
      const day = String(now.getDate()).padStart(2, "0");
      el.textContent = `${weekday} ${day}, ${hh}:${mm}`;
    }
  }

  function renderMpris() {
    const el = document.getElementById("mpris");
    if (!el) return;
    const meta = window.SimState.getMprisMetadata();
    if (!meta) {
      el.className = "stopped";
      el.textContent = "";
      return;
    }
    el.className = meta.status === "Paused" ? "paused" : "";
    const txt = meta.cleanTitle || meta.rawTitle;
    el.textContent = txt.length > 36 ? txt.slice(0, 35) + "…" : txt;
  }

  function renderSysMonitor() {
    const tEl = document.getElementById("temperature");
    const cEl = document.getElementById("cpu");
    const mEl = document.getElementById("memory");
    const m = state.metrics;

    if (tEl) {
      const tIcons = ["", "", "", "", ""];
      const tIdx = Math.min(4, Math.max(0, Math.floor((m.tempC - 35) / 13)));
      tEl.textContent = `${tIcons[tIdx]} ${m.tempC}°C`;
      tEl.classList.toggle("critical", m.tempC >= 90);
    }
    if (cEl) {
      cEl.textContent = ` ${m.cpuPct}%`;
      cEl.classList.remove("good", "warning", "critical");
      if (m.cpuPct >= 90) cEl.classList.add("critical");
      else if (m.cpuPct >= 70) cEl.classList.add("warning");
      else if (m.cpuPct <= 30) cEl.classList.add("good");
    }
    if (mEl) {
      mEl.textContent = ` ${m.memPct}%`;
    }
  }

  function renderAudio() {
    const el = document.getElementById("pulseaudio");
    if (!el) return;
    if (state.muted) {
      el.textContent = "";
    } else {
      const icons = ["", "", ""];
      const idx = state.volume < 25 ? 0 : state.volume < 65 ? 1 : 2;
      el.textContent = icons[idx];
    }
  }

  function renderBacklight() {
    const el = document.getElementById("backlight");
    if (!el) return;
    const icons = ["󰃜", "󰃛", "󰃞", "󰃝", "󰃟", "󰃠"];
    const idx = Math.min(icons.length - 1, Math.floor((state.brightness / 100) * icons.length));
    el.textContent = icons[idx];
  }

  function renderBattery() {
    const el = document.getElementById("battery");
    if (!el) return;
    const cap = state.batteryCapacity;
    const idx = Math.min(10, Math.floor(cap / 9));
    const charging = ["󰢟", "󰢜", "󰂆", "󰂇", "󰂈", "󰢝", "󰢝", "󰢞", "󰂊", "󰂋", "󰂅"];
    const discharging = ["󰂎", "󰁺", "󰁻", "󰁼", "󰁽", "󰁾", "󰁿", "󰂀", "󰂁", "󰂂", "󰁹"];

    if (state.batteryStatus === "Full" || cap >= 100) {
      el.textContent = "";
    } else if (state.batteryStatus === "Charging") {
      el.textContent = charging[idx];
    } else {
      el.textContent = discharging[idx];
    }

    el.classList.remove("warning", "critical", "idle-inhibited");
    if (state.batteryStatus === "Discharging") {
      if (cap <= 24) el.classList.add("critical");
      else if (cap <= 30) el.classList.add("warning");
    }
    if (state.idleAwake) {
      el.classList.add("idle-inhibited");
    }
  }

  // Context Menu from home/.config/waybar/context/hyprmenu.xml
  function buildContextMenu() {
    if (!ctxMenuEl) return;
    const items = [
      {
        label: "Monitor system",
        children: [
          { label: "htop", run: () => window.AppLauncher.launch("htop") },
          { label: "nvtop", run: () => window.AppLauncher.launch("nvtop") },
          { label: "powertop", run: () => window.AppLauncher.launch("powertop") },
          { label: "missioncenter", run: () => window.AppLauncher.launch("missioncenter") },
        ],
      },
      {
        label: "Theme settings",
        children: [
          { label: "GTK settings", run: () => window.AppLauncher.launch("nwg-look") },
          { label: "QT6 settings", run: () => window.AppLauncher.launch("qt6ct") },
          { label: "Kvantum settings", run: () => window.AppLauncher.launch("kvantummanager") },
        ],
      },
      {
        label: "Refresh rate",
        children: [
          { label: "60Hz", run: () => setRefresh(60) },
          { label: "90Hz", run: () => setRefresh(90) },
          { label: "144Hz", run: () => setRefresh(144) },
        ],
      },
      {
        label: "Inhibit",
        children: [
          { label: "Shutdown", run: () => toggleIdleAwake() },
          { label: "Lid", run: () => toggleIdleAwake() },
        ],
      },
      {
        label: "Powersafe mode",
        run: () => {
          state.tlpProfile = "power-saver";
          window.SimState.notify({ appName: "Battery", summary: "Power Profile", body: "Switched to Power Saver mode" });
        },
      },
      { sep: true },
      {
        label: " Reload config",
        run: () => {
          window.SimState.notify({
            appName: "Hyprland",
            summary: "Hyprland",
            body: "Configuration reloaded",
            syncId: "565",
          });
        },
      },
    ];

    function setRefresh(hz) {
      state.refreshRate = hz;
      window.SimState.notify({
        appName: "Hyprland",
        summary: "Monitor eDP-1",
        body: `1920x1080@${hz}Hz applied`,
        syncId: "565",
      });
    }

    ctxMenuEl.innerHTML = "";
    for (const item of items) {
      if (item.sep) {
        const sep = document.createElement("div");
        sep.className = "wb-menu-sep";
        ctxMenuEl.appendChild(sep);
        continue;
      }
      const row = document.createElement("div");
      row.className = "wb-menu-item";
      row.innerHTML = `<span>${item.label}</span>${item.children ? "<span>▸</span>" : ""}`;
      if (item.run) {
        row.addEventListener("click", () => {
          ctxMenuEl.classList.add("hidden");
          item.run();
        });
      }
      if (item.children) {
        const sub = document.createElement("div");
        sub.className = "wb-submenu";
        for (const ch of item.children) {
          const sr = document.createElement("div");
          sr.className = "wb-menu-item";
          sr.textContent = ch.label;
          sr.addEventListener("click", (e) => {
            e.stopPropagation();
            ctxMenuEl.classList.add("hidden");
            ch.run();
          });
          sub.appendChild(sr);
        }
        row.appendChild(sub);
      }
      ctxMenuEl.appendChild(row);
    }
  }

  function initWaybarBindings() {
    // Workspaces scroll
    const wsEl = document.getElementById("workspaces");
    wsEl?.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        window.HyprCompositor.focusWorkspace(e.deltaY < 0 ? "m-1" : "m+1");
      },
      { passive: false }
    );

    // Active window clicks
    const winEl = document.getElementById("window");
    if (winEl) {
      winEl.addEventListener("click", (e) => {
        if (e.altKey) {
          window.RofiUI.open("window");
          return;
        }
        state.windowTitleAlt = !state.windowTitleAlt;
        renderActiveWindow();
      });
      winEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        window.RofiUI.open("drun");
      });
      winEl.addEventListener("auxclick", (e) => {
        if (e.button === 1) {
          e.preventDefault();
          window.RofiUI.open("window");
        }
      });
      bindTooltip(winEl, () => {
        const a = state.windows.find((w) => w.id === state.activeWindowId);
        return a ? a.title : "Desktop (Right-click: App Launcher, Middle-click: Window Switcher)";
      });
    }

    // Clock clicks & calendar tooltip
    const clockEl = document.getElementById("clock");
    if (clockEl) {
      clockEl.addEventListener("click", () => {
        state.clockAlt = !state.clockAlt;
        renderClock();
      });
      clockEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        window.AppLauncher.launch("gnome-clocks");
      });
      clockEl.addEventListener("auxclick", (e) => {
        if (e.button === 1) {
          e.preventDefault();
          window.AppLauncher.launch("thunderbird");
        }
      });
      bindTooltip(clockEl, buildCalendarHtml, true);
    }

    // MPRIS title
    const mprisEl = document.getElementById("mpris");
    if (mprisEl) {
      mprisEl.addEventListener("click", () => mprisToggle());
      bindTooltip(mprisEl, () => {
        const m = window.SimState.getMprisMetadata();
        if (!m) return "";
        return `${m.playerName} (${m.status})\n${m.rawTitle}\n${m.artist}`;
      });
    }

    // Custom/media (󰎈)
    const mediaEl = document.getElementById("custom-media");
    if (mediaEl) {
      mediaEl.addEventListener("click", () => window.RofiUI.open("media-player"));
      mediaEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        mprisNext(false);
      });
      mediaEl.addEventListener("auxclick", (e) => {
        if (e.button === 1) {
          e.preventDefault();
          mprisPrev();
        }
      });
      bindTooltip(mediaEl, "Left: Media Player OSD\nRight: Next Track\nMiddle: Previous Track");
    }

    // Tray drawer
    const trayDrawer = document.getElementById("tray-drawer");
    const trayExpand = document.getElementById("custom-expand");
    trayExpand?.addEventListener("click", () => {
      state.trayOpen = !state.trayOpen;
      trayDrawer?.classList.toggle("open", state.trayOpen);
    });

    // Tray icon actions
    document.querySelectorAll("#tray .tray-item").forEach((item) => {
      const app = item.dataset.trayApp;
      item.addEventListener("click", () => window.AppLauncher.launch(app));
      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        window.AppLauncher.launch(app);
      });
      bindTooltip(item, item.dataset.tooltip || app);
    });

    // Sys-monitor drawer
    const sysDrawer = document.getElementById("sys-monitor-drawer");
    const sysExpand = document.getElementById("custom-sys-monitor-expand");
    sysExpand?.addEventListener("click", () => {
      state.sysMonOpen = !state.sysMonOpen;
      sysDrawer?.classList.toggle("open", state.sysMonOpen);
    });
    bindTooltip(sysExpand, "System Monitor");

    const tempEl = document.getElementById("temperature");
    tempEl?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      window.AppLauncher.launch("nvidia-smi");
    });
    bindTooltip(tempEl, () => `CPU Package: ${state.metrics.tempC}°C\nNVIDIA GPU: ${state.metrics.gpuTempC}°C\nRight-click: my-nvidia-smi.sh`);

    const cpuEl = document.getElementById("cpu");
    cpuEl?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      window.AppLauncher.launch("nvtop");
    });
    bindTooltip(cpuEl, () => `Frequency: ${state.metrics.cpuAvgFreq}GHz / ${state.metrics.cpuMaxFreq}GHz\nRight-click: nvtop`);

    const memEl = document.getElementById("memory");
    memEl?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      window.AppLauncher.launch("btop");
    });
    bindTooltip(memEl, () => {
      const m = state.metrics;
      return `memory ${m.memPct}%: ${m.memUsedGiB}GiB / ${m.memTotalGiB}GiB\nswap ${m.swapPct}%: ${m.swapUsedGiB}GiB / ${m.swapTotalGiB}GiB\nRight-click: btop`;
    });

    // Pulseaudio
    const audioEl = document.getElementById("pulseaudio");
    if (audioEl) {
      audioEl.addEventListener("click", () => window.AppLauncher.launch("pavucontrol"));
      audioEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleMute();
      });
      audioEl.addEventListener("auxclick", (e) => {
        if (e.button === 1) {
          e.preventDefault();
          switchVolumeSink();
        }
      });
      audioEl.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          adjustVolume(e.deltaY < 0 ? 4 : -5);
        },
        { passive: false }
      );
      bindTooltip(audioEl, () => {
        const sink = state.sinks[state.activeSinkIndex];
        return `${state.volume}%${state.muted ? " (Muted)" : ""}\n${sink.name}`;
      });
    }

    // Backlight
    const blEl = document.getElementById("backlight");
    if (blEl) {
      blEl.addEventListener("click", () => window.RofiUI.open("bluelight-menu"));
      blEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        window.RofiUI.open("wallpaper");
      });
      blEl.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          adjustBrightness(e.deltaY < 0 ? 5 : -4);
        },
        { passive: false }
      );
      bindTooltip(blEl, () => `${state.brightness}% (${state.temperature}K, ${state.gamma}% gamma)\nLeft: bluelight-menu.sh\nRight: wall-picker.sh`);
    }

    // Battery
    const batEl = document.getElementById("battery");
    if (batEl) {
      batEl.addEventListener("click", () => window.RofiUI.open("battery-menu"));
      batEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleIdleAwake();
      });
      bindTooltip(batEl, () => {
        const arrow = state.batteryStatus === "Charging" ? "↑" : "↓";
        return `${state.batteryWatts}W${arrow} ${state.batteryCapacity}%\nProfile: ${state.tlpProfile} (${state.chargeThreshold}%)\nIdle Awake: ${state.idleAwake ? "on" : "off"}`;
      });
    }

    // Custom/power ()
    const pwrEl = document.getElementById("custom-power");
    if (pwrEl) {
      pwrEl.addEventListener("click", () => window.SwayNC.toggleControlCenter());
      pwrEl.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        window.RofiUI.open("power-menu");
      });
    }

    // Waybar background right-click -> GTK Hyprmenu context menu
    const waybarEl = document.getElementById("waybar");
    buildContextMenu();
    waybarEl?.addEventListener("contextmenu", (e) => {
      if (
        e.target === waybarEl ||
        e.target.classList.contains("modules-left") ||
        e.target.classList.contains("modules-center") ||
        e.target.classList.contains("modules-right")
      ) {
        e.preventDefault();
        if (!ctxMenuEl) return;
        ctxMenuEl.classList.remove("hidden");
        ctxMenuEl.style.left = `${Math.min(window.innerWidth - 220, e.clientX)}px`;
        ctxMenuEl.style.top = `${e.clientY + 4}px`;
      }
    });

    document.addEventListener("mousedown", (e) => {
      if (ctxMenuEl && !ctxMenuEl.contains(e.target)) {
        ctxMenuEl.classList.add("hidden");
      }
    });
  }

  on("windows:changed", () => {
    renderWorkspaces();
    renderActiveWindow();
  });
  on("workspace:changed", () => {
    renderWorkspaces();
    renderActiveWindow();
  });
  on("mpris:changed", renderMpris);
  on("metrics:changed", renderSysMonitor);
  on("audio:changed", renderAudio);
  on("display:changed", renderBacklight);
  on("power:changed", renderBattery);

  setInterval(renderClock, 15000);

  window.WaybarUI = {
    init: () => {
      initWaybarBindings();
      renderWorkspaces();
      renderActiveWindow();
      renderClock();
      renderMpris();
      renderSysMonitor();
      renderAudio();
      renderBacklight();
      renderBattery();
    },
  };
})();
