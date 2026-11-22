#!/usr/bin/env bash
# مدرسهٔ هدایت — وضعیت به‌روزرسانی خودکار در یک نگاه: bash deploy/update-status.sh
cd "$(dirname "$0")/.."
S=.auto-update
env_get() { [ -f .env ] && grep -E "^$1=" .env | tail -1 | cut -d= -f2- || true; }
PORT="$(env_get API_PORT)"
echo "== نسخهٔ در حال اجرا: $(curl -fsS -m 5 "http://127.0.0.1:${PORT:-3000}/api/health" 2>/dev/null || echo 'جواب نمی‌دهد')"
echo "== کد روی سرور: $(git log --oneline -1 2>/dev/null)"
git fetch -q origin main 2>/dev/null && echo "== آخرین روی گیت‌هاب: $(git show origin/main:apps/api/package.json | sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' | head -1) · $(git log --oneline -1 origin/main)" || echo "== گیت‌هاب: گرفتن نشد"
echo "== cron: $(cat /etc/cron.d/madrese-auto-update 2>/dev/null | grep -v '^#' || echo 'نصب نشده')"
echo "== سرویس cron: $(systemctl is-active cron 2>/dev/null || systemctl is-active crond 2>/dev/null)"
echo "== آخرین بررسی: $(cat $S/last-check 2>/dev/null || echo 'هرگز')"
echo "== نسخهٔ خراب‌شده: $(cat $S/failed 2>/dev/null || echo '-')"
echo "== تغییر دستی در فایل‌های گیت: $(git status --porcelain --untracked-files=no | tr '\n' ' ' | sed 's/^$/ندارد/')"
echo "== پشتیبان‌ها: $(ls -1t $S/backups 2>/dev/null | head -3 | tr '\n' ' ')"
echo "== ۱۵ خط آخر گزارش:"; tail -15 $S/log 2>/dev/null | grep -v '^ *#' || echo "   (خالی)"
