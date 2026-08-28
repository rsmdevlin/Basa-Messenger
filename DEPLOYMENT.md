# Deployment Guide: Basa Messenger Backend на Render.com (Free)

## Архитектура
```
iPhone (Expo) → Render.com HTTPS URL → Express API → MazeHost MySQL
```

## Шаг 1: Подготовка GitHub репозитория

1. **Убедитесь, что проект в GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/basa-messenger.git
   git branch -M main
   git push -u origin main
   ```

2. **Проверьте .gitignore содержит:**
   ```
   .env
   .env.local
   .env*.local
   node_modules/
   dist/
   build/
   artifacts/*/dist
   ```

## Шаг 2: Создание приложения на Render.com

### 2.1 Регистрация
- Откройте https://render.com
- Зарегистрируйтесь через GitHub (быстрее всего)
- Дайте разрешение на доступ к репозиториям

### 2.2 Создание Web Service
1. Нажмите **"New +"** → **"Web Service"**
2. Выберите репозиторий `basa-messenger`
3. Заполните форму:
   - **Name:** `basa-messenger-api`
   - **Runtime:** Node
   - **Build Command:** `pnpm install && cd artifacts/api-server && pnpm run build`
   - **Start Command:** `cd artifacts/api-server && NODE_ENV=production node --enable-source-maps ./dist/index.mjs`
   - **Instance Type:** Free (но обновится на Starter, если нужна надежность)

### 2.3 Environment Variables
После создания Service, нажмите **"Environment"** и добавьте:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | Render назначает автоматически, но явно укажите |
| `DATABASE_URL` | `mysql://gs348298:eKDxA99Mc2sf@80.242.59.112:3306/gs348298` | Из MazeHost |
| `JWT_SECRET` | `your_long_random_secret_string_here` | Сгенерируйте что-то длинное |
| `JWT_EXPIRES_IN` | `30d` | |
| `JWT_REFRESH_EXPIRES_IN` | `90d` | |
| `CORS_ORIGIN` | `*` | Для мобильного доступа |

Нажмите **"Save changes"**

## Шаг 3: Получение публичного URL

После деплоя (5-10 минут):
1. В Render Dashboard откроется ваш сервис
2. Вверху будет URL вроде: `https://basa-messenger-api-xxx.onrender.com`
3. **Скопируйте этот URL** — это ваш `API_URL`

Проверьте здоровье сервера:
```
https://basa-messenger-api-xxx.onrender.com/health
```
Должен вернуть: `{"status":"ok","timestamp":"..."}`

## Шаг 4: Обновление React Native App

В файле `artifacts/test-app/context/AuthContext.tsx` (или где у вас хранится API URL):

```typescript
// Определяйте API_URL в зависимости от среды
const API_URL = __DEV__ 
  ? 'http://localhost:5000'
  : 'https://basa-messenger-api-xxx.onrender.com';  // ← Ваш Render URL
```

Или используйте переменную окружения в app.json:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://basa-messenger-api-xxx.onrender.com"
    }
  }
}
```

И в коде:
```typescript
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
```

## Шаг 5: Тестирование с iPhone

### 5.1 В локальной сети (для быстрого теста)
```bash
cd artifacts/test-app
npx expo start
```
На iPhone откройте Expo Go и отсканируйте QR код

### 5.2 Production сборка на iPhone (IPA)
```bash
cd artifacts/test-app
eas build --platform ios
```
После сборки скачайте IPA и установите на устройство

## Шаг 6: Мониторинг

На Render Dashboard:
- **Logs** — смотрите ошибки в реальном времени
- **Events** — деплои и перезагрузки
- **Metrics** — использование CPU/RAM (Free tier ограничен)

## Проблемы и решения

### "Free service spins down after 15 minutes of inactivity"
**Решение:** Upgrade на Starter ($7/месяц) или используйте cron-job для пингования каждые 14 минут:
```bash
# Добавьте в GitHub Actions или используйте UptimeRobot
curl https://basa-messenger-api-xxx.onrender.com/health
```

### "Database connection timeout"
**Решение:** 
- Проверьте DATABASE_URL в .env
- Убедитесь, что MazeHost разрешает внешние подключения
- Добавьте IP Render.com в whitelist (если есть)

### "CORS errors на iPhone"
**Решение:** 
- Убедитесь `CORS_ORIGIN=*` в Environment Variables
- Или установите конкретный домен: `CORS_ORIGIN=https://basa-messenger-api-xxx.onrender.com`

## Альтернатива: Railway.app

Если Render не подходит:

1. Откройте https://railway.app
2. Нажмите "Start a New Project" → "Deploy from GitHub"
3. Выберите репозиторий и ветку
4. Создайте переменные окружения через Dashboard
5. Деплой автоматический, URL вроде: `https://project-name-production.up.railway.app`

Railway дает $5/месяц бесплатного кредита, что хватает для небольшого приложения.

## Безопасность

⚠️ **Никогда не коммитьте:**
- `.env` файлы
- Реальные DATABASE_URL
- JWT_SECRET с хардкодом

✅ **Правильно:**
- `.env` в .gitignore
- Все секреты через Environment Variables на хостинге
- Используйте разные JWT_SECRET для dev/prod

## Автоматические деплои

После каждого `git push` в main:
1. Render автоматически запустит build
2. Если успешно → автоматический старт нового сервиса
3. Если ошибка → старый сервис продолжит работать

Смотрите Render Dashboard для статуса деплоя.

---

**Готово!** Теперь Basa Messenger доступен на iPhone через интернет 🚀
