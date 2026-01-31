# План рефакторинга структуры проекта

## 0. Предварительные договорённости
- ✅ Определить целевой вариант: A (минимальный).
- ✅ Зафиксировать запрет на однострочный if (учесть при правках).
- ✅ Договориться об уровне риска: без смены API.

## 1. Инвентаризация и карта зависимостей
### 1.1. Список “общих” компонентов
- ✅ Найти компоненты внутри src/app/**, которые используются вне своей фичи.
- Кандидаты: TimeInput.tsx, Template* компоненты и т.п.
  - Найдено: src/app/profile/records/TimeInput.tsx (используется в tools/pace-calculator и tools/speed-to-pace).
  - Найдено: src/app/profile/records/RecordsClient.tsx (используется в admin/users/[userId]/records).

### 1.2. Список серверной логики
- ✅ Всё, что импортирует db/schema, считается серверным слоем.
- Кандидаты: src/lib/*, src/services/*, src/app/actions/*, src/app/api/**.
  - Найдено: src/services/users.ts.
  - Найдено: src/lib/alice.ts, src/lib/diary.ts, src/lib/personalRecords.ts, src/lib/planEntries.ts, src/lib/recoveryEntries.ts, src/lib/telegramLink.ts, src/lib/tokens.ts, src/lib/weightEntries.ts, src/lib/workoutReports.ts.
  - Найдено: src/app/actions/diaryTemplates.ts.
  - Найдено (app/api): auth/*, admin/*, diary/*, plans/*, register, shoes/*, telegram/*.
  - Найдено: src/app/admin/invites/page.tsx, src/app/admin/users/page.tsx, src/app/admin/users/[userId]/records/page.tsx.
  - Найдено: src/bot/services/telegramAccounts.ts, src/bot/services/telegramLinking.ts, src/bot/services/telegramSubscriptions.ts.
  - Найдено: src/scripts/seed.ts.

### 1.3. Список утилит/типов общего назначения
- ✅ src/utils, src/types, src/constants.
  - src/utils: templateEngine.ts, templateEngine.test.ts, templateMatching.ts, templateMatching.test.ts.
  - src/types: next-auth.d.ts.
  - src/constants: index.ts.

✅ Критерий готовности этапа 1: есть список файлов-кандидатов и понимание текущих зависимостей.

## 2. Этап минимальной стабилизации (общий для A/B/C)
### 2.1. Устранить зависимость utils -> app
- ✅ Вынести DiaryResultTemplate и другие типы из src/app/actions/diaryTemplates.ts в src/types/diary-templates.ts.
- ✅ Обновить импорты в src/utils/templateEngine.ts, src/utils/templateMatching.ts, src/components/templates/*, src/app/tools/templates/*.

### 2.2. Вынести кросс-фичевые UI из src/app/**
- ✅ Перенос src/app/profile/records/TimeInput.tsx -> src/components/inputs/TimeInput.tsx (или src/components/profile/TimeInput.tsx).
- ✅ Обновить импорты в src/app/profile/**, src/app/tools/**.

✅ Критерий готовности этапа 2: нет импортов из src/app/** в src/utils и нет общих компонентов внутри src/app.

## 3. Вариант A (минимальный)
- Оставить текущую структуру, применив только этап 2.
- Дополнительно:
  - ✅ Оставить src/lib как есть, но запретить импорт src/app из src/lib (проверено: импортов нет).
  - ✅ Зафиксировать правило: app -> components/lib/utils, но не наоборот.

✅ Критерий готовности A: логику и UI не перемещали массово, но циклов зависимостей нет.

## 4. Вариант B (умеренный)
### 4.1. Ввести src/server
- ✅ Переместить src/db -> src/server/db.
- ✅ Переместить src/services -> src/server/services.
- ✅ Переместить серверные модули из src/lib в src/server/*.
  - Инвентаризация:
    - src/db: client.ts, schema.ts.
    - src/services: users.ts.
    - src/lib (кандидаты в server): alice.ts, diary.ts, email.ts, personalRecords.ts, planEntries.ts, recoveryEntries.ts, registrationInvites.ts, telegramLink.ts, tokens.ts, weightEntries.ts, workoutReports.ts.
    - src/lib тесты: diary.test.ts, email.test.ts, tokens.test.ts.

### 4.2. Оставить src/shared
- ✅ Создать src/shared и перенести туда src/utils, src/types, src/constants (импорты обновлены на @/shared/*).
- ✅ Либо сохранить текущие каталоги, но запретить импорты server в клиентские компоненты — N/A (выбран src/shared).

### 4.3. Нормализовать доступ к данным
- src/app/api/** должен обращаться к src/server/**, а не к db напрямую.
  - Инвентаризация (прямые импорты db в app/api и app/actions):
    - app/actions: src/app/actions/diaryTemplates.ts.
    - app/api: admin/invites, admin/users/[userId]/{password,records,role,status}, auth/{forgot-password,reset-password,verify-email}, diary/workout-report, plans, plans/import, register, shoes, shoes/[shoeId], telegram/{link-code,status,unlink}.
  - ✅ app/actions/diaryTemplates.ts переведён на src/server/diaryTemplates (без прямых импортов db).
  - ✅ app/api/auth/* переведён на src/server/auth (без прямых импортов db).
  - ✅ app/api/telegram/* переведён на src/server/telegram (без прямых импортов db).
  - ✅ app/api/register/route.ts переведён на src/server/register (без прямых импортов db).
  - ✅ app/api/plans/* переведён на src/server/plans и src/server/planImports (без прямых импортов db).

Критерий готовности B: нет прямых импортов db из app/api, всё через server.

## 5. Вариант C (фичевая структура)
### 5.1. Ввести src/features/<feature>
- diary, plans, templates, profile, telegram, admin, tools.
- В каждом: ui/, server/, types.ts, utils.ts, tests/.

### 5.2. Переместить доменную логику
- src/lib/diary.ts -> src/features/diary/server/diary.ts.
- src/lib/planEntries.ts -> src/features/plans/server/planEntries.ts.
- src/components/templates/* -> src/features/templates/ui/*.

### 5.3. src/app оставить “thin”
- page.tsx, layout.tsx, route.ts только проксируют вызовы в features/*.

Критерий готовности C: все домены живут в features, app только маршрутизатор.

## 6. Миграция импортов
- ✅ Утвердить алиасы: @/shared/*, @/server/*, @/features/*.
- ✅ Массово обновить импорты (скриптом/regex) — N/A для варианта A.
- ✅ Проверить, что нет циклических импортов (madge: круговых зависимостей не найдено).

## 7. Тесты и валидация
- Запуск: npm run lint, npm run type-check, npm test.
- Проверить маршруты Next.js и bot runtime.
- Проверить, что Next.js app не потерял page.tsx/layout.tsx.

## 8. Риски и контроль
- Риск 1: сломаны пути Next.js — нужен контроль списка page.tsx.
- Риск 2: циклические зависимости — отслеживать импортную графику.
- Риск 3: server/shared перепутаны — запретить импорты server в клиентские компоненты.
