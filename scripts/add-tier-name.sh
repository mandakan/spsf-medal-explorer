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

  echo "Processing: $in_file"
  echo " - Backup: $backup"

  top_type=$(jq -r 'type' "$in_file" 2>/dev/null || echo "unknown")
  echo " - JSON top-level type: $top_type"

  if jq -e 'has("medals") and (.medals | type=="array")' "$in_file" >/dev/null 2>&1; then
    count=$(jq -r '.medals | length' "$in_file")
    echo " - medals[] count: $count"
  elif jq -e 'type=="array"' "$in_file" >/dev/null 2>&1; then
    count=$(jq -r 'length' "$in_file")
    echo " - top-level array length: $count"
  else
    echo " - no medals[] array; walking entire document"
  fi

  obj_with_names=$(jq -r '[.. | objects | select((.name? | type=="string") or (.displayName? | type=="string"))] | length' "$in_file" 2>/dev/null || echo 0)
  echo " - objects with name/displayName: $obj_with_names"

  jq '
    def trim: gsub("^\\s+|\\s+$"; "");
    def normalize_spaces: gsub("\\s+"; " ") | trim;
    def normalize_no_dash($s):
      ($s // "") | gsub("\\s*[-–—]\\s*"; " ") | normalize_spaces;

    # Split on first dash into base/tier
    def dash_parts($s):
      try ($s | capture("^(?<base>.*?)\\s*[-–—]\\s*(?<tier>.*?)\\s*$")) catch null;

    # Generic trailing tier phrase (no dash):
    #  - Colors (Guld|Silver|Brons) possibly with extra words
    #  - Any "med ..." phrase (e.g. "med kvistar", "med en stjärna", "med blå emalj", ...)
    def generic_parts($s):
      try (
        $s | capture("^(?<base>.*?)\\s+(?<tier>(?:Guld|Silver|Brons)(?:\\s+.*)?|med\\s+.*)\\s*$")
      ) catch null;

    def has_str_name: (.name? | type=="string");
    def has_str_display: (.displayName? | type=="string");

    def choose_candidate:
      if has_str_display then .displayName
      elif has_str_name then .name
      else ""
      end;

    def fix_one:
      . as $orig
      | (choose_candidate) as $cand
      | (dash_parts($cand) // generic_parts($cand)) as $p
      | if ($cand | type) == "string" and $p != null and ($p.base | length) > 0 and ($p.tier | length) > 0 then
          ($p.base | trim) as $base
          | ($p.tier | trim) as $tier
          | .tierName = (if ((.tierName? // "") | length) == 0 then $tier else .tierName end)
          | .name = $base
          | .displayName = (($base + " " + .tierName) | normalize_spaces)
        else
          # No structured parts found; at minimum remove dashes if present
          (if has_str_name then .name = normalize_no_dash(.name) else . end)
          | (if has_str_display then .displayName = normalize_no_dash(.displayName) else . end)
        end;

    if has("medals") and (.medals | type=="array") then
      .medals |= map(fix_one)
    elif type=="array" then
      map(fix_one)
    else
      fix_one
    end
  ' "$in_file" > "$tmp"

  if [ ! -s "$tmp" ]; then
    echo "ERROR: Transformation produced empty output for $in_file. Leaving original in place. Backup at $backup" >&2
    rm -f "$tmp"
    continue
  fi

  if ! jq -e '.' "$tmp" >/dev/null 2>&1; then
    echo "ERROR: Transformed file is invalid JSON for $in_file. Restoring backup." >&2
    rm -f "$tmp"
    cp "$backup" "$in_file"
    continue
  fi

  final_count=$(jq -r 'if has("medals") and (.medals|type=="array") then .medals|length elif type=="array" then length else ([..|objects|select(has("id"))] | length) end' "$tmp" 2>/dev/null || echo "?")
  echo " - transformed items count estimate: $final_count"

  mv "$tmp" "$in_file"
  echo "Updated: $in_file (backup at $backup)"
done
