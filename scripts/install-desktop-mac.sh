#!/bin/zsh
# Install the newest release/*-arm64.zip into /Applications, signed with a stable identity, and relaunch.
# Ad-hoc signatures change every build, which voids the keychain "Always Allow" grant for t3code Safe Storage.
set -euo pipefail
REPO=${0:A:h:h}
IDENTITY="${MEESEEKS_SIGN_IDENTITY:-$(security find-identity -v -p codesigning | awk '/Apple Development/ { print $2; exit }')}"
[[ -n "$IDENTITY" ]] || { echo "no Apple Development identity; set MEESEEKS_SIGN_IDENTITY"; exit 1; }
ZIP=$(ls -t "$REPO"/release/*-arm64.zip | head -1)
STAGE=/tmp/meeseeks-next
rm -rf "$STAGE" && mkdir -p "$STAGE"
ditto -x -k "$ZIP" "$STAGE"
APP=$(ls -d "$STAGE"/*.app | head -1)
codesign --force --deep --sign "$IDENTITY" "$APP"
codesign --verify --deep --strict "$APP"
echo "signed $(basename "$APP") from $(basename "$ZIP")"

if pgrep -xq meeseeks; then
  osascript -e 'tell application "meeseeks" to quit'
  for _ in {1..60}; do pgrep -xq meeseeks || break; sleep 0.5; done
  if pgrep -xq meeseeks; then echo "meeseeks did not quit; nothing changed"; exit 1; fi
fi
rm -rf /tmp/meeseeks.old.app
mv /Applications/meeseeks.app /tmp/meeseeks.old.app
ditto "$APP" /Applications/meeseeks.app
open -a /Applications/meeseeks.app
echo "installed and launched"
