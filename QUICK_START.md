# Быстрый старт: Basa Messenger Production

## 📱 iPhone не на localhost? Вот инструкция:

### Вариант 1: Render.com (Рекомендуется - свободно, просто)

**За 5 минут:**

1. **GitHub**: Запушьте проект
   ```bash
   git push origin main
   ```

2. **Render.com**: Откройте https://render.com
   - Зарегистрируйтесь через GitHub
   - New → Web Service
   - Выберите `basa-messenger`
   - Build: `pnpm install && cd artifacts/api-server && pnpm run build`
   - Start: `cd artifacts/api-server && node --enable-source-maps ./dist/index.mjs`

3. **Environment Variables** (в Render Dashboard):
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=mysql://gs348298:eKDxA99Mc2sf@80.242.59.112:3306/gs348298
   JWT_SECRET=your_secret_here
   CORS_ORIGIN=*
   ```

4. **Получили URL**: `https://basa-messenger-api-xxx.onrender.com`

5. **iPhone**: Обновите в коде (в `AuthContext.tsx` или app.json):
   ```
   const API_URL = 'https://basa-messenger-api-xxx.onrender.com/api'
   ```

6. **Соберите IPA**:
   ```bash
   cd artifacts/test-app
   eas build --platform ios --auto-submit
   ```

**Готово!** iPhone подключится к облачному API через интернет 🚀

---

### Вариант 2: Railway.app (Тоже бесплатно, с бонусом $5)

1. https://railway.app → Start a New Project → Deploy from GitHub
2. Выберите репозиторий и ветку
3. Добавьте Environment Variables
4. Получите URL вроде: `https://project-production.up.railway.app`
5. Используйте как API_URL в приложении

---

## 🔧 Локально на своем компьютере?

Если хотите тестировать на локальной сети (быстрее для разработки):

```bash
# Терминал 1: API Server
cd artifacts/api-server
DATABASE_URL="mysql://gs348298:eKDxA99Mc2sf@80.242.59.112:3306/gs348298" \
PORT=5000 \
node --enable-source-maps ./dist/index.mjs

# Терминал 2: Expo App
cd artifacts/test-app
npx expo start

# На iPhone: Откройте Expo Go и отсканируйте QR код
```

Но для production (когда ваш iPhone будет в интернете, а не в локальной сети) **нужен Render/Railway**.

---

## ⚡ Проблемы?

- **"Free service spins down after 15 min"** → Upgrade на Starter ($7/месяц) или используйте UptimeRobot для пингования
- **"Database timeout"** → Проверьте DATABASE_URL и firewall MazeHost
- **"CORS error"** → Убедитесь CORS_ORIGIN=* в Environment Variables
- **Подробнее** → Смотрите `DEPLOYMENT.md`

---

## 📋 Чеклист перед production

- [ ] `.env` в `.gitignore` (секреты не в GitHub!)
- [ ] `EXPO_PUBLIC_API_URL` указывает на облачный сервер
- [ ] `DATABASE_URL` работает и из облака доступна MazeHost
- [ ] `JWT_SECRET` длинный и уникальный
- [ ] Протестировали регистрацию и логин с iPhone
- [ ] Render/Railway service здоров (check `/health`)
- [ ] Сборка IPA прошла успешно

---

**Готово к боевому деплою!** 🎉
