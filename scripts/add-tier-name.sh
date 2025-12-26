#!/usr/bin/env bash
set -euo pipefail

# add-tier-name.sh
# Normalize medal naming across mixed formats.
# - Extract base and tier from either displayName or name.
#   • If a dash ( -, – or — ) is present, split on the first dash.
#   • Otherwise, try Swedish star patterns like:
#     "(Guld|Silver|Brons)? med (en|två|tre) stjärna/stjärnor" as a trailing tier phrase.
# - Write:
#   • tierName: set if missing/empty.
#   • name: base + " " + tierName (no dash), trimmed.
#   • displayName: same as name (no dash).
# - If no structured split found, at least remove dashes from textual fields (name/displayName).
# Operates on:
# - Any JSON shape; walks recursively and only updates objects that have string name/displayName.
# Creates a timestamped backup: <file>.bak.<epoch>

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required. Install jq and retry." >&2
  exit 1
fi

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <json-file> [more-json-files...]" >&2
  exit 1
fi

for in_file in "$@"; do
  if [ ! -f "$in_file" ]; then
    echo "Skipping: $in_file (not found)" >&2
    continue
  fi

  backup="${in_file}.bak.$(date +%s)"
  tmp="${in_file}.tmp.$$"

  cp "$in_file" "$backup"

  jq '
    def trim: gsub("^\\s+|\\s+$"; "");
    def normalize_spaces: gsub("\\s+"; " ") | trim;
    def normalize_no_dash($s):
      ($s // "") | gsub("\\s*[-–—]\\s*"; " ") | normalize_spaces;

    # Split on first dash into base/tier
    def dash_parts($s):
      try ($s | capture("^(?<base>.*?)\\s*[-–—]\\s*(?<tier>.*?)\\s*$")) catch null;

    # Try Swedish star/tier suffix: "(Guld|Silver|Brons)? med (en|två|tre) stjärna/stjärnor"
    # Captures the whole suffix (including optional color) as tier.
    def star_parts($s):
      try ($s | capture("^(?<base>.*?)\\s+(?<tier>(?:(?:Guld|Silver|Brons)\\s+)?med\\s+(?:en|två|tre)\\s+stjärnor?)\\s*$")) catch null;

    def choose_candidate:
      ( ( .displayName? // .name? ) as $c
        | if ($c|type) == "string" then $c else "" end );

    def update_obj:
      (choose_candidate) as $cand
      | (dash_parts($cand)) as $d
      | (if $d == null then star_parts($cand) else null end) as $s
      | ($d // $s) as $p
      | if $p != null and ($p.base | length) > 0 and ($p.tier | length) > 0 then
          ($p.base | trim) as $base
          | ($p.tier | trim) as $tier
          | (if ((.tierName? // "") | length) == 0 then .tierName = $tier else . end)
          | .name = (($base + " " + $tier) | normalize_spaces)
          | .displayName = .name
        else
          # No structured parts found; at minimum remove dashes if present
          (if (.name? | type) == "string" then .name = normalize_no_dash(.name) else . end)
          | (if (.displayName? | type) == "string" then .displayName = normalize_no_dash(.displayName) else . end)
        end;

    def walk_all(f):
      def w:
        if type == "object" then
          (f | with_entries(.value |= ( . | w )))
        elif type == "array" then
          map( . | w )
        else
          .
        end;
      w;

    . | walk_all(update_obj)
  ' "$in_file" > "$tmp"

  mv "$tmp" "$in_file"
  echo "Updated: $in_file (backup at $backup)"
done
