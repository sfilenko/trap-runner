<!--
Текст PR для capstone (Task 6.3). Агент склав його з docs/evidence.md; людина перечитує і править перед вставкою.
Посилання на коміти — повні URL: у PR іншого репозиторію короткі SHA не стають посиланнями.
-->

## Ім'я

Serhii Filenko

## Проєкт

Trap Runner — невеликий браузерний платформер: пастки в стилі Level Devil (підлога зникає, монета-приманка вмикає шипи, фініш переїжджає), вороги й монети як у Маріо. Уся логіка гри — одна чиста детермінована функція `step(world, input)`, тому кожне правило перевіряє тест без браузера.

**Де код:** окремий репозиторій https://github.com/sfilenko/trap-runner. У цій гілці — лише `submissions/serhii-filenko/README.md` з посиланнями. Таблиця «практика → доказ» з посиланнями на файли, коміти, рядки журналів і прогони CI: [`docs/evidence.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/evidence.md).

## Відео-демо (1–2 хв)

**Посилання:** https://drive.google.com/file/d/1_RlZPj-4SBTMSrJr8FxACqIguWTr2qu9/view?usp=sharing

1:53, без голосу: усе пояснення — у підписах. Кадри гри — розв'язки рівнів, записані мною клавішею `R` і програні через справжні `step()` і `draw.ts`. Далі — гейт, блок hook'а в журналі, цикл генерації рівнів, червоний → зелений тест, хто що вирішував, одна помилка агента. Сцени і джерела кадрів: [`docs/video-script.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/video-script.md).

## Застосовані практики Agentic Engineering

- [x] **Контекст-інженерія** (правила / `AGENTS.md`, статичний vs динамічний контекст) — доказ:
  - статичний: [`AGENTS.md`](https://github.com/sfilenko/trap-runner/blob/main/AGENTS.md) забороняє `Math.random` у `src/core`, hook `guard-core` це виконує. Агент спробував записати такий файл: у журналі є [запит без виконання](https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L93) і [рядок блоку з тим самим `id`](https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/blocked.jsonl#L1). До цього, у першій спробі, агент прочитав `AGENTS.md` і сам відмовився від дії ([журнал](https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L83-L86));
  - динамічний: проєктний Playwright MCP ([`.mcp.json`](https://github.com/sfilenko/trap-runner/blob/main/.mcp.json)) — агент читає живий стан гри `window.__game` ([виклики в журналі](https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L1119-L1122), відповідь `x = 2, y = 210` — [журнал довіри, рядок #18](https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/autonomy-log.md?plain=1#L26));
  - вимір контексту: [`docs/context-log.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/context-log.md) — одна зміна (skill `make-level`), і свіжа сесія [першою дією кличе skill](https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L919-L920). Прогін «до» не сліпий: агент прочитав план із текстом skill, це записано.
- [x] **Цикли (loop engineering)** замість покрокового промптингу — доказ: [`scripts/level-loop.mjs`](https://github.com/sfilenko/trap-runner/blob/main/scripts/level-loop.mjs), команда `pnpm level:loop --level 04`: `claude -p` пише рівень → валідатор → помилки в наступну ітерацію; ліміт ітерацій і `--max-budget-usd` на виклик; запобіжник `git status` зупиняє цикл, якщо агент змінив файл поза рівнем. Логи прогонів: [`.agent-log/loops/`](https://github.com/sfilenko/trap-runner/tree/main/.agent-log/loops), підсумок — [`docs/loop-log.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/loop-log.md). Рівні 04 і 05 — PASS з першої ітерації ($0.41 і $0.44). Гілку «FAIL → наступна ітерація» справжній прогін не пройшов, її перевірено лише тестом з підставними командами.
- [x] **Верифікація** (тести / evals / перевірки) — доказ: одна команда `pnpm check` (typecheck, межа `src/core`, 87 тестів, проходження кожного рівня записаним розв'язком, спеки); тест раніше за код — [червоний коміт](https://github.com/sfilenko/trap-runner/commit/7b80c81) (`2 failed`, `AssertionError`) → [зелений](https://github.com/sfilenko/trap-runner/commit/9993693); 13 replay-сценаріїв [червоні](https://github.com/sfilenko/trap-runner/commit/f4dd72e) до коду фізики; e2e smoke у CI; перевірка перевіряючого — [`docs/mutation-log.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/mutation-log.md): 3 мутації ядра, кожна дає червоні саме очікувані тести.
- [x] **maker ≠ checker** (окремий агент або прохід на рев'ю) — доказ: субагент [`game-checker`](https://github.com/sfilenko/trap-runner/blob/main/.claude/agents/game-checker.md) у чистому worktree без доступу до плану; [звіт](https://github.com/sfilenko/trap-runner/blob/main/docs/stage3/checker-report.md): 3 прогалини в тестах, 1 примітка, 3 контрприклади; [рішення щодо кожної знахідки](https://github.com/sfilenko/trap-runner/blob/main/docs/stage3/decisions.md). Головне: еталон із плану порушував правило дизайну, а всі 76 тестів плану його пропускали — checker вивів правило сам. Також незалежне рев'ю дизайну ([`design.md` §13](https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/design.md?plain=1#L267)) і окрема сесія-рецензент для кожної фази OpenSpec.
- [x] **Специфікації наперед (SDD)** — доказ: OpenSpec 1.13.0; [пропозиція](https://github.com/sfilenko/trap-runner/commit/c4485f7) закомічена раніше за [перший код](https://github.com/sfilenko/trap-runner/commit/5ad9a65); [архів 4 змін](https://github.com/sfilenko/trap-runner/tree/main/openspec/changes/archive); бюджет у [`docs/intent.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/intent.md) до кожного propose. Спеку змінено, бо реальність не збіглася: [`spec:` коміт](https://github.com/sfilenko/trap-runner/commit/77dda70) — спека казала «`enemies` is an error», а контракт ворогів їх приймав.
- [x] **Журнал рівнів довіри** — доказ: [`docs/autonomy-log.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/autonomy-log.md) — рядок на кожну задачу (рівень план → факт, хто вирішував, докази, три питання); розділи «Зниження рівня» (2 записи: прийняття рівнів циклу 3 → 1, перший рівень і фізика 2 → 1), «Впевнені помилки агента» і «Відхилення від плану».
- [ ] **Project Factory** — не застосовано.
- [x] Інше: **оркестрація** (контракт → два паралельні workers → checker) — доказ: тег [`contract-c0`](https://github.com/sfilenko/trap-runner/tree/contract-c0) закомічено до fan-out; [брифи](https://github.com/sfilenko/trap-runner/blob/main/docs/stage3/brief-a.md) з власними файлами кожного worker'а; два git worktrees; join без конфліктів; фактичні витрати $18.63 — [`docs/stage3/costs.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/stage3/costs.md).

## Інструменти та MCP

- **Claude Code** 2.1.289, модель Opus 5.5; режими `default`, `acceptEdits`, `auto`, `bypassPermissions` — режим кожної сесії видно в журналі hook'ів.
- **MCP:** Playwright MCP `@playwright/mcp@0.0.83` (проєктний `.mcp.json`) — живий стан гри і скріншот.
- **Hooks:** `log-action` (PreToolUse, PostToolUse, PostToolUseFailure → `.agent-log/actions.jsonl`), `guard-core` (блокує правку `src/core` з забороненими словами → `.agent-log/blocked.jsonl`); `pnpm hooks:selftest` перевіряє їх без агента.
- **Skills:** `make-level` (власний); OpenSpec skills і команди `/opsx:*`.
- **Субагенти:** `game-checker` (read-only); workers етапу 3 — окремі сесії в git worktrees.
- **Цикл:** `claude -p` у `scripts/level-loop.mjs`.
- **Перевірка:** TypeScript, Vitest, zod, `tools/validate-level`, Playwright (e2e), GitHub Actions.

## Що вирішував(ла) я, а що агент

**Агент:** код ядра через OpenSpec apply, тести і replay-сценарії, два workers етапу 3, рівні 04 і 05 у циклі, e2e, мутації, журнали, чернетки документів.

**Мої рішення:** стек і архітектура (дизайн v1 написав агент у розмові зі мною, окремий агент-рецензент дав 13 знахідок, рішення щодо кожної — моє); фізичні константи `PHYS` прийнято один раз і не змінено жодного разу; розв'язки рівнів записано мною клавішею `R`; рівні з циклу прийнято лише після моєї гри (довіра 3 → 1); 8 рішень щодо знахідок checker'а; бюджети до кожного propose; усі коміти і push (`git commit` — в `ask`, `git push` — у `deny` для агента).

**Чесно про межу:** більшість рішень ухвалено за рекомендацією агента-рецензента («як рекомендуєш»). Варіанти здебільшого пропонував агент; моя роль — вибрати варіант, задати межі (бюджет, рівень довіри), грати рівні і комітити. Кілька кроків, які план відводив мені, делеговано агентові: чернетки `AGENTS.md` і першого рівня, рядки в `settings.json`, мутації, зйомку відео. Кожен такий крок записано у «Відхилення від плану».

**Де агенти розходились, і вибір був мій:** сесія propose пропонувала додавати сценарії в спеку після тестів, рецензент — до тестів; вибрано «до тестів». Код worker'а A проти еталона плану — вибрано код worker'а.

**Помилки агента, які впіймано:**
1. План, написаний агентом, подав еталон `resolveEnemyContacts` як правильний. Еталон порушував правило «стрибок зверху перемагає», і всі 76 тестів плану його пропускали. Впіймали worker A, orchestrator і checker без доступу до плану. Наслідок: [тест](https://github.com/sfilenko/trap-runner/commit/60e679f) і правило checker'у «не читати `docs/plan/`».
2. Перевірка запобіжника циклу «без витрат»: агент записав шлях у PATH у формі `C:/…`, і замість підставної команди запустився справжній `claude` — 5 справжніх викликів, $0.97.
3. Агент запевнив, що `pnpm add` попросить підтвердження, а сесія працювала в `bypassPermissions`.
4. Агент лишив підказки в `session-notes.md` і незакомічених журналах — два контрольні прогони свіжих сесій вийшли не сліпими.

**Що зупинено:** запис `src/core/spawn.ts` з `Math.random` (hook `guard-core`); дві команди з `rm -rf` (правило `deny`); сесія archive сама переписала `## Purpose` всупереч промпту — помічено до коміту, позначено в коміті.

Усе з посиланнями: [`docs/evidence.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/evidence.md), розділ 2, і [`docs/autonomy-log.md`](https://github.com/sfilenko/trap-runner/blob/main/docs/autonomy-log.md).

## Перевірка

```
pnpm install && pnpm exec playwright install chromium
pnpm hooks:selftest && pnpm check && pnpm e2e
```

CI зелений на `80d74da`: https://github.com/sfilenko/trap-runner/actions/runs/37192027655

```
check-boundaries: 11 files in src/core, 0 violations
 Test Files  11 passed (11)
      Tests  87 passed (87)
PASS level-01.json
PASS level-02.json
PASS level-03.json
PASS level-04.json
PASS level-05.json
validate-level: 5 levels, 0 failed
spec:check ok — specs: 2 · active changes: 0 · archived: 4

  ok 1 [chromium] › e2e\smoke.spec.ts:10:1 › the game starts, the player moves right, the console stays clean (734ms)
  1 passed (2.9s)
```

**Чого перевірка не охоплює:** «відчуття» стрибка, складність і справедливість рівнів (лише моя гра); розв'язок доводить прохідність одним записаним шляхом; e2e — лише smoke. Відомий дефект: на екрані перемоги HUD рахує монети останнього рівня двічі («Монети 10» проти «Монети: 9» у підсумку) — видно у відео, гейт його не ловить.
