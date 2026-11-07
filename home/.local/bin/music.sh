#!/usr/bin/env bash
# music.sh — metadata and controls for the primary player (see player-lib.sh)
#
#   music.sh --title | --artist | --album | --length | --status | --shuffle
#            | --icon | --source | --arturl
#   music.sh --do toggle | next | prev | shuffle | switch
[[ ${LC_ALL:-${LC_CTYPE:-$LANG}} == *[Uu][Tt][Ff]* ]] || export LC_ALL=C.UTF-8

PLAYER_CACHE="$HOME/.cache/playerctl-current"
PLAYER=""
STATUS=""

# progress bar settings (next to MAX_TITLE / ICON_* at the top)
BAR_LENGTH=10
COLOR_PLAYED="#1DB954"
COLOR_HANDLE="#FFFFFF"
COLOR_REMAINING="#FFFFFF40"
TRACK_CHAR="—"
HANDLE="⦿"

resolve_player() {
    PLAYER="" STATUS=""

    # fast path: the player cached by switch-target-player.sh is still alive
    [[ -r $PLAYER_CACHE ]] && PLAYER=$(<"$PLAYER_CACHE")
    [[ -n $PLAYER ]] && STATUS=$(playerctl -p "$PLAYER" status 2>/dev/null)

    # slow path: cache missing or stale -> ask the switcher (read-only `get` mode)
    if [[ -z $STATUS ]]; then
        PLAYER=$("switch-target-player.sh" 0)
        [[ -n $PLAYER ]] && STATUS=$(playerctl -p "$PLAYER" status 2>/dev/null)
    fi

    [[ -n $STATUS ]]
}

# microseconds -> M:SS or H:MM:SS 
fmt_time() {
    local us=${1:-0}
    us=${us%%.*}
    [[ $us =~ ^[0-9]+$ ]] || us=0

    local s=$(( 10#$us / 1000000 ))
    local h=$(( s / 3600 )) m=$(( s % 3600 / 60 )) sec=$(( s % 60 ))

    if (( h > 0 )); then
        printf '%d:%02d:%02d' "$h" "$m" "$sec"
    else
        printf '%d:%02d' "$m" "$sec"
    fi
}

music_progress() {
    [[ $STATUS == Playing || $STATUS == Paused ]] || return 0

    local pos len filled played rest
    IFS='|' read -r pos len < <(
        playerctl -p "$PLAYER" metadata --format '{{position}}|{{mpris:length}}' 2>/dev/null
    )
    pos=${pos%%.*}
    len=${len%%.*}
    [[ $pos =~ ^[0-9]+$ ]] || pos=0
    [[ $len =~ ^[0-9]+$ ]] || len=0

    # unknown length (live streams, some browser media): show elapsed time only
    if (( len == 0 )); then
        fmt_time "$pos"; echo
        return 0
    fi

    (( pos > len )) && pos=$len
    filled=$(( pos * BAR_LENGTH / len ))

    printf -v played '%*s' "$filled" ''
    played=${played// /$TRACK_CHAR}
    printf -v rest '%*s' $(( BAR_LENGTH - filled )) ''
    rest=${rest// /$TRACK_CHAR}

    printf '<span foreground="%s">%s</span><span foreground="%s">%s</span><span foreground="%s">%s</span> %s / %s\n' \
        "$COLOR_PLAYED" "$played" \
        "$COLOR_HANDLE" "$HANDLE" \
        "$COLOR_REMAINING" "$rest" \
        "$(fmt_time "$pos")" "$(fmt_time "$len")"
}

MAX_TITLE=28
MAX_ARTIST=30

# Nerd Font glyphs, swap to taste
ICON_PLAY=""
ICON_PAUSE=""
ICON_SHUFFLE_ON=""
ICON_SHUFFLE_OFF="󰒞"

usage() {
    echo "Usage: ${0##*/} --title | --artist | --album | --length | --progress | --position | --status | --shuffle | --icon | --source | --arturl" >&2
    echo "       ${0##*/} --do toggle | next | prev | shuffle | switch" >&2
    exit 1
}

meta() { playerctl -p "$PLAYER" metadata "$1" 2>/dev/null; }

# hyprlock labels are Pango markup: an unescaped & < > makes the whole label vanish
escape() {
    local s=$1
    s=${s//&/'&amp;'}
    s=${s//</'&lt;'}
    s=${s//>/'&gt;'}
    printf '%s' "$s"
}

trunc() {
    local s=$1 max=$2
    (( ${#s} > max )) && s="${s:0:max-1}…"
    printf '%s' "$s"
}

# drop "(Official Video)", "[Lyrics]", "(feat. ...)" and friends
clean_title() {
    sed -E \
        -e 's/\s*[-|–]*\s*\(?official music video\)?//I' \
        -e 's/\s*[-|–]*\s*\(?official video\)?//I' \
        -e 's/\s*[-|–]*\s*\(?lyrics\)?//I' \
        -e 's/\s*[-|–]*\s*\(?\bHD\b\)?//I' \
        -e 's/\s*\[[^]]*\]//g' \
        -e 's/\s*\([^)]*\)//g' \
        -e 's/\s{2,}/ /g' \
        -e 's/^\s+|\s+$//g'
}

# icon of the primary player (coloured with Pango, same palette as your current-song.sh)
player_icon() {
    local n=${PLAYER,,}
    n=${n%%.*}
    case $n in
        spotify*)                  printf "<span color='#1DB954'>%s</span>" "󰓇" ;;
        firefox*)                  printf "<span color='#331E54'>%s</span>" "󰈹" ;;
        vlc*)                      printf "<span color='#F48200'>%s</span>" "󰕼" ;;
        *youtube*)                 printf "<span color='#CD201F'>%s</span>" "󰗃" ;;
        chromium*|chrome*|brave*)  printf "<span color='#699dd3'>%s</span>" "󰊯" ;;
        mpv*|haruna*)              printf "<span color='#C1B7B0'>%s</span>" "" ;;
        *)                         printf "<span color='#613583'>%s</span>" "󰎇" ;;
    esac
}

[[ $# -eq 0 ]] && usage

resolve_player || exit 1    # no player: print nothing, do nothing

case $1 in
    --title)
        t=$(meta xesam:title)
        [[ -z $t ]] && exit 0
        c=$(clean_title <<<"$t")
        [[ -n $c ]] || c=$t
        printf '%s\n' "$(escape "$(trunc "$c" "$MAX_TITLE")")"
        ;;
    --artist)
        a=$(meta xesam:artist)
        [[ -z $a ]] && exit 0
        printf '%s\n' "$(escape "$(trunc "$a" "$MAX_ARTIST")")"
        ;;
    --album)
        printf '%s\n' "$(escape "$(meta xesam:album)")"
        ;;
    --length)
        l=$(meta mpris:length)
        l=${l%%.*}
        [[ $l =~ ^[0-9]+$ ]] && (( l > 0 )) && { fmt_time "$l"; echo; }
        ;;
    --position)
        p=$(playerctl -p "$PLAYER" metadata --format '{{position}}' 2>/dev/null)
        p=${p%%.*}
        [[ $p =~ ^[0-9]+$ ]] && { fmt_time "$p"; echo; }
        ;;
    --status)       # icon of the ACTION a click will do
        if [[ $STATUS == Playing ]]; then echo "$ICON_PAUSE"; else echo "$ICON_PLAY"; fi
        ;;
    --shuffle)      # prints nothing if the player has no shuffle support
        case $(playerctl -p "$PLAYER" shuffle 2>/dev/null) in
            On)  echo "$ICON_SHUFFLE_ON" ;;
            Off) echo "$ICON_SHUFFLE_OFF" ;;
        esac
        ;;
    --icon)
        player_icon; echo
        ;;
    --source)
        n=${PLAYER,,}; n=${n%%.*}
        printf '%s %s\n' "${n^}" "$(player_icon)"
        ;;
    --arturl)
        meta mpris:artUrl
        ;;
    --progress)
	      music_progress
	      ;;
    --do)
        case ${2:-} in
            toggle)  playerctl -p "$PLAYER" play-pause ;;
            next)    playerctl -p "$PLAYER" next ;;
            prev)    playerctl -p "$PLAYER" previous ;;
            shuffle) playerctl -p "$PLAYER" shuffle Toggle ;;
            switch)  "switch-target-player.sh" 1 >/dev/null ;;
            *)       usage ;;
        esac
        ;;
    *)
        usage
        ;;
esac
