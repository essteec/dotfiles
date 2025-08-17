#!/usr/bin/env python3

# this script only returns path when arg '0' and returns next path when arg '1' 
# you need a folder that has different folders for specific themes

# you need a json file within this file:
# {
#     "wallpapers_path": "/home/[username]/Pictures/Wallpapers/", # in this path there are theme folders named 'theme 1' and 'theme 2'
#     "wallpaper_options": ["theme 1", "theme 2"], 
#     "current_theme_index": 1 # to track current theme
# }

# Example Full Usage within i3wm:
# Set random wallpaper on startup
# exec_always --no-startup-id feh --bg-fill --randomize $(python3 ~/.config/i3/wallpaper/get-wallpaper-path.py 0)
# change wallpaper 
# bindsym $mod+p exec --no-startup-id feh --bg-fill --randomize $(python3 ~/.config/i3/wallpaper/get-wallpaper-path.py 0); exec --no-startup-id notify-send "Wallpaper" "theme: $(python3 ~/.config/i3/wallpaper/get-wallpaper-path.py 0 | awk -F'/' '{print $NF}')"
# change theme and then wallpaper
# bindsym $mod+Shift+p exec --no-startup-id feh --bg-fill --randomize $(python3 ~/.config/i3/wallpaper/get-wallpaper-path.py 1); exec --no-startup-id notify-send "Wallpaper" "theme: $(python3 ~/.config/i3/wallpaper/get-wallpaper-path.py 0 | awk -F'/' '{print $NF}')"

import json, sys

user = "arch"  # change this with your name

with open(f'/home/{user}/.config/i3/wallpaper/wallpaper-paths.json', 'r') as f:
    y = json.load(f)

wp_path = y["wallpapers_path"]
wps = y["wallpaper_options"]
index = y["current_theme_index"]

if sys.argv[1] == '1': 
    index += 1

    if (index >= len(wps)):
        index = 0

    y["current_theme_index"] = index

    with open(f'/home/{user}/.config/i3/wallpaper/wallpaper-paths.json', 'w') as f:
        json.dump(y, f)

    
print(wp_path + wps[index])
