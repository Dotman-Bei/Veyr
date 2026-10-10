#!/usr/bin/env bash
# splice.sh: replace frame ranges of the master with re-rendered patches, then mux the WAV.
# Each piece is encoded on its own with identical settings and the pieces are joined with the
# concat demuxer (stream copy), so memory stays flat however long the film is.
# Usage: bash scripts/splice.sh master.mp4 out.mp4 A-B:patch1.mp4 C-D:patch2.mp4 ...   (ranges ascending)
set -euo pipefail
MASTER=$1; OUT=$2; shift 2
WAV=public/audio/soundtrack.wav
W=$(mktemp -d); trap 'rm -rf "$W"' EXIT
ENC=(-an -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p -r 60 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv)
TOTAL=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$MASTER")
i=0; prev=0; : > "$W/list.txt"
piece() { echo "file '$W/p$i.mp4'" >> "$W/list.txt"; i=$((i+1)); }
cut() { # master frames [a, b)
  ffmpeg -loglevel error -y -i "$MASTER" -vf "trim=start_frame=$1:end_frame=$2,setpts=PTS-STARTPTS" "${ENC[@]}" "$W/p$i.mp4"; piece; }
for spec in "$@"; do
  r=${spec%%:*}; file=${spec#*:}; a=${r%-*}; b=${r#*-}
  (( a > prev )) && cut "$prev" "$a"
  ffmpeg -loglevel error -y -i "$file" "${ENC[@]}" "$W/p$i.mp4"; piece
  prev=$((b + 1))
done
(( prev < TOTAL )) && cut "$prev" "$TOTAL"
ffmpeg -loglevel error -y -f concat -safe 0 -i "$W/list.txt" -i "$WAV" -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "spliced -> $OUT ($i pieces)"
