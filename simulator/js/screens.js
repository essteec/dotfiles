// Hyprlock Screen + Wallpaper/Hyprsunset/Brightness Rendering + Power Action Overlay

(function () {
  const {
    state,
    on,
    getActiveMprisPlayer,
    getMprisMetadata,
    mprisToggle,
    mprisNext,
    mprisPrev,
    mprisToggleShuffle,
    switchTargetPlayer,
  } = window.SimState;

  const lockEl = document.getElementById("hyprlock-screen");
  const wallEl = document.getElementById("desktop-wallpaper");
  const sunsetEl = document.getElementById("hyprsunset-overlay");
  const pwrOverlay = document.getElementById("power-action-overlay");

  function updateWallpaperAndFilters() {
    if (wallEl && state.currentWallpaper?.path) {
      wallEl.style.backgroundImage = `url("${state.currentWallpaper.path}")`;
    }

    // Apply brightness + hyprsunset gamma & temperature tint
    const brightFactor = (0.35 + (state.brightness / 100) * 0.65) * (state.gamma / 100);
    const desktopRoot = document.getElementById("desktop-root");
    if (desktopRoot) {
      desktopRoot.style.filter = `brightness(${brightFactor.toFixed(2)})`;
    }

    if (sunsetEl) {
      if (state.temperature < 6000) {
        const warmth = Math.min(1, (6000 - state.temperature) / 4500);
        sunsetEl.style.background = `rgba(255, ${Math.round(190 - warmth * 60)}, ${Math.round(120 - warmth * 110)}, ${(warmth * 0.42).toFixed(2)})`;
      } else if (state.temperature > 6000) {
        const cool = Math.min(1, (state.temperature - 6000) / 4000);
        sunsetEl.style.background = `rgba(170, 210, 255, ${(cool * 0.25).toFixed(2)})`;
      } else {
        sunsetEl.style.background = "transparent";
      }
    }
  }

  // Exact battery-status.sh formatter for Hyprlock top-right
  function formatBatteryStatus() {
    const cap = state.batteryCapacity;
    const idx = Math.min(10, Math.floor(cap / 9));
    const batIcons = ["󱃍", "󰁺", "󰁻", "󰁼", "󰁽", "󰁾", "󰁿", "󰂀", "󰂁", "󰂂", "󰁹"];
    const chgIcons = ["󰢟", "󰢜", "󰂆", "󰂇", "󰂈", "󰢝", "󰢝", "󰢞", "󰂊", "󰂋", "󰂅"];
    const icon = state.batteryStatus === "Full" ? "" : state.batteryStatus === "Charging" ? chgIcons[idx] : batIcons[idx];
    return `${cap}% ${icon}`;
  }

  // Exact player_icon() from music.sh
  function getPlayerIconHtml(playerName) {
    const n = (playerName || "").toLowerCase();
    if (n.startsWith("spotify")) return `<span style="color:#1DB954;">󰓇</span>`;
    if (n.startsWith("firefox")) return `<span style="color:#331E54;">󰈹</span>`;
    if (n.startsWith("vlc")) return `<span style="color:#F48200;">󰕼</span>`;
    if (n.includes("youtube")) return `<span style="color:#CD201F;">󰗃</span>`;
    if (n.startsWith("chrom")) return `<span style="color:#699dd3;">󰊯</span>`;
    if (n.startsWith("mpv") || n.startsWith("haruna")) return `<span style="color:#C1B7B0;"></span>`;
    return `<span style="color:#613583;">󰎇</span>`;
  }

  // Exact music_progress() from music.sh (BAR_LENGTH=10, TRACK_CHAR="—", HANDLE="⦿")
  function buildProgressHtml(posSec, durSec) {
    const fmt = (s) => {
      s = Math.max(0, Math.floor(s || 0));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const r = s % 60;
      return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
    };
    if (!durSec || durSec <= 0) return fmt(posSec);
    const pos = Math.min(posSec, durSec);
    const filled = Math.floor((pos * 10) / durSec);
    const played = "—".repeat(filled);
    const rest = "—".repeat(10 - filled);
    return `<span style="color:#1DB954;">${played}</span><span style="color:#FFFFFF;">⦿</span><span style="color:rgba(255,255,255,0.25);">${rest}</span> ${fmt(pos)} / ${fmt(durSec)}`;
  }

  function renderHyprlock() {
    if (!lockEl || !state.locked) return;
    lockEl.innerHTML = "";

    const bg = document.createElement("div");
    bg.className = "hyprlock-bg";
    if (state.currentWallpaper?.path) {
      bg.style.backgroundImage = `url("${state.currentWallpaper.path}")`;
    }

    const layoutBtn = document.createElement("div");
    layoutBtn.className = "hyprlock-top-left";
    layoutBtn.textContent = `Layout: ${state.kbLayouts[state.kbLayoutIndex]}`;
    layoutBtn.title = "Click to switch xkb layout";
    layoutBtn.addEventListener("click", () => {
      state.kbLayoutIndex = (state.kbLayoutIndex + 1) % state.kbLayouts.length;
      layoutBtn.textContent = `Layout: ${state.kbLayouts[state.kbLayoutIndex]}`;
    });

    const batEl = document.createElement("div");
    batEl.className = "hyprlock-top-right";
    batEl.textContent = formatBatteryStatus();

    const stage = document.createElement("div");
    stage.className = "hyprlock-center-stage";

    // Date & Time
    const clockBlock = document.createElement("div");
    clockBlock.className = "hyprlock-clock-block";
    const dateEl = document.createElement("div");
    dateEl.className = "hyprlock-date";
    const timeEl = document.createElement("div");
    timeEl.className = "hyprlock-time";

    function updateClock() {
      const now = new Date();
      dateEl.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      timeEl.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }
    updateClock();
    clockBlock.append(dateEl, timeEl);

    // Media Section
    const mediaWrap = document.createElement("div");
    mediaWrap.className = "hyprlock-media-wrap";

    const blurImg = document.createElement("img");
    blurImg.className = "hyprlock-album-blur";
    const mainImg = document.createElement("img");
    mainImg.className = "hyprlock-album-main";
    const titleEl = document.createElement("div");
    titleEl.className = "hyprlock-track-title";
    const artistEl = document.createElement("div");
    artistEl.className = "hyprlock-track-artist";
    const ctrls = document.createElement("div");
    ctrls.className = "hyprlock-controls";
    const progEl = document.createElement("div");
    progEl.className = "hyprlock-progress";

    function updateMedia() {
      const player = getActiveMprisPlayer();
      const meta = getMprisMetadata(player);
      ctrls.innerHTML = "";

      if (!player || !meta) {
        blurImg.style.display = "none";
        mainImg.style.display = "none";
        titleEl.textContent = "";
        artistEl.textContent = "";
        progEl.innerHTML = "";

        const launchBtn = document.createElement("button");
        launchBtn.className = "hyprlock-ctrl-btn play-btn";
        launchBtn.textContent = "󰓇";
        launchBtn.title = "Launch Spotify player";
        launchBtn.addEventListener("click", () => {
          state.mpris.players.spotify.running = true;
          state.mpris.activePlayerId = "spotify";
          mprisToggle("spotify");
        });
        ctrls.appendChild(launchBtn);
        return;
      }

      blurImg.style.display = "block";
      mainImg.style.display = "block";
      blurImg.src = meta.artUrl;
      mainImg.src = meta.artUrl;
      const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
      titleEl.textContent = trunc(meta.cleanTitle, 28);
      artistEl.textContent = trunc(meta.artist, 30);

      const switchBtn = document.createElement("button");
      switchBtn.className = "hyprlock-ctrl-btn";
      switchBtn.innerHTML = getPlayerIconHtml(meta.playerName);
      switchBtn.title = "Switch player (music.sh --do switch)";
      switchBtn.addEventListener("click", () => {
        switchTargetPlayer();
        updateMedia();
      });

      const prevBtn = document.createElement("button");
      prevBtn.className = "hyprlock-ctrl-btn";
      prevBtn.textContent = "󰒮";
      prevBtn.addEventListener("click", mprisPrev);

      const playBtn = document.createElement("button");
      playBtn.className = "hyprlock-ctrl-btn play-btn";
      playBtn.textContent = meta.status === "Playing" ? "" : "";
      playBtn.addEventListener("click", () => mprisToggle());

      const nextBtn = document.createElement("button");
      nextBtn.className = "hyprlock-ctrl-btn";
      nextBtn.textContent = "󰒭";
      nextBtn.addEventListener("click", () => mprisNext(false));

      const shufBtn = document.createElement("button");
      shufBtn.className = "hyprlock-ctrl-btn";
      shufBtn.textContent = meta.shuffle ? "" : "󰒞";
      shufBtn.addEventListener("click", mprisToggleShuffle);

      ctrls.append(switchBtn, prevBtn, playBtn, nextBtn, shufBtn);
      progEl.innerHTML = buildProgressHtml(meta.positionSec, meta.durationSec);
    }

    updateMedia();
    mediaWrap.append(blurImg, mainImg, titleEl, artistEl, ctrls, progEl);

    // Input Field
    const inputWrap = document.createElement("div");
    inputWrap.className = "hyprlock-input-wrap";
    const input = document.createElement("input");
    input.type = "password";
    input.className = "hyprlock-input";
    input.placeholder = "Enter the password ";
    input.title = "Type any password and press Enter to unlock";
    inputWrap.appendChild(input);

    input.addEventListener("keydown", (e) => {
      if (e.getModifierState && e.getModifierState("CapsLock")) {
        input.classList.add("capslock");
      } else {
        input.classList.remove("capslock");
      }
      if (e.key === "Enter") {
        if (!input.value) return; // ignore_empty_input = true
        input.classList.add("checking");
        setTimeout(() => unlock(), 180);
      }
    });

    stage.append(clockBlock, mediaWrap, inputWrap);
    lockEl.append(bg, layoutBtn, batEl, stage);

    const unsubs = [
      on("mpris:changed", updateMedia),
      on("mpris:tick", () => {
        const meta = getMprisMetadata();
        if (meta) progEl.innerHTML = buildProgressHtml(meta.positionSec, meta.durationSec);
      }),
      on("power:changed", () => {
        batEl.textContent = formatBatteryStatus();
      }),
    ];
    const clkTimer = setInterval(updateClock, 10000);
    lockEl._cleanup = () => {
      unsubs.forEach((u) => u());
      clearInterval(clkTimer);
    };

    setTimeout(() => input.focus(), 20);
  }

  function lock() {
    window.RofiUI?.close();
    window.SwayNC?.toggleControlCenter(false);
    state.locked = true;
    lockEl?.classList.remove("hidden");
    renderHyprlock();
  }

  function unlock() {
    lockEl?._cleanup?.();
    state.locked = false;
    lockEl?.classList.add("hidden");
    if (lockEl) lockEl.innerHTML = "";
  }

  function showPowerOverlay(title, cmd) {
    if (!pwrOverlay) return;
    pwrOverlay.classList.remove("hidden");
    pwrOverlay.innerHTML = `
      <div style="font-size:34px;color:#b965f0;"></div>
      <div style="font-weight:700;">${title}</div>
      <div style="font-size:12.5px;color:#bababa;">Executed: <code>${cmd}</code></div>
      <button class="filler-btn" id="pwr-resume-btn" style="margin-top:12px;">Boot / Resume Desktop</button>
    `;
    pwrOverlay.querySelector("#pwr-resume-btn").addEventListener("click", () => {
      pwrOverlay.classList.add("hidden");
    });
  }

  on("wallpaper:changed", updateWallpaperAndFilters);
  on("display:changed", updateWallpaperAndFilters);

  window.ScreensUI = {
    init: updateWallpaperAndFilters,
    lock,
    unlock,
    showPowerOverlay,
  };
})();
