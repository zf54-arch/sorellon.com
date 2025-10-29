#!/bin/sh
set -eu

# Usage: ./fix_icons.sh [--dry-run]
DRYRUN=0
[ "${1-}" = "--dry-run" ] && { DRYRUN=1; echo ">>> DRY RUN: No files will be written."; }

THEME_LINE='<meta name="theme-color" content="#0b3d2e" />'
SNIPPET='<!-- Favicon & PWA -->
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/favicon-196.png">
<link rel="icon" type="image/png" sizes="196x196" href="/assets/icons/favicon-196.png">
<link rel="manifest" href="/assets/icons/site.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'

BACKUP_DIR="backups_$(date +%Y%m%d_%H%M%S)"
CHANGED_FILE="$(mktemp -t changed.XXXXXX)"
SKIPPED_FILE="$(mktemp -t skipped.XXXXXX)"

[ "$DRYRUN" -eq 0 ] && mkdir -p "$BACKUP_DIR"

# Find HTML files (skip node_modules and hidden dirs)
find . \( -name node_modules -o -name '.*' \) -prune -o -type f -name '*.html' -print0 |
while IFS= read -r -d '' f; do
  CONTENT="$(cat "$f")"

  echo "$CONTENT" | grep -q "<!-- Favicon & PWA -->" && { echo "$f (already has snippet)" >> "$SKIPPED_FILE"; continue; }

  if echo "$CONTENT" | grep -q 'name="theme-color"'; then
    UPDATED=$(awk -v snip="$SNIPPET" '{
      print;
      if (index($0,"name=\"theme-color\"")>0) print snip
    }' <<EOF2
$CONTENT
EOF2
)
    ACTION="inserted after theme-color"
  else
    echo "$CONTENT" | awk 'BEGIN{IGNORECASE=1} /<\/head>/{found=1; exit} END{exit !found}' >/dev/null 2>&1 \
      || { echo "$f (no </head> found)" >> "$SKIPPED_FILE"; continue; }
    UPDATED=$(awk -v theme="$THEME_LINE" -v snip="$SNIPPET" 'BEGIN{IGNORECASE=1}
      /<\/head>/ && !done { print theme "\n" snip; done=1 }
      { print }
    ' <<EOF3
$CONTENT
EOF3
)
    ACTION="added theme-color + snippet before </head>"
  fi

  if [ "$UPDATED" != "$CONTENT" ]; then
    if [ "$DRYRUN" -eq 0 ]; then
      mkdir -p "$(dirname "$BACKUP_DIR/$f")"
      cp "$f" "$BACKUP_DIR/$f"
      printf "%s" "$UPDATED" > "$f"
    fi
    echo "$f ($ACTION)" >> "$CHANGED_FILE"
  else
    echo "$f (no change)" >> "$SKIPPED_FILE"
  fi
done

# Ensure Netlify caches icons
HEADERS_RULE="/assets/icons/*
  Cache-Control: public, max-age=31536000, immutable
"
if [ -f _headers ]; then
  grep -q "/assets/icons/*" _headers || {
    [ "$DRYRUN" -eq 0 ] && printf "%s" "$HEADERS_RULE" >> _headers
    echo "Appended cache rule to _headers"
  }
else
  [ "$DRYRUN" -eq 0 ] && printf "%s" "$HEADERS_RULE" > _headers
  echo "Created _headers with cache rule"
fi

# Create site.webmanifest if missing (uses your maskable icons already in repo)
if [ ! -f assets/icons/site.webmanifest ]; then
  [ "$DRYRUN" -eq 0 ] && {
    mkdir -p assets/icons
    cat > assets/icons/site.webmanifest <<'JSON'
{
  "name": "Sorellon",
  "short_name": "Sorellon",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b3d2e",
  "theme_color": "#0b3d2e",
  "icons": [
    { "src": "/assets/icons/manifest-icon-192.maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/assets/icons/manifest-icon-512.maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
JSON
  }
  echo "Created assets/icons/site.webmanifest"
fi

# Report
check_icon() { [ -f ".$1" ] && echo "  ✔ $1" || echo "  ✘ $1 (missing)"; }
echo ""
echo "========== SUMMARY =========="
CHANGED_COUNT=$( [ -s "$CHANGED_FILE" ] && wc -l < "$CHANGED_FILE" || echo 0 )
SKIPPED_COUNT=$( [ -s "$SKIPPED_FILE" ] && wc -l < "$SKIPPED_FILE" || echo 0 )
echo "Changed: $CHANGED_COUNT"; [ -s "$CHANGED_FILE" ] && sed 's/^/  - /' "$CHANGED_FILE"
echo "Skipped: $SKIPPED_COUNT"; [ -s "$SKIPPED_FILE" ] && sed 's/^/  - /' "$SKIPPED_FILE"
echo ""
echo "Icon files present?"
check_icon /assets/icons/favicon-196.png
check_icon /assets/icons/manifest-icon-192.maskable.png
check_icon /assets/icons/manifest-icon-512.maskable.png
check_icon /assets/icons/site.webmanifest
echo ""
if [ "$DRYRUN" -eq 0 ]; then
  echo "Backups saved to: $BACKUP_DIR"
  echo "To revert everything: rsync -a \"$BACKUP_DIR/\" ./"
else
  echo "DRY RUN complete. Re-run without --dry-run to apply changes."
fi

rm -f "$CHANGED_FILE" "$SKIPPED_FILE"


