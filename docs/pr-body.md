<!--
Текст PR для capstone (Task 6.3), коротка версія на прохання людини. Повна версія — в історії git (6b14ea4). Деталі — docs/evidence.md.
Посилання на коміти — повні URL: у PR іншого репозиторію короткі SHA не стають посиланнями.
-->

## Ім'я

Serhii Filenko

## Проєкт

Trap Runner — браузерний платформер: пастки в стилі Level Devil, вороги й монети як у Маріо. Уся логіка — чиста детермінована функція `step(world, input)`, тому кожне правило перевіряє тест без браузера.

**Де код:** https://github.com/sfilenko/trap-runner · усі докази з посиланнями — [`docs/evidence.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/evidence.md)

## Відео-демо (1–2 хв)

**Посилання:** https://drive.google.com/file/d/1_RlZPj-4SBTMSrJr8FxACqIguWTr2qu9/view?usp=sharing

1:53, без голосу: пояснення — у підписах. Кадри гри — файли розв'язків, програні через справжні `step()` і `draw.ts`; підпис називає автора кожного розв'язку. Зйомку доручено агентові.

## Застосовані практики Agentic Engineering

- [x] **Контекст-інженерія** — доказ: статичний — `AGENTS.md` забороняє `Math.random` у ядрі, hook `guard-core` це виконує; свідомо спровокований запис агента заблоковано: [запит без виконання](https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L93) і [рядок блоку з тим самим id](https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/blocked.jsonl#L1). Динамічний — Playwright MCP читає живий стан гри ([виклики в журналі](https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L1119-L1122)). Вимір контексту — [`docs/context-log.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/context-log.md).
- [x] **Цикли (loop engineering)** — доказ: [`scripts/level-loop.mjs`](https://github.com/sfilenko/trap-runner/blob/main/scripts/level-loop.mjs): `claude -p` → валідатор → помилки в наступну ітерацію; ліміт ітерацій і $ на виклик; запобіжник `git status` проти правок поза рівнем. [Логи прогонів](https://github.com/sfilenko/trap-runner/tree/main/.agent-log/loops): рівні 04 і 05 — PASS з першої ітерації ($0.41 і $0.44); гілку «FAIL → наступна ітерація» на справжньому рівні не пройдено.
- [x] **Верифікація** — доказ: `pnpm check` (typecheck, межа ядра, 87 тестів, прохідність кожного рівня, спеки) і e2e у CI; [червоний тест](https://github.com/sfilenko/trap-runner/commit/7b80c81) → [зелений код](https://github.com/sfilenko/trap-runner/commit/9993693); [мутації ядра](https://github.com/sfilenko/trap-runner/blob/main/docs/mutation-log.md) дають червоні саме очікувані тести.
- [x] **maker ≠ checker** — доказ: субагент [`game-checker`](https://github.com/sfilenko/trap-runner/blob/main/.claude/agents/game-checker.md), який план не читав: [звіт](https://github.com/sfilenko/trap-runner/blob/main/docs/stage3/checker-report.md) (F1–F3, 3 контрприклади) і [рішення щодо кожної знахідки](https://github.com/sfilenko/trap-runner/blob/main/docs/stage3/decisions.md). Перед здачею незалежний `homework-reviewer` двічі перевірив цей PR і знайшов 5 хибних заяв — виправлено.
- [x] **Специфікації наперед (SDD)** — доказ: OpenSpec; [пропозиція](https://github.com/sfilenko/trap-runner/commit/c4485f7) раніше за [перший код зміни](https://github.com/sfilenko/trap-runner/commit/5ad9a65); [спеку змінено, бо реальність не збіглася](https://github.com/sfilenko/trap-runner/commit/77dda70); [архів 4 змін](https://github.com/sfilenko/trap-runner/tree/main/openspec/changes/archive).
- [x] **Журнал рівнів довіри** — доказ: [`docs/autonomy-log.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/autonomy-log.md): рівень на кожну задачу, 2 зниження, «Впевнені помилки агента», «Відхилення від плану».
- [ ] **Project Factory** — не застосовано.
- [x] Інше: **оркестрація** — доказ: контракт [`contract-c0`](https://github.com/sfilenko/trap-runner/tree/contract-c0) до fan-out, два workers у git worktrees, [фактичні витрати $18.63](https://github.com/sfilenko/trap-runner/blob/main/docs/stage3/costs.md).

## Інструменти та MCP

Claude Code (Opus 5.5) · Playwright MCP (проєктний `.mcp.json`) · hooks `log-action` і `guard-core` · skills `make-level` і OpenSpec · субагент `game-checker` · `claude -p` у циклі · Vitest, zod, Playwright, GitHub Actions.

## Що вирішував(ла) я, а що агент

**Агент:** код ядра (OpenSpec apply), тести, два workers, рівні 04 і 05 у циклі, e2e, мутації, журнали, відео, чернетки документів, 8 перших комітів етапу 0.

**Я:** стек і архітектура (рішення щодо 13 знахідок рев'ю дизайну); фізичні константи — не змінено жодного разу; розв'язки рівнів 1 і 3; прийняття рівнів з циклу лише після гри (довіра 3 → 1); 8 рішень щодо знахідок checker'а; бюджети; коміти з `7d3c86b` і всі push.

**Чесно:** більшість рішень ухвалено за рекомендацією агента-рецензента. Моя роль — вибір варіанта, межі (бюджет, рівень довіри), гра і коміти. Делеговані агентові кроки записано у «Відхилення від плану».

**Помилки агента:**
1. Еталон `resolveEnemyContacts` у плані (його писав агент) порушував правило дизайну, а 76 тестів плану його пропускали. Знайшли worker A і orchestrator, checker назвав прогалину в тестах; тепер є [тест](https://github.com/sfilenko/trap-runner/commit/60e679f).
2. Тест запобіжника циклу «без витрат» запустив справжній `claude`: 5 викликів, $0.97.
3. Агент, який готував цю здачу, перебільшував у тексті PR і підписах відео (хто записав розв'язки, хто знайшов помилку). Впіймав `homework-reviewer`, виправлено.

**Зупинено:** запис з `Math.random` у ядро (hook); дві команди `rm -rf` (Pre без Post, причина — правило `deny` — виведена). Сесія archive сама переписала `## Purpose` — помічено до коміту, лишено з позначкою в коміті.

## Перевірка

```
pnpm install && pnpm exec playwright install chromium
pnpm hooks:selftest && pnpm check && pnpm e2e
```

CI (Linux, кроки `hooks:selftest`, `check`, `e2e`) зелений: https://github.com/sfilenko/trap-runner/actions/runs/37195642589

Локально (Windows):

```
check-boundaries: 11 files in src/core, 0 violations
      Tests  87 passed (87)
validate-level: 5 levels, 0 failed
spec:check ok — specs: 2 · active changes: 0 · archived: 4
  1 passed (2.9s)
```

**Не перевіряється:** «відчуття» і складність рівнів (лише гра), інші шляхи проходження, e2e — лише smoke. Відомий дефект: HUD на екрані перемоги рахує монети останнього рівня двічі.
