'use strict';

const roomRepository = require('../../repositories/roomRepository');
// eslint-disable-next-line no-unused-vars -- reserved for future remaining-time/reconnect handling
const { checkRoundOver, getRemainingSeconds } = require('../../services/gameEngine');

const ROUND_DURATION_SEC = 90;

/**
 * Timer handles per room, kept here (not in roomRepository) so this
 * module owns the setTimeout lifecycle and can cancel it on manual
 * round:end without leaking that concern into the data layer.
 * @type {Map<string, NodeJS.Timeout>}
 */
const roundTimers = new Map();

/**
 * Registers round/canvas-related socket event handlers on a single
 * connection:
 * - `game:start`            — host starts the next round (picks a topic, starts the timer)
 * - `canvas:stroke`         — broadcasts a single stroke segment to the rest of the room
 * - `canvas:cursorMove`     — broadcasts a player's live cursor position
 * - `canvas:clear`          — host clears the shared canvas
 * - `canvas:snapshotSubmit` — host submits the final canvas image after round:over
 * - `round:end`             — host ends the round early
 *
 * Snapshot flow note: `round:over` fires instantly with no image attached
 * once the timer runs out (or the host ends it early) — it never waits on
 * canvas capture. The actual image arrives later via `canvas:snapshotSubmit`,
 * which the host client triggers itself right after receiving `round:over`.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerRoundHandlers(io, socket) {
  socket.on('game:start', ({ roomCode }, callback) => {
    try {
      const room = roomRepository.getRoom(roomCode);
      if (!room) {
        callback({ error: 'Room tidak ditemukan' });
        return;
      }

      if (socket.id !== room.hostSocketId) {
        callback({ error: 'Hanya host yang bisa mulai ronde' });
        return;
      }

      const updatedRoom = roomRepository.startNextRound(roomCode, ROUND_DURATION_SEC);
      if (!updatedRoom) {
        callback({ error: 'Semua topic sudah dipakai' });
        return;
      }

      io.to(roomCode).emit('round:started', {
        topic: updatedRoom.currentTopic,
        durationSec: ROUND_DURATION_SEC,
      });

      const timeoutId = setTimeout(() => {
        endRoundForRoom(io, roomCode);
      }, ROUND_DURATION_SEC * 1000);
      roundTimers.set(roomCode, timeoutId);

      callback({ success: true });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('canvas:stroke', ({ roomCode, x, y, type, color, size }) => {
    try {
      roomRepository.addStroke(roomCode, { socketId: socket.id, x, y, type, color, size });
      socket.to(roomCode).emit('canvas:strokeBroadcast', {
        socketId: socket.id,
        color,
        x,
        y,
        type,
        size,
      });
    } catch (error) {
      console.error(`canvas:stroke error: ${error.message}`);
    }
  });

  socket.on('canvas:cursorMove', ({ roomCode, x, y }) => {
    try {
      const room = roomRepository.getRoom(roomCode);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      socket.to(roomCode).emit('canvas:cursorBroadcast', {
        socketId: socket.id,
        username: player.username,
        color: player.color,
        avatarUrl: player.avatarUrl,
        x,
        y,
      });
    } catch (error) {
      console.error(`canvas:cursorMove error: ${error.message}`);
    }
  });

  socket.on('canvas:clear', ({ roomCode }) => {
    try {
      const room = roomRepository.getRoom(roomCode);
      if (!room) return;

      if (socket.id !== room.hostSocketId) {
        console.error(`canvas:clear ditolak: ${socket.id} bukan host room ${roomCode}`);
        return;
      }

      roomRepository.clearStrokes(roomCode);
      io.to(roomCode).emit('canvas:clear');
    } catch (error) {
      console.error(`canvas:clear error: ${error.message}`);
    }
  });

  socket.on('canvas:snapshotSubmit', ({ roomCode, imageBase64 }, callback) => {
    try {
      const room = roomRepository.getRoom(roomCode);
      if (!room) {
        callback({ error: 'Room tidak ditemukan' });
        return;
      }

      if (socket.id !== room.hostSocketId) {
        callback({ error: 'Hanya host yang bisa submit snapshot' });
        return;
      }

      roomRepository.setCanvasSnapshot(roomCode, imageBase64);

      // TODO: trigger aiRoundSummaryService di sini nanti, setelah snapshot
      // beneran ada, async jangan blocking.

      callback({ success: true });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('round:end', ({ roomCode }, callback) => {
    try {
      const room = roomRepository.getRoom(roomCode);
      if (!room) {
        callback({ error: 'Room tidak ditemukan' });
        return;
      }

      if (socket.id !== room.hostSocketId) {
        callback({ error: 'Hanya host yang bisa mengakhiri ronde' });
        return;
      }

      const timeoutId = roundTimers.get(roomCode);
      if (timeoutId) {
        clearTimeout(timeoutId);
        roundTimers.delete(roomCode);
      }

      endRoundForRoom(io, roomCode);

      callback({ success: true });
    } catch (error) {
      callback({ error: error.message });
    }
  });
}

/**
 * Ends the current round for a room: cancels any pending timer, then
 * announces `round:over` with the topic only — no canvas image yet,
 * that arrives separately via `canvas:snapshotSubmit`.
 *
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 */
function endRoundForRoom(io, roomCode) {
  const room = roomRepository.getRoom(roomCode);
  if (!room) return;

  const timeoutId = roundTimers.get(roomCode);
  if (timeoutId) {
    clearTimeout(timeoutId);
    roundTimers.delete(roomCode);
  }

  io.to(roomCode).emit('round:over', { topic: room.currentTopic });
}

module.exports = {
  registerRoundHandlers,
};
