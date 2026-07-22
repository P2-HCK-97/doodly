'use strict';

const roomRepository = require('../../repositories/roomRepository');
const { generateAvatarUrl } = require('../../utils/avatarGen');
const { assignColor } = require('../../utils/colorAssign');
const { generateTopicPool } = require('../../services/aiTopicGenService');

/**
 * Registers room-related socket event handlers on a single connection:
 * - `room:create` — host creates a new room
 * - `room:join`   — a player joins an existing room by code
 * - `disconnect`  — removes the player from whatever room they were in
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerRoomHandlers(io, socket) {
  socket.on('room:create', async ({ username }, callback) => {
    try {
      const avatarUrl = generateAvatarUrl(username);
      const color = assignColor([]);

      const room = roomRepository.createRoom({
        hostSocketId: socket.id,
        hostUsername: username,
        color,
        avatarUrl,
      });

      socket.join(room.code);
      socket.data.roomCode = room.code;

      const topicPool = await generateTopicPool();
      roomRepository.setTopicPool(room.code, topicPool);

      const updatedRoom = roomRepository.getRoom(room.code);
      callback({ room: updatedRoom });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('room:join', ({ code, username }, callback) => {
    try {
      const room = roomRepository.getRoom(code);
      if (!room) {
        callback({ error: 'Room tidak ditemukan' });
        return;
      }

      const avatarUrl = generateAvatarUrl(username);
      const existingColors = room.players.map((player) => player.color);
      const color = assignColor(existingColors);

      roomRepository.addPlayer(code, {
        socketId: socket.id,
        username,
        color,
        avatarUrl,
      });

      socket.join(code);
      socket.data.roomCode = code;

      callback({ room });
      io.to(code).emit('room:playersUpdate', { players: room.players });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('disconnect', () => {
    try {
      const { roomCode } = socket.data;
      if (!roomCode) return;

      const room = roomRepository.removePlayer(roomCode, socket.id);
      if (!room) return;

      io.to(roomCode).emit('room:playersUpdate', { players: room.players });

      if (room.players.length === 0) {
        console.log(`room kosong: ${roomCode}`);
      }
    } catch (error) {
      console.log(`error saat disconnect handler: ${error.message}`);
    }
  });
}

module.exports = {
  registerRoomHandlers,
};
