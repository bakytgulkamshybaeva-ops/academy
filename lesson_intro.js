/* ATAMŪRA · Академия — движок теста вводного урока (общий).
   Читает data-lesson / data-title с <form id="quiz">, начисляет коины через Academy. */
(function () {
  'use strict';
  var quiz = document.getElementById('quiz');
  if (!quiz) return;
  var LESSON = quiz.getAttribute('data-lesson');
  var TITLE = quiz.getAttribute('data-title') || 'Урок';
  var PASS = (window.Academy && Academy.PASS_PCT) || 80;
  var questions = Array.prototype.slice.call(quiz.querySelectorAll('.q'));
  var total = questions.length;
  var checkBtn = document.getElementById('check');
  var retryBtn = document.getElementById('retry');
  var result = document.getElementById('result');
  var scoreNum = document.getElementById('score-num');
  var resultMsg = document.getElementById('result-msg');
  var nextLink = document.getElementById('next-link');

  function rankName(id) {
    if (!window.Academy) return id;
    var r = Academy.RANKS.filter(function (x) { return x.id === id; })[0];
    return r ? r.name : id;
  }
  function updateChrome() {
    if (!window.Academy) return;
    var s = Academy.snapshot();
    var el = document.getElementById('lpts');
    if (el) el.textContent = '🪙 ' + s.coins + ' · ' + s.rank.current.name;
  }

  function check() {
    if (window.Academy) Academy.markAttempt(LESSON);
    var correct = 0, unanswered = 0;
    questions.forEach(function (q) {
      var ans = q.getAttribute('data-answer');
      var picked = q.querySelector('input:checked');
      q.classList.add('checked');
      var correctOpt = q.querySelector('input[value="' + ans + '"]').closest('.opt');
      correctOpt.classList.add('correct');
      correctOpt.querySelector('.mark').textContent = 'верно';
      if (!picked) { unanswered++; return; }
      if (picked.value === ans) correct++;
      else {
        var wrongOpt = picked.closest('.opt');
        wrongOpt.classList.add('wrong');
        wrongOpt.querySelector('.mark').textContent = 'ваш ответ';
      }
    });

    var pct = Math.round((correct / total) * 100);
    scoreNum.textContent = correct;
    result.classList.add('show');
    checkBtn.style.display = 'none';
    retryBtn.style.display = 'inline-block';

    if (pct >= PASS) {
      result.classList.remove('fail'); result.classList.add('pass');
      var extra = '';
      if (window.Academy) {
        var res = Academy.completeLesson(LESSON, { score: correct, total: total });
        if (res && res.coinsAwarded) {
          extra = ' Начислено <b>+' + res.coinsAwarded + ' 🪙</b>.';
          if (res.blockBonus) extra += ' +' + res.blockBonus + ' 🪙 за блок!';
          if (res.leveledUp) extra += ' Новый грейд: <b>' + rankName(res.newRank) + '</b>!';
          if (res.newBadges && res.newBadges.length) extra += ' Значок получен 🏅.';
          try { sessionStorage.setItem('academy_award', 'Урок «' + TITLE + '» засчитан: +' + res.coinsAwarded + ' коинов' + (res.leveledUp ? ' · новый грейд ' + rankName(res.newRank) + '!' : '')); } catch (e) {}
        } else if (res && res.alreadyDone) { extra = ' Этот урок уже был засчитан ранее.'; }
        updateChrome();
      }
      resultMsg.innerHTML = 'Отлично — <b>' + pct + '%</b>. Урок засчитан.' + extra;
      nextLink.style.display = 'inline-block';
    } else {
      result.classList.remove('pass'); result.classList.add('fail');
      var miss = unanswered ? ' (' + unanswered + ' без ответа)' : '';
      resultMsg.innerHTML = '<b>' + pct + '%</b>' + miss + ' — нужно ответить верно на все. Посмотри подсветку и разбор «Почему», затем пройди заново.';
      nextLink.style.display = 'none';
    }
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function reset() {
    questions.forEach(function (q) {
      q.classList.remove('checked');
      q.querySelectorAll('.opt').forEach(function (o) {
        o.classList.remove('correct', 'wrong');
        var m = o.querySelector('.mark'); if (m) m.textContent = '';
      });
      q.querySelectorAll('input').forEach(function (i) { i.checked = false; });
    });
    result.classList.remove('show', 'pass', 'fail');
    nextLink.style.display = 'none';
    checkBtn.style.display = 'inline-block';
    retryBtn.style.display = 'none';
    quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  checkBtn.addEventListener('click', check);
  retryBtn.addEventListener('click', reset);
  updateChrome();
})();
