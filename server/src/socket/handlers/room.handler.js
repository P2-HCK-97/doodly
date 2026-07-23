"use strict";

const roomRepository = require("../../repositories/roomRepository");
const { generateAvatarUrl } = require("../../utils/avatarGen");
const { assignColor } = require("../../utils/colorAssign");
const { generateTopicPool } = require("../../services/aiTopicGenService");
const { cancelRoundTimer } = require("../../socket/handlers/round.handler");

const MIN_PLAYERS_TO_PLAY = 2;

/**
 * Menangani keluarnya seorang pemain dari room, baik karena
 * disconnect maupun karena menekan tombol keluar.
 *
 * Mencakup:
 * - pengurangan daftar pemain
 * - migrasi host ke pemain berikutnya
 * - pembatalan game jika pemain kurang dari minimum
 * - penghapusan room jika sudah kosong
 *
 * @param {import("socket.io").Server} io
 * @param {import("socket.io").Socket} socket
 * @param {string} roomCode
 */
function handlePlayerLeave(io, socket, roomCode) {
  if (!roomCode) {
    return;
  }

  const roomBefore = roomRepository.getRoom(roomCode);

  if (!roomBefore) {
    return;
  }

  const wasHost = socket.id === roomBefore.hostSocketId;
  const previousPhase = roomBefore.phase;

  const leavingPlayer = roomBefore.players.find(
    (player) => player.socketId === socket.id,
  );

  const room = roomRepository.removePlayer(roomCode, socket.id);

  socket.leave(roomCode);
  socket.data.roomCode = null;

  if (!room) {
    return;
  }

  /*
   * Room kosong: bersihkan timer dan hapus room
   * supaya kodenya tidak bisa dipakai lagi.
   */
  if (room.players.length === 0) {
    cancelRoundTimer(roomCode);
    roomRepository.deleteRoom(roomCode);

    console.log(`[ROOM] ${roomCode} dihapus karena kosong`);
    return;
  }

  /*
   * Beritahu sisa pemain: daftar pemain baru + host baru.
   */
  io.to(roomCode).emit("room:playersUpdate", {
    players: room.players,
    hostSocketId: room.hostSocketId,
  });

  io.to(roomCode).emit("room:playerLeft", {
    socketId: socket.id,
    username: leavingPlayer?.username || "Seorang pemain",
    players: room.players,
    hostSocketId: room.hostSocketId,
  });

  if (wasHost) {
    const newHost = room.players.find(
      (player) => player.socketId === room.hostSocketId,
    );

    io.to(roomCode).emit("room:hostChanged", {
      hostSocketId: room.hostSocketId,
      hostUsername: newHost?.username || "",
      players: room.players,
    });
  }

  /*
   * Game sedang berjalan tapi pemain sudah di bawah minimum:
   * batalkan game dan kembalikan room ke lobby.
   */
  const isMidGame =
    previousPhase === "playing" ||
    previousPhase === "evaluating" ||
    previousPhase === "round-result";

  if (isMidGame && room.players.length < MIN_PLAYERS_TO_PLAY) {
    cancelRoundTimer(roomCode);
    roomRepository.abortGame(roomCode);

    io.to(roomCode).emit("game:aborted", {
      reason: `${leavingPlayer?.username || "Seorang pemain"} keluar. Pemain tidak cukup untuk melanjutkan permainan.`,
      players: room.players,
      hostSocketId: room.hostSocketId,
    });

    console.log(`[ROOM] ${roomCode} game dibatalkan, pemain kurang`);
    return;
  }

  /*
   * Host lama keluar di fase evaluating: tidak ada lagi yang
   * bisa mengirim snapshot. Minta host baru mengirimkannya.
   */
  if (wasHost && previousPhase === "evaluating") {
    io.to(room.hostSocketId).emit("round:requestSnapshot", {
      roomCode,
      currentRound: room.currentRound,
      topic: room.currentTopic,
    });
  }
}

/**
 * Registers room-related socket event handlers on a single connection.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerRoomHandlers(io, socket) {
  socket.on("room:create", async ({ username } = {}, callback) => {
    try {
      const cleanUsername = String(username || "").trim();

      if (!cleanUsername) {
        callback?.({ error: "Username wajib diisi" });
        return;
      }

      const avatarUrl = generateAvatarUrl(cleanUsername);
      const color = assignColor([]);

      const room = roomRepository.createRoom({
        hostSocketId: socket.id,
        hostUsername: cleanUsername,
        color,
        avatarUrl,
      });

      socket.join(room.code);
      socket.data.roomCode = room.code;

      /*
       * Callback HANYA dipanggil sekali.
       * Socket.IO ack tidak bisa dipanggil dua kali.
       */
      callback?.({ room });

      /*
       * Generate topik di background (fire & forget).
       */
      generateTopicPool()
        .then((topicPool) => {
          const stillExists = roomRepository.getRoom(room.code);

          if (!stillExists) {
            return;
          }

          roomRepository.setTopicPool(room.code, topicPool);

          io.to(room.code).emit("room:topicsReady", {
            roomCode: room.code,
          });

          console.log(`[AI] Topik selesai di-generate untuk room ${room.code}`);
        })
        .catch((error) => {
          console.error(
            `[AI Error] Gagal generate topik untuk room ${room.code}:`,
            error.message,
          );
        });
    } catch (error) {
      callback?.({ error: error.message });
    }
  });

  socket.on("room:join", ({ code, username } = {}, callback) => {
    try {
      const cleanCode = String(code || "").trim().toUpperCase();
      const cleanUsername = String(username || "").trim();

      if (!cleanCode || !cleanUsername) {
        callback?.({ error: "Kode room dan username wajib diisi" });
        return;
      }

      const room = roomRepository.getRoom(cleanCode);

      /*
       * Room bekas / sudah selesai sudah dihapus dari memori,
       * jadi kasus ini menangkap kode kadaluarsa juga.
       */
      if (!room) {
        callback?.({
          error: "Room tidak ditemukan atau sudah berakhir",
          code: "ROOM_NOT_FOUND",
        });
        return;
      }

      /*
       * Room sudah selesai: tidak menerima pemain baru.
       */
      if (room.phase === "finished") {
        callback?.({
          error: "Permainan di room ini sudah selesai",
          code: "ROOM_FINISHED",
        });
        return;
      }

      /*
       * Game sedang berlangsung: tolak pemain baru.
       * Pemain yang sebelumnya ada di room ini boleh rejoin
       * (reconnect), lihat blok di bawah.
       */
      const isMidGame =
        room.phase === "playing" ||
        room.phase === "evaluating" ||
        room.phase === "round-result";

      const isReturningPlayer = room.disconnectedPlayers?.some(
        (player) =>
          player.username.toLowerCase() === cleanUsername.toLowerCase(),
      );

      if (isMidGame && !isReturningPlayer) {
        callback?.({
          error: "Room sedang berlangsung, tidak bisa bergabung sekarang",
          code: "ROOM_IN_PROGRESS",
        });
        return;
      }

      const avatarUrl = generateAvatarUrl(cleanUsername);
      const existingColors = room.players.map((player) => player.color);
      const color = assignColor(existingColors);

      const updatedRoom = roomRepository.addPlayer(cleanCode, {
        socketId: socket.id,
        username: cleanUsername,
        color,
        avatarUrl,
      });

      socket.join(cleanCode);
      socket.data.roomCode = cleanCode;

      callback?.({ room: updatedRoom, isRejoin: Boolean(isReturningPlayer) });

      io.to(cleanCode).emit("room:playersUpdate", {
        players: updatedRoom.players,
        hostSocketId: updatedRoom.hostSocketId,
      });
    } catch (error) {
      callback?.({ error: error.message });
    }
  });

  /*
   * Pemain menekan tombol keluar secara sadar.
   * Tanpa ini, server baru tahu saat tab benar-benar ditutup.
   */
  socket.on("room:leave", ({ roomCode } = {}, callback) => {
    try {
      const targetRoom = roomCode || socket.data.roomCode;

      handlePlayerLeave(io, socket, targetRoom);

      callback?.({ success: true });
    } catch (error) {
      console.error(`room:leave error: ${error.message}`);
      callback?.({ error: error.message });
    }
  });

  socket.on("disconnect", () => {
    try {
      handlePlayerLeave(io, socket, socket.data.roomCode);
    } catch (error) {
      console.log(`error saat disconnect handler: ${error.message}`);
    }
  });
}

module.exports = {
  registerRoomHandlers,
  handlePlayerLeave,
};