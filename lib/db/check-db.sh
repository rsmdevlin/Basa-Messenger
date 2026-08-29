#!/bin/bash

# Убедись что DATABASE_URL установлена в .env или Render environment
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL не найдена"
  echo "Убедись что переменная установлена в Render Environment Variables"
  exit 1
fi

echo "✅ DATABASE_URL найдена (пароль скрыт)"

cd "$(dirname "$0")"
pnpm exec tsx check-db.ts
