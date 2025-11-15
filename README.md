# Project 2 — Погодное дашборд-приложение

Клиентское приложение показывает актуальную погоду для текущего местоположения и сохранённых городов. Данные берём из API [OpenWeather](https://openweathermap.org/api), интерфейс собран на **React (Vite)**, **TypeScript** и **Tailwind CSS**.

## Возможности

- определение координат пользователя (при разрешении геолокации) и показ погоды поблизости;
- добавление городов по названию через геокодер OpenWeather, переключение и удаление карточек;
- поиск по сохранённым городам и восстановление их данных из `localStorage`;
- настройка отображаемых метрик (влажность, «ощущается как», рассвет/закат, скорость ветра);
- сохранение списка городов и выбранных настроек между перезагрузками.

## Запуск

```bash
npm install
cp .env.example .env
# впишите свой ключ OpenWeather в .env
npm run dev
```

Сборка production-версии:

```bash
npm run build
npm run preview
```

## Переменные окружения

Создайте `.env` (или скопируйте `.env.example`) и укажите ключ API:

```dotenv
VITE_OPENWEATHER_API_KEY=ВАШ_КЛЮЧ
```

Без этого значения приложение не сможет загрузить реальные данные, даже если интерфейс отрисуется.

## Деплой на GitHub Pages

1. Установите пакеты для деплоя: `npm install -D gh-pages`.
2. Дополните `package.json`:
   ```json
   "homepage": "https://<username>.github.io/<repo>",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Запустите `npm run deploy`, чтобы собрать проект и отправить содержимое `dist` в ветку `gh-pages`.

## Технологии

- React 18 + Vite
- TypeScript
- Tailwind CSS
- OpenWeather API (Current Weather + Geocoding)

