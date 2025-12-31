#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/add-type-names.sh [path/to/medals.json]
#
# Defaults to src/data/medals.json
# Requires: jq

INPUT="${1:-src/data/medals.json}"

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but not found in PATH." >&2
  exit 1
fi

if [ ! -f "$INPUT" ]; then
  echo "Error: Input file not found: $INPUT" >&2
  exit 1
fi

TMP="${INPUT}.tmp"
BACKUP="${INPUT}.bak.$(date +%Y%m%d%H%M%S)"

# Mapping from type -> human-friendly Swedish typeName
read -r -d '' MAP <<'JSON' || true
{
  "pistol_mark": "Pistolskyttemärket",
  "elite_mark": "Elitmärket",
  "championship_mark": "Mästarmärket",
  "field_mark": "Fältskyttemärket",
  "precision_mark": "Precisionsskyttemärket",
  "skis_mark": "Skidskyttemärket",
  "running_mark": "Springskyttemärket",
  "national_full_match_mark": "Nationell helmatch",
  "military_fast_match_mark": "Militär snabbmatch",
  "air_pistol_mark": "Luftpistolmärket"
}
JSON

# Transform:
# - If .typeName exists and is non-empty, keep it.
# - Else set .typeName = map[type] if present,
#   otherwise titleize the raw type (e.g., "unknown_type" -> "Unknown Type").
jq --argjson map "$MAP" '
  def titleize:
    split("_")
    | map(if length > 0
          then (.[0:1] | ascii_upcase) + (.[1:] | ascii_downcase)
          else "" end)
    | join(" ");

  .medals |= (map(
    # Preserve existing non-empty typeName; otherwise compute from .type
    (.type // "") as $rawtype
    | ($rawtype | tostring) as $key
    | .typeName =
        (if ((.typeName // "") | tostring | length) > 0
         then .typeName
         else
           (if ($key | length) == 0
            then "Okänd"
            else ($map[$key] // ($key | titleize))
            end)
         end)
  ))
' "$INPUT" > "$TMP"

cp "$INPUT" "$BACKUP"
mv "$TMP" "$INPUT"

echo "Updated $INPUT"
echo "Backup saved as $BACKUP"
