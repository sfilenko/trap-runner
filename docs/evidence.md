# Докази практик — Trap Runner

> Джерело для PR у форку capstone (`docs/plan/stage-6-submit.md`, Task 6.1).
> Посилання на файли закріплено за комітом `43a8a39` (permalink), тож номери рядків журналів не зсуваються.
> Відео (1:53, без голосу, з підписами): https://drive.google.com/file/d/1_RlZPj-4SBTMSrJr8FxACqIguWTr2qu9/view?usp=sharing — фактичні сцени з таймкодами і підписами: `docs/video-script.md`, розділ «Фактичні сцени».
> Журнал дій агента `.agent-log/actions.jsonl` пише hook `log-action`: рядок `PreToolUse` без пари `PostToolUse` з тим самим `id` — дія, яку агент запропонував, але яка не виконалась.

## 1. Практика → доказ

| Практика | Доказ (посилання) | Що він показує |
|---|---|---|
| Контекст-інженерія (статичний) | [AGENTS.md][agents] · hook [guard-core][guard] викликає [check-boundaries.mjs][bounds] · [actions.jsonl L93][aj93]: `PreToolUse` Write `src/core/spawn.ts` без `PostToolUse` · [blocked.jsonl L1][blocked]: той самий `id` `toolu_01DvoeyGwr9c3ArCQN4jJ6ER`, правило `no-math-random` · [autonomy-log, рядок #4][al4] · ще одне правило: `deny: rm -rf` — [actions.jsonl L667][aj667], `Pre` без `Post` | правило не просто написане — hook заблокував запис файлу. Це негативний контроль: людина свідомо попросила свіжу сесію один раз записати такий файл ([autonomy-log, рядок #4][al4]). Перша спроба цього контролю не доказ: сесія прочитала підказку в `session-notes.md` і план ([actions.jsonl L83–86][aj83]) і впізнала тест — записано в «Впевнених помилках агента» |
| Контекст-інженерія (динамічний) | [.mcp.json][mcp] (`@playwright/mcp@0.0.83`, коміт [1b66c29][c-1b66c29]) · [actions.jsonl L1119–1122][aj1119]: `browser_navigate` і `browser_evaluate` з `PostToolUse` · відповідь агента `x = 2, y = 210`, `levelIndex: 0` — [autonomy-log, рядок #18][al18] | агент читає живий стан гри (`window.__game`) у момент запиту, а не з коду |
| Вимір контексту (ДЗ 02) | [docs/context-log.md][ctx] (три колонки: `/context` до → одна зміна → після) · одна зміна — skill [make-level][skill], окремий коміт [4db3375][c-4db3375] · [actions.jsonl L919][aj919]: `"tool":"Skill"` — перша дія свіжої сесії `7011e9a7` | одна зміна харнесу → інша поведінка в свіжій сесії (Skills 79 → 80, агент першою дією кличе skill). Чесно: прогін «до» не сліпий — агент прочитав план з текстом skill (записано в `context-log.md`) |
| Цикли | [scripts/level-loop.mjs][loop] (коміт [2d9787b][c-2d9787b]), команда `pnpm level:loop --level 04` ([package.json][pkg]) · логи прогонів: [пробний 04][loop1], [04][loop2], [05][loop3] · [docs/loop-log.md][looplog] · кандидати [8fbb6d0][c-8fbb6d0], [ee47379][c-ee47379] | цикл справді запускається (`claude -p` → `validate:levels` → помилки в наступну ітерацію); кожна ітерація пише `cost_usd` і `turns`; зупинка на PASS або на ліміті ітерацій; запобіжник `git status` зупиняє цикл (exit 3), якщо агент змінив файл поза рівнем. Чесно: усі 3 справжні прогони — PASS з першої ітерації; гілку «FAIL → наступна ітерація» справжній агент пройшов лише в помилковому тесті запобіжника, де FAIL дало середовище, а не рівень ([логи][guardlogs], `docs/loop-log.md`); передачу тексту помилки валідатора перевірено тестом з підставними командами |
| Верифікація | одна команда `pnpm check` = typecheck + межа `src/core` + тести + рівні + спеки ([package.json][pkg]) · червоний коміт [f4dd72e][c-f4dd72e] «13 replay scenarios … (red)», `17 failed` → зелені [03aba67][c-03aba67], [cf81fdc][c-cf81fdc] (`46 passed`) · **тест раніше за код:** [7b80c81][c-7b80c81] `2 failed` → [9993693][c-9993693] `87 passed` · e2e [c61a5d7][c-c61a5d7] (червоний з підміною вводу, потім зелений) · CI: [прогін на `stage-5b`][ci-5b], [прогін з кроком `pnpm e2e`][ci-e2e] · [docs/mutation-log.md][mut] | тест спершу червоний через `AssertionError`, а не через import; гейт бачили червоним; мутації M1–M3 в `src/core` дають червоні саме очікувані тести |
| maker ≠ checker | субагент [game-checker.md][checker] (коміт [b318dc1][c-b318dc1]) · звіт [docs/stage3/checker-report.md][report] · журнал сесії checker'а [.agent-log/stage3/checker.jsonl][checkerlog] · рішення людини [docs/stage3/decisions.md][decisions] · незалежне рев'ю дизайну — [design.md §13][design13] · висновки сесії-рецензента фаз OpenSpec — у журналі довіри ([рядок #6][al6], [рядок #24][al24]; транскриптів у репо немає) · перед здачею — незалежний `homework-reviewer` (див. помилку 6 нижче) | checker знайшов 2 прогалини в тестах і 1 у спеці (F1–F3), 1 примітку (N1) і 3 контрприклади, підтверджені на `step()`. Заборона читати `docs/plan/` — текст промпту, не механізм; у журналі сесії checker'а звертань до `docs/plan/` немає. Найважливіше: еталон з плану порушував `design.md` §6, а всі 76 тестів його пропускали; розбіжність з еталоном знайшов orchestrator, прогалину в тестах — checker (F1). Для кожної знахідки є рішення людини і коміт ([60e679f][c-60e679f], [290bfca][c-290bfca]) |
| SDD | пропозиція зміни A [c4485f7][c-c4485f7] (01:31) раніше за її перший код [5ad9a65][c-5ad9a65] (01:40; каркас і годинник етапу 0 старші за спеку, вони поза зміною); пропозиція [02815b6][c-02815b6] раніше за [cdc93f7][c-cdc93f7] · бюджет в [intent.md][intent] до propose ([1e0072d][c-1e0072d]) · [openspec/changes/archive/][archive] (4 зміни) · [openspec/specs/][specs] · **спеку змінили, бо реальність не збіглася:** [77dda70][c-77dda70] | спека раніше за код змін A, B і D (видно за порядком комітів); спеку ворогів (зміна C) свідомо написано за кодом етапу 3; спека `level-validation` казала «`enemies` is an error», а контракт C0 ворогів приймав — спеку виправили окремим комітом `spec:` |
| Оркестрація (ДЗ 04) | тег [contract-c0][tag-c0] = [2aefcda][c-2aefcda] (20:56) раніше за брифи [cef8421][c-cef8421] (21:01) і коміти workers · [requirements.md][req], [dag.md][dag] · брифи [A][briefa], [B][briefb] · звіти [A][repa], [B][repb] · worker A: червоний [1c22360][c-1c22360] → зелений [d31c5e5][c-d31c5e5]; worker B: [37def98][c-37def98] · join [9af5b43][c-9af5b43] · журнали сесій [.agent-log/stage3/][stage3log] · витрати [costs.md][costs] | контракт закомічено до fan-out; два bounded workers у окремих worktrees з власними файлами; join без конфліктів; фактичні витрати $18.63 (orchestrator $13.94, workers $1.57 і $1.71, checker $1.41) |
| Журнал довіри | [docs/autonomy-log.md][al] — рядок на кожну задачу (рівень план → факт, хто вирішував, докази, 3 питання) · [«Зниження рівня»][al-down] · [«Впевнені помилки агента»][al-err] · [«Відхилення від плану»][al-dev] | рівень знизили двічі: прийняття рівнів циклу 3 → 1 і перший рівень та `PHYS` 2 → 1 — бо «відчуття» і складність тест не ловить |
| Project Factory | не застосовано: етап F (`stage-F-factory.md`) не виконано | |
| Brownfield | не застосовано: проєкт новий | |

## 2. Що вирішував я, а що агент

> Чернетка для поля PR. Перед вставкою людина переписує її своїми словами.

**Мої рішення**
- Стек і архітектура: чисте детерміноване ядро `step(world, input)`, перевірка через replay. Дизайн v1 написав агент у розмові зі мною. Окремий агент-рецензент дав 13 знахідок, і рішення щодо кожної — моє ([design.md §13][design13]).
- `PHYS`: значення з плану прийнято один раз. За весь проєкт їх не змінено: `git log -S` знаходить лише коміт [5ad9a65][c-5ad9a65].
- Рівні: level-01 — чернетка агента на моє доручення; прийняття без змін і розв'язок клавішею `R` — мої ([c004dd6][c-c004dd6]). Рівні 04 і 05 з циклу — «прийнято» після моєї гри; рівень довіри для цього кроку знижено 3 → 1. Варіант ворога в level-03 і його розв'язок — мої ([290bfca][c-290bfca]).
- Знахідки checker'а: 8 рішень у [decisions.md][decisions].
- Бюджети в [intent.md][intent] — до кожного propose і до fan-out.
- Контрольний шар: `settings.json`, hooks, `AGENTS.md`. Агент його не править без доручення. Кожне доручення записано в [«Відхилення від плану»][al-dev].
- Коміти — за моїм рішенням, push — лише мій (`git push` у `deny`, у журналі немає жодного push агента). Три ранні коміти етапу 0 (`0ad50ab`, `ec0ad9e`, `3e97f59`) виконав агент у сесії `c06fcde4` (режими `auto` і `acceptEdits`); мого підтвердження в журналі немає. Решта комітів — мої.
- Розв'язки: рівні 01 і 03 — мої (клавіша `R`); рівень 02 і розв'язок — worker B ([37def98][c-37def98]); рівні 04 і 05 і розв'язки — агент у циклі.

**Чесно про межу.** Більшість рішень ухвалено за рекомендацією агента-рецензента («як рекомендуєш»): усі 8 рішень щодо знахідок checker'а, бюджети, запобіжник циклу. Варіанти здебільшого пропонував агент. Моя роль — вибрати варіант, задати межі (бюджет, рівень довіри), грати рівні і комітити. Кілька кроків [ЛЮДИНА] делеговано агентові: чернетки `AGENTS.md` і level-01, рядки в `settings.json`, мутації, зйомку відео. Кожен такий крок записано як відхилення.

**Де агенти розходились, і вибір був мій**
- D4 зміни C ([autonomy-log, «Відхилення»][al-dev]): сесія propose пропонувала додавати сценарії в спеку після тестів, рецензент — до тестів. Вибрано «до тестів»: 5 сценаріїв увійшли в спеку раніше за тести.
- Код worker'а A проти еталона плану ([decisions.md][decisions], #2): вибрано код worker'а, бо еталон порушував `design.md` §6.
- Запобіжник `git status` у циклі ([2d9787b][c-2d9787b]): плану не було. Рецензент показав, що PASS міг би прийти зі зміненого валідатора; рішення — додати.

**Що агент зробив сам:** ядро гри через OpenSpec apply (рівень 3), workers етапу 3 (рівень 4), рівні 04 і 05 у циклі (рівень 3), тести, e2e, мутації, журнали.

**Помилки агента, які впіймано** ([«Впевнені помилки агента»][al-err])
1. План (написаний агентом) подав еталонну `resolveEnemyContacts` як правильну. Еталон порушував `design.md` §6 «перемагає стрибок зверху», а всі 76 тестів плану його пропускали. Помилку побачили worker A, orchestrator і checker, який еталона не бачив. Наслідок: тест [60e679f][c-60e679f] і правило checker'у «не читати `docs/plan/`».
2. Перевірка запобіжника циклу «без витрат»: агент записав шлях у PATH у формі `C:/…`, і замість підставної команди запустився справжній `claude`. 5 справжніх викликів, $0.97; агент зупинив цикл сам. Наслідок: `where claude` перед кожним таким тестом.
3. Агент запевнив, що `pnpm add` попросить підтвердження. Сесія працювала в `bypassPermissions`, тож залежність поставилась без запиту.
4. Агент записав підказку в `session-notes.md` і лишив незакомічені журнали. Свіжа сесія контрольного експерименту їх прочитала: спроба 1 Task 0.4 і прогін «до» етапу 1 не сліпі.
5. Тричі вставка рядка в таблицю `autonomy-log.md` розрізала сусідній рядок. Виправлено, і тепер після кожної вставки рахуємо комірки.
6. Агент, який готував здачу (етап 6), написав у тексті PR, у журналі і в підписі відео, що розв'язки всіх 5 рівнів записала людина (насправді лише 01 і 03), і подав забруднену першу спробу негативного контролю як доказ статичного контексту. Обидві заяви впіймав незалежний `homework-reviewer` до здачі; текст, журнал і відео виправлено.

**Що зупинено або відкочено**
- Write `src/core/spawn.ts` з `Math.random` — заблокував `guard-core` ([actions.jsonl L93][aj93], [blocked.jsonl][blocked]).
- Дві команди агента з `rm -rf` — не виконались через правило `deny` ([actions.jsonl L667][aj667]).
- Сесія archive зміни C сама переписала `## Purpose`, хоча промпт це забороняв. Помічено до коміту. Моє рішення — лишити й доповнити, і коміт [4d8f233][c-4d8f233] це позначає.
- Цикл зі справжнім `claude` замість підставного — зупинено.
- Мутації M1–M3 і `<=` → `<` — внесено і відкочено через `git checkout`; для M1–M3 відкат перевірено `git diff --quiet`.

## 3. Чого перевірка не охоплює

Автоматично не перевіряється ([design.md §7, «Межі перевірки»][design7]):
- «відчуття» стрибка, складність і справедливість рівнів. Це лише моя гра: рівні 04 і 05 прийнято одним словом «прийнято», без окремої причини;
- розв'язок доводить прохідність лише одним записаним шляхом. Інші шляхи і те, чи рівень цікавий, не перевіряються;
- e2e — лише smoke: гра стартує, «вправо» рухає гравця, у консолі немає помилок. Смерть, пастки, ворогів і перемогу в браузері e2e не перевіряє. Ці правила перевіряють replay-тести на `step()`, без браузера;
- читабельність HUD. Відома проблема: шрифт `8px` на канвасі 320×240, розтягнутому до 960×720, — кирилиця розмазана;
- зайві ключі в об'єктах пасток, тригерів і дій валідатор приймає (`.strict()` лише для рівня, ворога і розв'язку);
- гілку циклу «FAIL → помилки агентові → наступна ітерація» справжній прогін не пройшов;
- витрати знято не всі: частину сесій (archive змін, рев'ю) окремо не виміряно ([intent.md][intent]).

## 4. Як перевірити

```
pnpm install && pnpm hooks:selftest && pnpm check && pnpm e2e
```

CI на коміті тегу `stage-5b` (`5b40bcc`): [прогін][ci-5b] (`pnpm hooks:selftest`, `pnpm check`, `pnpm e2e`).

[agents]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/AGENTS.md
[guard]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.claude/hooks/guard-core.mjs
[bounds]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/scripts/check-boundaries.mjs
[aj83]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L83-L86
[aj93]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L93
[aj667]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L667
[aj919]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L919-L920
[aj1119]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/actions.jsonl#L1119-L1122
[blocked]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/blocked.jsonl#L1
[mcp]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.mcp.json
[ctx]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/context-log.md
[skill]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.claude/skills/make-level/SKILL.md
[loop]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/scripts/level-loop.mjs
[pkg]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/package.json
[loop1]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/loops/2026-10-04T07-04-04-071Z-level-04.jsonl
[loop2]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/loops/2026-10-04T07-09-59-998Z-level-04.jsonl
[loop3]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/loops/2026-10-04T07-12-42-175Z-level-05.jsonl
[looplog]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/loop-log.md
[mut]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/mutation-log.md
[checker]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.claude/agents/game-checker.md
[report]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/stage3/checker-report.md
[checkerlog]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/stage3/checker.jsonl
[decisions]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/stage3/decisions.md
[design7]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/design.md?plain=1#L188-L190
[design13]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/design.md?plain=1#L267
[intent]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/intent.md
[archive]: https://github.com/sfilenko/trap-runner/tree/43a8a39999ae25abb9b1a7870240196bd376119e/openspec/changes/archive
[specs]: https://github.com/sfilenko/trap-runner/tree/43a8a39999ae25abb9b1a7870240196bd376119e/openspec/specs
[req]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/stage3/requirements.md
[dag]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/stage3/dag.md
[briefa]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/stage3/brief-a.md
[briefb]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/stage3/brief-b.md
[repa]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/stage3/report-a.md
[repb]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/stage3/report-b.md
[stage3log]: https://github.com/sfilenko/trap-runner/tree/43a8a39999ae25abb9b1a7870240196bd376119e/.agent-log/stage3
[costs]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/stage3/costs.md
[tag-c0]: https://github.com/sfilenko/trap-runner/tree/contract-c0
[al]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/autonomy-log.md
[al4]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/autonomy-log.md?plain=1#L12
[al6]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/autonomy-log.md?plain=1#L14
[al18]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/autonomy-log.md?plain=1#L26
[al24]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/autonomy-log.md?plain=1#L32
[al-down]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/autonomy-log.md?plain=1#L46-L50
[al-err]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/autonomy-log.md?plain=1#L52-L61
[al-dev]: https://github.com/sfilenko/trap-runner/blob/43a8a39999ae25abb9b1a7870240196bd376119e/docs/autonomy-log.md?plain=1#L63
[ci-5b]: https://github.com/sfilenko/trap-runner/actions/runs/37186615017
[ci-e2e]: https://github.com/sfilenko/trap-runner/actions/runs/37186278089
[guardlogs]: https://github.com/sfilenko/trap-runner/tree/main/.agent-log/loops/guard-test-2026-10-04
[c-1b66c29]: https://github.com/sfilenko/trap-runner/commit/1b66c29
[c-4db3375]: https://github.com/sfilenko/trap-runner/commit/4db3375
[c-2d9787b]: https://github.com/sfilenko/trap-runner/commit/2d9787b
[c-8fbb6d0]: https://github.com/sfilenko/trap-runner/commit/8fbb6d0
[c-ee47379]: https://github.com/sfilenko/trap-runner/commit/ee47379
[c-f4dd72e]: https://github.com/sfilenko/trap-runner/commit/f4dd72e
[c-03aba67]: https://github.com/sfilenko/trap-runner/commit/03aba67
[c-cf81fdc]: https://github.com/sfilenko/trap-runner/commit/cf81fdc
[c-7b80c81]: https://github.com/sfilenko/trap-runner/commit/7b80c81
[c-9993693]: https://github.com/sfilenko/trap-runner/commit/9993693
[c-c61a5d7]: https://github.com/sfilenko/trap-runner/commit/c61a5d7
[c-b318dc1]: https://github.com/sfilenko/trap-runner/commit/b318dc1
[c-60e679f]: https://github.com/sfilenko/trap-runner/commit/60e679f
[c-290bfca]: https://github.com/sfilenko/trap-runner/commit/290bfca
[c-c4485f7]: https://github.com/sfilenko/trap-runner/commit/c4485f7
[c-5ad9a65]: https://github.com/sfilenko/trap-runner/commit/5ad9a65
[c-02815b6]: https://github.com/sfilenko/trap-runner/commit/02815b6
[c-cdc93f7]: https://github.com/sfilenko/trap-runner/commit/cdc93f7
[c-1e0072d]: https://github.com/sfilenko/trap-runner/commit/1e0072d
[c-77dda70]: https://github.com/sfilenko/trap-runner/commit/77dda70
[c-2aefcda]: https://github.com/sfilenko/trap-runner/commit/2aefcda
[c-cef8421]: https://github.com/sfilenko/trap-runner/commit/cef8421
[c-1c22360]: https://github.com/sfilenko/trap-runner/commit/1c22360
[c-d31c5e5]: https://github.com/sfilenko/trap-runner/commit/d31c5e5
[c-37def98]: https://github.com/sfilenko/trap-runner/commit/37def98
[c-9af5b43]: https://github.com/sfilenko/trap-runner/commit/9af5b43
[c-c004dd6]: https://github.com/sfilenko/trap-runner/commit/c004dd6
[c-4d8f233]: https://github.com/sfilenko/trap-runner/commit/4d8f233
