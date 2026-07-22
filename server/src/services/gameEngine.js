'use strict';

/**
 * Pure game-logic functions — no imports of roomRepository or socket.io,
 * no side effects, no logging. Everything here is input-in/value-out
 * so it can be unit-tested without mocking anything.
 */

/**
 * Checks whether a round's timer has run out.
 *
 * @param {number|null} roundStartAt - ms timestamp when the round started,
 *   or null if no round is currently running.
 * @param {number} durationSec - round length in seconds.
 * @param {number} [now] - ms timestamp to check against, defaults to now.
 * @returns {boolean} true if the round is over.
 */
function checkRoundOver(roundStartAt, durationSec, now = Date.now()) {
  if (roundStartAt === null) return false;

  const elapsedSec = (now - roundStartAt) / 1000;

  return elapsedSec >= durationSec;
}

/**
 * Folds a round's similarity score into the room's cumulative total,
 * clamping the score to 0-100 first in case the AI response comes
 * back out of range.
 *
 * @param {number} currentTotal - room's current cumulative score.
 * @param {number} similarityScore - raw similarity score from the AI.
 * @returns {number} new cumulative total.
 */
function computeCumulativeScore(currentTotal, similarityScore) {
  const clampedScore = Math.min(100, Math.max(0, similarityScore));

  return currentTotal + clampedScore;
}

/**
 * Computes remaining round time in whole seconds, floored and never
 * negative even if `now` is past the round's end.
 *
 * @param {number|null} roundStartAt - ms timestamp when the round started,
 *   or null if no round is currently running.
 * @param {number} durationSec - round length in seconds.
 * @param {number} [now] - ms timestamp to check against, defaults to now.
 * @returns {number} seconds remaining, >= 0.
 */
function getRemainingSeconds(roundStartAt, durationSec, now = Date.now()) {
  if (roundStartAt === null) return 0;

  const elapsedSec = (now - roundStartAt) / 1000;
  const remainingSec = durationSec - elapsedSec;

  return Math.max(0, Math.floor(remainingSec));
}

module.exports = {
  checkRoundOver,
  computeCumulativeScore,
  getRemainingSeconds,
};

// Contoh manual (jalanin di node REPL: node -e "..." atau require file ini):
//
// checkRoundOver(roundStartAt, durationSec, now)
//   checkRoundOver(1000, 90, 1000)        -> false   (baru mulai, elapsed 0s)
//   checkRoundOver(1000, 90, 91000)       -> true    (elapsed 90s, pas abis)
//   checkRoundOver(1000, 90, 50000)       -> false   (elapsed 49s, masih jalan)
//   checkRoundOver(null, 90, 91000)       -> false   (ronde belum mulai)
//
// computeCumulativeScore(currentTotal, similarityScore)
//   computeCumulativeScore(0, 75)         -> 75
//   computeCumulativeScore(75, 60)        -> 135
//   computeCumulativeScore(100, 150)      -> 200    (150 diclamp jadi 100, lalu 100+100)
//   computeCumulativeScore(100, -20)      -> 100    (-20 diclamp jadi 0, lalu 100+0)
//
// getRemainingSeconds(roundStartAt, durationSec, now)
//   getRemainingSeconds(1000, 90, 1000)   -> 90     (baru mulai, full durasi)
//   getRemainingSeconds(1000, 90, 46000)  -> 45     (elapsed 45s, sisa 45s)
//   getRemainingSeconds(1000, 90, 95000)  -> 0      (udah lewat, tetep 0 bukan minus)
//   getRemainingSeconds(null, 90, 1000)   -> 0      (ronde belum mulai)
