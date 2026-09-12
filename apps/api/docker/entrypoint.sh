#!/bin/sh
set -e

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
PGUSER="postgres"
PGDB="${POSTGRES_DB:-velozity}"

mkdir -p /run/postgresql
chown -R postgres:postgres /run/postgresql

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "==> No existing database found, initializing PostgreSQL data directory at $PGDATA"
  mkdir -p "$PGDATA"
  chown -R postgres:postgres /var/lib/postgresql
  su-exec postgres initdb -D "$PGDATA" --auth=trust --username="$PGUSER"
fi

chown -R postgres:postgres /var/lib/postgresql

echo "==> Starting PostgreSQL"
su-exec postgres pg_ctl -D "$PGDATA" -l /var/lib/postgresql/pg.log -w start

FRESH_DB=false
if ! su-exec postgres psql -U "$PGUSER" -lqt | cut -d '|' -f1 | grep -qw "$PGDB"; then
  echo "==> Creating database $PGDB"
  su-exec postgres createdb -U "$PGUSER" "$PGDB"
  FRESH_DB=true
fi

echo "==> Running Prisma migrations"
npx prisma migrate deploy

if [ "$FRESH_DB" = true ]; then
  echo "==> Seeding fresh database"
  npx tsx prisma/seed.ts
fi

echo "==> Starting API server"
exec node dist/index.js
