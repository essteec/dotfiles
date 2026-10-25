# 🍙 Arch Linux + Hyprland Dotfiles

A modern, fast, and aesthetically cohesive desktop setup on **Arch Linux** powered by **Hyprland**, styled with the custom **Monokai Soda v2** palette, and optimized for development and daily productivity.

---

## 🖥️ Desktop Stack

| Component | Software | Details / Highlights |
| :--- | :--- | :--- |
| **Compositor** | [Hyprland](https://hyprland.org) | Modern **Lua**-driven configuration (`hyprland.lua`) |
| **Status Bar** | [Waybar](https://github.com/Alexays/Waybar) | Customized modules, contextual menus, volume/backlight scripts |
| **Notification Center** | [SwayNC](https://github.com/ErikReider/SwayNotificationCenter) | Actionable control center, DND, volume & quick settings |
| **App Launcher & Menus** | [Rofi](https://github.com/lbonn/rofi) *(wayland)* | Application launcher, power menu, clipboard, and window switcher |
| **Terminals** | [Kitty](https://sw.kovidgoyal.net/kitty/) / [Alacritty](https://alacritty.org) | Custom `tab_bar.py`, Monokai Soda v2 themes, fast rendering |
| **Shell & Prompt** | [Zsh](https://www.zsh.org) + [Powerlevel10k](https://github.com/romkatv/powerlevel10k) | Oh-My-Zsh plugins, syntax highlighting, autosuggestions |
| **Screen Lock & Idle** | [Hyprlock](https://github.com/hyprwm/hyprlock) / [Hypridle](https://github.com/hyprwm/hypridle) | Smooth lockscreen, idle inhibitor integration |
| **Blue Light Filter** | [Hyprsunset](https://github.com/hyprwm/hyprsunset) | Controlled via custom `.local/bin/bluelight-menu.sh` |
| **System Monitor** | [Btop](https://github.com/aristocratos/btop) | Custom Monokai Soda v2 theme matching terminal palette |
| **Icon Theme** | [Material-Black-Plum-Suru](https://github.com) | Selective fixes, symbolic apps, and custom status icons |
| **Display Manager** | [SDDM](https://github.com/sddm/sddm) + [SilentSDDM](https://github.com/essteec/SilentSddm) | Silent theme with randomized and extra wallpaper backgrounds |

---

## 📂 Repository Structure

```text
.
├── home/                   # Mirrors $HOME for tracked configurations
│   ├── .config/            # Application configs (hypr, waybar, kitty, rofi, etc.)
│   ├── .icons/             # Selective custom fixes for Material-Black-Plum-Suru
│   ├── .local/
│   │   ├── bin/            # Custom personal shell scripts (*.sh)
│   │   └── share/
│   │       ├── applications/  # Custom webapps (YouTube, Netflix, Twitch, etc.)
│   │       ├── fonts/         # Font documentation (my-fonts.md)
│   │       └── sounds/        # Desktop notification sounds
│   ├── .themes/            # Theme notes (my-themes.md)
│   └── .zshrc              # Shell environment & aliases
├── sync.sh                 # Intelligent checksum sync tool ($HOME -> repo)
├── diff-delta.sh           # Delta-powered diff inspector (live $HOME vs repo)
├── pull-extra.sh           # Offline documentation & wiki updater (.extra/)
├── desktop-audio.sh        # Desktop sound clip generator (yt-dlp + ffmpeg)
├── colors.md               # Central color palette reference (Monokai Soda v2)
├── installed-apps.md       # Complete package manifest
└── AGENTS.md               # Context & guidelines for AI assistants
```

---

## 🛠️ Management Scripts

This repository includes custom automation scripts to keep your dotfiles version-controlled, clean, and up to date without manual copying:

### 1. `sync.sh` — Sync from `$HOME` to Repo
Synchronizes active configurations from your live `$HOME` directory into `home/`. It uses checksum comparison (`rsync -c`) so only truly modified files are touched, dynamically discovers tracked apps, and filters out noise (caches, bookmarks, logs).

```bash
# Check what changed without modifying any files (dry-run):
./sync.sh --dry-run
# or ./sync.sh -n

# Run full sync:
./sync.sh

# View help and options:
./sync.sh --help
```

### 2. `diff-delta.sh` — Inspect Differences
Quickly inspect syntax-highlighted diffs between any file in this repository and its counterpart in your live `$HOME` using `delta`:

```bash
# Compare a specific config after seen it with ./sync.sh -n:
./diff-delta.sh .config/waybar/config.jsonc

# Accepts paths with or without 'home/' prefix:
./diff-delta.sh home/.config/hypr/hyprland.lua
```

### 3. `pull-extra.sh` — Reference Wikis & Docs
Clones and updates offline reference wikis (Hyprland wiki, Waybar wiki, SwayNC documentation) into the git-ignored `.extra/` directory:

```bash
./pull-extra.sh
```

### 4. `desktop-audio.sh` — Create Desktop Sound Clips
Downloads audio via `yt-dlp` (`-l`) or uses a local media file (`-f`) and trims/converts it with `ffmpeg` into `.ogg` (default) or `.wav` (max 30 seconds, using any two of `-ss`, `-t`, `-to`, with optional `-fi` / `-fo` fades and `-o` custom output path):

```bash
# Download from a link and extract a 5s .ogg clip starting at 00:10:
./desktop-audio.sh -l "https://www.youtube.com/watch?v=VIDEO_ID" -ss 00:10 -t 5

# Trim a local file between two timestamps as .wav with 1s fade-in and 2s fade-out:
./desktop-audio.sh -f song.mp3 -ss 01:00 -to 01:12 -fi 1 -fo 2 wav

# Literal Usecase:
./desktop-audio.sh -l 'https://www.youtube.com/watch?v=-6hxH80TCp8' -ss 0 -t 17.679 -fo 3 -o home/.local/share/sounds/steereeo/stereo/desktop-login-nfsu2
# try/adjust settings optionally:
./desktop-audio.sh -f 'Riders On The Storm (Fredwreck Remix).opus' -ss 0 -t 17.679 -fo 5 -o home/.local/share/sounds/steereeo/stereo/desktop-login-nfsu2
# remove and copy actual spot after job done
rm 'Riders On The Storm (Fredwreck Remix).opus'
cp home/.local/share/sounds/steereeo/stereo/desktop-login-nfsu2.ogg ~/.local/share/sounds/steereeo/stereo/
```

---

## 🎨 Theme: Monokai Soda v2

All user interfaces across the desktop are unified under a **Monokai Soda v2** palette featuring high-contrast dark tones with vibrant accents:

- **Background**: `#000000` / `#121212`
- **Foreground / Text**: `#c4c4c4` / `#f6f6e6`
- **Accent Red / Pink**: `#f3005f`
- **Accent Green**: `#97e023`
- **Accent Yellow**: `#e6be00`
- **Accent Cyan / Blue**: `#42a7cf` / `#9f34d7`

> Detailed color tokens for every application (Alacritty, Btop, Kitty, Rofi, Waybar, etc.) are documented in [colors.md](colors.md).

---

## 📦 Installed Packages

For a full list of all official repository and AUR packages installed on this system, see [installed-apps.md](installed-apps.md).
