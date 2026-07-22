"use strict";

const roomRepository = require("../../repositories/roomRepository");
const {
  generateRoundSummary,
} = require("../../services/aiRoundSummaryService");

const ROUND_DURATION_SEC = 90;
const AI_TIMEOUT_MS = 30_000;

/**
 * Menyimpan timer aktif berdasarkan room code.
 *
 * @type {Map<string, NodeJS.Timeout>}
 */
const roundTimers = new Map();

/**
 * Memberikan batas waktu untuk proses async.
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
 * @param {Function|undefined} callback
 * @param {object} payload
 */
function sendCallback(callback, payload) {
  if (typeof callback === "function") {
    callback(payload);
  }
}

/**
 * @param {import("socket.io").Server} io
 * @param {import("socket.io").Socket} socket
 */
function registerRoundHandlers(io, socket) {
  /*
   * Host memulai ronde pertama atau ronde berikutnya.
   */
  socket.on("game:start", ({ roomCode }, callback) => {
    try {
      const room = roomRepository.getRoom(roomCode);

      if (!room) {
        sendCallback(callback, {
          error: "Room tidak ditemukan",
        });

        return;
      }

      if (socket.id !== room.hostSocketId) {
        sendCallback(callback, {
          error: "Hanya host yang bisa mulai ronde",
        });

        return;
      }

      if (room.phase === "playing" || room.phase === "evaluating") {
        sendCallback(callback, {
          error: "Ronde sebelumnya masih berlangsung atau sedang dinilai",
        });

        return;
      }

      if (room.phase === "finished" || room.currentRound >= room.maxRounds) {
        sendCallback(callback, {
          error: "Semua ronde sudah selesai",
          isGameFinished: true,
        });

        return;
      }

      const updatedRoom = roomRepository.startNextRound(
        roomCode,
        ROUND_DURATION_SEC,
      );

      if (!updatedRoom) {
        sendCallback(callback, {
          error: "Ronde tidak dapat dimulai atau topic sudah habis",
        });

        return;
      }

      /*
       * Membersihkan canvas semua pemain sebelum ronde baru.
       */
      io.to(roomCode).emit("canvas:clear");

      const endsAt = updatedRoom.roundStartAt + ROUND_DURATION_SEC * 1000;

      io.to(roomCode).emit("round:started", {
        topic: updatedRoom.currentTopic,
        durationSec: ROUND_DURATION_SEC,
        endsAt,
        currentRound: updatedRoom.currentRound,
        maxRounds: updatedRoom.maxRounds,
      });

      /*
       * Hapus timer lama jika masih tersimpan.
       */
      const previousTimer = roundTimers.get(roomCode);

      if (previousTimer) {
        clearTimeout(previousTimer);
      }

      const timeoutId = setTimeout(() => {
        endRoundForRoom(io, roomCode);
      }, ROUND_DURATION_SEC * 1000);

      roundTimers.set(roomCode, timeoutId);

      sendCallback(callback, {
        success: true,
        currentRound: updatedRoom.currentRound,
        maxRounds: updatedRoom.maxRounds,
        topic: updatedRoom.currentTopic,
        endsAt,
      });
    } catch (error) {
      sendCallback(callback, {
        error: error.message,
      });
    }
  });

  /*
   * Menerima coretan pemain lalu mengirimnya ke pemain lain.
   */
  socket.on("canvas:stroke", ({ roomCode, x, y, type, color, size, tool }) => {
    try {
      const room = roomRepository.getRoom(roomCode);

      if (!room || room.phase !== "playing") {
        return;
      }

      const stroke = {
        socketId: socket.id,
        x,
        y,
        type,
        color,
        size,
        tool,
      };

      roomRepository.addStroke(roomCode, stroke);

      socket.to(roomCode).emit("canvas:strokeBroadcast", stroke);
    } catch (error) {
      console.error(`canvas:stroke error: ${error.message}`);
    }
  });

  /*
   * Mengirim posisi cursor pemain ke pemain lain.
   */
  socket.on("canvas:cursorMove", ({ roomCode, x, y }) => {
    try {
      const room = roomRepository.getRoom(roomCode);

      if (!room || room.phase !== "playing") {
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

  /*
   * Host membersihkan canvas seluruh pemain.
   */
  socket.on("canvas:clear", ({ roomCode }, callback) => {
    try {
      const room = roomRepository.getRoom(roomCode);

      if (!room) {
        sendCallback(callback, {
          error: "Room tidak ditemukan",
        });

        return;
      }

      if (socket.id !== room.hostSocketId) {
        sendCallback(callback, {
          error: "Hanya host yang bisa membersihkan canvas",
        });

        return;
      }

      if (room.phase !== "playing") {
        sendCallback(callback, {
          error: "Canvas hanya bisa dibersihkan saat ronde berlangsung",
        });

        return;
      }

      roomRepository.clearStrokes(roomCode);

      io.to(roomCode).emit("canvas:clear");

      sendCallback(callback, {
        success: true,
      });
    } catch (error) {
      sendCallback(callback, {
        error: error.message,
      });
    }
  });

  /*
   * Host mengirim gambar canvas setelah round:over.
   */
  socket.on(
    "canvas:snapshotSubmit",
    async ({ roomCode, imageBase64 }, callback) => {
      let roundTopic;
      let roundNumber;
      let maxRounds;

      try {
        const room = roomRepository.getRoom(roomCode);

        if (!room) {
          sendCallback(callback, {
            error: "Room tidak ditemukan",
          });

          return;
        }

        if (socket.id !== room.hostSocketId) {
          sendCallback(callback, {
            error: "Hanya host yang bisa submit snapshot",
          });

          return;
        }

        if (!imageBase64) {
          sendCallback(callback, {
            error: "Canvas snapshot tidak ditemukan",
          });

          return;
        }

        if (room.phase !== "evaluating") {
          sendCallback(callback, {
            error: "Room tidak sedang menunggu penilaian",
          });

          return;
        }

        /*
         * Mencegah snapshot ronde yang sama terkirim berulang.
         */
        if (room.canvasSnapshot) {
          sendCallback(callback, {
            error: "Snapshot ronde ini sudah dikirim",
          });

          return;
        }

        /*
         * Simpan data ronde sebelum menunggu Gemini.
         * currentTopic bisa berubah ketika ronde berikutnya dimulai.
         */
        roundTopic = room.currentTopic;
        roundNumber = room.currentRound;
        maxRounds = room.maxRounds;

        roomRepository.setCanvasSnapshot(roomCode, imageBase64);

        /*
         * Client langsung mendapat acknowledgement.
         * Tidak perlu menunggu proses Gemini.
         */
        sendCallback(callback, {
          success: true,
          roundNumber,
        });
      } catch (error) {
        sendCallback(callback, {
          error: error.message,
        });

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
          roundNumber,
          topic: roundTopic,
          canvasSnapshot: imageBase64,
          similarityScore,
          roastText,
        });

        if (!updatedRoom) {
          throw new Error("Room tidak ditemukan saat menyimpan hasil ronde");
        }

        const isLastRound = updatedRoom.currentRound >= updatedRoom.maxRounds;

        io.to(roomCode).emit("round:aiSummary", {
          roundNumber,
          maxRounds,
          topic: roundTopic,
          canvasSnapshot: imageBase64,
          similarityScore,
          roomTotalScore: updatedRoom.totalScore,
          roastText,
          isLastRound,
          aiError: false,
        });

        /*
         * Event tambahan ketika seluruh ronde selesai.
         */
        if (isLastRound) {
          io.to(roomCode).emit("game:finished", {
            roomCode,
            totalScore: updatedRoom.totalScore,
            roundHistory: updatedRoom.roundHistory,
          });
        }
      } catch (error) {
        console.error(
          `canvas:snapshotSubmit AI summary error: ${error.message}`,
        );

        const fallbackResult = {
          roundNumber,
          topic: roundTopic,
          canvasSnapshot: imageBase64,
          similarityScore: 0,
          roastText:
            "AI belum berhasil menilai gambar ini. Gambarnya tetap tersimpan dan permainan bisa dilanjutkan.",
        };

        let updatedRoom;

        try {
          updatedRoom = roomRepository.recordRoundResult(
            roomCode,
            fallbackResult,
          );
        } catch (recordError) {
          console.error(
            `Gagal menyimpan fallback result: ${recordError.message}`,
          );
        }

        const roomTotalScore = updatedRoom?.totalScore ?? 0;

        const isLastRound = updatedRoom
          ? updatedRoom.currentRound >= updatedRoom.maxRounds
          : roundNumber >= maxRounds;

        /*
         * Event tetap dikirim agar modal frontend
         * tidak loading selamanya.
         */
        io.to(roomCode).emit("round:aiSummary", {
          ...fallbackResult,
          maxRounds,
          roomTotalScore,
          isLastRound,
          aiError: true,
        });

        if (isLastRound && updatedRoom) {
          io.to(roomCode).emit("game:finished", {
            roomCode,
            totalScore: updatedRoom.totalScore,
            roundHistory: updatedRoom.roundHistory,
          });
        }
      }
    },
  );

  /*
   * Host mengakhiri ronde sebelum timer selesai.
   */
  socket.on("round:end", ({ roomCode }, callback) => {
    try {
      const room = roomRepository.getRoom(roomCode);

      if (!room) {
        sendCallback(callback, {
          error: "Room tidak ditemukan",
        });

        return;
      }

      if (socket.id !== room.hostSocketId) {
        sendCallback(callback, {
          error: "Hanya host yang bisa mengakhiri ronde",
        });

        return;
      }

      if (room.phase !== "playing") {
        sendCallback(callback, {
          error: "Tidak ada ronde yang sedang berlangsung",
        });

        return;
      }

      endRoundForRoom(io, roomCode);

      sendCallback(callback, {
        success: true,
      });
    } catch (error) {
      sendCallback(callback, {
        error: error.message,
      });
    }
  });
}

/**
 * Mengakhiri ronde aktif dan memberi tahu semua pemain.
 *
 * Snapshot belum ikut dikirim karena canvas berada di frontend.
 * Setelah menerima event ini, host mengambil snapshot dan mengirim
 * event canvas:snapshotSubmit.
 *
 * @param {import("socket.io").Server} io
 * @param {string} roomCode
 */
function endRoundForRoom(io, roomCode) {
  const room = roomRepository.getRoom(roomCode);

  if (!room || room.phase !== "playing") {
    return;
  }

  const timeoutId = roundTimers.get(roomCode);

  if (timeoutId) {
    clearTimeout(timeoutId);
    roundTimers.delete(roomCode);
  }

  /*
   * Menandai bahwa ronde selesai dan server
   * sedang menunggu snapshot/hasil AI.
   */
  room.phase = "evaluating";

  io.to(roomCode).emit("round:over", {
    topic: room.currentTopic,
    currentRound: room.currentRound,
    maxRounds: room.maxRounds,
  });
}

module.exports = {
  registerRoundHandlers,
};
