# DroneMovement - Система анализа движения дронов

Spring Boot приложение для анализа, предсказания и визуализации траекторий движения дронов.

## Структура проекта

### Backend (Java)
- `src/main/java/com/example/dronemovement/Controller/DroneController.java` - REST API контроллер
- `src/main/java/com/example/dronemovement/DTO/` - Data Transfer Objects
- `src/main/java/com/example/dronemovement/DroneMovementApplication.java` - Главный класс приложения

### Frontend (HTML/CSS/JavaScript)

#### HTML
- `src/main/resources/static/index.html` - Главная страница приложения

#### CSS
- `src/main/resources/static/css/styles.css` - Все стили приложения

#### JavaScript (модульная структура)
- `src/main/resources/static/js/utils.js` - Утилиты и вспомогательные функции
- `src/main/resources/static/js/telemetry.js` - Работа с телеметрическими данными
- `src/main/resources/static/js/api.js` - API функции для взаимодействия с сервером
- `src/main/resources/static/js/charts.js` - Графики и визуализация данных
- `src/main/resources/static/js/3d-visualization.js` - 3D визуализация движения дрона
- `src/main/resources/static/js/init.js` - Инициализация приложения

## Функциональность

### API Endpoints
- `POST /api/drones/predict-path` - Предсказание траектории дрона
- `POST /api/drones/drone-type` - Определение типа дрона
- `POST /api/drones/trajectory-visualization` - Визуализация траектории

### Веб-интерфейс
- Загрузка телеметрии через JSON файлы
- Добавление точек телеметрии вручную
- Определение типа дрона (quadcopter, fixed-wing, VTOL)
- Предсказание траектории движения
- 3D визуализация в реальном времени
- Графики отклонений прогноза от реальности
- Анализ точности предсказаний

## Технологии

### Backend
- Spring Boot 3.5.3
- Java 17
- Apache Commons Math (интерполяция и аппроксимация)
- Maven

### Frontend
- HTML5/CSS3
- JavaScript (ES6+)
- Chart.js (графики)
- Three.js (3D визуализация)
- OrbitControls (управление 3D камерой)

## Запуск приложения

1. Убедитесь, что у вас установлена Java 17
2. Клонируйте репозиторий
3. Запустите приложение:
   ```bash
   mvn spring-boot:run
   ```
4. Откройте браузер и перейдите по адресу: `http://localhost:8080`

## Использование

1. **Загрузка данных**: Загрузите JSON файл с телеметрией или добавьте точки вручную
2. **Определение типа дрона**: Нажмите "Detect Drone Type" для анализа типа дрона
3. **Предсказание траектории**: Выберите метод (аппроксимация/интерполяция) и нажмите "Create Graph and Predict Path"
4. **3D визуализация**: Используйте элементы управления для навигации в 3D пространстве
5. **Анализ отклонений**: Изучите графики для оценки точности предсказаний

## Структура JSON файла

```json
{
  "drone_id": "drone_01",
  "drone_type": "quadcopter",
  "telemetry": [
    {
      "time": 0.0,
      "position": [37.617, 55.755],
      "altitude": 100.0
    }
  ]
}
```

## Особенности архитектуры

### Модульная структура JavaScript
- Разделение ответственности между файлами
- Переиспользование кода через утилиты
- Улучшенная обработка ошибок
- Валидация данных

### CSS организация
- Все стили в одном файле
- Семантические классы
- Адаптивный дизайн
- Стили для 3D элементов управления

### API интеграция
- RESTful API
- Обработка ошибок HTTP
- Валидация входных данных
- Логирование операций

## Разработка

### Добавление новых функций
1. Создайте соответствующий JavaScript модуль
2. Добавьте подключение в `index.html`
3. Обновите API контроллер при необходимости
4. Добавьте стили в `styles.css`

### Отладка
- Используйте консоль браузера для отладки JavaScript
- Проверьте логи Spring Boot для отладки сервера
- Валидация данных происходит на клиенте и сервере

### Мои данные
- tg - t.me/ImpleXxX
- vk - vk.com/1mplexx
- gm - daniladubinkin@gmail.com

### :)