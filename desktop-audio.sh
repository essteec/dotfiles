#!/usr/bin/env bash
#
# desktop-audio.sh - Create desktop audio (max 30s) from a link or local media file
#
# Usage:
#   ./desktop-audio.sh (-l <url> | -f <file>) [-ss <time>] [-t <sec>] [-to <time>] [-fi <sec>] [-fo <sec>] [-o <path>] [ogg|wav]
#   (Provide exactly 2 of: -ss, -t, -to)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  echo "Usage: $0 (-l <url> | -f <file>) <-ss time | -t sec | -to time (pick 2)> [-fi sec] [-fo sec] [-o path] [ogg|wav]" >&2
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
fi_val=""
fo_val=""
out_name=""
fmt="ogg"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l) [[ $# -lt 2 ]] && usage; mode="link"; src="$2"; shift 2 ;;
    -f) [[ $# -lt 2 ]] && usage; mode="file"; src="$2"; shift 2 ;;
    -ss) [[ $# -lt 2 ]] && usage; ss="$2"; shift 2 ;;
    -t) [[ $# -lt 2 ]] && usage; t="$2"; shift 2 ;;
    -to) [[ $# -lt 2 ]] && usage; to="$2"; shift 2 ;;
    -fi|--fade-in|-fade-in|--fadein|-fadein) [[ $# -lt 2 ]] && usage; fi_val="$2"; shift 2 ;;
    -fo|--fade-out|-fade-out|--fadeout|-fadeout) [[ $# -lt 2 ]] && usage; fo_val="$2"; shift 2 ;;
    -o|--output|-output) [[ $# -lt 2 ]] && usage; out_name="$2"; shift 2 ;;
    ogg|wav|--ogg|--wav) fmt="${1#--}"; shift ;;
    -fmt|--format) [[ $# -lt 2 ]] && usage; fmt="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) usage ;;
  esac
done

[[ -z "$mode" || -z "$src" ]] && usage

# Infer format from -o if provided with an extension
if [[ -n "$out_name" && "$out_name" =~ \.(ogg|wav)$ ]]; then
  fmt="${BASH_REMATCH[1]}"
fi

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
elif [[ -n "$ss" && -n "$to" ]]; then
  start=$(to_sec "$ss")
  dur=$(awk "BEGIN { print $(to_sec "$to") - $start }")
else
  dur=$(to_sec "$t")
  start=$(awk "BEGIN { print $(to_sec "$to") - $dur }")
fi

if ! awk "BEGIN { exit !($start >= 0 && $dur > 0 && $dur <= 30) }"; then
  echo "Error: invalid timestamps (start=${start}s, duration=${dur}s; max 30s)." >&2
  exit 1
fi

time_opts=(-ss "$start" -t "$dur")

# Configure fade-in and fade-out audio filters
filter_opts=()
af_filters=()

if [[ -n "$fi_val" ]]; then
  fi_sec=$(to_sec "$fi_val")
  if ! awk "BEGIN { exit !($fi_sec > 0 && $fi_sec <= $dur) }"; then
    echo "Error: fade-in duration ($fi_sec s) must be between 0 and clip duration ($dur s)." >&2
    exit 1
  fi
  af_filters+=("afade=t=in:st=0:d=$fi_sec")
fi

if [[ -n "$fo_val" ]]; then
  fo_sec=$(to_sec "$fo_val")
  if ! awk "BEGIN { exit !($fo_sec > 0 && $fo_sec <= $dur) }"; then
    echo "Error: fade-out duration ($fo_sec s) must be between 0 and clip duration ($dur s)." >&2
    exit 1
  fi
  fo_start=$(awk "BEGIN { print $dur - $fo_sec }")
  af_filters+=("afade=t=out:st=$fo_start:d=$fo_sec")
fi

if [[ -n "$fi_val" && -n "$fo_val" ]]; then
  if ! awk "BEGIN { exit !($fi_sec + $fo_sec <= $dur) }"; then
    echo "Error: combined fade durations ($fi_sec s + $fo_sec s) exceed clip duration ($dur s)." >&2
    exit 1
  fi
fi

if [[ ${#af_filters[@]} -gt 0 ]]; then
  IFS=,
  filter_opts=(-af "${af_filters[*]}")
  unset IFS
fi

# Step 1: Resolve input file (download via yt-dlp or use local file)
if [[ "$mode" == "link" ]]; then
  tmp_file=$(mktemp)
  trap 'rm -f "$tmp_file"' EXIT
  yt-dlp -f "bestaudio/best" -x --audio-format best \
    -o "$ROOT_DIR/%(title)s.%(ext)s" --print-to-file after_move:filepath "$tmp_file" "$src"
  in_file=$(head -n 1 "$tmp_file" | tr -d '\r\n')
  rm -f "$tmp_file"
  trap - EXIT
  [[ -z "$in_file" || ! -f "$in_file" ]] && { echo "Error: failed to download audio with yt-dlp" >&2; exit 1; }
else
  [[ -f "$src" ]] || { echo "Error: file not found: $src" >&2; exit 1; }
  in_file="$src"
fi

if [[ -n "$out_name" ]]; then
  if [[ "$out_name" =~ \.(ogg|wav)$ ]]; then
    out_file="$out_name"
  else
    out_file="${out_name}.$fmt"
  fi
  [[ -f "$out_file" && "$in_file" -ef "$out_file" ]] && {
    echo "Error: output file cannot be identical to input file ($out_file)" >&2
    exit 1
  }
else
  base="$(basename "${in_file%.*}")"
  out_file="$ROOT_DIR/$base.$fmt"
  [[ "$in_file" -ef "$out_file" ]] && out_file="$ROOT_DIR/${base}-clip.$fmt"
fi

# Ensure output directory exists
mkdir -p "$(dirname "$out_file")"

# Step 2: Trim and convert with ffmpeg
ffmpeg "${time_opts[@]}" -i "$in_file" -vn -map_metadata 0 "${filter_opts[@]}" "${opts[@]}" "$out_file"
echo "Saved: $out_file"
