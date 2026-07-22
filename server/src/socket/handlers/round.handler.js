"use strict";

const roomRepository = require("../../repositories/roomRepository");
// eslint-disable-next-line no-unused-vars -- reserved for future reconnect handling
const {
  checkRoundOver,
  getRemainingSeconds,
} = require("../../services/gameEngine");
const {
  generateRoundSummary,
} = require("../../services/aiRoundSummaryService");

const ROUND_DURATION_SEC = 90;
const AI_TIMEOUT_MS = 30_000;

/**
 * Menyimpan timer setiap room agar bisa dihentikan ketika host
 * mengakhiri ronde lebih awal.
 *
 * @type {Map<string, NodeJS.Timeout>}
 */
const roundTimers = new Map();

/**
 * Membatasi durasi proses async.
 *
 * @param {Promise<unknown>} promise
 * @param {number} timeoutMs
 * @returns {Promise<unknown>}
 */
function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`AI timeout setelah ${timeoutMs / 1000} detik`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerRoundHandlers(io, socket) {
  socket.on("game:start", ({ roomCode }, callback) => {
    try {
      const room = roomRepository.getRoom(roomCode);

      if (!room) {
        callback({ error: "Room tidak ditemukan" });
        return;
      }

      if (socket.id !== room.hostSocketId) {
        callback({
          error: "Hanya host yang bisa mulai ronde",
        });
        return;
      }

      if (room.roundStartAt) {
        callback({
          error: "Ronde sebelumnya masih berlangsung atau sedang dinilai",
        });
        return;
      }

      const updatedRoom = roomRepository.startNextRound(
        roomCode,
        ROUND_DURATION_SEC,
      );

      if (!updatedRoom) {
        callback({
          error: "Semua topic sudah dipakai",
        });
        return;
      }

      io.to(roomCode).emit("round:started", {
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

  socket.on("canvas:stroke", ({ roomCode, x, y, type, color, size }) => {
    try {
      roomRepository.addStroke(roomCode, {
        socketId: socket.id,
        x,
        y,
        type,
        color,
        size,
      });

      socket.to(roomCode).emit("canvas:strokeBroadcast", {
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

  socket.on("canvas:cursorMove", ({ roomCode, x, y }) => {
    try {
      const room = roomRepository.getRoom(roomCode);

      if (!room) {
        return;
      }

      const player = room.players.find((item) => item.socketId === socket.id);

      if (!player) {
        return;
      }

      socket.to(roomCode).emit("canvas:cursorBroadcast", {
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

  socket.on("canvas:clear", ({ roomCode }) => {
    try {
      const room = roomRepository.getRoom(roomCode);

      if (!room) {
        return;
      }

      if (socket.id !== room.hostSocketId) {
        console.error(
          `canvas:clear ditolak: ${socket.id} bukan host room ${roomCode}`,
        );
        return;
      }

      roomRepository.clearStrokes(roomCode);
      io.to(roomCode).emit("canvas:clear");
    } catch (error) {
      console.error(`canvas:clear error: ${error.message}`);
    }
  });

  socket.on(
    "canvas:snapshotSubmit",
    async ({ roomCode, imageBase64 }, callback) => {
      let roundTopic;

      try {
        const room = roomRepository.getRoom(roomCode);

        if (!room) {
          callback({ error: "Room tidak ditemukan" });
          return;
        }

        if (socket.id !== room.hostSocketId) {
          callback({
            error: "Hanya host yang bisa submit snapshot",
          });
          return;
        }

        if (!imageBase64) {
          callback({
            error: "Canvas snapshot tidak ditemukan",
          });
          return;
        }

        /*
         * Disimpan sebelum await Gemini agar hasil AI tetap memakai
         * topik ronde yang benar.
         */
        roundTopic = room.currentTopic;

        roomRepository.setCanvasSnapshot(roomCode, imageBase64);

        /*
         * Host langsung menerima acknowledgement tanpa perlu
         * menunggu proses AI.
         */
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
        return;
      }

      try {
        const { similarityScore, roastText } = await withTimeout(
          generateRoundSummary({
            topic: roundTopic,
            canvasSnapshot: imageBase64,
          }),
          AI_TIMEOUT_MS,
        );

        const updatedRoom = roomRepository.recordRoundResult(roomCode, {
          topic: roundTopic,
          canvasSnapshot: imageBase64,
          similarityScore,
          roastText,
        });

        if (!updatedRoom) {
          throw new Error("Room tidak ditemukan saat menyimpan hasil ronde");
        }

        io.to(roomCode).emit("round:aiSummary", {
          topic: roundTopic,
          canvasSnapshot: imageBase64,
          similarityScore,
          roomTotalScore: updatedRoom.totalScore,
          roastText,
          aiError: false,
        });
      } catch (error) {
        console.error(
          `canvas:snapshotSubmit AI summary error: ${error.message}`,
        );

        const fallbackResult = {
          topic: roundTopic,
          canvasSnapshot: imageBase64,
          similarityScore: 0,
          roastText:
            "AI belum berhasil menilai gambar ini. Gambarnya tetap tersimpan dan permainan bisa dilanjutkan.",
        };

        let roomTotalScore = roomRepository.getRoom(roomCode)?.totalScore ?? 0;

        try {
          const updatedRoom = roomRepository.recordRoundResult(roomCode, {
            ...fallbackResult,
          });

          roomTotalScore = updatedRoom?.totalScore ?? roomTotalScore;
        } catch (recordError) {
          console.error(
            `Gagal menyimpan fallback result: ${recordError.message}`,
          );
        }

        /*
         * Event ini wajib tetap dikirim meskipun AI gagal.
         * Frontend menunggu event ini untuk menghentikan loading.
         */
        io.to(roomCode).emit("round:aiSummary", {
          ...fallbackResult,
          roomTotalScore,
          aiError: true,
        });
      }
    },
  );

  socket.on("round:end", ({ roomCode }, callback) => {
    try {
      const room = roomRepository.getRoom(roomCode);

      if (!room) {
        callback({ error: "Room tidak ditemukan" });
        return;
      }

      if (socket.id !== room.hostSocketId) {
        callback({
          error: "Hanya host yang bisa mengakhiri ronde",
        });
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
 * @param {import('socket.io').Server} io
 * @param {string} roomCode
 */
function endRoundForRoom(io, roomCode) {
  const room = roomRepository.getRoom(roomCode);

  if (!room) {
    return;
  }

  const timeoutId = roundTimers.get(roomCode);

  if (timeoutId) {
    clearTimeout(timeoutId);
    roundTimers.delete(roomCode);
  }

  io.to(roomCode).emit("round:over", {
    topic: room.currentTopic,
  });
}

module.exports = {
  registerRoundHandlers,
};
