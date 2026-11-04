
#!/usr/bin/env bash

set -Eeuo pipefail

# Run from anywhere; resolve the repository root.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="$(basename "$ROOT")"

# Keep the archive outside the project directory.
OUTPUT="${1:-"$ROOT/../${PROJECT_NAME}-antigravity-context.zip"}"

if ! command -v zip >/dev/null 2>&1; then
    echo "Error: zip is not installed."
    echo "Install it with: sudo pacman -S zip"
    exit 1
fi

cd "$ROOT"

# Relevant frontend source, assets, documentation and configuration.
INCLUDE=(
    "src"
    "public"
    "docs"
    "claude-context"
    "design-reference"
    "package.json"
    "package-lock.json"
    "index.html"
    "README.md"
    ".gitignore"
    ".oxlintrc.json"
    "tsconfig.json"
    "tsconfig.app.json"
    "tsconfig.node.json"
    "vite.config.ts"
)

# Only include paths that exist.
EXISTING=()

for item in "${INCLUDE[@]}"; do
    if [[ -e "$item" ]]; then
        EXISTING+=("$item")
    fi
done

if [[ ${#EXISTING[@]} -eq 0 ]]; then
    echo "Error: No project files found."
    exit 1
fi

# Avoid accidentally including an old archive.
rm -f "$OUTPUT"

echo "Creating Ranga Antigravity context archive..."
echo

zip -r "$OUTPUT" "${EXISTING[@]}" \
    -x "*/node_modules/*" \
       "*/.git/*" \
       "*/dist/*" \
       "*/build/*" \
       "*/coverage/*" \
       "*/.next/*" \
       "*/.temp/*" \
       "*/.env" \
       "*/.env.*" \
       ".env" \
       ".env.*" \
       "*/.DS_Store" \
       "*/Thumbs.db" \
       "*/.vite/*" \
       "*/coverage/*"

echo
echo "======================================"
echo " RANGA CONTEXT ARCHIVE CREATED"
echo "======================================"
echo "Archive: $OUTPUT"
echo "Size:    $(du -h "$OUTPUT" | cut -f1)"
echo
echo "Included:"
printf '  - %s\n' "${EXISTING[@]}"
echo
echo "Excluded:"
echo "  - Environment files and secrets"
echo "  - Git history"
echo "  - Dependencies and build outputs"
echo "  - Supabase database/backend files"
echo
echo "Ready to provide to Antigravity."

