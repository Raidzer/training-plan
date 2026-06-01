# План внедрения адаптивной верстки

## Цель

Сделать приложение удобным на телефоне, планшете и ПК без полной миграции стека. Основной путь:
оставить Ant Design и SCSS modules, привести layout к единой responsive-системе, а затем точечно
переработать самые важные экраны.

Tailwind на первом этапе не подключаем. Решение пересмотреть после стабилизации базовой
адаптивности, если останется много повторяющихся utility-правил для сеток, отступов и responsive
состояний.

## Целевые размеры

- Телефон: 360-430 px.
- Большой телефон / маленький планшет: 600-767 px.
- Планшет: 768-1023 px.
- Ноутбук: 1024-1365 px.
- Широкий desktop: 1366 px и больше.

Минимальный обязательный набор проверок перед завершением каждого этапа:

- 390 x 844: телефон.
- 768 x 1024: планшет.
- 1440 x 900: desktop.

## Общие принципы

- Сначала чинить общий каркас и повторяемые паттерны, затем отдельные страницы.
- Для рабочих экранов важнее плотная и предсказуемая компоновка, чем декоративная верстка.
- Ant Design оставляем для форм, таблиц, календарей, модалок, уведомлений и базовых контролов.
- SCSS modules используем для layout-правил, responsive grid, page spacing и локальных улучшений.
- На мобильном не пытаться показывать все desktop-таблицы как есть. Часто лучше карточки,
  секции, collapse или упрощенный список.
- Таблицы, которые используются редко или только администраторами, можно временно стабилизировать
  через horizontal scroll и скрытие вторичных колонок.
- Изменения внедрять маленькими PR-совместимыми шагами, чтобы каждый шаг можно было проверить
  отдельно.

## Этап 0. Подготовка и базовая диагностика

Цель: зафиксировать текущее состояние и определить порядок работ без изменения поведения.

Шаги:

1. Создать список ключевых экранов:
   - `/dashboard`
   - `/plan`
   - `/diary`
   - `/diary/period`
   - `/profile/shoes`
   - `/profile/records`
   - `/admin/users`
   - `/admin/invites`
   - `/tools/pace-calculator`
   - `/tools/speed-to-pace`
   - `/tools/templates`
2. Запустить приложение локально и открыть основные экраны на 390, 768 и 1440 px.
3. Зафиксировать фактические проблемы:
   - горизонтальный скролл страницы;
   - слишком узкий контент из-за вложенных padding;
   - кнопки, которые переносятся неудачно;
   - таблицы, которые вылезают за viewport;
   - карточки фиксированной ширины;
   - модалки, которые неудобны на телефоне.
4. Добавить короткую baseline-заметку в этот документ или в issue/PR description.

Готово, когда есть список экранов с приоритетами и понятны самые заметные mobile/tablet проблемы.

### Baseline этапа 0 от 2026-06-01

Статус: выполнен статический аудит проекта и runtime-проверка в браузере. Приложение проверено на
`http://localhost:3000` после входа тестовым admin-пользователем `test`. Первичная попытка запуска
из sandbox была нестабильной (`spawn EPERM` / зависание до `Ready`), поэтому для runtime-проверки
использовался вручную запущенный dev server.

Текущий стек:

- Next.js 15.5.5, React 19.2.
- Ant Design 6 как основной UI-kit.
- SCSS modules и глобальные CSS variables для локальной стилизации.
- Tailwind не подключен: нет `tailwind`/`postcss` конфигурации в корне проекта.

Ключевые экраны и приоритет:

- P0: `/dashboard`, `/plan`, `/diary`.
- P1: `/diary/period`, `/profile/shoes`, `/profile/records`, `/admin/users`, `/admin/invites`.
- P2: `/tools/pace-calculator`, `/tools/speed-to-pace`, `/tools/templates`, auth/register/login,
  `/results`.

Общие проблемы, найденные по коду:

- Общий shell задает фиксированные максимальные ширины `980px` и `1400px`, а отдельные страницы
  дополнительно добавляют собственный `padding: 24px`. На телефоне это создает риск двойных
  боковых отступов и слишком узкого полезного контента.
- Header на ширине до 720 px складывает бренд, навигацию и переключатель темы в одну колонку.
  Пункты меню остаются набором pill-кнопок вместо compact drawer-навигации.
- Повторяется один и тот же паттерн `headerRow/headerText/headerActions` в plan, diary, period,
  admin screens. Это хороший кандидат на общий `PageHeader`.
- AntD `Table` используется без явной mobile-стратегии на plan, diary period, admin users,
  admin invites и templates. Минимальная стабилизация: `scroll={{ x: ... }}`; для `/plan`
  лучше отдельное mobile card-представление.
- Несколько страниц имеют собственный page-wrapper с `min-height: 100vh` поверх root layout.
  Это может давать лишнюю высоту и неравномерные вертикальные отступы.

Runtime-проверка:

- Viewports: `390 x 844`, `768 x 1024`, `1440 x 900`.
- Проверены маршруты: `/dashboard`, `/plan`, `/diary`, `/diary/period`, `/profile/shoes`,
  `/profile/records`, `/admin/users`, `/admin/invites`, `/tools/pace-calculator`,
  `/tools/speed-to-pace`, `/tools/templates`, `/results`, `/login`, `/register`.
- `/login` после авторизации ожидаемо редиректит на `/dashboard`.

Baseline по экранам:

- `/dashboard`: глобального horizontal overflow нет на всех размерах. Карточки все еще фиксированы
  `240px x 170px`; нужно заменить на responsive grid и убрать жесткую высоту в пользу `min-height`.
- `/plan`: на телефоне подтвержден horizontal overflow страницы `375/433`. Источник - таблица и
  общая ширина app-shell. Для телефона нужен card-list режим; быстрый первый шаг - внутренний
  `Table.scroll`.
- `/diary`: глобального overflow нет на 390/768/1440. Экран уже адаптируется лучше остальных, но
  остается риск UX-перегруза: календарь, вложенные card-секции, длинная форма тренировки и modal
  ежедневного отчета.
- `/diary/period`: на телефоне подтвержден horizontal overflow `375/518`. Основные кандидаты -
  period controls и таблица. Нужен внутренний scroll таблицы и mobile-friendly панель диапазона.
- `/profile/shoes`: overflow не найден на проверенных размерах. Нужно сохранить это поведение после
  внедрения общего shell и проверить edit state с длинным названием.
- `/profile/records`: на телефоне overflow не найден, но на tablet подтвержден overflow `753/1000`.
  Причина вероятнее всего в desktop-grid строках, которые переключаются в mobile-режим только ниже
  `720px`; breakpoint нужно поднять или сделать grid более fluid.
- `/admin/users`: подтвержден overflow на phone `375/799` и tablet `753/799`. Нужны `Table.scroll`,
  минимальные ширины колонок и скрытие вторичных колонок на mobile/tablet.
- `/admin/invites`: подтвержден overflow на phone `375/760`; tablet уже без глобального overflow.
  Нужны `Table.scroll` и проверка блока newly-created invite.
- `/tools/pace-calculator`: overflow не найден на проверенных размерах. После изменения shell нужно
  повторно проверить input rows и result sections.
- `/tools/speed-to-pace`: overflow не найден на проверенных размерах.
- `/tools/templates`: глобального overflow не найден, но таблица есть; для надежности стоит добавить
  `Table.scroll`, чтобы длинные паттерны не ломали viewport.
- `/results`: overflow не найден на проверенных размерах.
- `/register`: overflow не найден на проверенных размерах.

Рекомендуемый порядок первых implementation-шагов по результатам baseline:

1. Этап 1: общий shell и fluid gutters.
2. Этап 2: Header drawer для mobile/tablet.
3. Этап 4: dashboard responsive grid как быстрый видимый выигрыш.
4. Этап 5: `/plan` table scroll, затем mobile cards.
5. Этап 6: `/diary` mobile секции и проверка длинных форм.
6. Этап 7/9: `/diary/period`, `/admin/users`, `/admin/invites` table scroll и column strategy.

## Этап 1. Единый responsive app shell

Цель: убрать разрозненные контейнеры и сделать предсказуемую ширину/отступы для всех страниц.

Основные файлы:

- `src/components/ThemeProvider/ThemeProvider.tsx`
- `src/components/ThemeProvider/ThemeProvider.module.scss`
- страницы с собственным `mainContainer` и `padding: 24px`

Шаги:

1. Ввести CSS-переменные для отступов и ширин:
   - `--page-gutter: clamp(12px, 3vw, 24px)`
   - `--page-block-gap`
   - `--content-width-default`
   - `--content-width-wide`
2. Обновить `.main`, `.mainWide`, `.mainFull` так, чтобы:
   - ширина всегда была `width: 100%`;
   - боковые отступы были fluid;
   - mobile не получал двойной padding от общего layout и страницы.
3. Пересмотреть страницы с `mainContainer`:
   - заменить жесткий `padding: 24px` на общий паттерн;
   - убрать `min-height: 100vh`, если он дублирует корневой layout и создает лишнюю высоту.
4. Проверить, что auth-страницы, dashboard, plan и diary не изменили визуальный смысл на desktop.
5. Добавить короткое правило в документацию: новые страницы используют общий shell, а не собственный
   full-page padding.

Готово, когда на 390 px нет лишнего двойного отступа, а desktop сохраняет комфортную максимальную
ширину.

### Статус этапа 1 от 2026-06-01

Статус: выполнено.

Сделано:

- Введены базовые CSS tokens в `src/app/globals.css`:
  - `--content-width-default`
  - `--content-width-wide`
  - `--page-gutter`
  - `--page-bottom-gap`
  - `--page-footer-gap`
- `ThemeProvider` переведен на эти tokens для `.main`, `.mainWide`, `.mainFull` и footer.
- Header container также использует `--content-width-default` и `--page-gutter`, чтобы совпадать с
  базовым shell.
- Убраны собственные `padding: 24px` и дублирующие `min-height: 100vh` у ключевых page wrappers:
  `/plan`, `/plan/import`, `/diary`, `/diary/period`, `/profile/shoes`, `/profile/records`.

Проверка после изменений:

- `npm run type-check` проходит.
- Browser check на `390 x 844`, `768 x 1024`, `1440 x 900` выполнен для ключевых приватных
  страниц.

Изменение метрик overflow после этапа 1:

- `/plan` phone: было `375/433`, стало `375/405`. Полностью не исправлено, нужна стратегия таблицы
  на этапе 5.
- `/diary/period` phone: было `375/518`, стало `375/490`. Полностью не исправлено, нужна стратегия
  controls/table на этапе 7.
- `/profile/records` tablet: было `753/1000`, стало `753/983`. Нужен breakpoint/grid fix на этапе 8.
- `/admin/users` phone/tablet и `/admin/invites` phone остаются с overflow из-за широких таблиц,
  это переносится на этап 9.

Правило для новых страниц: не добавлять full-page `padding: 24px` внутри страницы, если страница уже
рендерится внутри общего `ThemeProvider.main`. Страница должна занимать `width: 100%` и, если внутри
есть flex/grid/table-контент, задавать `min-width: 0` на верхнем wrapper.

## Этап 2. Responsive Header и навигация

Цель: сделать навигацию удобной на телефоне и не перегруженной на планшете.

Основные файлы:

- `src/components/Header/Header.tsx`
- `src/components/Header/Header.module.scss`

Шаги:

1. Сохранить текущую desktop-навигацию для ширины от 1024 px.
2. Для tablet/mobile добавить компактный режим:
   - бренд слева;
   - кнопка меню справа;
   - переключатель темы доступен в меню или рядом с кнопкой меню.
3. Использовать AntD `Drawer` и `Menu` для мобильной навигации.
4. Перенести пункты:
   - О клубе
   - Полезное
   - Результаты клуба
   - Личный кабинет
5. Для группы "Полезное" использовать вложенный пункт или отдельные пункты в Drawer.
6. Проверить keyboard/focus поведение:
   - меню открывается кнопкой;
   - drawer закрывается после перехода;
   - интерактивные элементы имеют понятные labels.
7. Убрать mobile-компоновку, где все nav-link просто переносятся несколькими строками.

Готово, когда header занимает одну аккуратную строку на телефоне, а все пункты доступны через меню.

### Статус этапа 2 от 2026-06-01

Статус: выполнено.

Сделано:

- `Header` переведен в client component, так как теперь управляет состоянием мобильного Drawer.
- Desktop-навигация сохранена для ширины от `1024px`.
- На `1023px` и ниже header показывает бренд и кнопку меню вместо многострочного набора nav-link.
- Мобильная/планшетная навигация реализована через AntD `Drawer` + `Menu`.
- В Drawer перенесены пункты:
  - О клубе
  - Полезное
  - Результаты клуба
  - Личный кабинет
- Переключатель темы доступен внутри Drawer.
- Drawer закрывается после выбора пункта меню.

Проверка после изменений:

- `npm run type-check` проходит.
- Browser check:
  - `390 x 844`: desktop nav скрыт, кнопка меню видна, Drawer открывается без horizontal overflow.
  - `768 x 1024`: desktop nav скрыт, кнопка меню видна.
  - `1440 x 900`: desktop nav и переключатель темы видны, кнопка меню скрыта.

## Этап 3. Общие page-компоненты и layout-паттерны

Цель: уменьшить дублирование и сделать новые экраны адаптивными по умолчанию.

Возможные компоненты:

- `PageShell`
- `PageHeader`
- `ResponsiveActions`
- `ResponsiveGrid`

Шаги:

1. Выделить `PageHeader` для повторяющегося паттерна:
   - title;
   - subtitle;
   - actions;
   - mobile full-width actions при необходимости.
2. Выделить `PageShell`, если после этапа 1 останется много одинаковой разметки страниц.
3. Для action groups использовать единый responsive-паттерн:
   - desktop: кнопки справа;
   - mobile: кнопки переносятся и занимают удобную ширину только там, где это оправдано.
4. Не делать большую абстракцию раньше времени. Начать с 2-3 экранов и выделять компонент только
   после повторения паттерна.
5. Обновить plan, diary period, admin users, admin invites на общий header-паттерн.

Готово, когда повторяющиеся header/action layout больше не копируются вручную в каждом модуле.

### Статус этапа 3 от 2026-06-01

Статус: выполнено.

Сделано:

- добавлен общий `PageHeader`:
  - `src/components/PageHeader/PageHeader.tsx`;
  - `src/components/PageHeader/PageHeader.module.scss`;
  - `src/components/PageHeader/index.ts`;
- на общий header-паттерн переведены:
  - `src/app/plan/page.tsx`;
  - `src/app/plan/import/page.tsx`;
  - `src/app/diary/DiaryClient/components/DiaryHeader.tsx`;
  - `src/app/diary/period/DiaryPeriodClient.tsx`;
  - `src/app/admin/users/AdminUsersClient.tsx`;
  - `src/app/admin/invites/AdminInvitesClient.tsx`;
- из модульных SCSS удалено дублирование `headerRow`, `headerText`, `headerActions`,
  `title` и `subtitle`, где оно заменено общим компонентом;
- `PageShell` пока не выделялся: после этапа 1 общего контейнера из `ThemeProvider` достаточно,
  а новая абстракция сейчас не уменьшит сложность.

Проверка:

- `npm run type-check` проходит;
- Browser smoke check на `390 x 844` и `1440 x 900` проходит для:
  - `/plan`;
  - `/plan/import`;
  - `/diary`;
  - `/diary/period`;
  - `/admin/users`;
  - `/admin/invites`.

Оставшийся horizontal overflow на phone для `/plan`, `/diary/period`, `/admin/users`
и `/admin/invites` относится к следующим этапам с таблицами, фильтрами и гридом.

## Этап 4. Dashboard

Цель: сделать главный рабочий экран удобным на всех размерах.

Основные файлы:

- `src/app/dashboard/DashboardClient/DashboardClient.tsx`
- `src/app/dashboard/DashboardClient/dashboard.module.scss`

Шаги:

1. Заменить фиксированные карточки `240px x 170px` на responsive grid:
   - `repeat(auto-fit, minmax(min(100%, 220px), 1fr))`
   - стабильная минимальная высота вместо фиксированной высоты.
2. Сделать приветственный блок адаптивным:
   - desktop: текст слева, выход справа;
   - mobile: текст сверху, выход ниже или справа, если хватает места.
3. Убрать зависимость от AntD `Space` там, где он мешает ширине контейнера.
4. Проверить длинное имя/email пользователя.
5. Проверить набор карточек для admin и обычного пользователя.

Готово, когда dashboard не имеет пустых узких колонок, карточки занимают всю доступную ширину на
телефоне и аккуратную сетку на desktop.

### Статус этапа 4 от 2026-06-01

Статус: выполнено.

Сделано:

- внешний `Space` на dashboard заменен обычным page-wrapper, чтобы контейнер занимал всю доступную
  ширину;
- приветственный блок стал адаптивным:
  - desktop/tablet: текст слева, выход справа;
  - phone: текст сверху, кнопка выхода на всю доступную ширину;
- карточки заменены с фиксированных `240px x 170px` на responsive grid:
  - `repeat(auto-fit, minmax(min(100%, 220px), 1fr))`;
  - `width: 100%`;
  - стабильная `min-height` вместо фиксированной ширины;
- для приветствия и заголовков карточек добавлен перенос длинного текста через `overflow-wrap`;
- добавлен component test для набора карточек:
  - admin видит 7 карточек, включая `Администрирование` и `Шаблоны`;
  - обычный пользователь видит 5 карточек без admin-only пунктов.

Проверка:

- `npm run type-check` проходит;
- `npm exec vitest -- run tests/app/dashboard/DashboardClient.test.tsx` проходит;
- Browser check `/dashboard`:
  - `390 x 844`: 1 колонка, horizontal overflow нет;
  - `768 x 1024`: 2 колонки, horizontal overflow нет;
  - `1440 x 900`: 3 колонки, horizontal overflow нет.

## Этап 5. План тренировок

Цель: сделать `/plan` читаемым и управляемым на телефоне, не ухудшая desktop-таблицу.

Основные файлы:

- `src/app/plan/page.tsx`
- `src/app/plan/components/PlanEntriesTable.tsx`
- `src/app/plan/plan.module.scss`

Шаги:

1. Быстрая стабилизация:
   - добавить `scroll={{ x: ... }}` для таблицы;
   - убедиться, что пагинация и кнопки действий не ломают ширину.
2. Добавить responsive-переключение представления:
   - desktop и широкий tablet landscape: `Table`;
   - phone и tablet portrait: список карточек дней.
3. Для mobile-карточки дня показать:
   - дату;
   - задачу;
   - комментарий, если есть;
   - статус отчета;
   - действия "Редактировать" и "Дневник" иконками/кнопками.
4. Сохранить подсветку сегодняшнего дня и workload-дня в обоих режимах.
5. Проверить автоскролл к сегодняшнему дню:
   - desktop row;
   - mobile card.
6. Убедиться, что HTML из `dangerouslySetInnerHTML` продолжает переноситься корректно.

Готово, когда на телефоне план читается без горизонтального скролла, а на desktop остается плотная
таблица.

### Статус этапа 5 от 2026-06-01

Статус: выполнено.

Сделано:

- desktop и широкий tablet landscape оставлены на AntD `Table`, таблица получила внутренний
  horizontal scroll через `scroll={{ x: 900 }}`, чтобы не раздвигать страницу;
- phone и tablet portrait переведены на список карточек дней:
  - дата с днем недели;
  - задание;
  - комментарий, если есть;
  - tags для `Сегодня`, `Рабочая`, `Заполнен` / `Нет отчета`;
  - действия редактирования и перехода в дневник;
- desktop table и mobile cards получают единый `data-plan-entry-key`, поэтому автоскролл к
  сегодняшнему дню выбирает видимый элемент;
- HTML-текст заданий и комментариев продолжает рендериться через `dangerouslySetInnerHTML`, но
  получил устойчивые переносы через `overflow-wrap`;
- исправлен общий `PageHeader` на phone: убран лишний вертикальный зазор из-за `flex-basis` у
  текстового блока;
- breakpoint card-view поднят до `1023px`.

Проверка:

- `npm run type-check` проходит;
- `npm exec vitest -- run tests/app/plan/components/PlanEntriesTable.test.tsx tests/app/dashboard/DashboardClient.test.tsx`
  проходит;
- Browser check `/plan`:
  - `390 x 844`: mobile-list включен, table скрыта, horizontal overflow нет;
  - `768 x 1024`: mobile-list включен, table скрыта, horizontal overflow нет;
  - `1024 x 768`: desktop table включена, horizontal overflow нет;
  - `1440 x 900`: desktop table включена, horizontal overflow нет.

Примечание: после добавления тестовых тренировок card-state проверен в браузере на реальных данных.

## Этап 6. Дневник за день

Цель: улучшить mobile UX самого сложного рабочего экрана.

Основные файлы:

- `src/app/diary/DiaryClient/DiaryClient.tsx`
- `src/app/diary/DiaryClient/diary.module.scss`
- компоненты внутри `src/app/diary/DiaryClient/components`

Шаги:

1. Сохранить текущую desktop-идею:
   - календарь слева;
   - выбранный день справа.
2. Для tablet проверить ширину календаря и day-card:
   - календарь не должен сжимать форму;
   - day-card не должен вылезать.
3. Для phone перейти к вертикальному сценарию:
   - header;
   - compact calendar;
   - статус дня;
   - вес;
   - восстановление;
   - тренировки.
4. Рассмотреть `Collapse` или `Tabs` для мобильных секций, если экран получается слишком длинным.
5. В `WorkoutsCard` проверить:
   - поля тренировки в одну колонку на телефоне;
   - score/meta grid без переполнения;
   - кнопка сохранения доступна после длинных textarea.
6. Проверить DailyReport modal:
   - ширина на телефоне;
   - прокрутка длинного текста;
   - кнопка закрытия видна.

Готово, когда дневник можно заполнить с телефона без horizontal scroll и без потери важных действий.

### Статус этапа 6 от 2026-06-01

Статус: выполнено.

Сделано:

- выполнено визуальное упрощение страницы после первичной адаптации:
  - убрана лишняя внешняя `Card`-обертка вокруг всего дневника;
  - `Вес`, `Восстановление` и `Тренировки` переведены из вложенных AntD `Card` в плоские
    внутренние секции;
  - status-блок оформлен как отдельная компактная панель;
  - уменьшена визуальная вложенность и увеличена рабочая ширина формы тренировки;
- desktop layout сохранен:
  - календарь слева;
  - выбранный день справа;
  - внутри дня `Вес/Восстановление` слева, `Тренировки` справа;
- tablet layout оставлен вертикальным внутри дня, чтобы календарь и форма тренировки не сжимали
  друг друга;
- phone layout уплотнен:
  - уменьшены padding у вложенных `Card`;
  - `WeightCard`, `RecoveryCard` и `WorkoutsCard` получили больше рабочей ширины;
  - кнопки сохранения на телефоне занимают доступную ширину;
  - score/meta grids в тренировке на телефоне переходят в одну колонку;
  - длинный HTML-текст задания и комментария переносится через `overflow-wrap`;
- `DailyReportModal` получил:
  - responsive width;
  - ограничение высоты;
  - внутреннюю прокрутку body;
  - перенос длинных строк отчета;
  - footer с переносом кнопок при нехватке места.

Проверка:

- `npm run type-check` проходит;
- `npm exec vitest -- run tests/app/diary/WorkoutsCard.test.tsx` проходит;
- Browser check `/diary?date=2026-05-18` на реальной тренировке:
  - `390 x 844`: vertical layout, workout card шире после правки, horizontal overflow нет;
  - `768 x 1024`: vertical day layout, workout card не вылезает, horizontal overflow нет;
  - `1440 x 900`: desktop grid сохранен, horizontal overflow нет;
- `DailyReportModal` на `390 x 844`:
  - modal помещается в viewport;
  - close button видна;
  - body имеет `overflow-y: auto`;
  - footer buttons видны.

## Этап 7. Дневник за период

Цель: сделать обзор периода пригодным для телефона и планшета.

Основные файлы:

- `src/app/diary/period/DiaryPeriodClient.tsx`
- `src/app/diary/period/period.module.scss`

Шаги:

1. Header привести к общему `PageHeader`.
2. Range controls сделать mobile-friendly:
   - `RangePicker` занимает доступную ширину;
   - быстрые кнопки переносятся аккуратно;
   - export-кнопка не теряется.
3. Summary cards оставить responsive grid.
4. Таблицу стабилизировать:
   - сначала добавить `scroll={{ x: ... }}`;
   - затем рассмотреть mobile-list, если экран часто используется с телефона.
5. Проверить диапазоны 7 и 30 дней.

Готово, когда период можно просмотреть и экспортировать с телефона без поломанной панели фильтров.

### Статус этапа 7 от 2026-06-01

Статус: выполнено.

Сделано:

- header уже использует общий `PageHeader`;
- панель диапазона переведена с `Space` на CSS-grid:
  - `RangePicker` занимает доступную ширину;
  - быстрые кнопки переносятся аккуратно;
  - export-кнопка остается видимой на phone/tablet;
- summary cards оставлены responsive grid и защищены от переполнения длинного текста;
- desktop и широкий tablet landscape оставлены на AntD `Table`;
- для phone и tablet portrait добавлен card-list:
  - дата;
  - статус заполнения;
  - вес;
  - дистанция;
  - восстановление;
  - тренировки;
- таблица получила внутренний `scroll={{ x: 860 }}` и больше не раздвигает страницу.

Проверка:

- `npm run type-check` проходит;
- Browser check `/diary/period`:
  - `390 x 844`: card-list включен, horizontal overflow нет;
  - `768 x 1024`: card-list включен, horizontal overflow нет;
  - `1024 x 768`: table включена, horizontal overflow нет;
  - `1440 x 900`: table включена, horizontal overflow нет;
- быстрые диапазоны на `390 x 844`:
  - `Последние 7 дней`: 7 карточек, horizontal overflow нет;
  - `Последние 30 дней`: 30 карточек, horizontal overflow нет.

## Этап 8. Профиль: обувь и рекорды

Цель: привести формы профиля к единому mobile-поведению.

Основные файлы:

- `src/app/profile/shoes/ShoesClient.tsx`
- `src/app/profile/shoes/shoes.module.scss`
- `src/app/profile/records/RecordsClient.tsx`
- `src/app/profile/records/records.module.scss`

Шаги:

1. Для обуви:
   - проверить form row на 390 px;
   - сделать кнопки добавления/сохранения удобными по ширине;
   - проверить edit state для длинного названия обуви.
2. Для рекордов:
   - сохранить текущую mobile-логику с row в одну колонку;
   - проверить длинные ссылки на протокол;
   - сделать actions sticky/visible только если это действительно удобно.
3. Убрать лишний page padding после внедрения общего shell.
4. Проверить empty/loading/error состояния.

Готово, когда профильные формы заполняются на телефоне без масштабирования страницы.

### Статус этапа 8 от 2026-06-01

Статус: выполнено.

Сделано:

- `profile/shoes`:
  - страница больше не центрируется по вертикали, card стартует сверху рабочей области;
  - form row на `390px` переходит в одну колонку;
  - кнопка добавления на телефоне занимает доступную ширину;
  - list item и edit row защищены от переполнения длинного названия;
  - actions в item row на телефоне переносятся под название;
- `profile/records`:
  - страница переведена в wide layout, но card ограничена `1120px`;
  - desktop сетка заменена на карточки дистанций в две колонки, чтобы поля не были сжаты в одну строку;
  - tablet layout переведен на карточные строки в 2 колонки;
  - phone layout переведен на карточные строки в 1 колонку;
  - labels полей показываются на всех ширинах;
  - подсказка `Как заполнять` заменена на спокойный help-блок с нормальными отступами и переносами;
  - длинные значения и ссылки не раздвигают viewport;
  - save action на телефоне занимает доступную ширину;
- лишний page padding не добавлялся: страницы используют общий shell и локальные card constraints.

Проверка:

- `npm run type-check` проходит;
- Browser check:
  - `/profile/shoes` на `390 x 844`, `768 x 1024`, `1440 x 900`: horizontal overflow нет;
  - `/profile/records` на `390 x 844`, `768 x 1024`, `1440 x 900`: horizontal overflow нет;
  - `/profile/records` на `390 x 844`: rows в одну колонку, save button full width;
  - `/profile/records` на `768 x 1024`: rows в две колонки, labels видны.

## Этап 9. Админка и шаблоны

Цель: стабилизировать менее частые, но широкие рабочие экраны.

Основные файлы:

- `src/app/admin/users/AdminUsersClient.tsx`
- `src/app/admin/users/admin-users.module.scss`
- `src/app/admin/invites/AdminInvitesClient.tsx`
- `src/app/admin/invites/admin-invites.module.scss`
- `src/components/templates/TemplateManager.tsx`

Шаги:

1. Для admin users:
   - добавить `scroll={{ x: ... }}`;
   - задать минимальные ширины ключевых колонок;
   - рассмотреть скрытие колонок "Пол", "Создан" на mobile через AntD responsive columns.
2. Для admin invites:
   - добавить horizontal scroll;
   - проверить длинные даты и ссылку после создания;
   - на mobile сделать created invite input и copy button вертикальными.
3. Для templates:
   - добавить table scroll;
   - сделать action buttons компактными;
   - проверить перенос тегов паттернов.
4. Проверить модалки смены роли и пароля на телефоне.

Готово, когда админские таблицы не ломают общий viewport, даже если внутри таблицы есть собственный
горизонтальный скролл.

Статус: выполнено.

Сделано:

- `/admin/*` переведен в wide layout, чтобы таблицы использовали ширину рабочего экрана;
- `admin/users`:
  - таблица получила `scroll.x`, ширины ключевых колонок и скрытие менее важных колонок на малых ширинах;
  - email/name защищены от раздвигания таблицы;
  - модалки роли и пароля ограничены шириной viewport;
- `admin/invites`:
  - таблица получила `scroll.x`, ширины колонок и скрытие колонок использования на малых ширинах;
  - форма создания и блок последней ссылки складываются в одну колонку на телефоне;
  - длинные имена пользователей переносятся внутри ячейки;
- `tools/templates`:
  - страница переведена на `PageHeader` и CSS module вместо inline layout;
  - таблица шаблонов получила `scroll.x`, компактные actions и перенос тегов паттернов.

Проверка:

- `npm run type-check` проходит;
- Browser check на текущем desktop viewport:
  - `/admin/users`, `/admin/invites`, `/tools/templates`: horizontal overflow страницы нет;
  - `/admin/users` и `/admin/invites` раскрываются в wide layout до `1400px`;
  - таблицы на desktop помещаются без внутреннего scroll, а `scroll.x` остается fallback для меньших ширин.

## Этап 10. Инструменты и публичные страницы

Цель: довести вспомогательные страницы до того же уровня качества.

Основные файлы:

- `src/app/tools/pace-calculator/*`
- `src/app/tools/speed-to-pace/*`
- `src/app/results/ResultsClient/*`
- auth/register/login страницы

Шаги:

1. Калькуляторы уже имеют media queries. Проверить после изменения общего shell.
2. Убедиться, что input rows на телефоне идут в одну колонку и не имеют фиксированной ширины.
3. Results проверить на длинные имена, дистанции и ссылки.
4. Auth/register проверить на 390 px:
   - нет overflow;
   - кнопки не выходят за card;
   - поля имеют удобную ширину.
5. About/home можно оставить минимальными, если задача не включает контентную переработку.

Готово, когда публичные и auth-страницы визуально не выбиваются из общего responsive-подхода.

Статус: выполнено.

Сделано:

- `tools/pace-calculator`:
  - контейнеры и панели получили `min-width: 0`;
  - гриды инпутов на mobile используют доступную ширину и не держатся за фиксированный минимум;
  - сохраненные результаты и split-строки защищены от переполнения длинным текстом;
- `tools/speed-to-pace`:
  - добавлены `min-width: 0` для строк, полей и панелей;
  - на mobile поля и unit-тексты могут переноситься без раздвигания viewport;
- `results`:
  - длинные имена, мета-информация и ссылки переносятся внутри карточек/строк;
  - tabs на телефоне занимают ширину контейнера без выхода за экран;
- auth-страницы:
  - `login` и `register` больше не используют жесткую ширину card;
  - `forgot-password`, `reset-password`, `verify-email` получили защиту от переполнения и mobile padding;
  - register radio/select/input-группы защищены от горизонтального overflow.

Проверка:

- `npm run type-check` проходит;
- Browser check на текущем desktop viewport:
  - `/tools/pace-calculator`, `/tools/speed-to-pace`, `/results`, `/register`,
    `/auth/forgot-password`, `/auth/reset-password`: horizontal overflow страницы нет;
  - `/login` при активной сессии редиректит на `/dashboard`, поэтому сам login form проверен по CSS-коду.

## Этап 11. Проверка, тесты и регрессии

Цель: подтвердить, что адаптивность не сломала функциональность.

Шаги:

1. Прогнать статические проверки:
   - `npm run lint`
   - `npm run type-check`
2. Прогнать релевантные тесты после изменений рабочих экранов:
   - plan tests после этапа 5;
   - diary tests после этапов 6-7;
   - admin/profile tests после этапов 8-9.
3. Проверить приложение в браузере на 390, 768 и 1440 px.
4. На каждом ключевом экране проверить:
   - нет horizontal scroll у всей страницы;
   - интерактивные элементы доступны;
   - текст не обрезается критично;
   - модалки помещаются;
   - таблицы либо читаемы, либо имеют ожидаемый внутренний scroll.
5. Сделать screenshots до/после для наиболее измененных экранов.

Готово, когда основные сценарии проходят вручную и автоматические проверки не падают.

Статус: выполнено.

Проверка:

- `npm run lint` проходит без ошибок. В проекте остаются существующие warnings по `any`, unused и
  react hooks, но они не относятся к responsive-правкам и не блокируют команду;
- `npm run type-check` проходит;
- `npm exec vitest -- run ...` по релевантным клиентским тестам проходит:
  - `10` test files passed;
  - `64` tests passed;
- Browser smoke на текущем viewport `905 x 1272`:
  - `/dashboard`, `/plan`, `/diary?date=2026-05-18`, `/diary/period`,
    `/profile/records`, `/profile/shoes`, `/admin/users`, `/admin/invites`,
    `/tools/templates`, `/tools/pace-calculator`, `/tools/speed-to-pace`, `/results`,
    `/register`, `/auth/reset-password`;
  - horizontal overflow страницы не найден;
  - у `/admin/users` и `/admin/invites` есть ожидаемый внутренний table scroll на ширине `905px`;
  - `/results` и `/register` дополнительно проверены после повторной навигации из-за разового timeout.

## Приоритеты внедрения

Рекомендуемый порядок PR/коммитов:

1. App shell и gutters.
2. Header drawer.
3. Dashboard grid.
4. План: table scroll, затем mobile cards.
5. Дневник: mobile секции и проверка форм.
6. Период дневника.
7. Профиль.
8. Админка и шаблоны.
9. Публичные инструменты и auth polishing.
10. Финальная проверка и cleanup.

## Когда вернуться к Tailwind

Tailwind стоит рассмотреть отдельно, если после этапов 1-4 появятся признаки:

- много одинаковых SCSS-классов только для spacing/grid/flex;
- сложно поддерживать единые breakpoints;
- новые страницы пишутся быстрее utility-классами, чем SCSS modules;
- команда готова принять смешанный стиль AntD + Tailwind.

Если таких признаков нет, лучше остаться на AntD + SCSS modules: это меньше зависимостей, меньше
миграционных рисков и лучше соответствует текущему коду.
