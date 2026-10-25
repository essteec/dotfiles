#!/usr/bin/env bash
#
# desktop-audio.sh - Create desktop audio (max 30s) from a link or local media file
#
# Usage:
#   ./desktop-audio.sh (-l <url> | -f <file>) [-ss <time>] [-t <sec>] [-to <time>] [ogg|wav]
#   (Provide exactly 2 of: -ss, -t, -to)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  echo "Usage: $0 (-l <url> | -f <file>) <-ss time | -t sec | -to time (pick 2)> [ogg|wav]" >&2
  exit 1
}

to_sec() {
  awk -F: '{ s = 0; for (i = 1; i <= NF; i++) s = s * 60 + $i; print s }' <<<"$1"
}

mode=""
src=""
ss=""
t=""
to=""
fmt="ogg"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l) [[ $# -lt 2 ]] && usage; mode="link"; src="$2"; shift 2 ;;
    -f) [[ $# -lt 2 ]] && usage; mode="file"; src="$2"; shift 2 ;;
    -ss) [[ $# -lt 2 ]] && usage; ss="$2"; shift 2 ;;
    -t) [[ $# -lt 2 ]] && usage; t="$2"; shift 2 ;;
    -to) [[ $# -lt 2 ]] && usage; to="$2"; shift 2 ;;
    ogg|wav|--ogg|--wav) fmt="${1#--}"; shift ;;
    -fmt|--format) [[ $# -lt 2 ]] && usage; fmt="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) usage ;;
  esac
done

[[ -z "$mode" || -z "$src" ]] && usage

# Validate format
case "$fmt" in
  ogg) opts=(-c:a libvorbis -q:a 6) ;;
  wav) opts=(-c:a pcm_s16le) ;;
  *) echo "Error: format must be 'ogg' or 'wav'" >&2; exit 1 ;;
esac

# Require exactly 2 of -ss, -t, -to
count=0
[[ -n "$ss" ]] && ((count += 1))
[[ -n "$t" ]]  && ((count += 1))
[[ -n "$to" ]] && ((count += 1))
[[ $count -ne 2 ]] && { echo "Error: provide exactly 2 of -ss, -t, -to" >&2; usage; }

if [[ -n "$ss" && -n "$t" ]]; then
  start=$(to_sec "$ss")
  dur=$(to_sec "$t")
  time_opts=(-ss "$ss" -t "$t")
elif [[ -n "$ss" && -n "$to" ]]; then
  start=$(to_sec "$ss")
  dur=$(awk "BEGIN { print $(to_sec "$to") - $start }")
  time_opts=(-ss "$ss" -to "$to")
else
  dur=$(to_sec "$t")
  start=$(awk "BEGIN { print $(to_sec "$to") - $dur }")
  time_opts=(-ss "$start" -to "$to")
fi

if ! awk "BEGIN { exit !($start >= 0 && $dur > 0 && $dur <= 30) }"; then
  echo "Error: invalid timestamps (start=${start}s, duration=${dur}s; max 30s)." >&2
  exit 1
fi

# Step 1: Resolve input file (download via yt-dlp or use local file)
if [[ "$mode" == "link" ]]; then
  in_file=$(yt-dlp -f "bestaudio/best" -x --audio-format best --progress \
    -o "$ROOT_DIR/%(title)s.%(ext)s" --print after_move:filepath "$src")
else
  [[ -f "$src" ]] || { echo "Error: file not found: $src" >&2; exit 1; }
  in_file="$src"
fi

base="$(basename "${in_file%.*}")"
out_file="$ROOT_DIR/$base.$fmt"
[[ "$in_file" -ef "$out_file" ]] && out_file="$ROOT_DIR/${base}-clip.$fmt"

# Step 2: Trim and convert with ffmpeg
ffmpeg -i "$in_file" "${time_opts[@]}" -vn -map_metadata 0 "${opts[@]}" "$out_file"
echo "Saved: $out_file"
