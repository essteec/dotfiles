# Dotfiles

## Environment

The setup is Arch Linux, Hyprland.

The following modern CLI tools and utilities are available on the system for terminal: `rg`, `fd`, `jq`, `gh`, `ast-grep`, `bat`, `yq`, `uv`, and so on to explore.

## Project Structure & Repository Context

- `.extra/`: Fully ignored from dotfiles sync and git tracking. It serves as a local reference/documentation store for agents to scan directly (e.g., wiki clones, reference guides) so agents can work strictly within this repo instead of touching the live home folder.
- `installed-apps.md`: Full list of installed packages on the system.
- `colors.md`: Central reference of color and theme options across configs. Agents can read this to quickly adapt or create matching color themes for other apps.
- `home/`: Mirrors the user's original `$HOME` directory and stores all tracked dotfiles:
  - `.zshrc`: Shell configuration.
  - `.themes/`: Contains `my-themes.md` listing downloaded system themes.
  - `.local/share/`:
    - `applications/`: Custom webapp desktop files (e.g., `youtube.desktop`, `netflix.desktop`, `kick.desktop`, `primevideo.desktop`, `twitch.desktop`).
    - `fonts/`: Contains `my-fonts.md` listing downloaded fonts.
  - `.local/bin/`: Personal shell scripts (`*.sh`) used by Waybar, Hyprland, or executed manually in terminal. Standalone binaries and tools (like `agy`, `claude`, `uv`, `uvx`) are excluded; only personal `.sh` scripts are tracked.
  - `.icons/`: Only tracks custom modified or added files to the main icon theme (`Material-Black-Plum-Suru`) preserving directory hierarchy (e.g. `apps/symbolic/primevideo.svg`, `status/48/*`, `index.theme`), plus `my-icons.md` listing downloaded icon themes. Upstream full icon themes are not tracked.
  - `.config/`: Dedicated config directories for user-customized tools (`hypr`, `waybar`, `kitty`, `rofi`, `swaync`, `alacritty`, `btop`, `gtk-3.0`, `gtk-4.0`, `sddm-theme`).
