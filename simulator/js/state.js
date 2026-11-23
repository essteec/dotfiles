// Central reactive state store + real audio MPRIS engine + wallpaper/script actions

(function () {
  const listeners = new Map();

  function on(evt, fn) {
    if (!listeners.has(evt)) listeners.set(evt, new Set());
    listeners.get(evt).add(fn);
    return () => listeners.get(evt)?.delete(fn);
  }

  function emit(evt, data) {
    if (listeners.has(evt)) {
      listeners.get(evt).forEach((fn) => fn(data));
    }
    if (evt !== "*") {
      listeners.get("*")?.forEach((fn) => fn({ evt, data }));
    }
  }

  const manifest = window.ASSET_MANIFEST || { wallpaperThemes: [], songs: [], icons: [] };
  const allWallpapers = manifest.wallpaperThemes.flatMap((t) => t.wallpapers);

  // Pick a clean default wallpaper from the user's copied bg/ folders
  const defaultWall =
    allWallpapers.find((w) => w.path.includes("black-arch")) ||
    allWallpapers.find((w) => w.path.includes("dark-smoke")) ||
    allWallpapers[0] || { name: "default", theme: "arch", path: "" };

  const defaultThemeIdx = Math.max(
    0,
    manifest.wallpaperThemes.findIndex((t) => t.name === defaultWall.theme)
  );

  // Real HTML5 audio element for Spotify-titled player
  const audio = new Audio();
  audio.preload = "metadata";

  // Procedural deterministic cover art generator (unique colors & waveform per song)
  const coverCache = new Map();
  function getCoverArtUrl(title, artist) {
    const key = `${artist} - ${title}`;
    if (coverCache.has(key)) return coverCache.get(key);

    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const palette = [
      ["#9f34d7", "#f3005f", "#181825"],
      ["#0f7fcf", "#57d1ea", "#11111b"],
      ["#97e023", "#42a7cf", "#121212"],
      ["#b965f0", "#e6be00", "#1a0a2e"],
      ["#f3005f", "#42a7cf", "#121218"],
      ["#00afff", "#9f34d7", "#14141c"],
    ];
    const [c1, c2, bg] = palette[Math.abs(hash) % palette.length];
    const initials = (artist || "M")
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() || "")
      .join("");
    const angle = Math.abs(hash % 360);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle} .5 .5)">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="55%" stop-color="${c2}"/>
          <stop offset="100%" stop-color="${bg}"/>
        </linearGradient>
      </defs>
      <rect width="320" height="320" fill="url(#g)"/>
      <circle cx="160" cy="160" r="108" fill="rgba(12,12,18,0.55)" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
      <circle cx="160" cy="160" r="32" fill="rgba(12,12,18,0.85)" stroke="${c1}" stroke-width="3"/>
      <text x="160" y="172" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="38" fill="rgba(246,246,230,0.88)">${initials}</text>
      <text x="160" y="294" text-anchor="middle" font-family="monospace" font-size="13" fill="rgba(246,246,230,0.75)">${(artist || "").slice(0, 28).replace(/[<>&]/g, "")}</text>
    </svg>`;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    coverCache.set(key, url);
    return url;
  }

  // Port of clean_title() from music.sh / current-song.sh
  function cleanTitle(raw) {
    if (!raw) return "";
    const cleaned = raw
      .replace(/\s*[-|–]*\s*\(?official music video\)?/gi, "")
      .replace(/\s*[-|–]*\s*\(?official video\)?/gi, "")
      .replace(/\s*[-|–]*\s*\(?lyrics\)?/gi, "")
      .replace(/\s*[-|–]*\s*\(?\bHD\b\)?/gi, "")
      .replace(/\s*\[[^\]]*\]/g, "")
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    return cleaned || raw;
  }

  const initialSongIndex = Math.max(
    0,
    manifest.songs.findIndex((s) => s.filename.includes("Riders On The Storm"))
  );

  const state = {
    startedAt: Date.now(),
    // Wallpapers (get-wallpaper-path.sh)
    wallpaperThemes: manifest.wallpaperThemes,
    allWallpapers,
    currentThemeIndex: defaultThemeIdx,
    currentWallpaper: defaultWall,

    // Hyprland compositor
    activeWorkspace: 1,
    previousWorkspace: 2,
    activeSpecial: null, // null | 'magic' | 'scratchpad'
    workspaceLayouts: {
      1: "lua:fibonacci",
      2: "lua:fibonacci",
      3: "lua:fibonacci",
      4: "lua:fibonacci",
    },
    windows: [],
    activeWindowId: null,
    nextWinSeq: 1,
    submap: null, // null | 'layout' | 'resize'
    animationsEnabled: true,
    touchpadEnabled: true,
    refreshRate: 144,
    kbLayouts: ["en", "tr"],
    kbLayoutIndex: 0,
    locked: false,

    // Waybar UI toggles
    windowTitleAlt: false,
    clockAlt: false,
    trayOpen: false,
    sysMonOpen: false,

    // Audio / PipeWire (volume-control.sh & switch-volume-sink.sh)
    volume: 65,
    muted: false,
    micMuted: false,
    sinks: [
      { name: "Built-in Audio Speakers", icon: "audio-speakers" },
      { name: "Built-in Audio Headphones", icon: "audio-headphones" },
      { name: "HDMI / DisplayPort Audio", icon: "video-display" },
      { name: "JBL Go 4 (Bluetooth)", icon: "bluetooth" },
    ],
    activeSinkIndex: 0,
    perAppVolumes: {
      Spotify: 85,
      Firefox: 75,
      MPV: 90,
    },

    // Display & Hyprsunset (brightness-control.sh & bluelight-menu.sh)
    brightness: 82,
    temperature: 6000,
    gamma: 100,

    // Battery & Power (battery-menu.sh & toggle-idle.sh)
    batteryCapacity: 84,
    batteryStatus: "Discharging", // 'Discharging' | 'Charging' | 'Full'
    batteryWatts: 12,
    tlpProfile: "balanced", // 'performance' | 'balanced' | 'power-saver'
    chargeThreshold: 80, // 60 | 80 | 100
    idleAwake: false, // false => hypridle running; true => awake/caffeine on

    // System monitors (Waybar temp/cpu/memory + btop)
    metrics: {
      tempC: 48,
      gpuTempC: 44,
      cpuPct: 14,
      cpuAvgFreq: 3.42,
      cpuMaxFreq: 4.8,
      memPct: 32,
      memUsedGiB: 5.1,
      memTotalGiB: 15.6,
      swapPct: 4,
      swapUsedGiB: 0.3,
      swapTotalGiB: 8.0,
      cpuHistory: Array.from({ length: 30 }, () => 10 + Math.random() * 20),
      netDownKbps: 420,
      netUpKbps: 64,
    },

    // MPRIS & Spotify-titled Audio Player
    songs: manifest.songs,
    mpris: {
      players: {
        spotify: {
          id: "spotify",
          name: "spotify",
          running: false,
          status: "Paused", // 'Playing' | 'Paused' | 'Stopped'
          songIndex: initialSongIndex,
          positionSec: 42,
          durationSec: 222,
          shuffle: false,
          loop: "Playlist", // 'None' | 'Playlist' | 'Track'
        },
        firefox: {
          id: "firefox",
          name: "firefox",
          running: false,
          status: "Paused",
          title: "Arch Linux Hyprland Workflow Showcase (4K)",
          artist: "YouTube",
          album: "Browser Media",
          positionSec: 85,
          durationSec: 612,
          shuffle: false,
          loop: "None",
        },
      },
      activePlayerId: "spotify",
    },

    // SwayNC & Notifications
    dnd: false,
    swayncOpen: false,
    notifications: [
      {
        id: 1,
        syncId: null,
        appName: "Hyprland",
        summary: "Session Started",
        body: "Monokai Soda v2 environment loaded (lua:fibonacci)",
        icon: "assets/icons/avatar-default.svg",
        urgency: "normal",
        timestamp: Date.now() - 45000,
      },
    ],
    toasts: [],
    nextNotifId: 10,

    // Clipboard history (cliphist)
    cliphist: [
      "hyprctl dispatch layoutmsg rotate",
      "kitty --hold sh -c fastfetch",
      "https://wiki.hypr.land/Configuring/Start/",
      "notify-send -a System 'Hello Arch'",
      "sudo pacman -Syu",
    ],
  };

  function getActiveMprisPlayer() {
    const runningIds = Object.values(state.mpris.players)
      .filter((p) => p.running)
      .map((p) => p.id);
    if (runningIds.length === 0) return null;
    if (!runningIds.includes(state.mpris.activePlayerId)) {
      state.mpris.activePlayerId = runningIds[0];
    }
    return state.mpris.players[state.mpris.activePlayerId];
  }

  function getMprisMetadata(player = getActiveMprisPlayer()) {
    if (!player) return null;
    if (player.id === "spotify") {
      const song = state.songs[player.songIndex] || {
        artist: "Snoop Dogg",
        title: "Riders On The Storm",
        file: "",
      };
      return {
        playerId: "spotify",
        playerName: "spotify",
        status: player.status,
        rawTitle: song.title,
        cleanTitle: cleanTitle(song.title),
        artist: song.artist,
        album: "Desktop Music Library",
        positionSec: player.positionSec,
        durationSec: player.durationSec,
        shuffle: player.shuffle,
        loop: player.loop,
        artUrl: getCoverArtUrl(song.title, song.artist),
        file: song.file,
      };
    }
    return {
      playerId: player.id,
      playerName: player.name,
      status: player.status,
      rawTitle: player.title,
      cleanTitle: cleanTitle(player.title),
      artist: player.artist,
      album: player.album,
      positionSec: player.positionSec,
      durationSec: player.durationSec,
      shuffle: player.shuffle,
      loop: player.loop,
      artUrl: getCoverArtUrl(player.title, player.artist),
      file: "",
    };
  }

  // Audio playback sync
  let audioAvailable = true;

  function handleTrackEnded() {
    const sp = state.mpris.players.spotify;
    if (sp.loop === "Track") {
      sp.positionSec = 0;
      if (audioAvailable) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      emit("mpris:tick", getMprisMetadata());
    } else if (sp.loop === "Playlist" || sp.shuffle) {
      mprisNext(true);
    } else if (sp.songIndex < state.songs.length - 1) {
      mprisNext(true);
    } else {
      sp.status = "Paused";
      emit("mpris:changed", getMprisMetadata());
    }
  }

  function syncAudioSource(autoplay = false) {
    const sp = state.mpris.players.spotify;
    const song = state.songs[sp.songIndex];
    if (!song) return;
    if (audio.dataset.src !== song.file) {
      audioAvailable = true;
      audio.src = song.file;
      audio.dataset.src = song.file;
      sp.positionSec = 0;
    }
    const effectiveVol = state.muted
      ? 0
      : Math.min(1, (state.volume / 100) * (state.perAppVolumes.Spotify / 100));
    audio.volume = effectiveVol;
    if (autoplay && sp.running) {
      sp.status = "Playing";
      audio.play().catch(() => {
        // Fallback to timer tick when audio files are omitted (e.g. hosted demo)
      });
    }
    emit("mpris:changed", getMprisMetadata());
  }

  audio.addEventListener("loadedmetadata", () => {
    audioAvailable = true;
    const sp = state.mpris.players.spotify;
    if (isFinite(audio.duration) && audio.duration > 0) {
      sp.durationSec = Math.floor(audio.duration);
      emit("mpris:tick", getMprisMetadata());
    }
  });

  audio.addEventListener("error", () => {
    audioAvailable = false;
  });

  audio.addEventListener("timeupdate", () => {
    const sp = state.mpris.players.spotify;
    sp.positionSec = Math.floor(audio.currentTime || 0);
    if (isFinite(audio.duration) && audio.duration > 0) {
      sp.durationSec = Math.floor(audio.duration);
    }
    emit("mpris:tick", getMprisMetadata());
  });

  audio.addEventListener("ended", handleTrackEnded);

  // Fallback timer when local MP3 files are not hosted (e.g. GitHub Pages demo)
  setInterval(() => {
    const sp = state.mpris.players.spotify;
    if (!sp.running || sp.status !== "Playing" || audioAvailable) return;
    sp.positionSec += 1;
    if (sp.positionSec >= (sp.durationSec || 222)) {
      handleTrackEnded();
    } else {
      emit("mpris:tick", getMprisMetadata());
    }
  }, 1000);

  function updateAudioVolume() {
    const effectiveVol = state.muted
      ? 0
      : Math.min(1, (state.volume / 100) * (state.perAppVolumes.Spotify / 100));
    audio.volume = effectiveVol;
  }

  function mprisToggle(targetId = null) {
    const p = targetId ? state.mpris.players[targetId] : getActiveMprisPlayer();
    if (!p || !p.running) return;
    if (p.status === "Playing") {
      p.status = "Paused";
      if (p.id === "spotify") audio.pause();
    } else {
      p.status = "Playing";
      if (p.id === "spotify") {
        syncAudioSource(true);
      }
    }
    emit("mpris:changed", getMprisMetadata());
  }

  function mprisNext(forcePlay = false) {
    const p = getActiveMprisPlayer();
    if (!p) return;
    if (p.id === "spotify") {
      const wasPlaying = forcePlay || p.status === "Playing";
      if (p.shuffle && state.songs.length > 1) {
        let nextIdx = p.songIndex;
        while (nextIdx === p.songIndex) {
          nextIdx = Math.floor(Math.random() * state.songs.length);
        }
        p.songIndex = nextIdx;
      } else {
        p.songIndex = (p.songIndex + 1) % state.songs.length;
      }
      p.positionSec = 0;
      if (wasPlaying) p.status = "Playing";
      syncAudioSource(wasPlaying);
    } else {
      p.positionSec = 0;
      emit("mpris:changed", getMprisMetadata());
    }
  }

  function mprisPrev() {
    const p = getActiveMprisPlayer();
    if (!p) return;
    if (p.id === "spotify") {
      const wasPlaying = p.status === "Playing";
      if (p.positionSec > 4) {
        p.positionSec = 0;
        audio.currentTime = 0;
      } else {
        p.songIndex = (p.songIndex - 1 + state.songs.length) % state.songs.length;
        p.positionSec = 0;
      }
      syncAudioSource(wasPlaying);
    } else {
      p.positionSec = 0;
      emit("mpris:changed", getMprisMetadata());
    }
  }

  function mprisSeek(deltaSec) {
    const p = getActiveMprisPlayer();
    if (!p) return;
    const nextPos = Math.max(0, Math.min(p.durationSec || 220, p.positionSec + deltaSec));
    p.positionSec = nextPos;
    if (p.id === "spotify" && audio.readyState >= 1) {
      audio.currentTime = nextPos;
    }
    emit("mpris:tick", getMprisMetadata());
  }

  function mprisSetSong(index) {
    const sp = state.mpris.players.spotify;
    sp.running = true;
    state.mpris.activePlayerId = "spotify";
    sp.songIndex = Math.max(0, Math.min(state.songs.length - 1, index));
    sp.positionSec = 0;
    sp.status = "Playing";
    syncAudioSource(true);
  }

  function mprisToggleShuffle() {
    const p = getActiveMprisPlayer();
    if (!p) return;
    p.shuffle = !p.shuffle;
    emit("mpris:changed", getMprisMetadata());
  }

  function mprisCycleLoop() {
    const p = getActiveMprisPlayer();
    if (!p) return;
    const modes = ["None", "Playlist", "Track"];
    const idx = modes.indexOf(p.loop);
    p.loop = modes[(idx + 1) % modes.length];
    emit("mpris:changed", getMprisMetadata());
  }

  function switchTargetPlayer() {
    const runningIds = Object.values(state.mpris.players)
      .filter((p) => p.running)
      .map((p) => p.id);
    if (runningIds.length === 0) return null;
    const cur = runningIds.indexOf(state.mpris.activePlayerId);
    state.mpris.activePlayerId = runningIds[(cur + 1) % runningIds.length];
    emit("mpris:changed", getMprisMetadata());
    return state.mpris.activePlayerId;
  }

  // Notifications helper (matches notify-send -a -i -r -u -h int:value:...)
  function notify({ appName = "System", summary = "", body = "", icon = "", syncId = null, urgency = "normal", progress = null, imagePath = null, actions = null }) {
    const now = Date.now();
    let item;
    if (syncId) {
      const existing = state.notifications.find((n) => n.syncId === syncId);
      if (existing) {
        Object.assign(existing, { appName, summary, body, icon, urgency, progress, imagePath, actions, timestamp: now });
        item = existing;
      }
    }
    if (!item) {
      item = {
        id: state.nextNotifId++,
        syncId,
        appName,
        summary,
        body,
        icon,
        urgency,
        progress,
        imagePath,
        actions,
        timestamp: now,
      };
      // Transient notifications (volume/brightness) don't clutter notification history, per swaync config.json!
      const isTransient =
        appName === "System" && (summary === "Volume" || summary === "Volume muted" || summary === "Brightness");
      if (!isTransient) {
        state.notifications.unshift(item);
        if (state.notifications.length > 30) state.notifications.pop();
      }
    }

    if (!state.dnd && !state.swayncOpen) {
      if (syncId) {
        const toastIdx = state.toasts.findIndex((t) => t.syncId === syncId);
        if (toastIdx !== -1) {
          state.toasts[toastIdx] = { ...item };
        } else {
          state.toasts.unshift({ ...item });
        }
      } else {
        state.toasts.unshift({ ...item });
      }
      if (state.toasts.length > 4) state.toasts.pop();
      emit("toast:update", item);
    }

    emit("notifications:changed", state.notifications);
    return item;
  }

  // Script-faithful helpers
  function adjustVolume(delta) {
    state.volume = Math.max(0, Math.min(120, Math.round(state.volume + delta)));
    updateAudioVolume();
    sendVolumeNotify();
    emit("audio:changed");
  }

  function setVolume(val) {
    state.volume = Math.max(0, Math.min(120, Math.round(val)));
    updateAudioVolume();
    emit("audio:changed");
  }

  function toggleMute() {
    state.muted = !state.muted;
    updateAudioVolume();
    sendVolumeNotify();
    emit("audio:changed");
  }

  function sendVolumeNotify() {
    let icon = "assets/icons/notification-audio-volume-high.svg";
    let summary = "Volume";
    if (state.muted) {
      summary = "Volume muted";
      icon = "assets/icons/notification-audio-volume-muted.svg";
    } else if (state.volume < 20) {
      icon = "assets/icons/notification-audio-volume-low.svg";
    } else if (state.volume < 60) {
      icon = "assets/icons/notification-audio-volume-medium.svg";
    }
    notify({
      appName: "System",
      summary,
      body: String(state.volume),
      icon,
      syncId: "556",
      urgency: "low",
      progress: Math.min(100, state.volume),
    });
  }

  function switchVolumeSink() {
    state.activeSinkIndex = (state.activeSinkIndex + 1) % state.sinks.length;
    const sink = state.sinks[state.activeSinkIndex];
    const icon = sink.icon === "bluetooth"
      ? "assets/icons/bluetooth-active.svg"
      : "assets/icons/audio-volume-high.svg";
    notify({
      appName: "System",
      summary: "Audio output",
      body: sink.name,
      icon,
      syncId: "558",
      urgency: "low",
    });
    emit("audio:changed");
  }

  function adjustBrightness(delta) {
    setBrightness(state.brightness + delta, true);
  }

  function setBrightness(val, showToast = false) {
    state.brightness = Math.max(1, Math.min(100, Math.round(val)));
    if (showToast) {
      let icon = "assets/icons/notification-display-brightness-high.svg";
      if (state.brightness < 15) icon = "assets/icons/notification-display-brightness-off.svg";
      else if (state.brightness > 85) icon = "assets/icons/notification-display-brightness-full.svg";
      else if (state.brightness < 40) icon = "assets/icons/notification-display-brightness-low.svg";
      else if (state.brightness < 60) icon = "assets/icons/notification-display-brightness-medium.svg";

      notify({
        appName: "System",
        summary: "Brightness",
        body: String(state.brightness),
        icon,
        syncId: "557",
        urgency: "low",
        progress: state.brightness,
      });
    }
    emit("display:changed");
  }

  function setHyprsunset(temp, gamma) {
    state.temperature = Math.max(1000, Math.min(10000, Math.round(temp)));
    state.gamma = Math.max(50, Math.min(150, Math.round(gamma)));
    emit("display:changed");
  }

  function applyWallpaper(wallObj, silent = false) {
    if (!wallObj) return;
    state.currentWallpaper = wallObj;
    const tIdx = state.wallpaperThemes.findIndex((t) => t.name === wallObj.theme);
    if (tIdx !== -1) state.currentThemeIndex = tIdx;
    emit("wallpaper:changed", wallObj);
    if (!silent) {
      notify({
        appName: "Wallpaper",
        summary: "Wallpaper Changed",
        body: wallObj.name,
        imagePath: wallObj.path,
        syncId: "559",
        urgency: "low",
      });
    }
  }

  function setRandomWallpaper(allThemes = false) {
    let pool = [];
    if (allThemes || state.wallpaperThemes.length === 0) {
      pool = state.allWallpapers;
    } else {
      const theme = state.wallpaperThemes[state.currentThemeIndex];
      pool = theme ? theme.wallpapers : state.allWallpapers;
    }
    if (pool.length === 0) return;
    const candidates = pool.filter((w) => w.path !== state.currentWallpaper?.path);
    const pick = (candidates.length ? candidates : pool)[
      Math.floor(Math.random() * (candidates.length ? candidates.length : pool.length))
    ];
    applyWallpaper(pick);
  }

  function cycleWallpaperTheme() {
    if (state.wallpaperThemes.length === 0) return;
    state.currentThemeIndex = (state.currentThemeIndex + 1) % state.wallpaperThemes.length;
    const theme = state.wallpaperThemes[state.currentThemeIndex];
    notify({
      appName: "Theme",
      summary: "Wallpaper",
      body: theme.name,
      syncId: "559",
      urgency: "low",
    });
    emit("wallpaper:themeChanged", theme);
  }

  function toggleIdleAwake() {
    state.idleAwake = !state.idleAwake;
    if (state.idleAwake) {
      notify({
        appName: "System",
        summary: "Screen Lock",
        body: "Off - Display will stay on",
        syncId: "569",
        urgency: "low",
      });
    } else {
      notify({
        appName: "System",
        summary: "Screen Lock",
        body: "On - Display would not stay on",
        syncId: "569",
        urgency: "low",
      });
    }
    emit("power:changed");
  }

  function toggleAnimations() {
    state.animationsEnabled = !state.animationsEnabled;
    notify({
      appName: "Hypr",
      summary: state.animationsEnabled ? "Animations Enabled" : "Animations Disabled",
      body: state.animationsEnabled ? "Game Mode Off" : "Game Mode On",
      syncId: "560",
    });
    emit("hypr:changed");
  }

  function toggleTouchpad() {
    state.touchpadEnabled = !state.touchpadEnabled;
    notify({
      appName: "System",
      summary: "Touchpad",
      body: state.touchpadEnabled ? "Enabled" : "Disabled",
      icon: state.touchpadEnabled
        ? "assets/icons/notification-input-touchpad-symbolic.svg"
        : "assets/icons/notification-touchpad-disabled-symbolic.svg",
      syncId: "561",
    });
    emit("hypr:changed");
  }

  function copyToClipboard(text) {
    if (!text) return;
    state.cliphist = [text, ...state.cliphist.filter((x) => x !== text)].slice(0, 50);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  // Periodic realistic system metrics + secondary player tick
  setInterval(() => {
    const m = state.metrics;
    const playingCount = Object.values(state.mpris.players).filter((p) => p.running && p.status === "Playing").length;
    const baseCpu = 7 + state.windows.length * 2.1 + playingCount * 3.5;
    m.cpuPct = Math.max(3, Math.min(96, Math.round(baseCpu + (Math.random() * 10 - 5))));
    m.cpuAvgFreq = +(1.8 + (m.cpuPct / 100) * 2.9).toFixed(2);
    m.tempC = Math.max(38, Math.min(92, Math.round(42 + m.cpuPct * 0.42 + (Math.random() * 3 - 1.5))));
    m.gpuTempC = Math.max(35, Math.min(82, Math.round(m.tempC - 4 + (Math.random() * 2 - 1))));
    m.memPct = Math.max(18, Math.min(88, Math.round(24 + state.windows.length * 3.2)));
    m.memUsedGiB = +((m.memPct / 100) * m.memTotalGiB).toFixed(1);
    m.cpuHistory.push(m.cpuPct);
    if (m.cpuHistory.length > 30) m.cpuHistory.shift();
    m.netDownKbps = Math.round((playingCount ? 450 : 30) + Math.random() * 320);
    m.netUpKbps = Math.round(18 + Math.random() * 75);

    // Secondary player (firefox) progress simulation
    const ff = state.mpris.players.firefox;
    if (ff.running && ff.status === "Playing") {
      ff.positionSec = (ff.positionSec + 2) % ff.durationSec;
      emit("mpris:tick", getMprisMetadata());
    }

    emit("metrics:changed", m);
  }, 2500);

  function startMprisPlayer(playerId) {
    const p = state.mpris.players[playerId];
    if (!p) return;
    p.running = true;
    state.mpris.activePlayerId = playerId;
    if (playerId === "spotify") syncAudioSource(false);
    else emit("mpris:changed", getMprisMetadata());
  }

  function stopMprisPlayer(playerId) {
    const p = state.mpris.players[playerId];
    if (!p) return;
    p.running = false;
    p.status = "Paused";
    if (playerId === "spotify") audio.pause();
    if (state.mpris.activePlayerId === playerId) {
      const nextRunning = Object.values(state.mpris.players).find((x) => x.running);
      state.mpris.activePlayerId = nextRunning ? nextRunning.id : "spotify";
    }
    emit("mpris:changed", getMprisMetadata());
  }

  window.SimState = {
    state,
    on,
    emit,
    cleanTitle,
    getCoverArtUrl,
    getActiveMprisPlayer,
    getMprisMetadata,
    startMprisPlayer,
    stopMprisPlayer,
    mprisToggle,
    mprisNext,
    mprisPrev,
    mprisSeek,
    mprisSetSong,
    mprisToggleShuffle,
    mprisCycleLoop,
    switchTargetPlayer,
    notify,
    adjustVolume,
    setVolume,
    toggleMute,
    updateAudioVolume,
    switchVolumeSink,
    adjustBrightness,
    setBrightness,
    setHyprsunset,
    applyWallpaper,
    setRandomWallpaper,
    cycleWallpaperTheme,
    toggleIdleAwake,
    toggleAnimations,
    toggleTouchpad,
    copyToClipboard,
  };
})();
