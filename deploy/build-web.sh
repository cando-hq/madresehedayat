#!/usr/bin/env bash
# مدرسهٔ هدایت — ساخت فایل‌های وب و کپی در پوشهٔ nginx خود سرور
#
#   ./deploy/build-web.sh                  →  /var/www/madrese
#   ./deploy/build-web.sh /srv/madrese     →  پوشهٔ دیگر
#
# ساخت داخل Docker انجام می‌شود (Node روی سرور لازم نیست). تنظیم‌های NESHAN_KEY، MAP_TILES،
# NODE_IMAGE و NPM_REGISTRY از .env خوانده می‌شوند. بعد از هر git pull دوباره اجرا شود.
set -euo pipefail
cd "$(dirname "$0")/.."

DEST="${1:-/var/www/madrese}"
TAG=madrese-web-build
OUT=.web-out

env_get() { [ -f .env ] && grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' || true; }
args=()
add_arg() { local v; v="$(env_get "$2")"; [ -n "$v" ] && args+=(--build-arg "$1=$v") || true; }
add_arg NODE_IMAGE NODE_IMAGE
add_arg NPM_REGISTRY NPM_REGISTRY
add_arg VITE_MAP_TILES MAP_TILES
add_arg VITE_NESHAN_KEY NESHAN_KEY

echo "ساخت وب…"
docker build -f apps/web/Dockerfile --target build -t "$TAG" "${args[@]}" .

rm -rf "$OUT"
id="$(docker create "$TAG")"
docker cp "$id:/app/apps/web/dist" "$OUT"
docker rm "$id" >/dev/null

echo "کپی در $DEST …"
mkdir -p "$DEST"
# اول همه‌چیز جز index.html، آخر index.html؛ فایل‌های نسخهٔ قبل پاک نمی‌شوند تا کسی که صفحه را باز دارد خطا نبیند
( cd "$OUT" && find . -type f ! -path ./index.html -exec install -D -m 644 {} "$DEST/{}" \; )
install -m 644 "$OUT/index.html" "$DEST/index.html"
rm -rf "$OUT"

echo "تمام. نسخه: $(grep -m1 '"version"' apps/web/package.json | cut -d'"' -f4)"
