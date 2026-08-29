# Запуск Basa Messenger локально

## Шаг 1: Убедись что зависимости установлены
```bash
cd C:\Users\myteg\Desktop\Basa-Messenger
pnpm install
```

## Шаг 2: Запусти Expo dev server
```bash
cd artifacts\test-app
npx expo start
```

## Шаг 3: Отсканируй QR код
- На iPhone установи **Expo Go** из App Store
- Открой приложение
- Нажми "Scan QR Code"
- Отсканируй QR код из терминала

## Альтернатива: Веб версия
```bash
npx expo start --web
```

---

## Если ошибка "expo-secure-store not found"
1. Убедись что `expo-secure-store` добавлен в `artifacts/test-app/package.json`
2. Запусти: `pnpm install`
3. Запусти: `npx expo start --clear`

## Если ошибка про build scripts
```bash
pnpm approve-builds
# Выбери "No" для всех
```

---

**Backend API:** https://basa-messenger.onrender.com/api
**Local dev:** npx expo start
