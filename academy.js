/* ============================================================
   ATAMŪRA · Академия продаж — движок (данные курса + геймификация)
   Общий для academy.html и страниц уроков (lesson_*.html).
   Состояние — в localStorage. Без CRM, без денежных/HR-последствий:
   «конверсия» здесь = ЦЕЛЬ и ПРОКСИ-готовность, подтверждаемая РОПом.
   Валюта — коины 🪙 (как в кокпите «Напарник продавца»).
   ============================================================ */
(function (global) {
  'use strict';

  var STORE_KEY = 'atamura_academy_v1';

  /* ---------- Экономика коинов ---------- */
  var COIN = {
    lessonDone: 15,   // урок просмотрен и прочитан
    quizPass: 25,     // тест сдан (≥ порога)
    firstTry: 10,     // бонус: сдал с первой попытки
    blockDone: 50     // бонус за закрытие блока
  };
  var DAILY_GOAL = 60;     // дневная цель, коинов
  var PASS_PCT = 80;       // порог теста

  /* ---------- Грейды (ранги) ----------
     Эксперт+ требуют РОП-чек реального звонка (замок 2) —
     ранг растёт не от кликов, а от подтверждённого навыка. */
  var RANKS = [
    { id: 'intern',  name: 'Стажёр',          min: 0,    needRop: false },
    { id: 'manager', name: 'Менеджер',         min: 100,  needRop: false },
    { id: 'senior',  name: 'Старший менеджер', min: 300,  needRop: false },
    { id: 'expert',  name: 'Эксперт',          min: 650,  needRop: true  },
    { id: 'mentor',  name: 'Наставник',        min: 1100, needRop: true  }
  ];

  /* ---------- Блоки курса ---------- */
  var BLOCKS = [
    { id: 'intro', icon: '✨', title: 'Вступление',        sub: 'Зачем академия и как учиться' },
    { id: 'mkt',   icon: '🏙️', title: '1 · Рынок',          sub: 'Как устроена недвижимость' },
    { id: 'cli',   icon: '👥', title: '2 · Клиенты',        sub: 'Портреты ЦА: для себя и инвестор' },
    { id: 'prod',  icon: '🏢', title: '3 · Продукты',       sub: 'ЖК ATAMŪRA под задачу' },
    { id: 'fin',   icon: '⚖️', title: '4 · Финансы и право', sub: 'Оплата, ипотека, договоры' },
    { id: 'sales', icon: '🎯', title: '5 · Продажи',        sub: 'Техника: звонок → показ → сделка' }
  ];

  /* track: для блока «Продажи» — core (для всех) / tm (телемаркетинг) / op (отдел продаж).
     ready:true — урок реально собран (видео + текст + тест). Остальные «готовятся»
     в параллельной видео-сессии: появляется видео → ставим ready:true + страницу. */
  var COURSE = [
    // ✨ Вступление
    { id: 'intro_01', block: 'intro', title: 'Продажи — это навык, а не талант', min: 1.8, ready: true,  video: 'video/intro_01_mariia_clean.mp4', page: 'lesson_intro_01.html' },
    { id: 'intro_02', block: 'intro', title: 'Как устроена академия и две роли',  min: 2.6, ready: true,  video: 'video/intro_02_mariia.mp4',      page: 'lesson_intro_02.html' },

    // 🏙️ Рынок
    { id: 'mkt_01', block: 'mkt', title: 'Рынок жилья: первичка, вторичка, новостройка', min: 5 },
    { id: 'mkt_02', block: 'mkt', title: 'Путь дома от земли до ключей', min: 4.5 },
    { id: 'mkt_03', block: 'mkt', title: 'Кто есть кто: застройщик, подрядчик, УК, дольщик, агент', min: 5 },
    { id: 'mkt_04', block: 'mkt', title: 'Форматы жилья: квартира, студия, евро, таунхаус', min: 5.5 },
    { id: 'mkt_05', block: 'mkt', title: 'Словарь: балкон, лоджия, терраса, площади, отделка', min: 4.5 },
    { id: 'mkt_06', block: 'mkt', title: 'Как выбирают квартиру: на что смотрит покупатель', min: 6 },

    // 👥 Клиенты
    { id: 'cli_01', block: 'cli', title: 'Две мотивации: для себя и для инвестиции', min: 4.5 },
    { id: 'cli_02', block: 'cli', title: 'Покупатель «для себя»: первое жильё, семья', min: 5.5 },
    { id: 'cli_03', block: 'cli', title: 'Покупатель-инвестор: как думает и считает', min: 5 },
    { id: 'cli_04', block: 'cli', title: 'Как собрать портрет клиента за один разговор', min: 5.5 },

    // 🏢 Продукты
    { id: 'd2_01', block: 'prod', title: 'Продукт под задачу, цифры — у РОП', min: 4 },
    { id: 'd2_02', block: 'prod', title: 'Карта линейки по задачам', min: 4 },
    { id: 'd2_03', block: 'prod', title: 'Предгорье Алатау: «Аура» и «Аксай Резорт»', min: 5.5 },
    { id: 'd2_04', block: 'prod', title: 'ЖК «Керуен»: первое жильё и понятный старт', min: 5 },
    { id: 'd2_05', block: 'prod', title: 'ЖК «Атмосфера»: семья и «город в городе»', min: 5 },
    { id: 'd2_07', block: 'prod', title: '«Браво» (статус) + ранние проекты', min: 5.5 },
    { id: 'd2_08', block: 'prod', title: 'Подбор ЖК под задачу клиента', min: 5.5 },
    { id: 'd2_09', block: 'prod', title: 'База по ипотеке (батл-карта)', min: 6 },
    { id: 'd2_10', block: 'prod', title: 'Как устроена покупка: бронь → договор → оплата → ввод', min: 6 },
    { id: 'd2_11', block: 'prod', title: 'Презентация объекта под задачу', min: 5.5 },
    { id: 'd2_12', block: 'prod', title: 'Конкуренты и «дорого / далеко»', min: 6 },
    { id: 'd2_13', block: 'prod', title: 'Продуктовый звонок целиком (разбор · Керуен)', min: 4.5 },
    { id: 'd2_14', block: 'prod', title: 'Продуктовый показ целиком (разбор · Атмосфера)', min: 5 },
    { id: 'd2_15', block: 'prod', title: 'Частые вопросы клиента: банк ответов', min: 4 },
    { id: 'd2_16', block: 'prod', title: 'Память на линейку: как держать в голове', min: 3 },
    { id: 'd2_17', block: 'prod', title: 'Финал блока: поведенческий чек-лист + метрика', min: 4 },

    // ⚖️ Финансы и право
    { id: 'fin_01', block: 'fin', title: 'Три способа оплатить: 100%, рассрочка, ипотека', min: 6 },
    { id: 'fin_02', block: 'fin', title: 'Ипотека: банки 2-го уровня и госпрограммы', min: 5.5 },
    { id: 'fin_03', block: 'fin', title: 'Долевое: как защищены деньги дольщика (КЖК)', min: 5 },
    { id: 'fin_04', block: 'fin', title: 'Договоры: ДДУ и ПДКП — чем отличаются', min: 5.5 },
    { id: 'fin_05', block: 'fin', title: '«Как купить безопасно» за две минуты', min: 5 },

    // 🎯 Продажи · общее ядро
    { id: 'd1_01', block: 'sales', track: 'core', title: 'Роль продавца: продажи — навык, а не талант', min: 8.3, ready: true, video: 'video/d1_01_hybrid.mp4', page: 'lesson_d1_01.html' },
    { id: 'd1_02', block: 'sales', track: 'core', title: 'Воронка-аквариум — на ком фокус', min: 7.5, ready: true, page: 'lesson_d1_02.html' },
    { id: 'd1_04', block: 'sales', track: 'core', title: 'Клиент покупает решение задачи', min: 8.8, ready: true, page: 'lesson_d1_04.html' },
    { id: 'd1_05', block: 'sales', track: 'core', title: 'Потребность против боли: как найти задачу', min: 9.7, ready: true, page: 'lesson_d1_05.html' },
    { id: 'd1_13', block: 'sales', track: 'core', title: 'Природа возражений', min: 8.4, ready: true, page: 'lesson_d1_13.html' },
    { id: 'd1_14', block: 'sales', track: 'core', title: 'Алгоритм отработки возражений', min: 9.7, ready: true, page: 'lesson_d1_14.html' },

    // 📞 Продажи · Телемаркетинг (телефон → показ)
    { id: 'd1_03', block: 'sales', track: 'tm', title: 'КЭВ — почему всё ведёт к показу', min: 9.6 },
    { id: 'd1_06', block: 'sales', track: 'tm', title: 'Подготовка к звонку и рабочий настрой', min: 6.1 },
    { id: 'd1_07', block: 'sales', track: 'tm', title: 'Каркас звонка: 8 этапов', min: 10.2 },
    { id: 'd1_08', block: 'sales', track: 'tm', title: 'Контакт и приветствие: первые 15 секунд', min: 8.8 },
    { id: 'd1_09', block: 'sales', track: 'tm', title: 'Программирование: рамка и захват инициативы', min: 9.8 },
    { id: 'd1_10', block: 'sales', track: 'tm', title: 'Квалификация: 5 вопросов и ABC', min: 13.1 },
    { id: 'd1_11', block: 'sales', track: 'tm', title: 'Презентация под задачу', min: 9.9 },
    { id: 'd1_12', block: 'sales', track: 'tm', title: 'Закрытие на показ: предложение встречи', min: 11.9 },
    { id: 'd1_15', block: 'sales', track: 'tm', title: 'Топ возражений недвижимости', min: 12.3 },
    { id: 'd1_16', block: 'sales', track: 'tm', title: 'Холодный звонок и реактивация отказников', min: 10.3 },
    { id: 'd1_17', block: 'sales', track: 'tm', title: 'Голос, темп и телефон', min: 6.3 },
    { id: 'd1_18', block: 'sales', track: 'tm', title: 'Доведение и дисциплина в СРМ', min: 10.1 },
    { id: 'd1_19', block: 'sales', track: 'tm', title: 'Скрипт-карта звонка целиком + разбор', min: 10.8 },

    // 🤝 Продажи · Отдел продаж (встреча → сделка)
    { id: 's_01', block: 'sales', track: 'op', title: 'Передача из телемаркетинга и подготовка к встрече', min: 12.3 },
    { id: 's_02', block: 'sales', track: 'op', title: 'Встреча и показ: первые минуты вживую', min: 9.5 },
    { id: 's_03', block: 'sales', track: 'op', title: 'Презентация на показе: дом под задачу', min: 14.2 },
    { id: 's_04', block: 'sales', track: 'op', title: 'Чтение клиента вживую и усиление потребности', min: 8.2 },
    { id: 's_05', block: 'sales', track: 'op', title: 'Возражения лицом к лицу', min: 9.0 },
    { id: 's_06', block: 'sales', track: 'op', title: 'Переговоры по условиям', min: 13.3 },
    { id: 's_07', block: 'sales', track: 'op', title: 'Сигналы готовности и закрытие сделки', min: 8.9 },
    { id: 's_08', block: 'sales', track: 'op', title: 'Бронь, договор и оформление', min: 7.5 },
    { id: 's_09', block: 'sales', track: 'op', title: 'Работа после встречи: доведение до сделки', min: 10.3 },
    { id: 's_10', block: 'sales', track: 'op', title: 'Чек-лист встречи и самопроверка', min: 7.8 }
  ];

  /* ---------- Цель по роли (север-стар = конверсия кокпита) ---------- */
  var ROLE = {
    tm: {
      id: 'tm', name: 'Телемаркетинг', short: 'ТМ', icon: '📞',
      metric: 'Конверсия: встречи ÷ лиды', lever: 'КЭВ — закрытие на конкретную дату показа',
      target: 22, baseline: 16, unit: '%'
    },
    op: {
      id: 'op', name: 'Отдел продаж', short: 'ОП', icon: '🤝',
      metric: 'Конверсия: сделки ÷ показы', lever: 'Закрытие на встрече: бронь и договор',
      target: 35, baseline: 28, unit: '%'
    }
  };

  /* ---------- Значки ---------- */
  var BADGES = [
    { id: 'first',     icon: '🥇', name: 'Первый шаг',     desc: 'Пройден первый урок' },
    { id: 'sniper',    icon: '🎯', name: 'Снайпер',        desc: 'Тест сдан с первой попытки' },
    { id: 'week',      icon: '🔥', name: 'Неделя в строю', desc: 'Серия 7 дней подряд' },
    { id: 'base',      icon: '🧠', name: 'Фундамент',      desc: 'Закрыты блоки «Рынок» и «Клиенты»' },
    { id: 'core',      icon: '🧩', name: 'Ядро продаж',    desc: 'Пройдено общее ядро продаж' },
    { id: 'track',     icon: '🏆', name: 'Трек закрыт',    desc: 'Все уроки твоей роли пройдены' },
    { id: 'rop',       icon: '✅', name: 'КЭВ-проба',      desc: 'РОП подтвердил реальный звонок' },
    { id: 'mentor',    icon: '👑', name: 'Наставник',      desc: 'Достигнут высший грейд' }
  ];

  /* ============================================================
     Состояние
     ============================================================ */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function daysBetween(a, b) {
    var da = new Date(a + 'T00:00:00'), db = new Date(b + 'T00:00:00');
    return Math.round((db - da) / 86400000);
  }

  function defaults() {
    return {
      v: 1,
      name: 'Айдана',
      role: 'tm',
      coins: 0,
      done: {},               // id -> {at, score, total, firstTry, passed}
      streak: 0,
      lastActive: null,       // YYYY-MM-DD
      today: todayStr(),
      todayCoins: 0,
      badges: {},             // id -> at
      rop: { tm: false, op: false }  // замок 2 (РОП-чек) по роли
    };
  }

  function load() {
    var s;
    try { s = JSON.parse(global.localStorage.getItem(STORE_KEY)); } catch (e) { s = null; }
    if (!s || s.v !== 1) s = defaults();
    // прокатка дня
    var t = todayStr();
    if (s.today !== t) { s.today = t; s.todayCoins = 0; }
    return s;
  }
  function save(s) {
    try { global.localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  /* ============================================================
     Вычисления
     ============================================================ */
  function lessonsForRole(role) {
    return COURSE.filter(function (l) {
      if (l.block !== 'sales') return true;       // общие блоки
      if (l.track === 'core') return true;
      return l.track === role;                    // только свой трек
    });
  }

  function isDone(s, id) { return !!s.done[id]; }

  function rankFor(coins, ropOk) {
    var r = RANKS[0], idx = 0;
    for (var i = 0; i < RANKS.length; i++) {
      if (coins >= RANKS[i].min && (!RANKS[i].needRop || ropOk)) { r = RANKS[i]; idx = i; }
    }
    return { rank: r, index: idx };
  }

  function nextRankInfo(coins, ropOk) {
    var cur = rankFor(coins, ropOk);
    var nxt = RANKS[cur.index + 1] || null;
    var prevMin = cur.rank.min;
    var info = { current: cur.rank, next: nxt, pct: 100, toNext: 0, ropBlocked: false };
    if (nxt) {
      var span = Math.max(1, nxt.min - prevMin);
      info.pct = Math.max(0, Math.min(100, Math.round(((coins - prevMin) / span) * 100)));
      info.toNext = Math.max(0, nxt.min - coins);
      info.ropBlocked = nxt.needRop && !ropOk;
    }
    return info;
  }

  // Конверсия-готовность (0–100%): знания 50 + навык 25 + подтверждение 25.
  // Это ПРОКСИ обученности, не выгрузка из CRM.
  function readiness(s) {
    var rl = lessonsForRole(s.role);
    var total = rl.length;
    var doneCnt = 0, quizTaken = 0, quizFirst = 0;
    rl.forEach(function (l) {
      var d = s.done[l.id];
      if (d) {
        doneCnt++;
        if (typeof d.score === 'number') { quizTaken++; if (d.firstTry) quizFirst++; }
      }
    });
    var knowledge = total ? doneCnt / total : 0;
    var skill = quizTaken ? quizFirst / quizTaken : 0;
    var confirm = s.rop[s.role] ? 1 : 0;
    var pct = Math.round(50 * knowledge + 25 * skill + 25 * confirm);
    return {
      pct: pct,
      knowledge: Math.round(knowledge * 100),
      skill: Math.round(skill * 100),
      confirm: confirm * 100,
      doneCnt: doneCnt, total: total
    };
  }

  function blockProgress(s, blockId) {
    var ls = COURSE.filter(function (l) {
      if (l.block !== blockId) return false;
      if (blockId === 'sales' && l.track && l.track !== 'core' && l.track !== s.role) return false;
      return true;
    });
    var done = ls.filter(function (l) { return isDone(s, l.id); }).length;
    return { done: done, total: ls.length, pct: ls.length ? Math.round(done / ls.length * 100) : 0 };
  }

  function nextLesson(s) {
    // первый собранный (ready) и не пройденный урок по порядку курса
    for (var i = 0; i < COURSE.length; i++) {
      var l = COURSE[i];
      if (l.block === 'sales' && l.track && l.track !== 'core' && l.track !== s.role) continue;
      if (l.ready && !isDone(s, l.id)) return l;
    }
    return null;
  }

  /* ============================================================
     Действия
     ============================================================ */
  function touchStreak(s) {
    var t = todayStr();
    if (s.lastActive === t) return;            // уже отмечались сегодня
    if (s.lastActive && daysBetween(s.lastActive, t) === 1) s.streak += 1;
    else s.streak = 1;                         // первый день или серия прервана
    s.lastActive = t;
  }

  function evalBadges(s) {
    var gained = [];
    function give(id) { if (!s.badges[id]) { s.badges[id] = Date.now(); gained.push(id); } }

    if (COURSE.some(function (l) { return isDone(s, l.id); })) give('first');
    var anyFirstTry = Object.keys(s.done).some(function (k) { return s.done[k].firstTry; });
    if (anyFirstTry) give('sniper');
    if (s.streak >= 7) give('week');
    if (blockProgress(s, 'mkt').pct === 100 && blockProgress(s, 'cli').pct === 100) give('base');

    var core = COURSE.filter(function (l) { return l.track === 'core'; });
    if (core.length && core.every(function (l) { return isDone(s, l.id); })) give('core');

    var rl = lessonsForRole(s.role);
    if (rl.length && rl.every(function (l) { return isDone(s, l.id); })) give('track');

    if (s.rop[s.role]) give('rop');
    if (rankFor(s.coins, s.rop[s.role]).rank.id === 'mentor') give('mentor');
    return gained;
  }

  function maybeBlockBonus(s, blockId) {
    var bp = blockProgress(s, blockId);
    var key = '_block_' + blockId + '_' + s.role;
    if (bp.pct === 100 && !s.done[key]) {
      s.done[key] = { at: Date.now(), bonus: true };
      s.coins += COIN.blockDone; s.todayCoins += COIN.blockDone;
      return COIN.blockDone;
    }
    return 0;
  }

  // Завершить урок. opts: {score, total} от теста (необязательно).
  function completeLesson(id, opts) {
    var s = load();
    var lesson = COURSE.filter(function (l) { return l.id === id; })[0];
    if (!lesson) return null;
    opts = opts || {};

    var already = isDone(s, id);
    var rankBefore = rankFor(s.coins, s.rop[s.role]).rank.id;
    var awarded = 0;

    var hasQuiz = (typeof opts.score === 'number' && typeof opts.total === 'number' && opts.total > 0);
    var pct = hasQuiz ? Math.round(opts.score / opts.total * 100) : null;
    var passed = hasQuiz ? (pct >= PASS_PCT) : true;
    if (hasQuiz && !passed) return { passed: false, pct: pct };  // не сдал — не засчитываем

    if (!already) {
      awarded += COIN.lessonDone;
      var firstTry = true;
      if (hasQuiz) {
        awarded += COIN.quizPass;
        var attempts = (s._attempts && s._attempts[id]) || 1;
        firstTry = attempts <= 1;
        if (firstTry) awarded += COIN.firstTry;
      }
      s.done[id] = {
        at: Date.now(), passed: true,
        score: hasQuiz ? opts.score : undefined,
        total: hasQuiz ? opts.total : undefined,
        firstTry: hasQuiz ? firstTry : undefined
      };
      s.coins += awarded; s.todayCoins += awarded;
    }

    touchStreak(s);
    var blockBonus = maybeBlockBonus(s, lesson.block);
    awarded += blockBonus;

    var newBadges = evalBadges(s);
    save(s);

    var rankAfter = rankFor(s.coins, s.rop[s.role]).rank.id;
    return {
      passed: true, pct: pct, alreadyDone: already,
      coinsAwarded: awarded, blockBonus: blockBonus,
      leveledUp: rankBefore !== rankAfter, newRank: rankAfter,
      newBadges: newBadges, goalMet: s.todayCoins >= DAILY_GOAL,
      next: nextLesson(s)
    };
  }

  // зафиксировать попытку теста (чтобы повтор не считался «с первой попытки»)
  function markAttempt(id) {
    var s = load();
    s._attempts = s._attempts || {};
    s._attempts[id] = (s._attempts[id] || 0) + 1;
    save(s);
  }

  /* ---------- демо/админ ---------- */
  function setRole(role) { var s = load(); if (ROLE[role]) { s.role = role; save(s); } }
  function setRop(role, val) { var s = load(); s.rop[role] = !!val; evalBadges(s); save(s); }
  function reset() { try { global.localStorage.removeItem(STORE_KEY); } catch (e) {} }

  /* ---------- снимок для рендера ---------- */
  function snapshot() {
    var s = load();
    var rd = readiness(s);
    return {
      state: s,
      role: ROLE[s.role],
      coins: s.coins,
      todayCoins: s.todayCoins,
      dailyGoal: DAILY_GOAL,
      streak: s.streak,
      rank: nextRankInfo(s.coins, s.rop[s.role]),
      readiness: rd,
      next: nextLesson(s),
      ropOk: s.rop[s.role]
    };
  }

  global.Academy = {
    COURSE: COURSE, BLOCKS: BLOCKS, RANKS: RANKS, ROLE: ROLE, BADGES: BADGES,
    COIN: COIN, DAILY_GOAL: DAILY_GOAL, PASS_PCT: PASS_PCT,
    load: load, snapshot: snapshot,
    lessonsForRole: lessonsForRole, isDone: function (id) { return isDone(load(), id); },
    blockProgress: function (b) { return blockProgress(load(), b); },
    readiness: function () { return readiness(load()); },
    rankInfo: function () { var s = load(); return nextRankInfo(s.coins, s.rop[s.role]); },
    nextLesson: function () { return nextLesson(load()); },
    completeLesson: completeLesson, markAttempt: markAttempt,
    setRole: setRole, setRop: setRop, reset: reset, todayStr: todayStr
  };

})(window);
