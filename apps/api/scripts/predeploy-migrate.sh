#!/bin/sh
# Railway api preDeploy - resolve Prisma via pnpm layout under /app/database.
set -eu
cd /app
PRISMA_JS="$(node -e "const p=require('path'); const d=p.dirname(require.resolve('prisma/package.json',{paths:['/app/database']})); process.stdout.write(p.join(d,'build','index.js'))")"
exec node "$PRISMA_JS" migrate deploy --schema=/app/database/prisma/schema.prisma
