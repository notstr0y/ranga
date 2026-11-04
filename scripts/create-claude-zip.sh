#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$ROOT/claude-context"
ZIP_NAME="ranga-claude-context.zip"
STAGING="$OUTPUT_DIR/ranga-project"

mkdir -p "$OUTPUT_DIR"
rm -rf "$STAGING"
mkdir -p "$STAGING"

cd "$ROOT"

echo "Preparing RANGA project files..."

# Directories to include
INCLUDE_DIRS=(
    src
    public
    scripts
    supabase
    docs
    design-reference
)

# Root files to include
ROOT_FILES=(
    package.json
    package-lock.json
    index.html
    README.md
    vite.config.ts
    tsconfig.json
    tsconfig.app.json
    tsconfig.node.json
    .gitignore
    .oxlintrc.json
    .env.example
)

# Copy selected directories, excluding generated/private content
for dir in "${INCLUDE_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        mkdir -p "$STAGING/$dir"

        rsync -a \
            --exclude='.git/' \
            --exclude='node_modules/' \
            --exclude='dist/' \
            --exclude='build/' \
            --exclude='coverage/' \
            --exclude='.next/' \
            --exclude='.temp/' \
            --exclude='*.log' \
            --exclude='*.pem' \
            --exclude='*.key' \
            --exclude='*.p12' \
            --exclude='*.pfx' \
            --exclude='*.sqlite' \
            --exclude='*.db' \
            "$dir/" "$STAGING/$dir/"
    fi
done

# Copy selected root files
for file in "${ROOT_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        cp "$file" "$STAGING/"
    fi
done

# Remove all real environment files, including nested ones.
find "$STAGING" -type f \( \
    -name '.env' -o \
    -name '.env.*' -o \
    -name '*secret*' -o \
    -name '*credential*' \
\) ! -name '.env.example' -delete

# Add project metadata
cat > "$STAGING/CLAUDE-READ-ME.txt" <<EOF
RANGA PROJECT CONTEXT
Generated: $(date)

This archive contains the selected RANGA source code,
SQL scripts, documentation, design references and assets.

IMPORTANT:
- .env.local and real environment files are excluded.
- API keys, passwords and storage credentials must not be requested.
- .env.example contains placeholders only.
- Inspect the existing implementation before changing anything.
- Do not assume SQL scripts have already been executed.
- Refer to the separately supplied CSE 2024 curriculum PDF
  for official subject names and codes.
EOF

# Remove old archive and create a fresh one
rm -f "$OUTPUT_DIR/$ZIP_NAME"

(
    cd "$OUTPUT_DIR"
    zip -qr "$ZIP_NAME" ranga-project
)

# Remove temporary staging directory
rm -rf "$STAGING"

echo
echo "======================================"
echo "RANGA Claude archive created!"
echo "======================================"
echo "File: $OUTPUT_DIR/$ZIP_NAME"
echo "Size: $(du -h "$OUTPUT_DIR/$ZIP_NAME" | cut -f1)"
echo
echo "Review the ZIP before uploading:"
echo "  unzip -l \"$OUTPUT_DIR/$ZIP_NAME\""
echo
echo "Never upload .env.local or real credentials."

