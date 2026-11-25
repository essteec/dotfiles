// Hyprland Window Renderer + All Simulated/Dummy Apps + Real Spotify-titled Audio Player + Kitty + Btop

(function () {
  const {
    state,
    on,
    getMprisMetadata,
    getCoverArtUrl,
    mprisToggle,
    mprisNext,
    mprisPrev,
    mprisSetSong,
    mprisToggleShuffle,
    mprisCycleLoop,
    adjustVolume,
    setVolume,
    toggleMute,
    switchVolumeSink,
    applyWallpaper,
    notify,
  } = window.SimState;

  const {
    openWindow,
    closeWindow,
    focusWindow,
    toggleFloat,
    toggleFullscreen,
    swapTiledSlotByPoint,
  } = window.HyprCompositor;

  const stageEl = document.getElementById("hyprland-workspace");
  const windowNodes = new Map();

  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  // ── App Content Builders ─────────────────────────────────────────
  function buildSpotifyApp(bodyEl) {
    window.SimState.startMprisPlayer("spotify");
    bodyEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "player-app";

    const main = document.createElement("div");
    main.className = "player-app-main";

    const left = document.createElement("div");
    left.className = "player-now-playing";
    const cover = document.createElement("img");
    cover.className = "player-cover";
    const metaTitle = document.createElement("div");
    metaTitle.className = "player-meta-title";
    const metaArtist = document.createElement("div");
    metaArtist.className = "player-meta-artist";
    const sinkInfo = document.createElement("div");
    sinkInfo.style.cssText = "font-size:11px; color:#57d1ea; margin-top:auto; text-align:center;";
    left.append(cover, metaTitle, metaArtist, sinkInfo);

    const right = document.createElement("div");
    right.className = "player-playlist";
    const search = document.createElement("input");
    search.className = "player-search";
    search.type = "text";
    search.placeholder = `Search ${state.songs.length} local tracks in assets/songs/...`;

    const trackList = document.createElement("div");
    trackList.className = "player-track-list";
    right.append(search, trackList);

    main.append(left, right);

    const transport = document.createElement("div");
    transport.className = "player-transport-bar";

    const btns = document.createElement("div");
    btns.className = "player-transport-btns";
    const btnShuffle = document.createElement("button");
    const btnPrev = document.createElement("button");
    btnPrev.textContent = "󰒮";
    const btnPlay = document.createElement("button");
    btnPlay.className = "primary";
    const btnNext = document.createElement("button");
    btnNext.textContent = "󰒭";
    const btnLoop = document.createElement("button");

    btnShuffle.addEventListener("click", mprisToggleShuffle);
    btnPrev.addEventListener("click", mprisPrev);
    btnPlay.addEventListener("click", () => {
      state.mpris.players.spotify.running = true;
      state.mpris.activePlayerId = "spotify";
      mprisToggle("spotify");
    });
    btnNext.addEventListener("click", () => mprisNext(false));
    btnLoop.addEventListener("click", mprisCycleLoop);
    btns.append(btnShuffle, btnPrev, btnPlay, btnNext, btnLoop);

    const seekRow = document.createElement("div");
    seekRow.className = "player-seek-row";
    const curLbl = document.createElement("span");
    const seekRange = document.createElement("input");
    seekRange.type = "range";
    seekRange.min = 0;
    seekRange.max = 100;
    seekRange.className = "swaync-range";
    const durLbl = document.createElement("span");
    seekRow.append(curLbl, seekRange, durLbl);

    seekRange.addEventListener("input", (e) => {
      const sp = state.mpris.players.spotify;
      const targetSec = Math.floor((Number(e.target.value) / 100) * (sp.durationSec || 1));
      window.SimState.mprisSeek(targetSec - sp.positionSec);
    });

    transport.append(btns, seekRow);
    wrap.append(main, transport);
    bodyEl.appendChild(wrap);

    function renderTracks() {
      const q = search.value.toLowerCase().trim();
      const sp = state.mpris.players.spotify;
      trackList.innerHTML = "";
      state.songs.forEach((s, idx) => {
        if (q && !s.title.toLowerCase().includes(q) && !s.artist.toLowerCase().includes(q)) return;
        const row = document.createElement("div");
        row.className = `player-track-row ${idx === sp.songIndex ? "active" : ""}`;
        row.innerHTML = `<span>${idx + 1}. ${s.title}</span><span style="opacity:.7;font-size:11px;">${s.artist}</span>`;
        row.addEventListener("click", () => mprisSetSong(idx));
        trackList.appendChild(row);
      });
    }

    function syncPlayerUI() {
      const sp = state.mpris.players.spotify;
      const song = state.songs[sp.songIndex] || { title: "No Track", artist: "Unknown" };
      cover.src = getCoverArtUrl(song.title, song.artist);
      metaTitle.textContent = song.title;
      metaArtist.textContent = song.artist;
      sinkInfo.textContent = `Output: ${state.sinks[state.activeSinkIndex].name}`;

      btnPlay.textContent = sp.status === "Playing" ? "" : "";
      btnShuffle.textContent = sp.shuffle ? "" : "󰒞";
      btnShuffle.classList.toggle("active-state", sp.shuffle);

      btnLoop.textContent = sp.loop === "Track" ? "󰑘" : sp.loop === "Playlist" ? "󰑖" : "󰑗";
      btnLoop.classList.toggle("active-state", sp.loop !== "None");
      btnLoop.title = `Loop: ${sp.loop}`;

      curLbl.textContent = fmtTime(sp.positionSec);
      durLbl.textContent = fmtTime(sp.durationSec);
      seekRange.value = sp.durationSec > 0 ? Math.round((sp.positionSec / sp.durationSec) * 100) : 0;
      renderTracks();
    }

    search.addEventListener("input", renderTracks);
    const unsubs = [
      on("mpris:changed", syncPlayerUI),
      on("mpris:tick", () => {
        const sp = state.mpris.players.spotify;
        curLbl.textContent = fmtTime(sp.positionSec);
        durLbl.textContent = fmtTime(sp.durationSec);
        seekRange.value = sp.durationSec > 0 ? Math.round((sp.positionSec / sp.durationSec) * 100) : 0;
      }),
      on("audio:changed", syncPlayerUI),
    ];
    bodyEl._cleanup = () => unsubs.forEach((u) => u());
    syncPlayerUI();
  }

  function buildKittyApp(bodyEl, opts = {}) {
    bodyEl.innerHTML = "";
    const container = document.createElement("div");
    container.className = "kitty-container";

    // Tab bar matching home/.config/kitty/tab_bar.py
    const PALETTE = ["#b4befe", "#f5c2e7", "#cba6f7", "#89b4fa", "#89dceb"];
    const tabs = [
      { title: opts.tabTitle || "~", cwd: "~" },
      { title: "dotfiles", cwd: "~/Linux/dotfiles" },
    ];
    let activeTab = 0;

    const tabbar = document.createElement("div");
    tabbar.className = "kitty-tabbar";
    function drawTabs() {
      tabbar.innerHTML = `<div class="kitty-logo-badge">󰄛 Kitty</div>`;
      tabs.forEach((t, i) => {
        const tb = document.createElement("div");
        tb.className = `kitty-tab ${i === activeTab ? "active" : ""}`;
        tb.style.background = PALETTE[i % PALETTE.length];
        tb.textContent = `${i === activeTab ? "◉" : "◌"} ${i + 1}:${t.title}`;
        tb.addEventListener("click", () => {
          activeTab = i;
          drawTabs();
        });
        tabbar.appendChild(tb);
      });
    }
    drawTabs();

    const termBody = document.createElement("div");
    termBody.className = "kitty-terminal-body";
    const outputEl = document.createElement("div");
    termBody.appendChild(outputEl);

    const promptRow = document.createElement("div");
    promptRow.className = "kitty-prompt-line";
    promptRow.innerHTML = `<span class="p10k-seg-os"></span><span class="p10k-seg-dir">~/Linux/dotfiles</span><span class="p10k-seg-git"> main</span><span style="color:#97e023;">❯</span>`;
    const input = document.createElement("input");
    input.className = "kitty-cmd-input";
    input.type = "text";
    input.placeholder = "Type fastfetch, btop, nvtop, serie, hyprlock, ls, help...";
    promptRow.appendChild(input);
    termBody.appendChild(promptRow);

    function printBlock(htmlText) {
      const div = document.createElement("div");
      div.style.marginBottom = "8px";
      div.innerHTML = htmlText;
      outputEl.appendChild(div);
      termBody.scrollTop = termBody.scrollHeight;
    }

    function runCmd(raw) {
      const cmd = raw.trim();
      if (!cmd) return;
      printBlock(`<span style="color:#97e023;">❯</span> <span style="color:#f6f6e6;">${cmd.replace(/[<>&]/g, "")}</span>`);

      const lower = cmd.toLowerCase();
      if (lower === "clear") {
        outputEl.innerHTML = "";
      } else if (lower === "fastfetch") {
        printBlock(`<pre style="color:#57d1ea;line-height:1.3;">
       /\\        esstee@archlinux
      /  \\       -----------------
     /\\   \\      OS: Arch Linux x86_64
    /      \\     WM: Hyprland (lua:fibonacci)
   /   ,,   \\    Theme: Material-Black-Plum-BE
  /   |  |  -\\   Icons: Material-Black-Plum-Suru
 /_-''    ''-_\\  Terminal: kitty (Monokai Soda v2)
                 Shell: zsh + powerlevel10k
                 CPU: ${state.metrics.cpuPct}% @ ${state.metrics.cpuAvgFreq}GHz | Temp: ${state.metrics.tempC}°C
                 Mem: ${state.metrics.memUsedGiB}GiB / ${state.metrics.memTotalGiB}GiB (${state.metrics.memPct}%)
                 Battery: ${state.batteryCapacity}% [${state.tlpProfile}]</pre>`);
      } else if (lower === "btop") {
        launch("btop");
      } else if (lower === "nvtop") {
        launch("nvtop");
      } else if (lower === "htop") {
        launch("htop");
      } else if (lower === "serie") {
        launch("serie");
      } else if (lower === "hyprlock") {
        window.ScreensUI.lock();
      } else if (lower === "ls" || lower === "ll" || lower === "eza") {
        printBlock(`<span style="color:#42a7cf;">home/</span>  <span style="color:#42a7cf;">simulator/</span>  <span style="color:#97e023;">sync.sh</span>  <span style="color:#97e023;">diff-delta.sh</span>  <span style="color:#f6f6e6;">colors.md</span>  <span style="color:#f6f6e6;">README.md</span>`);
      } else if (lower.startsWith("cat ")) {
        printBlock(`<span style="color:#bababa;"># Previewing ${cmd.slice(4)} (Monokai Soda v2 dotfiles config)</span>\nhl.config({ general = { layout = "${window.HyprCompositor.getActiveLayoutName()}" } })`);
      } else if (lower === "help") {
        printBlock(`<span style="color:#dfd561;">Commands:</span> fastfetch, btop, nvtop, htop, serie, ls, eza, cat &lt;file&gt;, hyprlock, clear`);
      } else {
        printBlock(`<span style="color:#f3005f;">zsh:</span> command simulated: ${cmd}`);
      }
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const val = input.value;
        input.value = "";
        runCmd(val);
      }
    });

    termBody.addEventListener("click", () => input.focus());

    container.append(tabbar, termBody);
    bodyEl.appendChild(container);
    if (opts.initCmd) runCmd(opts.initCmd);
  }

  function buildBtopApp(bodyEl) {
    bodyEl.innerHTML = "";
    const ui = document.createElement("div");
    ui.className = "btop-ui";

    const top = document.createElement("div");
    top.className = "btop-topbar";
    const cpuBox = document.createElement("div");
    cpuBox.className = "btop-box";
    const procBox = document.createElement("div");
    procBox.className = "btop-box";
    const memBox = document.createElement("div");
    memBox.className = "btop-box";
    const netBox = document.createElement("div");
    netBox.className = "btop-box";

    ui.append(top, cpuBox, procBox, memBox, netBox);
    bodyEl.appendChild(ui);

    function draw() {
      const m = state.metrics;
      top.innerHTML = `<span>btop v1.4.7 — Monokai Soda v2</span><span>BAT ${state.batteryCapacity}% (${state.batteryWatts}W) | ${new Date().toLocaleTimeString()}</span>`;

      const barsHtml = m.cpuHistory
        .map((v) => {
          const color = v > 75 ? "#f3005f" : v > 45 ? "#dfd561" : "#97e023";
          return `<div class="btop-bar" style="height:${Math.max(8, v)}%;background:${color};"></div>`;
        })
        .join("");

      cpuBox.innerHTML = `
        <div class="btop-box-title"><span>┌ cpu (${m.cpuPct}%)</span><span style="color:#dfd561;">${m.cpuAvgFreq}GHz · ${m.tempC}°C</span></div>
        <div class="btop-bars">${barsHtml}</div>
      `;

      memBox.innerHTML = `
        <div class="btop-box-title"><span>┌ mem (${m.memPct}%)</span><span>${m.memUsedGiB} / ${m.memTotalGiB} GiB</span></div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px;">
          <div>Used: <span style="color:#f3005f;">${m.memUsedGiB} GiB</span></div>
          <div style="height:8px;background:#1a1a1a;border-radius:4px;overflow:hidden;"><div style="width:${m.memPct}%;height:100%;background:linear-gradient(90deg,#97e023,#dfd561,#f3005f);"></div></div>
          <div>Swap: <span style="color:#42a7cf;">${m.swapUsedGiB} / ${m.swapTotalGiB} GiB (${m.swapPct}%)</span></div>
        </div>
      `;

      netBox.innerHTML = `
        <div class="btop-box-title"><span>┌ net (wlp0s20f3)</span><span style="color:#57d1ea;">Connected</span></div>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
          <div>▼ Download: <span style="color:#b965f0;">${m.netDownKbps} KiB/s</span></div>
          <div>▲ Upload:   <span style="color:#00afff;">${m.netUpKbps} KiB/s</span></div>
          <div style="color:#6e6e6e;font-size:10.5px;">Net auto-rescale: on · Monokai Soda v2</div>
        </div>
      `;

      procBox.innerHTML = `
        <div class="btop-box-title"><span>┌ proc (mem sort)</span><span>${state.windows.length + 14} tasks</span></div>
        <table class="btop-proc-table">
          <thead><tr><th>PID</th><th>Program</th><th>CPU%</th><th>Mem</th></tr></thead>
          <tbody>
            <tr class="selected"><td>1042</td><td>Hyprland</td><td>${Math.max(2, Math.round(m.cpuPct * 0.25))}%</td><td>240M</td></tr>
            <tr><td>1388</td><td>waybar</td><td>1.2%</td><td>68M</td></tr>
            <tr><td>1412</td><td>swaync</td><td>0.4%</td><td>54M</td></tr>
            <tr><td>2104</td><td>spotify</td><td>2.1%</td><td>312M</td></tr>
            <tr><td>2319</td><td>kitty</td><td>0.8%</td><td>82M</td></tr>
          </tbody>
        </table>
      `;
    }

    const unsub = on("metrics:changed", draw);
    bodyEl._cleanup = unsub;
    draw();
  }

  function buildPavucontrolApp(bodyEl) {
    bodyEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "filler-app";

    function draw() {
      const sink = state.sinks[state.activeSinkIndex];
      wrap.innerHTML = `
        <div class="filler-card">
          <h4>Output Devices — PipeWire</h4>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span>Active: <strong style="color:#57d1ea;">${sink.name}</strong></span>
            <button class="filler-btn" id="pavu-switch">Switch Sink</button>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span>Master (${state.volume}%)</span>
            <input type="range" min="0" max="120" value="${state.volume}" class="swaync-range" id="pavu-master"/>
            <button class="filler-btn" id="pavu-mute">${state.muted ? "Unmute" : "Mute"}</button>
          </div>
        </div>
        <div class="filler-card">
          <h4>Playback Streams</h4>
          ${Object.entries(state.perAppVolumes)
            .map(
              ([name, val]) => `
            <div style="display:flex;align-items:center;gap:10px;margin:6px 0;">
              <span style="width:76px;">${name}</span>
              <input type="range" min="0" max="100" value="${val}" data-app="${name}" class="swaync-range pavu-app-range"/>
              <span style="width:36px;text-align:right;">${val}%</span>
            </div>`
            )
            .join("")}
        </div>
      `;

      wrap.querySelector("#pavu-switch").addEventListener("click", switchVolumeSink);
      wrap.querySelector("#pavu-mute").addEventListener("click", toggleMute);
      wrap.querySelector("#pavu-master").addEventListener("input", (e) => setVolume(Number(e.target.value)));
      wrap.querySelectorAll(".pavu-app-range").forEach((r) => {
        r.addEventListener("input", (e) => {
          state.perAppVolumes[e.target.dataset.app] = Number(e.target.value);
          window.SimState.updateAudioVolume();
        });
      });
    }

    const unsub = on("audio:changed", draw);
    bodyEl._cleanup = unsub;
    bodyEl.appendChild(wrap);
    draw();
  }

  function buildFillerApp(bodyEl, appId) {
    bodyEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "filler-app";

    if (appId === "nvidia-smi" || appId === "nvtop" || appId === "htop" || appId === "powertop") {
      wrap.style.background = "#000000";
      wrap.style.fontFamily = "var(--font-mono)";
      wrap.innerHTML = `
        <pre style="color:#97e023;">=================== THERMAL ZONES &amp; ${appId.toUpperCase()} ===================
x86_pkg_temp         ${state.metrics.tempC}°C
NVIDIA GPU           ${state.metrics.gpuTempC}°C (RTX Laptop GPU · 12W / 80W)
CPU Usage            ${state.metrics.cpuPct}% (${state.metrics.cpuAvgFreq} GHz / ${state.metrics.cpuMaxFreq} GHz)
Memory               ${state.metrics.memUsedGiB} GiB / ${state.metrics.memTotalGiB} GiB (${state.metrics.memPct}%)
TLP Profile          ${state.tlpProfile} (Charge limit: ${state.chargeThreshold}%)</pre>
      `;
    } else if (appId === "serie") {
      wrap.style.background = "#08080c";
      const commits = [
        ["*", "#f3005f", "a94c12e", "feat(simulator): Monokai Soda v2 desktop & waybar", "HEAD -> main"],
        ["*", "#97e023", "71e0b42", "style(swaync): transparent notification cards & purple accent", ""],
        ["*", "#dfd561", "482fa19", "feat(hypr): lua:fibonacci & lua:golden custom tiling layouts", ""],
        ["*", "#42a7cf", "19bc881", "chore(waybar): add sys-monitor and tray drawers", "origin/main"],
      ];
      wrap.innerHTML = `<div style="color:#97e023;font-weight:700;margin-bottom:6px;">serie — Rich Git Commit Graph</div>` +
        commits
          .map(
            ([sym, col, hash, msg, ref], idx) => `
          <div class="serie-row ${idx === 0 ? "selected" : ""}">
            <span style="color:${col};font-weight:700;">${sym}</span>
            <span style="color:#dfd561;">${hash}</span>
            <span style="color:#57d1ea;">${ref}</span>
            <span>${msg}</span>
          </div>`
          )
          .join("");
    } else if (appId === "thunar") {
      wrap.innerHTML = `
        <div class="filler-card">
          <h4>Thunar — ~/Pictures/Wallpapers/</h4>
          <div class="filler-grid">
            ${state.allWallpapers
              .map(
                (w) => `
              <button class="filler-btn" data-wall="${w.path}" style="text-align:left;display:flex;flex-direction:column;gap:4px;">
                <img src="${w.path}" style="width:100%;height:70px;object-fit:cover;border-radius:4px;"/>
                <span style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${w.name}</span>
              </button>`
              )
              .join("")}
          </div>
        </div>
      `;
      wrap.querySelectorAll("[data-wall]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const w = state.allWallpapers.find((x) => x.path === btn.dataset.wall);
          if (w) applyWallpaper(w);
        });
      });
    } else if (appId === "gnome-clocks" || appId === "thunderbird") {
      wrap.innerHTML = `
        <div class="filler-card">
          <h4>${appId === "gnome-clocks" ? "GNOME Clocks" : "Thunderbird Calendar"}</h4>
          <div style="font-size:28px;color:#f6f6e6;font-weight:700;">${new Date().toLocaleTimeString()}</div>
          <div style="color:#57d1ea;margin-top:4px;">${new Date().toDateString()}</div>
        </div>
      `;
    } else if (appId === "nwg-look" || appId === "kvantummanager" || appId === "qt6ct") {
      wrap.innerHTML = `
        <div class="filler-card">
          <h4>${appId}</h4>
          <p>GTK Theme: <strong>Material-Black-Plum-BE</strong></p>
          <p>Icon Theme: <strong>Material-Black-Plum-Suru</strong></p>
          <p>Kvantum Theme: <strong>Fluent-purple-dark</strong></p>
          <p>Cursor Theme: <strong>phinger-cursors-dark (24)</strong></p>
          <p>Font: <strong>Inter Medium 12 / JetBrainsMono Nerd Font</strong></p>
        </div>
      `;
    } else {
      const isMediaWeb = ["youtube", "twitch", "kick", "netflix", "primevideo", "firefox"].includes(appId);
      wrap.innerHTML = `
        <div class="filler-card">
          <h4>${appId}</h4>
          <p style="color:#bababa;line-height:1.5;">Dummy Hyprland window for <strong>${appId}</strong> (opacity: ${isMediaWeb ? "1.0 override" : "0.88 active"}).</p>
          ${
            isMediaWeb
              ? `<div style="margin-top:10px;display:flex;gap:8px;">
                  <button class="filler-btn" id="ff-mpris-play">Play / Toggle Browser MPRIS</button>
                 </div>`
              : ""
          }
        </div>
      `;
      const ffBtn = wrap.querySelector("#ff-mpris-play");
      if (ffBtn) {
        ffBtn.addEventListener("click", () => {
          state.mpris.players.firefox.running = true;
          state.mpris.players.firefox.title = `${appId.toUpperCase()} — Live Stream / Video`;
          state.mpris.activePlayerId = "firefox";
          mprisToggle("firefox");
        });
      }
    }

    bodyEl.appendChild(wrap);
  }

  // ── Window Launching Map ─────────────────────────────────────────
  function launch(appId, opts = {}) {
    const MAP = {
      kitty: { title: "kitty — zsh", className: "kitty", build: (b) => buildKittyApp(b, opts) },
      "kitty-float": { title: "kitty", className: "kitty-float", float: true, size: { w: 780, h: 420 }, build: (b) => buildKittyApp(b, opts) },
      spotify: { title: "Spotify", className: "Spotify", build: buildSpotifyApp },
      btop: { title: "kitty -e btop", className: "kitty", build: buildBtopApp },
      nvtop: { title: "kitty -e nvtop", className: "kitty", build: (b) => buildFillerApp(b, "nvtop") },
      htop: { title: "kitty -e htop", className: "kitty", build: (b) => buildFillerApp(b, "htop") },
      powertop: { title: "kitty -e powertop", className: "kitty", build: (b) => buildFillerApp(b, "powertop") },
      "nvidia-smi": { title: "kitty -e my-nvidia-smi.sh", className: "kitty", build: (b) => buildFillerApp(b, "nvidia-smi") },
      serie: { title: "kitty -e serie", className: "kitty", build: (b) => buildFillerApp(b, "serie") },
      pavucontrol: { title: "Volume Control", className: "pavucontrol", build: buildPavucontrolApp },
      thunar: { title: "Wallpapers - Thunar", className: "Thunar", build: (b) => buildFillerApp(b, "thunar") },
      "gnome-clocks": { title: "Clocks", className: "gnome-clocks", build: (b) => buildFillerApp(b, "gnome-clocks") },
      thunderbird: { title: "Calendar - Mozilla Thunderbird", className: "thunderbird", build: (b) => buildFillerApp(b, "thunderbird") },
      missioncenter: { title: "Mission Center", className: "missioncenter", build: buildBtopApp },
      "nwg-look": { title: "GTK Settings (nwg-look)", className: "nwg-look", build: (b) => buildFillerApp(b, "nwg-look") },
      kvantummanager: { title: "Kvantum Manager", className: "kvantummanager", build: (b) => buildFillerApp(b, "kvantummanager") },
      qt6ct: { title: "Qt6 Configuration Tool", className: "qt6ct", build: (b) => buildFillerApp(b, "qt6ct") },
      "blueman-manager": { title: "Bluetooth Devices", className: "blueman-manager", build: (b) => buildFillerApp(b, "blueman-manager") },
      "nm-connection-editor": { title: "Network Connections", className: "nm-connection-editor", build: (b) => buildFillerApp(b, "nm-connection-editor") },
      easyeffects: { title: "EasyEffects", className: "easyeffects", build: buildPavucontrolApp },
      kdeconnect: { title: "KDE Connect Indicator", className: "kdeconnect", build: (b) => buildFillerApp(b, "kdeconnect") },
      firefox: { title: "Mozilla Firefox", className: "firefox", build: (b) => buildFillerApp(b, "firefox") },
      youtube: { title: "YouTube", className: "chrome-youtube.com__-Default", build: (b) => buildFillerApp(b, "youtube") },
      kick: { title: "Kick", className: "chrome-kick.com__-Default", build: (b) => buildFillerApp(b, "kick") },
      netflix: { title: "Netflix", className: "chrome-netflix.com__browse-Default", build: (b) => buildFillerApp(b, "netflix") },
      primevideo: { title: "Prime Video", className: "chrome-primevideo.com__tv-Default", build: (b) => buildFillerApp(b, "primevideo") },
      twitch: { title: "Twitch", className: "chrome-twitch.tv__-Default", build: (b) => buildFillerApp(b, "twitch") },
    };

    const spec = MAP[appId] || { title: appId, className: appId, build: (b) => buildFillerApp(b, appId) };
    const win = openWindow({
      appId,
      title: opts.title || spec.title,
      className: spec.className,
      float: opts.float ?? spec.float ?? null,
      size: opts.size ?? spec.size ?? null,
      data: { build: spec.build },
    });
    return win;
  }

  // ── DOM Window Synchronization ─────────────────────────────────────
  function renderWindows() {
    if (!stageEl) return;
    const currentWs = state.activeSpecial ? `special:${state.activeSpecial}` : state.activeWorkspace;
    const liveIds = new Set(state.windows.map((w) => w.id));

    // Remove closed windows
    for (const [id, node] of windowNodes.entries()) {
      if (!liveIds.has(id)) {
        const body = node.querySelector(".hypr-win-body");
        body?._cleanup?.();
        node.remove();
        windowNodes.delete(id);
      }
    }

    for (const win of state.windows) {
      let node = windowNodes.get(win.id);
      if (!node) {
        node = document.createElement("div");
        node.className = "hypr-window";
        if (win.className.startsWith("kitty")) node.classList.add("kitty-window");

        const header = document.createElement("div");
        header.className = "hypr-win-header";
        header.innerHTML = `
          <span class="hypr-win-title">${win.title}</span>
          <div class="hypr-win-controls">
            <button class="hypr-win-btn float-btn" title="Toggle Float (Super+Shift+Space)"></button>
            <button class="hypr-win-btn fs-btn" title="Fullscreen (Super+F)"></button>
            <button class="hypr-win-btn close" title="Close (Super+Q)">✕</button>
          </div>
        `;

        const body = document.createElement("div");
        body.className = "hypr-win-body";
        win.data.build?.(body);

        header.querySelector(".float-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFloat(win.id);
        });
        header.querySelector(".fs-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFullscreen(win.id);
        });
        header.querySelector(".close").addEventListener("click", (e) => {
          e.stopPropagation();
          closeWindow(win.id);
        });

        node.addEventListener("mousedown", () => focusWindow(win.id));

        // Dragging: moves floating window, or swaps fibonacci slot if tiled
        header.addEventListener("mousedown", (e) => {
          if (e.target.closest("button") || win.fullscreen) return;
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const origRect = { ...win.rect };

          function onMove(mv) {
            const dx = mv.clientX - startX;
            const dy = mv.clientY - startY;
            if (win.floating) {
              win.rect.x = Math.max(0, origRect.x + dx);
              win.rect.y = Math.max(0, origRect.y + dy);
              win.floatRect = { ...win.rect };
              node.style.left = `${win.rect.x}px`;
              node.style.top = `${win.rect.y}px`;
            } else {
              node.style.transform = `translate(${dx}px, ${dy}px)`;
              node.style.zIndex = "250";
            }
          }

          function onUp(up) {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            if (!win.floating) {
              node.style.transform = "";
              node.style.zIndex = "";
              if (Math.hypot(up.clientX - startX, up.clientY - startY) > 28) {
                swapTiledSlotByPoint(win.id, up.clientX, up.clientY);
              }
            }
          }

          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        });

        node.append(header, body);
        stageEl.appendChild(node);
        windowNodes.set(win.id, node);
      }

      const visible = win.workspace === currentWs;
      node.style.display = visible ? "flex" : "none";
      if (!visible) continue;

      node.classList.toggle("active", state.activeWindowId === win.id);
      node.classList.toggle("floating", win.floating);
      node.classList.toggle("fullscreen", win.fullscreen);
      node.classList.toggle("opacity-override", win.opacityOverride);
      node.classList.toggle("special-win", typeof win.workspace === "string" && win.workspace.startsWith("special:"));
      node.classList.toggle("no-anim", !state.animationsEnabled);

      node.style.left = `${win.rect.x}px`;
      node.style.top = `${win.rect.y}px`;
      node.style.width = `${win.rect.w}px`;
      node.style.height = `${win.rect.h}px`;
    }
  }

  on("windows:render", renderWindows);
  on("windows:changed", renderWindows);
  on("hypr:changed", renderWindows);

  window.AppLauncher = { launch };
})();
