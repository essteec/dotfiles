# https://github.com/kovidgoyal/kitty/discussions/4447#discussioncomment-17863698

from kitty.tab_bar import draw_tab_with_powerline, as_rgb
from kitty.fast_data_types import Screen, Color

# ---- Catppuccin Mocha --------------------------------------------------
BASE  = 0x1e1e2e
CRUST = 0x11111b
TEXT  = 0x364153
BLACK = 0x000000
WHITE = 0xfafafa
PURPLE = 0x9f34d7

# reversed: red peach yellow green teal sky blue mauve pink lavender
PALETTE = [
    0xb4befe,  # lavender
    0xf5c2e7,  # pink
    0xcba6f7,  # mauve
    0x89b4fa,  # blue
    0x89dceb,  # sky
    0x94e2d5,  # teal
    0xa6e3a1,  # green
    0xf9e2af,  # yellow
    0xfab387,  # peach
    0xf38ba8,  # red
]
# -------------------------------------------------------------------------


def hexcolor(h):
    return Color((h >> 16) & 0xFF, (h >> 8) & 0xFF, h & 0xFF)


def draw_tab(
    draw_data,
    screen: Screen,
    tab,
    before,
    max_title_length,
    index,
    is_last,
    extra_data,
):
    cur_color = PALETTE[(index - 1) % len(PALETTE)]
    next_color = PALETTE[index % len(PALETTE)] if not is_last else BASE
    fg_color = BASE if not tab.is_active else CRUST

    # Plain text logo before first tab
    if index == 1:
        screen.cursor.bg = as_rgb(PURPLE)
        screen.cursor.fg = as_rgb(WHITE)
        screen.cursor.bold = True
        screen.cursor.italic = False
        screen.draw(" 󰄛 Kitty ")

        # margin for first tab
        screen.cursor.bg = as_rgb(cur_color)
        screen.draw(" ")
        screen.cursor.italic = tab.is_active

    screen.cursor.bg = as_rgb(cur_color)
    screen.cursor.fg = as_rgb(fg_color)
    screen.cursor.bold = tab.is_active

    draw_data = draw_data._replace(
        active_bg=hexcolor(next_color),
        inactive_bg=hexcolor(next_color),
    )
    return draw_tab_with_powerline(
        draw_data,
        screen,
        tab,
        before,
        max_title_length,
        index,
        is_last,
        extra_data,
    )
