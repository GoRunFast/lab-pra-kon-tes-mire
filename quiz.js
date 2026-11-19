/* Quiz engine: FSRS-lite scheduler used by the flashcard sessions (the UI in app.js drives the flow). */
var Quiz = (function () {

  // Simplified FSRS: 4 grades (1=Again, 2=Hard, 3=Good, 4=Easy).
  // Updates stability, difficulty, due date, reps, lapses, state.
  function scheduleFSRS(word, grade) {
    var now = Date.now();
    var stab = word.stability || 0;
    var diff = word.difficulty || 5;
    var reps = (word.reps || 0) + 1;
    var lapses = word.lapses || 0;
    var newStab, newDiff, intervalMs;

    if (grade === 1) {
      lapses += 1;
      newStab = Math.max(0.4, stab * 0.3);
      newDiff = Math.min(10, diff + 0.8);
      intervalMs = 10 * 60 * 1000;            // 10 minutes
    } else if (grade === 2) {
      newStab = stab === 0 ? 1 : stab * 1.2;
      newDiff = Math.min(10, diff + 0.2);
      intervalMs = newStab * 24 * 3600 * 1000 * 0.8;
    } else if (grade === 3) {
      newStab = stab === 0 ? 2.5 : stab * 2.3;
      newDiff = Math.max(1, diff - 0.1);
      intervalMs = newStab * 24 * 3600 * 1000;
    } else {
      newStab = stab === 0 ? 4 : stab * 3.2;
      newDiff = Math.max(1, diff - 0.4);
      intervalMs = newStab * 24 * 3600 * 1000 * 1.3;
    }

    intervalMs = Math.min(intervalMs, 365 * 24 * 3600 * 1000); // max interval: 365 days

    return {
      stability: newStab, difficulty: newDiff, reps: reps, lapses: lapses,
      lastReview: now, due: now + intervalMs,
      state: newStab < 1 ? 'learning' : 'review'
    };
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  return { scheduleFSRS: scheduleFSRS, shuffle: shuffle };
})();
