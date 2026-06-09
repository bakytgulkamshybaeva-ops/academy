/* ============================================================
   ATAMŪRA · Академия продаж — движок (данные курса + геймификация)
   Структура «День 1» (укрупнённая, под видео-сессию):
     О компании (U0) → Ядро U1–U3 → трек Телемаркетинг (T1–T6) / Отдел продаж (O1–O5).
   Состояние — в localStorage. Без CRM/HR: «конверсия» = цель + прокси-готовность (РОП).
   Валюта — коины 🪙 (как в кокпите «Напарник продавца»).
   ============================================================ */
(function (global) {
  'use strict';

  var STORE_KEY = 'atamura_academy_v1';

  var COIN = { lessonDone: 15, quizPass: 25, firstTry: 10, blockDone: 50 };
  var DAILY_GOAL = 60;
  var PASS_PCT = 80;

  var RANKS = [
    { id: 'intern',  name: 'Стажёр',          min: 0,    needRop: false },
    { id: 'manager', name: 'Менеджер',         min: 100,  needRop: false },
    { id: 'senior',  name: 'Старший менеджер', min: 300,  needRop: false },
    { id: 'expert',  name: 'Эксперт',          min: 650,  needRop: true  },
    { id: 'mentor',  name: 'Наставник',        min: 1100, needRop: true  }
  ];

  /* ---------- Блоки (они же группы карты) ---------- */
  var BLOCKS = [
    { id: 'about', icon: '🏛️', title: 'О компании',     sub: 'Кто мы и наше обещание' },
    { id: 'core',  icon: '🎯', title: 'Ядро продаж',     sub: 'База для обеих ролей' },
    { id: 'tm',    icon: '📞', title: 'Телемаркетинг',   sub: 'Телефон → показ' },
    { id: 'op',    icon: '🤝', title: 'Отдел продаж',    sub: 'Встреча → сделка' }
  ];

  /* ready:true — урок реально собран (видео Avatar IV + текст + тест). T/O ждут рендера. */
  var COURSE = [
    // 🏛️ О компании
    { id: 'U0', block: 'about', title: 'О компании ATAMŪRA', min: 7,    ready: true, video: 'video/U0_intro.mp4', page: 'lesson_U0.html' },

    // 🎯 Ядро продаж (для всех)
    { id: 'U1', block: 'core', title: 'Профессия продавца и воронка', min: 21.7, ready: true, video: 'video/U1_intro.mp4', page: 'lesson_U1.html' },
    { id: 'U2', block: 'core', title: 'Клиент и его задача',          min: 20.7, ready: true, video: 'video/U2_intro.mp4', page: 'lesson_U2.html' },
    { id: 'U3', block: 'core', title: 'Возражения: природа и алгоритм', min: 18.1, ready: true, video: 'video/U3_intro.mp4', page: 'lesson_U3.html' },

    // 📞 Телемаркетинг (телефон → показ)
    { id: 'T1', block: 'tm', title: 'Цель звонка (показ), подготовка и голос', min: 23.3 },
    { id: 'T2', block: 'tm', title: 'Начало звонка: каркас, контакт, первые 15 секунд', min: 20.1 },
    { id: 'T3', block: 'tm', title: 'Программирование и квалификация ABC', min: 23.0 },
    { id: 'T4', block: 'tm', title: 'Презентация и закрытие на показ', min: 23.0 },
    { id: 'T5', block: 'tm', title: 'Возражения по телефону, холодные и реактивация', min: 25.1 },
    { id: 'T6', block: 'tm', title: 'Follow-up и сборка скрипт-карты звонка', min: 22.4 },

    // 🤝 Отдел продаж (встреча → сделка)
    { id: 'O1', block: 'op', title: 'Подготовка к встрече и старт показа', min: 21.5 },
    { id: 'O2', block: 'op', title: 'Презентация на показе и чтение клиента', min: 24.3 },
    { id: 'O3', block: 'op', title: 'Возражения вживую и переговоры', min: 24.2 },
    { id: 'O4', block: 'op', title: 'Закрытие сделки и оформление', min: 18.2 },
    { id: 'O5', block: 'op', title: 'После встречи: доведение и чек-лист', min: 20.7 }
  ];

  var ROLE = {
    tm: { id: 'tm', name: 'Телемаркетинг', short: 'ТМ', icon: '📞',
      metric: 'Конверсия: встречи ÷ лиды', lever: 'КЭВ — закрытие на конкретную дату показа',
      target: 22, baseline: 16, unit: '%' },
    op: { id: 'op', name: 'Отдел продаж', short: 'ОП', icon: '🤝',
      metric: 'Конверсия: сделки ÷ показы', lever: 'Закрытие на встрече: бронь и договор',
      target: 35, baseline: 28, unit: '%' }
  };

  var BADGES = [
    { id: 'first',  icon: '🥇', name: 'Первый шаг',     desc: 'Пройден первый урок' },
    { id: 'start',  icon: '🏛️', name: 'Знакомство',     desc: 'Пройден урок «О компании»' },
    { id: 'sniper', icon: '🎯', name: 'Снайпер',        desc: 'Тест сдан с первой попытки' },
    { id: 'core',   icon: '🧩', name: 'Ядро продаж',    desc: 'Пройдено ядро U1–U3' },
    { id: 'week',   icon: '🔥', name: 'Неделя в строю', desc: 'Серия 7 дней подряд' },
    { id: 'track',  icon: '🏆', name: 'Трек закрыт',    desc: 'Все уроки твоей роли пройдены' },
    { id: 'rop',    icon: '✅', name: 'КЭВ-проба',      desc: 'РОП подтвердил реальный звонок' },
    { id: 'mentor', icon: '👑', name: 'Наставник',      desc: 'Достигнут высший грейд' }
  ];

  /* ============================================================
     Состояние
     ============================================================ */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function daysBetween(a, b) { var da = new Date(a + 'T00:00:00'), db = new Date(b + 'T00:00:00'); return Math.round((db - da) / 86400000); }

  function defaults() {
    return { v: 1, name: 'Айдана', role: 'tm', coins: 0, done: {}, streak: 0,
      lastActive: null, today: todayStr(), todayCoins: 0, badges: {}, rop: { tm: false, op: false } };
  }
  function load() {
    var s;
    try { s = JSON.parse(global.localStorage.getItem(STORE_KEY)); } catch (e) { s = null; }
    if (!s || s.v !== 1) s = defaults();
    var t = todayStr();
    if (s.today !== t) { s.today = t; s.todayCoins = 0; }
    if (!s.rop) s.rop = { tm: false, op: false };
    return s;
  }
  function save(s) { try { global.localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {} }

  /* ============================================================
     Вычисления
     ============================================================ */
  function lessonsForRole(role) {
    return COURSE.filter(function (l) {
      if (l.block === 'tm') return role === 'tm';
      if (l.block === 'op') return role === 'op';
      return true; // about, core
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
    var info = { current: cur.rank, next: nxt, pct: 100, toNext: 0, ropBlocked: false };
    if (nxt) {
      var span = Math.max(1, nxt.min - cur.rank.min);
      info.pct = Math.max(0, Math.min(100, Math.round(((coins - cur.rank.min) / span) * 100)));
      info.toNext = Math.max(0, nxt.min - coins);
      info.ropBlocked = nxt.needRop && !ropOk;
    }
    return info;
  }

  function readiness(s) {
    var rl = lessonsForRole(s.role), total = rl.length;
    var doneCnt = 0, quizTaken = 0, quizFirst = 0;
    rl.forEach(function (l) {
      var d = s.done[l.id];
      if (d) { doneCnt++; if (typeof d.score === 'number') { quizTaken++; if (d.firstTry) quizFirst++; } }
    });
    var knowledge = total ? doneCnt / total : 0;
    var skill = quizTaken ? quizFirst / quizTaken : 0;
    var confirm = s.rop[s.role] ? 1 : 0;
    return {
      pct: Math.round(50 * knowledge + 25 * skill + 25 * confirm),
      knowledge: Math.round(knowledge * 100), skill: Math.round(skill * 100),
      confirm: confirm * 100, doneCnt: doneCnt, total: total
    };
  }

  function blockProgress(s, blockId) {
    var ls = COURSE.filter(function (l) { return l.block === blockId; });
    var done = ls.filter(function (l) { return isDone(s, l.id); }).length;
    return { done: done, total: ls.length, pct: ls.length ? Math.round(done / ls.length * 100) : 0 };
  }

  function nextLesson(s) {
    for (var i = 0; i < COURSE.length; i++) {
      var l = COURSE[i];
      if (l.block === 'tm' && s.role !== 'tm') continue;
      if (l.block === 'op' && s.role !== 'op') continue;
      if (l.ready && !isDone(s, l.id)) return l;
    }
    return null;
  }

  /* ============================================================
     Действия
     ============================================================ */
  function touchStreak(s) {
    var t = todayStr();
    if (s.lastActive === t) return;
    if (s.lastActive && daysBetween(s.lastActive, t) === 1) s.streak += 1; else s.streak = 1;
    s.lastActive = t;
  }

  function evalBadges(s) {
    var gained = [];
    function give(id) { if (!s.badges[id]) { s.badges[id] = Date.now(); gained.push(id); } }
    if (COURSE.some(function (l) { return isDone(s, l.id); })) give('first');
    if (isDone(s, 'U0')) give('start');
    if (Object.keys(s.done).some(function (k) { return s.done[k] && s.done[k].firstTry; })) give('sniper');
    var core = COURSE.filter(function (l) { return l.block === 'core'; });
    if (core.length && core.every(function (l) { return isDone(s, l.id); })) give('core');
    if (s.streak >= 7) give('week');
    var rl = lessonsForRole(s.role);
    if (rl.length && rl.every(function (l) { return isDone(s, l.id); })) give('track');
    if (s.rop[s.role]) give('rop');
    if (rankFor(s.coins, s.rop[s.role]).rank.id === 'mentor') give('mentor');
    return gained;
  }

  function maybeBlockBonus(s, blockId) {
    var bp = blockProgress(s, blockId);
    var key = '_block_' + blockId;
    if (bp.total > 0 && bp.pct === 100 && !s.done[key]) {
      s.done[key] = { at: Date.now(), bonus: true };
      s.coins += COIN.blockDone; s.todayCoins += COIN.blockDone;
      return COIN.blockDone;
    }
    return 0;
  }

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
    if (hasQuiz && !passed) return { passed: false, pct: pct };

    if (!already) {
      awarded += COIN.lessonDone;
      var firstTry = true;
      if (hasQuiz) {
        awarded += COIN.quizPass;
        var attempts = (s._attempts && s._attempts[id]) || 1;
        firstTry = attempts <= 1;
        if (firstTry) awarded += COIN.firstTry;
      }
      s.done[id] = { at: Date.now(), passed: true,
        score: hasQuiz ? opts.score : undefined, total: hasQuiz ? opts.total : undefined,
        firstTry: hasQuiz ? firstTry : undefined };
      s.coins += awarded; s.todayCoins += awarded;
    }

    touchStreak(s);
    var blockBonus = maybeBlockBonus(s, lesson.block);
    awarded += blockBonus;
    var newBadges = evalBadges(s);
    save(s);

    var rankAfter = rankFor(s.coins, s.rop[s.role]).rank.id;
    return { passed: true, pct: pct, alreadyDone: already, coinsAwarded: awarded, blockBonus: blockBonus,
      leveledUp: rankBefore !== rankAfter, newRank: rankAfter, newBadges: newBadges,
      goalMet: s.todayCoins >= DAILY_GOAL, next: nextLesson(s) };
  }

  function markAttempt(id) {
    var s = load();
    s._attempts = s._attempts || {};
    s._attempts[id] = (s._attempts[id] || 0) + 1;
    save(s);
  }

  function setRole(role) { var s = load(); if (ROLE[role]) { s.role = role; save(s); } }
  function setRop(role, val) { var s = load(); s.rop[role] = !!val; evalBadges(s); save(s); }
  function reset() { try { global.localStorage.removeItem(STORE_KEY); } catch (e) {} }

  function snapshot() {
    var s = load(), rd = readiness(s);
    return { state: s, role: ROLE[s.role], coins: s.coins, todayCoins: s.todayCoins, dailyGoal: DAILY_GOAL,
      streak: s.streak, rank: nextRankInfo(s.coins, s.rop[s.role]), readiness: rd,
      next: nextLesson(s), ropOk: s.rop[s.role] };
  }

  global.Academy = {
    COURSE: COURSE, BLOCKS: BLOCKS, RANKS: RANKS, ROLE: ROLE, BADGES: BADGES,
    COIN: COIN, DAILY_GOAL: DAILY_GOAL, PASS_PCT: PASS_PCT,
    load: load, snapshot: snapshot, lessonsForRole: lessonsForRole,
    isDone: function (id) { return isDone(load(), id); },
    blockProgress: function (b) { return blockProgress(load(), b); },
    readiness: function () { return readiness(load()); },
    rankInfo: function () { var s = load(); return nextRankInfo(s.coins, s.rop[s.role]); },
    nextLesson: function () { return nextLesson(load()); },
    completeLesson: completeLesson, markAttempt: markAttempt,
    setRole: setRole, setRop: setRop, reset: reset, todayStr: todayStr
  };

})(window);
