#!/usr/bin/env bash
# مدرسهٔ هدایت — نصب به‌روزرسانی خودکار (یک بار، با root):
#   sudo bash deploy/install-auto-update.sh
# یک خط در /etc/cron.d می‌گذارد که هر ۳ دقیقه deploy/auto-update.sh را اجرا کند.
# برداشتن: sudo rm /etc/cron.d/madrese-auto-update
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
[ "$(id -u)" = 0 ] || { echo "با sudo یا root اجرا کن"; exit 1; }
command -v flock >/dev/null || { echo "flock نیست (بستهٔ util-linux)"; exit 1; }
git -C "$ROOT" fetch -q origin main || { echo "خطا: سرور نمی‌تواند از گیت‌هاب بگیرد؛ اول git pull دستی را درست کن"; exit 1; }
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "این فایل‌های گیت روی سرور دستی عوض شده‌اند؛ به‌روزرسانی خودکار تا وقتی این‌طور باشد نصب نمی‌کند:"
  git status --short --untracked-files=no
  echo "اگر تغییرها لازم نیست: git checkout -- <فایل>  (یا تغییر را در .env بگذار، نه در فایل‌های گیت)"
fi
chmod +x deploy/auto-update.sh deploy/update-status.sh deploy/build-web.sh
mkdir -p "$ROOT/.auto-update"
cat > /etc/cron.d/madrese-auto-update <<EOF
# مدرسهٔ هدایت: به‌روزرسانی خودکار از گیت‌هاب (deploy/auto-update.sh)
*/3 * * * * root $ROOT/deploy/auto-update.sh >/dev/null 2>&1
EOF
chmod 644 /etc/cron.d/madrese-auto-update
systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null || systemctl enable --now cron 2>/dev/null || systemctl enable --now crond 2>/dev/null || echo "هشدار: سرویس cron روشن نیست"
echo "نصب شد: */3 * * * * $ROOT/deploy/auto-update.sh"
echo "یک بار اجرا…"
"$ROOT/deploy/auto-update.sh" || true
bash "$ROOT/deploy/update-status.sh"
