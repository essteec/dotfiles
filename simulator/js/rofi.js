// Rofi — Exact implementations of style5, style5_variant, launcher/style-1, power_menu, media_player, wallpaper

(function () {
  const {
    state,
    getActiveMprisPlayer,
    getMprisMetadata,
    mprisToggle,
    mprisNext,
    mprisPrev,
    mprisSeek,
    mprisToggleShuffle,
    mprisCycleLoop,
    switchTargetPlayer,
    setHyprsunset,
    applyWallpaper,
    toggleIdleAwake,
    copyToClipboard,
    notify,
  } = window.SimState;

  const backdrop = document.getElementById("rofi-backdrop");
  let activeMode = null;
  let selectedIdx = 0;
  let query = "";
  let confirmAction = null;
  let currentItems = [];

  const EMOJIS = [
    ["😀", "Grinning Face"], ["😂", "Face with Tears of Joy"], ["🥳", "Partying Face"], ["😎", "Smiling Face with Sunglasses"],
    ["🔥", "Fire"], ["🚀", "Rocket"], ["✨", "Sparkles"], ["💜", "Purple Heart"],
    ["🍙", "Rice Ball (Arch)"], ["🐧", "Penguin (Linux)"], ["⚡", "High Voltage"], ["🎵", "Musical Note"],
    ["🎧", "Headphone"], ["💻", "Laptop"], ["🛠️", "Hammer and Wrench"], ["📁", "File Folder"],
    ["🔒", "Locked"], ["🌙", "Crescent Moon"], ["☀️", "Sun"], ["✅", "Check Mark"],
  ];

  const DRUN_APPS = [
    { id: "kitty", name: "Kitty", generic: "Fast GPU Terminal", icon: "" },
    { id: "spotify", name: "Spotify", generic: "Desktop Music Player", icon: "󰓇" },
    { id: "firefox", name: "Firefox", generic: "Web Browser", icon: "󰈹" },
    { id: "thunar", name: "Thunar", generic: "File Manager", icon: "" },
    { id: "btop", name: "btop++", generic: "Resource Monitor", icon: "󰻠" },
    { id: "nvtop", name: "nvtop", generic: "GPU Process Monitor", icon: "󰍹" },
    { id: "htop", name: "htop", generic: "Interactive Process Viewer", icon: "" },
    { id: "nvidia-smi", name: "Nvidia Thermal & SMI", generic: "GPU & Thermal Sensors", icon: "󰢮" },
    { id: "serie", name: "Serie", generic: "Rich Git Commit Graph", icon: "" },
    { id: "pavucontrol", name: "Volume Control", generic: "PipeWire PulseAudio Mixer", icon: "" },
    { id: "missioncenter", name: "Mission Center", generic: "System Monitor", icon: "󰍛" },
    { id: "gnome-clocks", name: "Clocks", generic: "Alarms & World Clocks", icon: "" },
    { id: "thunderbird", name: "Thunderbird Calendar", generic: "Mail & Calendar", icon: "" },
    { id: "nwg-look", name: "GTK Settings (nwg-look)", generic: "Material-Black-Plum-BE", icon: "󰏘" },
    { id: "kvantummanager", name: "Kvantum Manager", generic: "Fluent-purple-dark", icon: "󰔎" },
    { id: "qt6ct", name: "Qt6 Settings", generic: "Qt6 Theme Configuration", icon: "󰒓" },
    { id: "blueman-manager", name: "Bluetooth Manager", generic: "Blueman Applet", icon: "󰂯" },
    { id: "nm-connection-editor", name: "Network Connections", generic: "Wi-Fi & Ethernet", icon: "󰤨" },
    { id: "youtube", name: "YouTube", generic: "WebApp (Chromium)", icon: "" },
    { id: "twitch", name: "Twitch", generic: "WebApp (Chromium)", icon: "" },
    { id: "kick", name: "Kick", generic: "WebApp (Chromium)", icon: "󰻏" },
    { id: "netflix", name: "Netflix", generic: "WebApp (Chromium)", icon: "󰝆" },
    { id: "primevideo", name: "Prime Video", generic: "WebApp (Chromium)", icon: "" },
  ];

  function close() {
    activeMode = null;
    confirmAction = null;
    query = "";
    selectedIdx = 0;
    currentItems = [];
    if (backdrop) {
      backdrop.className = "hidden";
      backdrop.innerHTML = "";
    }
  }

  function open(mode, opts = {}) {
    document.getElementById("waybar-tooltip")?.classList.add("hidden");
    if (activeMode === mode && !opts.keepOpen) {
      close();
      return;
    }
    window.SwayNC?.toggleControlCenter(false);
    activeMode = mode;
    query = "";
    confirmAction = null;
    selectedIdx = opts.selectedIdx ?? (mode === "media-player" ? 2 : 0);
    render();
  }

  function paginateItems(items, pageSize) {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const clampedIdx = Math.max(0, Math.min(selectedIdx, Math.max(0, items.length - 1)));
    selectedIdx = clampedIdx;
    const currentPage = Math.floor(clampedIdx / pageSize);
    const pageStart = currentPage * pageSize;
    return {
      totalPages,
      currentPage,
      pageStart,
      pageItems: items.slice(pageStart, pageStart + pageSize),
    };
  }

  function stepSelection(delta) {
    if (!currentItems.length) return;
    selectedIdx = (selectedIdx + delta + currentItems.length) % currentItems.length;
    render();
  }

  function bindWheelPaging(el) {
    el.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        stepSelection(e.deltaY > 0 ? 1 : -1);
      },
      { passive: false }
    );
  }

  function formatDuration(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function renderStyle5(isVariant = false, listMode = "drun") {
    const win = document.createElement("div");
    win.className = `rofi-window ${isVariant ? "theme-style5-variant" : "theme-style5"}`;

    const main = document.createElement("div");
    main.className = "rofi-style5-mainbox";

    const inputbar = document.createElement("div");
    inputbar.className = "rofi-style5-inputbar";
    const prompt = document.createElement("div");
    prompt.className = "rofi-style5-prompt-icon";
    prompt.textContent = listMode === "filebrowser" ? "" : "";
    const entry = document.createElement("input");
    entry.className = "rofi-style5-entry";
    entry.type = "text";
    entry.value = query;
    entry.placeholder =
      listMode === "window"
        ? "Switch window..."
        : listMode === "clipboard"
          ? "Clipboard history (cliphist)..."
          : listMode === "filebrowser"
            ? "Browse files (~)..."
            : "Search applications...";
    inputbar.append(prompt, entry);

    const listWrap = document.createElement("div");
    listWrap.className = "rofi-style5-listview-wrap";
    const listview = document.createElement("div");
    listview.className = "rofi-style5-listview";
    const scrollbar = document.createElement("div");
    scrollbar.className = "rofi-style5-scrollbar";
    const thumb = document.createElement("div");
    thumb.className = "rofi-style5-scrollbar-thumb";
    scrollbar.appendChild(thumb);
    listWrap.append(listview, scrollbar);

    let items = [];
    const q = query.toLowerCase().trim();
    if (listMode === "drun") {
      items = DRUN_APPS.filter(
        (a) => a.name.toLowerCase().includes(q) || a.generic.toLowerCase().includes(q)
      ).map((a) => ({
        icon: a.icon,
        label: a.name,
        meta: `- ${a.generic}`,
        run: () => {
          close();
          window.AppLauncher.launch(a.id);
        },
      }));
    } else if (listMode === "window") {
      items = state.windows
        .filter(
          (w) =>
            w.title.toLowerCase().includes(q) || w.className.toLowerCase().includes(q)
        )
        .map((w) => ({
          icon: `[${w.workspace}]`,
          label: `${w.className} 󰤃`,
          meta: w.title,
          run: () => {
            close();
            if (typeof w.workspace === "number") {
              window.HyprCompositor.focusWorkspace(w.workspace);
            }
            window.HyprCompositor.focusWindow(w.id);
          },
        }));
      if (items.length === 0) {
        items = [{ icon: "󰖯", label: "No open windows", meta: "Launch an app via drun", run: close }];
      }
    } else if (listMode === "clipboard") {
      items = state.cliphist
        .filter((c) => c.toLowerCase().includes(q))
        .map((c, idx) => ({
          icon: String(idx + 1),
          label: c.length > 52 ? c.slice(0, 51) + "…" : c,
          meta: "wl-copy",
          run: () => {
            copyToClipboard(c);
            close();
            notify({ appName: "Clipboard", summary: "Copied from cliphist", body: c });
          },
        }));
    } else if (listMode === "filebrowser") {
      const files = [
        { icon: "", label: "~/.config/hypr/hyprland.lua", meta: "Hyprland config", run: () => { close(); window.AppLauncher.launch("kitty", { initCmd: "cat ~/.config/hypr/hyprland.lua" }); } },
        { icon: "", label: "~/.config/waybar/config.jsonc", meta: "Waybar config", run: () => { close(); window.AppLauncher.launch("kitty", { initCmd: "cat ~/.config/waybar/config.jsonc" }); } },
        { icon: "", label: "~/.config/swaync/style.css", meta: "SwayNC style", run: () => { close(); window.AppLauncher.launch("kitty", { initCmd: "cat ~/.config/swaync/style.css" }); } },
        { icon: "", label: "~/.zshrc", meta: "Zsh config", run: () => { close(); window.AppLauncher.launch("kitty", { initCmd: "cat ~/.zshrc" }); } },
        ...state.allWallpapers.map((w) => ({
          icon: "",
          label: `~/Pictures/Wallpapers/${w.theme}/${w.name}`,
          meta: w.theme,
          run: () => {
            applyWallpaper(w);
            close();
          },
        })),
      ];
      items = files.filter(
        (f) => f.label.toLowerCase().includes(q) || f.meta.toLowerCase().includes(q)
      );
    }

    currentItems = items;
    const { totalPages, currentPage, pageStart, pageItems } = paginateItems(items, 5);
    thumb.style.height = `${100 / totalPages}%`;
    thumb.style.top = `${(currentPage / totalPages) * 100}%`;

    pageItems.forEach((it, localIdx) => {
      const globalIdx = pageStart + localIdx;
      const row = document.createElement("div");
      row.className = `rofi-style5-item ${globalIdx === selectedIdx ? "selected" : ""}`;
      row.innerHTML = `<span class="item-icon">${it.icon}</span><span>${it.label} <span class="item-meta">${it.meta}</span></span>`;
      row.addEventListener("mouseenter", () => {
        selectedIdx = globalIdx;
        listview.querySelectorAll(".rofi-style5-item").forEach((el, i) =>
          el.classList.toggle("selected", pageStart + i === selectedIdx)
        );
      });
      row.addEventListener("click", it.run);
      listview.appendChild(row);
    });

    entry.addEventListener("input", (e) => {
      query = e.target.value;
      selectedIdx = 0;
      render();
    });
    bindWheelPaging(win);

    main.append(inputbar, listWrap);
    win.appendChild(main);
    backdrop.appendChild(win);
    setTimeout(() => entry.focus(), 10);
  }

  function renderLauncher1() {
    const win = document.createElement("div");
    win.className = "rofi-window theme-launcher-1";

    const main = document.createElement("div");
    main.className = "rofi-l1-mainbox";

    const inputbar = document.createElement("div");
    inputbar.className = "rofi-l1-inputbar";
    const entry = document.createElement("input");
    entry.className = "rofi-l1-entry";
    entry.type = "text";
    entry.value = query;
    entry.placeholder = "Search emojis...";
    inputbar.innerHTML = `<span>󰞅</span><span></span>`;
    inputbar.appendChild(entry);

    const listview = document.createElement("div");
    listview.className = "rofi-l1-listview";

    const q = query.toLowerCase().trim();
    const items = EMOJIS.filter(([em, desc]) => desc.toLowerCase().includes(q) || em.includes(q)).map(
      ([em, desc]) => ({
        label: `${em}  ${desc}`,
        run: () => {
          copyToClipboard(em);
          close();
          notify({ appName: "Emoji", summary: "Copied Emoji", body: `${em} (${desc})` });
        },
      })
    );

    currentItems = items;
    const { pageStart, pageItems } = paginateItems(items, 20);
    pageItems.forEach((it, localIdx) => {
      const globalIdx = pageStart + localIdx;
      const el = document.createElement("div");
      el.className = `rofi-l1-item ${globalIdx === selectedIdx ? "selected" : ""}`;
      el.textContent = it.label;
      el.addEventListener("mouseenter", () => {
        selectedIdx = globalIdx;
        listview.querySelectorAll(".rofi-l1-item").forEach((n, i) =>
          n.classList.toggle("selected", pageStart + i === selectedIdx)
        );
      });
      el.addEventListener("click", it.run);
      listview.appendChild(el);
    });

    const switcher = document.createElement("div");
    switcher.className = "rofi-l1-switcher";
    const emojiTab = document.createElement("button");
    emojiTab.textContent = "󰞅 Emoji";
    emojiTab.classList.add("selected");
    switcher.appendChild(emojiTab);

    entry.addEventListener("input", (e) => {
      query = e.target.value;
      selectedIdx = 0;
      render();
    });
    bindWheelPaging(win);

    main.append(inputbar, listview, switcher);
    win.appendChild(main);
    backdrop.appendChild(win);
    setTimeout(() => entry.focus(), 10);
  }

  function formatUptime() {
    const sec = Math.floor((Date.now() - state.startedAt) / 1000) + 5220;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h} hour${h === 1 ? "" : "s"}, ${m} minute${m === 1 ? "" : "s"}`;
  }

  function renderPowerMenu(isBattery = false) {
    const win = document.createElement("div");
    win.className = "rofi-window theme-power-menu";

    const main = document.createElement("div");
    main.className = "rofi-power-mainbox";

    const msg = document.createElement("div");
    msg.className = "rofi-power-message";

    let items = [];
    if (isBattery) {
      // Exact port of home/.local/bin/battery-menu.sh
      const idleStr = state.idleAwake ? "on" : "off";
      msg.textContent = `Profile: ${state.tlpProfile}-${state.chargeThreshold}%-${idleStr}`;

      if (state.tlpProfile !== "performance") {
        items.push({
          label: " 󱐋 Performance",
          run: () => {
            state.tlpProfile = "performance";
            state.batteryWatts = 24;
            close();
            notify({ appName: "Battery", summary: "Power Profile", body: "Switched to 󱐋 Performance mode" });
          },
        });
      }
      if (state.tlpProfile !== "balanced") {
        items.push({
          label: "  Balanced",
          run: () => {
            state.tlpProfile = "balanced";
            state.batteryWatts = 12;
            close();
            notify({ appName: "Battery", summary: "Power Profile", body: "Switched to  Balanced mode" });
          },
        });
      }
      if (state.tlpProfile !== "power-saver") {
        items.push({
          label: " 󰌪 Power Saver",
          run: () => {
            state.tlpProfile = "power-saver";
            state.batteryWatts = 7;
            close();
            notify({ appName: "Battery", summary: "Power Profile", body: "Switched to 󰌪 Power Saver mode" });
          },
        });
      }

      if (state.chargeThreshold !== 100) {
        items.push({
          label: " 󰠇 Full Charge",
          run: () => {
            state.chargeThreshold = 100;
            close();
            notify({ appName: "Battery", summary: "Battery Charge Threshold", body: "Set to 󰠇 Full Charge (100%)" });
          },
        });
      }
      if (state.chargeThreshold !== 80) {
        items.push({
          label: " 󰠏 80% Charge",
          run: () => {
            state.chargeThreshold = 80;
            close();
            notify({ appName: "Battery", summary: "Battery Charge Threshold", body: "Set to 󰠏 80% Charge" });
          },
        });
      }
      if (state.chargeThreshold !== 60) {
        items.push({
          label: " 󰠍 60% Charge",
          run: () => {
            state.chargeThreshold = 60;
            close();
            notify({ appName: "Battery", summary: "Battery Charge Threshold", body: "Set to 󰠍 60% Charge" });
          },
        });
      }

      items.push({
        label: state.idleAwake ? " 󰈉 Disable Idle Awake" : " 󰈈 Enable Idle Awake",
        run: () => {
          toggleIdleAwake();
          close();
        },
      });
    } else if (confirmAction) {
      msg.textContent = `Are you sure to  ${confirmAction.label}?`;
      items = [
        {
          label: "Yes",
          run: () => {
            const fn = confirmAction.exec;
            close();
            fn();
          },
        },
        {
          label: "No",
          run: () => {
            confirmAction = null;
            selectedIdx = 0;
            render();
          },
        },
      ];
    } else {
      // Exact port of home/.local/bin/power-menu.sh
      msg.textContent = `Uptime: ${formatUptime()}\nWindows: ${state.windows.length}`;
      const askConfirm = (label, exec) => {
        confirmAction = { label, exec };
        selectedIdx = 0;
        render();
      };
      items = [
        { label: "  Shutdown", run: () => askConfirm("  Shutdown", () => window.ScreensUI.showPowerOverlay("Shutting down...", "systemctl poweroff")) },
        { label: "  Reboot", run: () => askConfirm("  Reboot", () => window.ScreensUI.showPowerOverlay("Restarting...", "systemctl reboot")) },
        { label: "󰒲  Suspend", run: () => askConfirm("󰒲  Suspend", () => window.ScreensUI.showPowerOverlay("Suspending...", "systemctl suspend")) },
        { label: "󰒲  Hibernate", run: () => askConfirm("󰒲  Hibernate", () => window.ScreensUI.showPowerOverlay("Hibernating...", "systemctl hibernate")) },
        { label: "  Lock", run: () => { close(); window.ScreensUI.lock(); } },
        { label: "󰍃  Logout", run: () => askConfirm("󰍃  Logout", () => window.ScreensUI.showPowerOverlay("Exiting Hyprland...", "hyprshutdown")) },
      ];
    }

    const pageSize = isBattery || confirmAction ? 2 : 4;
    const listview = document.createElement("div");
    listview.className = "rofi-power-listview";
    listview.style.height = `calc(${pageSize} * 36px + ${pageSize - 1} * 6px)`;

    currentItems = items;
    const { pageStart, pageItems } = paginateItems(items, pageSize);

    pageItems.forEach((it, localIdx) => {
      const globalIdx = pageStart + localIdx;
      const el = document.createElement("div");
      el.className = `rofi-power-item ${globalIdx === selectedIdx ? "selected" : ""}`;
      el.textContent = it.label;
      el.addEventListener("mouseenter", () => {
        selectedIdx = globalIdx;
        listview.querySelectorAll(".rofi-power-item").forEach((n, i) =>
          n.classList.toggle("selected", pageStart + i === selectedIdx)
        );
      });
      el.addEventListener("click", it.run);
      listview.appendChild(el);
    });

    bindWheelPaging(win);
    main.append(msg, listview);
    win.appendChild(main);
    backdrop.appendChild(win);
  }

  function renderMediaPlayerOrBluelight(isBluelight = false) {
    const win = document.createElement("div");
    win.className = "rofi-window theme-media-player";

    const main = document.createElement("div");
    main.className = "rofi-media-mainbox";

    const msg = document.createElement("div");
    msg.className = "rofi-media-message";

    const listview = document.createElement("div");
    listview.className = "rofi-media-listview";

    let items = [];
    if (isBluelight) {
      // Exact port of home/.local/bin/bluelight-menu.sh
      msg.textContent = `current settings: ${state.temperature}K, ${state.gamma}% gamma`;
      items = [
        { label: " +100K", run: () => { setHyprsunset(state.temperature + 100, state.gamma); selectedIdx = 0; render(); } },
        { label: " -100K", run: () => { setHyprsunset(state.temperature - 100, state.gamma); selectedIdx = 1; render(); } },
        { label: " +5", run: () => { setHyprsunset(state.temperature, state.gamma + 5); selectedIdx = 2; render(); } },
        { label: "󰖔 -5", run: () => { setHyprsunset(state.temperature, state.gamma - 5); selectedIdx = 3; render(); } },
        { label: "󰁯 reset", run: () => { setHyprsunset(4800, 85); selectedIdx = 4; render(); } },
        { label: "󰈆 disable", run: () => { setHyprsunset(6000, 100); selectedIdx = 5; render(); } },
      ];
    } else {
      // Exact port of home/.local/bin/media-player.sh
      const player = getActiveMprisPlayer();
      const meta = getMprisMetadata(player);
      if (!player || !meta) {
        msg.textContent = "Nothing is playing";
        items = [
          { label: "", title: "Chromium", run: () => { close(); window.AppLauncher.launch("firefox"); } },
          { label: "", title: "YouTube", run: () => { close(); window.AppLauncher.launch("youtube"); } },
          { label: "", title: "Spotify", run: () => { close(); window.AppLauncher.launch("spotify"); } },
          { label: "󰻏", title: "Kick", run: () => { close(); window.AppLauncher.launch("kick"); } },
          { label: "󰝆", title: "Netflix", run: () => { close(); window.AppLauncher.launch("netflix"); } },
          { label: "", title: "Prime Video", run: () => { close(); window.AppLauncher.launch("primevideo"); } },
        ];
      } else {
        const capName = meta.playerName.charAt(0).toUpperCase() + meta.playerName.slice(1);
        const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
        msg.textContent = `${capName} | ${formatDuration(meta.positionSec)} -> ${formatDuration(meta.durationSec)}\n${trunc(meta.rawTitle, 41)}\n${trunc(meta.artist, 41)}`;

        const toggleGlyph = meta.status === "Playing" ? "" : "";
        const shuffleGlyph = meta.shuffle ? "" : "󰒞";
        const repeatGlyph = meta.loop === "Track" ? "󰑘" : meta.loop === "Playlist" ? "󰑖" : "󰑗";

        items = [
          { label: "󰼨", title: "Previous", run: () => { mprisPrev(); selectedIdx = 0; render(); } },
          { label: "󱥆", title: "Seek -15s", run: () => { mprisSeek(-15); selectedIdx = 1; render(); } },
          { label: toggleGlyph, title: "Play / Pause", run: () => { mprisToggle(); selectedIdx = 2; render(); } },
          { label: "󱤺", title: "Seek +15s", run: () => { mprisSeek(15); selectedIdx = 3; render(); } },
          { label: "󰼧", title: "Next", run: () => { mprisNext(false); selectedIdx = 4; render(); } },
          { label: "󱤵", title: "Switch Player", run: () => { switchTargetPlayer(); selectedIdx = 5; render(); } },
          { label: shuffleGlyph, title: "Shuffle", run: () => { mprisToggleShuffle(); selectedIdx = 6; render(); } },
          { label: repeatGlyph, title: `Loop: ${meta.loop}`, run: () => { mprisCycleLoop(); selectedIdx = 7; render(); } },
        ];
      }
    }

    currentItems = items;
    const cols = Math.max(1, Math.ceil(items.length / 2));
    listview.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    selectedIdx = Math.max(0, Math.min(selectedIdx, items.length - 1));
    items.forEach((it, idx) => {
      const el = document.createElement("div");
      el.className = `rofi-media-item ${isBluelight ? "bluelight-item" : ""} ${idx === selectedIdx ? "selected" : ""}`;
      el.textContent = it.label;
      if (it.title) el.title = it.title;
      el.addEventListener("mouseenter", () => {
        selectedIdx = idx;
        listview.querySelectorAll(".rofi-media-item").forEach((n, i) =>
          n.classList.toggle("selected", i === selectedIdx)
        );
      });
      el.addEventListener("click", it.run);
      listview.appendChild(el);
    });

    main.append(msg, listview);
    win.appendChild(main);
    backdrop.appendChild(win);
  }

  function renderWallpaperPicker() {
    backdrop.classList.add("wallpaper-mode");
    const win = document.createElement("div");
    win.className = "rofi-window theme-wallpaper";

    const inputbar = document.createElement("div");
    inputbar.className = "rofi-wall-inputbar";
    const entry = document.createElement("input");
    entry.className = "rofi-wall-entry";
    entry.type = "text";
    entry.value = query;
    entry.placeholder = " Search wallpapers...";
    inputbar.appendChild(entry);

    const listview = document.createElement("div");
    listview.className = "rofi-wall-listview";

    const q = query.toLowerCase().trim();
    const items = state.allWallpapers.filter(
      (w) => w.name.toLowerCase().includes(q) || w.theme.toLowerCase().includes(q)
    );

    selectedIdx = Math.max(0, Math.min(selectedIdx, Math.max(0, items.length - 1)));
    items.forEach((w, idx) => {
      const card = document.createElement("div");
      card.className = `rofi-wall-item ${idx === selectedIdx ? "selected" : ""}`;
      card.innerHTML = `
        <img class="rofi-wall-thumb" src="${w.path}" alt="${w.name}" loading="lazy"/>
        <div class="rofi-wall-label">${w.name}</div>
        <div class="rofi-wall-theme-badge">${w.theme}</div>
      `;
      card.addEventListener("click", () => {
        applyWallpaper(w);
        close();
      });
      listview.appendChild(card);
    });

    entry.addEventListener("input", (e) => {
      query = e.target.value;
      selectedIdx = 0;
      render();
    });
    entry.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && items[selectedIdx]) {
        e.preventDefault();
        applyWallpaper(items[selectedIdx]);
        close();
      }
    });

    win.append(inputbar, listview);
    backdrop.appendChild(win);
    setTimeout(() => entry.focus(), 10);
  }

  function render() {
    if (!backdrop || !activeMode) return;
    backdrop.className = "";
    backdrop.innerHTML = "";

    if (activeMode === "drun") renderStyle5(false, "drun");
    else if (activeMode === "window") renderStyle5(true, "window");
    else if (activeMode === "clipboard") renderStyle5(true, "clipboard");
    else if (activeMode === "filebrowser") renderStyle5(false, "filebrowser");
    else if (activeMode === "emoji") renderLauncher1();
    else if (activeMode === "power-menu") renderPowerMenu(false);
    else if (activeMode === "battery-menu") renderPowerMenu(true);
    else if (activeMode === "media-player") renderMediaPlayerOrBluelight(false);
    else if (activeMode === "bluelight-menu") renderMediaPlayerOrBluelight(true);
    else if (activeMode === "wallpaper") renderWallpaperPicker();
  }

  backdrop?.addEventListener("mousedown", (e) => {
    if (e.target === backdrop) close();
  });

  window.addEventListener("keydown", (e) => {
    if (!activeMode) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      stepSelection(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      stepSelection(-1);
    } else if (e.key === "Enter" && currentItems[selectedIdx]) {
      e.preventDefault();
      currentItems[selectedIdx].run();
    }
  });

  window.RofiUI = {
    open,
    close,
    isOpen: () => Boolean(activeMode),
  };
})();
