#!/bin/sh
# بالا آوردن پایگاه آزمایشی، API (۳۱۰۰ توسعه، ۳۱۰۱ بات بله)، سرورهای ساختگی و vite (۵۱۸۰)
R=$(cd "$(dirname "$0")/../.." && pwd)
export DATABASE_URL='postgresql://postgres@localhost:5433/madrese_test?host=/tmp/pg' BOOTSTRAP_ADMIN_MOBILES=09120000000
pg_isready -h /tmp/pg -p 5433 >/dev/null 2>&1 || { PGC=$(ls /usr/lib/postgresql/*/bin/pg_ctl | head -1); rm -f /tmp/pg/data/postmaster.pid /tmp/pg/.s.PGSQL.5433*; su -s /bin/sh nobody -c "$PGC -D /tmp/pg/data -o '-p 5433 -k /tmp/pg' -l /tmp/pg/log start" >/dev/null; sleep 3; }
if [ "$1" = fresh ]; then
  fuser -k 3100/tcp 3101/tcp >/dev/null 2>&1; sleep 1
  psql -h /tmp/pg -p 5433 -U postgres -c "drop database if exists madrese_test" -c "create database madrese_test" postgres >/dev/null
  (cd $R/apps/api && node dist/db/migrate.js | tail -1 && SEED_DEMO=true node dist/db/seed.js | tail -1)
fi
cd $R/tests; for f in fakebbb fakesafir fakebale; do pgrep -f $f.py >/dev/null || [ ! -f $f.py ] || nohup python3 $f.py >/tmp/$f.log 2>&1 & done
cd $R/apps/api; fuser -k 3100/tcp 3101/tcp >/dev/null 2>&1; sleep 1
nohup env PORT=3100 SMS_PROVIDER=console STAFF_MFA=on EITAA_APP_TOKEN=test:eitaa-token BBB_URL=http://127.0.0.1:9300/bigbluebutton/api BBB_SECRET=testsecret BALE_SAFIR_URL=http://127.0.0.1:9310/api/v3 BALE_SAFIR_API_KEY=test-safir-key BALE_SAFIR_BOT_ID=12345 node dist/main.js >/tmp/api.log 2>&1 &
nohup env NODE_ENV=production SMS_PROVIDER=console JWT_SECRET=$(openssl rand -hex 32) OTP_SECRET=$(openssl rand -hex 32) PUBLIC_URL=http://localhost PORT=3101 BALE_BOT_API=http://127.0.0.1:9320 BALE_BOT_TOKEN=test:bale-token BALE_BOT_USERNAME=madrese_bot node dist/main.js >/tmp/api2.log 2>&1 &
cd $R/apps/web; fuser -k 5180/tcp >/dev/null 2>&1; nohup env API_URL=http://localhost:3100 npx vite --port 5180 >/tmp/vite.log 2>&1 &
sleep 8; curl -s localhost:3100/api/health; echo
