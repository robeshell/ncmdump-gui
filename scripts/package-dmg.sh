#!/usr/bin/env bash
# Build ncmdump-gui .app and package a distributable DMG for macOS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="$(go env GOPATH)/bin:${PATH:-}"

if ! command -v wails >/dev/null 2>&1; then
  echo "error: wails not found. Install with:"
  echo "  go install github.com/wailsapp/wails/v2/cmd/wails@latest"
  exit 1
fi

# Platform: default universal (Intel + Apple Silicon). Override:
#   PLATFORM=darwin/arm64 ./scripts/package-dmg.sh
PLATFORM="${PLATFORM:-darwin/universal}"

APP_NAME="ncmdump-gui"
APP_PATH="build/bin/${APP_NAME}.app"
VOL_NAME="NCM 转换"
DMG_NAME="NCM转换"
DMG_PATH="build/bin/${DMG_NAME}.dmg"
STAGE="build/bin/dmg-stage"

echo "==> Building (${PLATFORM})..."
wails build -platform "${PLATFORM}" -clean

if [[ ! -d "${APP_PATH}" ]]; then
  echo "error: app bundle not found at ${APP_PATH}"
  exit 1
fi

echo "==> Creating DMG..."
rm -rf "${STAGE}" "${DMG_PATH}"
mkdir -p "${STAGE}"
cp -R "${APP_PATH}" "${STAGE}/"
ln -sf /Applications "${STAGE}/Applications"

hdiutil create \
  -volname "${VOL_NAME}" \
  -srcfolder "${STAGE}" \
  -ov \
  -format UDZO \
  "${DMG_PATH}"

rm -rf "${STAGE}"

echo ""
echo "Done."
echo "  App:  ${ROOT}/${APP_PATH}"
echo "  DMG:  ${ROOT}/${DMG_PATH}"
ls -lh "${DMG_PATH}"
echo ""
echo "Note: unsigned builds may need right-click → Open on the recipient's Mac."
