# Colors in my dotfiles

## Monokai Soda v2 Theme

### Alacritty

[colors.primary]
background = "#000000"
foreground = "#c4c4c4"

[colors.cursor]
cursor = "#dcdcdc"

[colors.selection]
background = "#a0c1eb"
text = "#121212"

[colors.normal]
black = "#121212"
red = "#f3005f"
green = "#97e023"
yellow = "#e6be00"
blue = "#9f34d7"
magenta = "#0f7fcf"
cyan = "#42a7cf"
white = "#bababa"

[colors.bright]
black = "#545454"
red = "#f5669c"
green = "#b0e05e"
yellow = "#dfd561"
blue = "#b965f0"
magenta = "#00afff"
cyan = "#57d1ea"
white = "#f6f6e6"

### Btop

theme[main_bg]="#000000"
theme[main_fg]="#c4c4c4"

theme[title]="#f6f6e6"

theme[hi_fg]="#f3005f"

theme[selected_bg]="#1a0a2e"
theme[selected_fg]="#f6f6e6"
theme[inactive_fg]="#545454"

theme[graph_text]="#6e6e6e"

theme[proc_misc]="#97e023"

theme[cpu_box]="#42a7cf"
theme[mem_box]="#42a7cf"
theme[net_box]="#42a7cf"
theme[proc_box]="#42a7cf"

theme[div_line]="#545454"

theme[temp_start]="#9f34d7"
theme[temp_mid]="#57d1ea"
theme[temp_end]="#f3005f"

theme[cpu_start]="#97e023"
theme[cpu_mid]="#dfd561"
theme[cpu_end]="#f3005f"

theme[free_start]="#545454"
theme[free_mid]="#b0e05e"
theme[free_end]="#f6f6e6"

theme[cached_start]="#545454"
theme[cached_mid]="#42a7cf"
theme[cached_end]="#57d1ea"

theme[available_start]="#545454"
theme[available_mid]="#e6be00"
theme[available_end]="#dfd561"

theme[used_start]="#545454"
theme[used_mid]="#f3005f"
theme[used_end]="#f5669c"

theme[download_start]="#0a0a2e"
theme[download_mid]="#9f34d7"
theme[download_end]="#b965f0"

theme[upload_start]="#0f7fcf"
theme[upload_mid]="#00afff"
theme[upload_end]="#57d1ea"

### Kitty

background #000000
foreground #c4c4c4
cursor #dcdcdc
selection_background #a0c1eb
color0 #121212
color8 #545454
color1 #f3005f
color9 #f5669c
color2 #97e023
color10 #b0e05e
color3 #e6be00
color11 #dfd561
color4 #9f34d7
color12 #b965f0
color5 #0f7fcf
color13 #00afff
color6 #42a7cf
color14 #57d1ea
color7 #bababa
color15 #f6f6e6
selection_foreground #121212

### Rofi

* {
    background:     #0d0d0dff;
    background-alt: #1a1a1aff;
    foreground:     #d0d0d0ff;
    selected:       #b965f0ff;
    active:         #b0e05eff;
    urgent:         #f5669cff;
}

### Waybar

@define-color primary-background #000000;
@define-color primary-foreground #c4c4c4;

@define-color cursor #dcdcdc;

@define-color selection-background #a0c1eb;
@define-color selection-foreground #121212;

@define-color black #121212;
@define-color red   #f3005f;
@define-color green #97e023;
@define-color yellow    #e6be00;
@define-color blue  #9f34d7;
@define-color magenta   #0f7fcf;
@define-color cyanw     #42a7cf;
@define-color white #bababa;

@define-color black-bright  #545454;
@define-color red-bright    #f5669c;
@define-color green-bright  #b0e05e;
@define-color yellow-bright     #dfd561;
@define-color blue-bright   #b965f0;
@define-color magenta-bright    #00afff;
@define-color cyan-bright   #57d1ea;
@define-color white-bright  #f6f6e6;

@define-color black-0 #2d2d2d;
@define-color black-1 #424242;

### Serie

[graph.color]
branches = [
  "#f3005f",
  "#97e023",
  "#dfd561",
  "#42a7cf",
  "#b965f0",
  "#00afff",
  "#f5669c",
  "#b0e05e",
  "#e6be00",
  "#57d1ea",
]
edge = "#00000000"
background = "#00000000"

[color]
fg = "#c4c4c4"
bg = "reset"
list_selected_fg = "#f6f6e6"
list_selected_bg = "#453366"
list_ref_paren_fg = "#dfd561"
list_ref_branch_fg = "#97e023"
list_ref_remote_branch_fg = "#f3005f"
list_ref_tag_fg = "#e6be00"
list_ref_stash_fg = "#b965f0"
list_head_fg = "#57d1ea"
list_subject_fg = "reset"
list_name_fg = "#42a7cf"
list_hash_fg = "#dfd561"
list_date_fg = "#0f7fcf"
list_match_fg = "#121212"
list_match_bg = "#e6be00"
detail_label_fg = "#545454"
detail_name_fg = "reset"
detail_date_fg = "reset"
detail_email_fg = "#00afff"
detail_hash_fg = "reset"
detail_ref_branch_fg = "#97e023"
detail_ref_remote_branch_fg = "#f3005f"
detail_ref_tag_fg = "#e6be00"
detail_file_change_add_fg = "#97e023"
detail_file_change_modify_fg = "#dfd561"
detail_file_change_delete_fg = "#f3005f"
detail_file_change_move_fg = "#b965f0"
ref_selected_fg = "#f6f6e6"
ref_selected_bg = "#453366"
help_block_title_fg = "#97e023"
help_key_fg = "#dfd561"
virtual_cursor_fg = "#dcdcdc"
status_input_fg = "reset"
status_input_transient_fg = "#545454"
status_info_fg = "#42a7cf"
status_success_fg = "#97e023"
status_warn_fg = "#dfd561"
status_error_fg = "#f3005f"
divider_fg = "#545454"

## Other

### Material Black Plum Suru

Main Colors used in gradient:

purple light: #a08fbf
purple: #5a33a3

### Hyprland

```lua
local colors = {
    rosewater = "rgb(e2d0cb)",
    flamingo  = "rgb(f2cdcd)",
    pink      = "rgb(f5c2e7)",
    mauve     = "rgb(ab86d7)",
    red       = "rgb(f38ba8)",
    maroon    = "rgb(eba0ac)",
    peach     = "rgb(fab387)",
    yellow    = "rgb(f9e2af)",
    green     = "rgb(a6e3a1)",
    teal      = "rgb(94e2d5)",
    sky       = "rgb(89dceb)",
    sapphire  = "rgb(63b6db)",
    blue      = "rgb(89b4fa)",
    lavender  = "rgb(b4befe)",
    text      = "rgb(cdd6f4)",
    subtext1  = "rgb(bac2de)",
    overlay0  = "rgb(6c7086)",
    base      = "rgb(1e1e2e)",
    mantle    = "rgb(181825)",
    crust     = "rgb(11111b)",
    passive   = "rgb(806aab)",
}
```
