# Training Plan

**Training Plan** — это современная платформа для планирования и анализа беговых тренировок. Приложение помогает спортсменам вести дневник, анализировать прогресс и использовать полезные инструменты для расчетов.

🚀 **Production:** [swarm-protocol.ru](https://swarm-protocol.ru)

---

## 🛠 Технологический стек

Проект построен на современном стеке технологий, обеспечивающем высокую производительность и удобство разработки.

### Frontend

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Library:** [Ant Design 6](https://ant.design/)
- **Styling:** CSS Modules / SCSS
- **State/Form:** React Hook Form / local state

### Backend & Database

- **API:** Next.js API Routes (Serverless functions)
- **Auth:** [NextAuth.js](https://next-auth.js.org/)
- **Database:** PostgreSQL
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)

### Infrastructure & Tools

- **Containerization:** Docker & Docker Compose
- **Bot:** [GrammY](https://grammy.dev/) (Telegram Bot integration)
- **Linting:** ESLint, Prettier, Husky (pre-commit hooks)
- **Testing:** Vitest

---

## ✨ Основные возможности

- 📅 **Дневник тренировок:** Удобное отображение плана и факта тренировок, интеграция с календарем.
- 📊 **Аналитика:** Детальный анализ выполнения заданий, учет объема и интенсивности.
- 📥 **Импорт планов:** Возможность загрузки тренировочных планов из Excel файлов.
- 🧮 **Инструменты:**
  - **Калькулятор темпа:** Расчет темпа на дистанции, прогноз результатов.
  - **Конвертер скоростей:** Перевод км/ч в мин/км и другие единицы.
- 🤖 **Telegram Бот:** Уведомления и взаимодействие с платформой через мессенджер.

---

## 🚀 Запуск проекта

### Предварительные требования

- [Node.js](https://nodejs.org/) (v20+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (для запуска БД)

### Установка и запуск

1.  **Клонируйте репозиторий:**

    ```bash
    git clone https://github.com/raidzer/training-plan.git
    cd training-plan
    ```

2.  **Установите зависимости:**

    ```bash
    npm install
    ```

3.  **Настройка окружения:**
    Создайте файл `.env` в корне проекта (сиспользуйте пример из `.env.example`, если есть, или запросите конфигурацию).

4.  **Запуск базы данных (PostgreSQL):**

    ```bash
    npm run db:up
    ```

5.  **Инициализация (Миграции и Seed):**

    ```bash
    npm run dev:init
    ```

    _Эта команда запустит контейнер БД, подождет его готовности, применит миграции и заполнит базу тестовыми данными._

6.  **Запуск в режиме разработки:**
    ```bash
    npm run dev
    ```
    Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

---

## 📜 Доступные скрипты

- `npm run dev` — Запуск сервера разработки.
- `npm run build` — Сборка проекта для продакшена.
- `npm run start` — Запуск собранного проекта.
- `npm run lint` / `npm run lint:fix` — Проверка и исправление линтером.
- `npm run db:push` — Применение схемы БД через Drizzle Kit.
- `npm run db:studio` — Запуск Drizzle Studio для управления БД в браузере.
- `npm run test` — Запуск тестов (Vitest).
