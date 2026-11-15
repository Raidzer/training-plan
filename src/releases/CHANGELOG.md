# Changelog

## [1.5.0](https://github.com/Raidzer/training-plan/compare/v1.4.0...v1.5.0) (2026-11-15)


### Новое

* **diary:** add long bottom checkbox to workout reports ([85acfdd](https://github.com/Raidzer/training-plan/commit/85acfddab4a28c7cf01f9a41ec424438987d231a))
* **diary:** add long bottom checkbox to workout reports ([a36117c](https://github.com/Raidzer/training-plan/commit/a36117cefae6edb7984b36f1e17ba6bf8249e3ca))
* **diary:** оценки и условия тренировок раскрыты по умолчанию ([6389c7e](https://github.com/Raidzer/training-plan/commit/6389c7e709ddaccd99ffb2fbee33c5426e4389dc))
* **diary:** оценки и условия тренировок раскрыты по умолчанию ([43139fa](https://github.com/Raidzer/training-plan/commit/43139fa660c9f071e31d69a58bba2285e603f5b4))
* **diary:** показывать пробег обуви при выборе в тренировке ([728a871](https://github.com/Raidzer/training-plan/commit/728a87135762e9da6fcf1d8c3c2e953f6283c4b4))
* **profile:** добавлена загрузка фото профиля с кадрированием ([444cc27](https://github.com/Raidzer/training-plan/commit/444cc2798596fb4964651c4c48ec4372d354b045))
* **profile:** добавлена загрузка фото профиля с кадрированием ([cf57b49](https://github.com/Raidzer/training-plan/commit/cf57b49554e6f55b418a0c7d15fa7bdc0e3d89d1))
* **telegram:** добавлен календарь выбора дат тренировочного плана ([ffcdf0d](https://github.com/Raidzer/training-plan/commit/ffcdf0da5b446f9173b7747cd88b39a769223a3e))
* **telegram:** добавлен календарь выбора дат тренировочного плана ([e34bb53](https://github.com/Raidzer/training-plan/commit/e34bb538326fa31deab05c6bebc46b92ccf3503f))
* **telegram:** добавлена отправка тренировочного плана в виде HTML-карточки ([6a463ec](https://github.com/Raidzer/training-plan/commit/6a463eca60316fa4369b425f4a5df534346ac982))
* **telegram:** добавлена отправка тренировочного плана в виде HTML-карточки ([1648aa0](https://github.com/Raidzer/training-plan/commit/1648aa0d3dcdf3692ef4f238d10c58ee4d7a5c34))
* **telegram:** добавлена рассылка сообщения при обновлении клавиатуры ([5e23655](https://github.com/Raidzer/training-plan/commit/5e23655cdc872c378db15b87cb089c360d9a095d))
* **telegram:** добавлена рассылка сообщения при обновлении клавиатуры ([31c8657](https://github.com/Raidzer/training-plan/commit/31c86576640b2963603b4ab19d8c10471ed649d9))


### Исправления

* **diary:** перенесён выбор длинного низа в условия и экипировку ([4d0bc6a](https://github.com/Raidzer/training-plan/commit/4d0bc6a2be005fbf51dbd3dc8c85658e7d44f189))

## [1.4.0](https://github.com/Raidzer/training-plan/compare/v1.3.0...v1.4.0) (2026-10-29)

### Новое

- Добавлено предложение сохранить первый или улучшенный личный рекорд после забега
- Добавлена главная страница с логотипом клуба и калькуляторами
- Добавлен архив обуви с сохранением истории тренировок
- Добавлен запрос результатов после соревнований с сохранением рекордов

## 1.3.0 (2026-10-25)

### Новое

- **plan:** add workout search ([aaa3508](https://github.com/Raidzer/training-plan/commit/aaa3508c100958d37fbb121f45c38855a0e4513d))
- **releases:** add current release notes modal and changelog loader ([66382be](https://github.com/Raidzer/training-plan/commit/66382be1429ffc6ff59420c6e74f17fa9d41257a))
- **release:** автоматизирована подготовка и публикация релизов ([94ec309](https://github.com/Raidzer/training-plan/commit/94ec309677c393cff227aa552479100a583907f5))
- добавлен поиск тренировок на страницу плана ([a4672b2](https://github.com/Raidzer/training-plan/commit/a4672b2b3c9c09fedd439ae3b0622430cfed0aa2))

### Исправления

- center import upload content ([8efbfdd](https://github.com/Raidzer/training-plan/commit/8efbfdd99fb0d9fe86b96a850523a97127eddffa))
- **deps:** обновлены Next.js и NextAuth для устранения уязвимостей ([9408308](https://github.com/Raidzer/training-plan/commit/9408308cd9987345b546a9def3ea9866d43742a5))
- **deps:** обновлены зависимости для устранения уязвимостей ([a364f68](https://github.com/Raidzer/training-plan/commit/a364f683b5d828bab806013d0248b46b9efaac33))
- **diary:** убран пробег кроссовок из экспорта дневника ([146dcfa](https://github.com/Raidzer/training-plan/commit/146dcfab4a6c4129a34362d8e45aec46c55b5ca3))
- **docker:** исключены dev-зависимости из production-образа ([ef5ef26](https://github.com/Raidzer/training-plan/commit/ef5ef261ddb8477f9f820a7284be16ebc9a70178))
- **email:** обновлён Nodemailer до 10.2.1 для устранения уязвимостей ([d4cec3c](https://github.com/Raidzer/training-plan/commit/d4cec3cb842c82bdc0010e9edbd420c27e746c5f))
- **plan:** ignore placeholder workout rows ([089cf70](https://github.com/Raidzer/training-plan/commit/089cf7048c303e507eed2036d583ec0d472dd2ab))
- **plan:** исправлены поиск тренировок и выбор страницы при загрузке ([aa396a6](https://github.com/Raidzer/training-plan/commit/aa396a6496ace0cf387e3d2557dc92b8aad7b4ec))
- retry interrupted current day scroll ([0937e37](https://github.com/Raidzer/training-plan/commit/0937e3783388bfbdb73d408be2d85b8a8f54f9fe))
- **runtime:** обновлён Node.js до 24.22.1 LTS в Docker и CI ([670a38b](https://github.com/Raidzer/training-plan/commit/670a38baa1fd2677d6dc611f815cb32c088a1bd3))
- **security:** обновлён Zod с сохранением правил валидации ([7a2c29c](https://github.com/Raidzer/training-plan/commit/7a2c29c4cc534f22f88f94a4a736c90dfc9364d4))
- **security:** обновлены зависимости и production-образ для устранения уязвимостей ([004a2b8](https://github.com/Raidzer/training-plan/commit/004a2b8844468881a3717c8993298b7d35078b65))
- исправлена неправильная прокрутка плана на телефоне ([5285ecb](https://github.com/Raidzer/training-plan/commit/5285ecb52d45fe1eef997ee873007a6f7e3d0a37))
- исправлена ошибка при которой на странице план, считались незаполнены пустые дни ([9882e55](https://github.com/Raidzer/training-plan/commit/9882e55f80521b0cf2a32ec0cc2cb7353f244f5a))

### Внешний вид

- remove dashboard section descriptions ([93e7e4e](https://github.com/Raidzer/training-plan/commit/93e7e4ee2994ada69de85a5c231631c4de721e15))
- simplify diary day layout ([81dcaf6](https://github.com/Raidzer/training-plan/commit/81dcaf633d9a26a392ab6688a13de7733b15ebdb))
- simplify login page copy ([ddd0068](https://github.com/Raidzer/training-plan/commit/ddd006828ef9552a40a06860ebf26efdd1450656))
- simplify plan interface ([3cb395d](https://github.com/Raidzer/training-plan/commit/3cb395dad1239091bb34274fba6c9acc41980ed9))
- simplify workload switch field ([ad53921](https://github.com/Raidzer/training-plan/commit/ad5392110ed5dc1bedde28ff019f5a9f2b9004c3))
- update brand icons ([5834e68](https://github.com/Raidzer/training-plan/commit/5834e6830b80f6545d90f707129edfa4a802df24))
- use Inter as application font ([75853e2](https://github.com/Raidzer/training-plan/commit/75853e2ca3e18fbf9866518ba3c1dcc13c13f315))
- use Inter as application font ([7d076da](https://github.com/Raidzer/training-plan/commit/7d076da6024ba5f9d5d894468d7cdb05ea902449))
- поправлены замечания по дизайну ([36eb879](https://github.com/Raidzer/training-plan/commit/36eb87980ff0d241fdbb37464e50a4c559d08e35))

## История изменений
