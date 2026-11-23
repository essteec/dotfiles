// Hyprland Keybinds + Helper Pill + Initial Desktop Boot

(function () {
  const {
    state,
    setRandomWallpaper,
    cycleWallpaperTheme,
    toggleAnimations,
    toggleTouchpad,
    adjustVolume,
    adjustBrightness,
    toggleMute,
    mprisToggle,
    mprisNext,
    mprisPrev,
  } = window.SimState;

  const {
    closeWindow,
    toggleFloat,
    toggleFullscreen,
    focusWorkspace,
    setWorkspaceLayout,
    layoutCommand,
    getActiveLayoutName,
  } = window.HyprCompositor;

  function initHelperPill() {
    const pill = document.getElementById("sim-helper-pill");
    if (!pill) return;

    const actions = [
      ["Apps (Drun)", () => window.RofiUI.open("drun")],
      ["Kitty", () => window.AppLauncher.launch("kitty")],
      ["Spotify", () => window.AppLauncher.launch("spotify")],
      ["Hyprlock", () => window.ScreensUI.lock()],
      ["Scratchpad", () => focusWorkspace("special:scratchpad")],
      ["Rotate", () => layoutCommand("rotate")],
      ["Layout", () => {
        const cycle = ["lua:fibonacci", "lua:golden", "dwindle", "master", "monocle"];
        const cur = getActiveLayoutName();
        const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
        setWorkspaceLayout(next);
      }],
      ["Wall Theme", () => cycleWallpaperTheme()],
      ["Rand Wall", () => setRandomWallpaper(false)],
    ];

    const toggleBtn = pill.querySelector("#helper-toggle");
    const box = pill.querySelector(".helper-actions");
    actions.forEach(([label, fn]) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.addEventListener("click", fn);
      box.appendChild(b);
    });

    toggleBtn?.addEventListener("click", () => {
      pill.classList.toggle("minimized");
    });
  }

  function initKeybinds() {
    window.addEventListener("keydown", (e) => {
      if (state.locked) return;
      const tag = document.activeElement?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA";

      // Media hardware keys always work
      if (e.key === "AudioVolumeUp") { adjustVolume(4); return; }
      if (e.key === "AudioVolumeDown") { adjustVolume(-5); return; }
      if (e.key === "AudioVolumeMute") { toggleMute(); return; }
      if (e.key === "MediaPlayPause") { mprisToggle(); return; }
      if (e.key === "MediaTrackNext") { mprisNext(false); return; }
      if (e.key === "MediaTrackPrevious") { mprisPrev(); return; }

      // Alt+Tab window switcher
      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
        window.RofiUI.open("window");
        return;
      }

      if (isInput) return;

      // Alt+1..4 workspace switching (browser-safe equivalent of Super+1..4)
      if (e.altKey && !e.shiftKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        focusWorkspace(Number(e.key));
        return;
      }

      if (e.altKey && e.key === "`") {
        e.preventDefault();
        focusWorkspace("special:magic");
      } else if (e.altKey && e.key === "=") {
        e.preventDefault();
        focusWorkspace("special:scratchpad");
      } else if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        window.RofiUI.open("drun");
      } else if (e.altKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        window.RofiUI.open("filebrowser");
      } else if (e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        window.RofiUI.open("emoji");
      } else if (e.altKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        window.RofiUI.open("clipboard");
      } else if (e.altKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        window.RofiUI.open("media-player");
      } else if (e.altKey && e.key.toLowerCase() === "p" && !e.shiftKey) {
        e.preventDefault();
        setRandomWallpaper(false);
      } else if (e.altKey && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        cycleWallpaperTheme();
      } else if (e.altKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        closeWindow();
      } else if (e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.altKey && e.shiftKey && e.key === " ") {
        e.preventDefault();
        toggleFloat();
      } else if (e.altKey && e.key === "/") {
        e.preventDefault();
        layoutCommand("rotate");
      } else if (e.altKey && e.key === "[") {
        e.preventDefault();
        window.SwayNC.toggleControlCenter();
      } else if (e.altKey && e.key === "]") {
        e.preventDefault();
        window.RofiUI.open("power-menu");
      } else if (e.altKey && e.shiftKey && e.key === "}") {
        e.preventDefault();
        window.ScreensUI.lock();
      } else if (e.altKey && e.shiftKey && e.key === '"') {
        e.preventDefault();
        toggleAnimations();
      } else if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        window.AppLauncher.launch("kitty-float");
      } else if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        window.AppLauncher.launch("kitty", { initCmd: "fastfetch" });
      }
    });
  }

  // Boot directly into Hyprland Desktop
  window.addEventListener("DOMContentLoaded", () => {
    window.ScreensUI.init();
    window.WaybarUI.init();
    window.SwayNC.renderToasts();
    initHelperPill();
    initKeybinds();
  });
})();
