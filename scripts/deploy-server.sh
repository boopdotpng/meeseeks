#!/usr/bin/env bash
# Build this fork's server on a remote Linux host and swap it into that host's t3 service.
# npm only has upstream builds under the same version numbers, so remote servers update this way.
#
#   scripts/deploy-server.sh [host] [build|install|all]    (defaults: tens all)
#
# build:   pull the current branch into ~/builds/floof on the host and package a runtime archive.
# install: replace the service's active runtime with that archive and restart the service.
#          The previous runtime is kept at ~/.t3/runtime/meeseeks-prev.
set -euo pipefail

host="${1:-tens}"
step="${2:-all}"
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
branch="$(git -C "$repo_root" rev-parse --abbrev-ref HEAD)"
local_head="$(git -C "$repo_root" rev-parse HEAD)"

case "$step" in build | install | all) ;; *)
  echo "usage: $0 [host] [build|install|all]" >&2
  exit 2
  ;;
esac

if [[ "$step" != install ]] && ! git -C "$repo_root" branch -r --contains "$local_head" | grep -q .; then
  echo "warning: $local_head is not pushed; the host builds what $branch is on the remote." >&2
fi

ssh "$host" bash -s -- "$step" "$branch" <<'REMOTE'
set -euo pipefail
step="$1"
branch="$2"
export PATH="$HOME/.cargo/bin:$PATH"
# shellcheck disable=SC1091
[[ -f "$HOME/.config/vite-plus/env" ]] && . "$HOME/.config/vite-plus/env"
repo="$HOME/builds/floof"
out="$repo/release-cli"

if [[ "$step" != install ]]; then
  cd "$repo"
  git fetch --quiet origin "$branch"
  git checkout --quiet "$branch"
  git merge --ff-only --quiet "origin/$branch"
  echo "[deploy] building $(git log -1 --format='%h %s')"

  # Use the repo's pinned Node for this build only; the host's own node setup stays untouched.
  node_version="$(sed -n 's/.*"node": "\([^"]*\)".*/\1/p' package.json)"
  vp env install "$node_version" >/dev/null
  export PATH="$HOME/.local/share/vite-plus/js_runtime/node/$node_version/bin:$PATH"

  vp i
  vp run --filter t3 build
  (cd apps/server && node scripts/cli.ts build-exe)
  cargo build --locked --release --manifest-path native/resource-monitor/Cargo.toml

  rm -rf "$out"
  mkdir -p "$out/resource-monitor/linux-x64"
  cp native/resource-monitor/target/release/t3-resource-monitor "$out/resource-monitor/linux-x64/"
  version="$(node -p 'require("./apps/server/package.json").version')"
  node scripts/build-cli-archive.ts --platform linux --arch x64 --version "$version" \
    --resource-monitor-dir "$out/resource-monitor" --output-dir "$out" --system-libatomic
  git rev-parse HEAD > "$out/COMMIT"
  echo "[deploy] built $(ls "$out"/*.tar.gz)"
fi

if [[ "$step" != build ]]; then
  archive="$(ls "$out"/*.tar.gz)"
  runtime="$HOME/.t3/runtime"
  # Install under the built version: the desktop's SSH launcher runs versions/<its own version>
  # and downloads stock upstream when that directory is missing.
  active="$(node -p "require('$repo/apps/server/package.json').version")"
  target="$runtime/versions/$active"
  staging="$(mktemp -d "$runtime/meeseeks-staging.XXXXXX")"
  tar -xzf "$archive" -C "$staging"
  built="$(find "$staging" -mindepth 1 -maxdepth 1 -type d)"
  cp "$out/COMMIT" "$built/MEESEEKS_COMMIT"
  # The service launcher only runs runtimes its installer marked complete.
  printf '%s\n' "$active" > "$built/.install-complete"

  rm -rf "$runtime/meeseeks-prev"
  if [[ -d "$target" ]]; then mv "$target" "$runtime/meeseeks-prev"; fi
  mv "$built" "$target"
  rmdir "$staging"
  node -e '
    const fs = require("fs");
    const [file, version] = process.argv.slice(1);
    const state = JSON.parse(fs.readFileSync(file, "utf8"));
    state.activeVersion = version;
    // A committed update must target activeVersion; this swap is not an update.
    delete state.update;
    fs.writeFileSync(file, JSON.stringify(state, null, 2) + "\n");
  ' "$runtime/service-state.json" "$active"
  echo "[deploy] installed $(cat "$target/MEESEEKS_COMMIT") as t3@$active; restarting t3code.service"
  systemctl --user restart t3code.service
  systemctl --user --no-pager status t3code.service | head -5
fi
REMOTE
