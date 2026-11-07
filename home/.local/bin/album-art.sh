#!/usr/bin/env bash

PATH="$HOME/.local/bin:$PATH"

main="/tmp/art-album.png"
blur="/tmp/art-album-blur.png"
id_file="/tmp/art.id"

hash() { printf '%s' "$1" | md5sum | cut -d' ' -f1; }

# percent-decode without letting printf interpret backslashes
urldecode() {
    local s=${1//\\/\\\\}
    printf '%b' "${s//%/\\x}"
}

player=$(switch-target-player.sh 0)
args=()
[[ -n $player ]] && args=(-p "$player")

# one call so art and url always come from the same track
mapfile -t meta < <(playerctl "${args[@]}" metadata \
    --format $'{{mpris:artUrl}}\n{{xesam:url}}' 2>/dev/null)
art=${meta[0]:-}
url=${meta[1]:-}

kind=fallback
id=fallback

if [[ -n $art ]]; then
    if [[ $art == file://* ]]; then
        art_path=$(urldecode "${art#file://}")
        [[ -f $art_path ]] || art_path=${art#file://}
        if [[ -f $art_path ]]; then
            kind=file
            id=$(hash "$art")
        fi
    else
        kind=url
        id=$(hash "$art")
    fi
elif [[ $url == file://* ]]; then
    file_path=$(urldecode "${url#file://}")
    [[ -f $file_path ]] || file_path=${url#file://}
    if [[ -f $file_path ]]; then
        if [[ -n $(ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of csv=p=0 -- "$file_path" 2>/dev/null) ]]; then
            pos=$(music.sh --position 2>/dev/null)
            pos="${pos// /}"
            [[ -z $pos || $pos == "0:00" || $pos == "00:00" ]] && pos="00:00:01"
            kind=video
            id=$(hash "$file_path-$pos")
        else
            id=$(hash "novideo-$file_path")
        fi
    fi
fi

if [[ -f $id_file && $(< "$id_file") == "$id" && -s $main && -s $blur ]]; then
    echo "$main"
    exit 0
fi

tmp=$(mktemp -d) || exit 1
trap 'rm -rf "$tmp"' EXIT

# any input -> first frame only, upright, max 1280px
to_png() {
    magick "$1[0]" -auto-orient -resize '1280x1280>' "png32:$tmp/main.png"
}

ok=false
case $kind in
    file)
        cp -- "$art_path" "$tmp/in" && to_png "$tmp/in" && ok=true
        ;;
    url)
        curl -fs --max-time 10 --proto '=http,https' --url "$art" -o "$tmp/in" \
            && to_png "$tmp/in" && ok=true
        ;;
    video)
        if ! ffmpeg -nostdin -ss "$pos" -i "$file_path" -frames:v 1 -pix_fmt rgba -update 1 -y "$tmp/frame.png" 2>/dev/null \
            || [[ ! -s $tmp/frame.png ]]; then
            ffmpeg -nostdin -ss 00:00:01 -i "$file_path" -frames:v 1 -pix_fmt rgba -update 1 -y "$tmp/frame.png" 2>/dev/null
        fi
        [[ -s $tmp/frame.png ]] && to_png "$tmp/frame.png" && ok=true
        ;;
esac

# failure -> blank image, id still saved so it isn't retried until the track changes
if [[ $ok != true || ! -s $tmp/main.png ]]; then
    magick -size 640x640 xc:none "png32:$tmp/main.png"
    # magick -size 640x640 -define gradient:angle=135 gradient:'#1B0122-#613583' "$tmp/main.png"  # dont remove this line!
fi

if [[ -s $tmp/main.png ]]; then
    height=$(magick identify -format '%h' "$tmp/main.png" 2>/dev/null || echo 640)
    radius=$((height / 32))
    (( radius < 1 )) && radius=1

    magick "$tmp/main.png" -blur "0x$radius" "png32:$tmp/blur.png"

    if [[ -s $tmp/blur.png ]]; then
        mv -f "$tmp/blur.png" "$blur"
        mv -f "$tmp/main.png" "$main"
        echo "$id" > "$id_file"
    fi
fi

[[ -s $main ]] && echo "$main"
