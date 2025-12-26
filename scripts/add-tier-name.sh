#!/usr/bin/env bash
set -euo pipefail

# add-tier-name.sh
# For each provided JSON file, split the "name" field into:
# - name: part before the first dash ( -, – or — ), trimmed
# - tierName: part after the first dash, trimmed (added only if absent/empty)
# Operates on:
# - { "medals": [ ... ] }
# - [ ... ]
# - single medal object
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

  # jq program:
  # - capture base and tier using the first dash occurrence (supports -, – or —)
  # - trim whitespace around both parts
  # - only set .tierName if it is missing or empty
  jq '
    def split_name:
      (.name // "") as $n
      | if ($n | type) == "string" then
          (try ($n | capture("^(?<base>.*?)\\s*[-–—]\\s*(?<tier>.*?)\\s*$")) catch null)
        else
          null
        end;

    def update_medal:
      (split_name) as $parts
      | if $parts == null then
          .
        else
          ($parts.base | gsub("^\\s+|\\s+$"; "")) as $base
          | ($parts.tier | gsub("^\\s+|\\s+$"; "")) as $tier
          | if ($base | length) > 0 and ($tier | length) > 0 then
              .name = $base
              | (if ((.tierName? // "") | length) == 0 then .tierName = $tier else . end)
            else
              .
            end
        end;

    if (has("medals") and (.medals | type == "array")) then
      .medals |= map(update_medal)
    elif (type == "array") then
      map(update_medal)
    else
      update_medal
    end
  ' "$in_file" > "$tmp"

  mv "$tmp" "$in_file"
  echo "Updated: $in_file (backup at $backup)"
done
