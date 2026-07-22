"use strict";

/**
 * Penyimpanan sementara seluruh room aktif.
 *
 * @type {Map<string, object>}
 */
const rooms = new Map();

const CODE_LENGTH = 5;
const DEFAULT_MAX_ROUNDS = 2;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode() {
  let code = "";

  do {
    code = "";

    for (let index = 0; index < CODE_LENGTH; index += 1) {
      const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);

      code += CODE_CHARS[randomIndex];
    }
  } while (rooms.has(code));

  return code;
}

function createRoom({ hostSocketId, hostUsername, color, avatarUrl }) {
  const code = generateRoomCode();

  const room = {
    code,
    hostSocketId,

    players: [
      {
        socketId: hostSocketId,
        username: hostUsername,
        color,
        avatarUrl,
        isHost: true,
      },
    ],

    phase: "lobby",

    currentRound: 0,
    maxRounds: DEFAULT_MAX_ROUNDS,

    topicPool: [],
    usedTopics: [],
    currentTopic: null,

    strokes: [],
    canvasSnapshot: null,

    roundStartAt: null,
    durationSec: 0,

    roundHistory: [],
    totalScore: 0,
  };

  rooms.set(code, room);

  return room;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function addPlayer(code, player) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const playerData = {
    ...player,
    isHost: player.socketId === room.hostSocketId,
  };

  const existingPlayerIndex = room.players.findIndex(
    (existingPlayer) => existingPlayer.socketId === player.socketId,
  );

  if (existingPlayerIndex >= 0) {
    room.players[existingPlayerIndex] = playerData;
  } else {
    room.players.push(playerData);
  }

  return room;
}

function removePlayer(code, socketId) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.players = room.players.filter((player) => player.socketId !== socketId);

  /*
   * Jika host keluar dan masih ada pemain,
   * pemain pertama menjadi host baru.
   */
  if (socketId === room.hostSocketId && room.players.length > 0) {
    room.hostSocketId = room.players[0].socketId;

    room.players = room.players.map((player) => ({
      ...player,
      isHost: player.socketId === room.hostSocketId,
    }));
  }

  return room;
}

function setTopicPool(code, topics) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.topicPool = Array.isArray(topics) ? topics : [];

  return room;
}

function startNextRound(code, durationSec) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.currentRound >= room.maxRounds) {
    return null;
  }

  const remainingTopics = room.topicPool.filter(
    (topic) => !room.usedTopics.includes(topic),
  );

  if (remainingTopics.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * remainingTopics.length);

  const topic = remainingTopics[randomIndex];

  room.currentRound += 1;
  room.currentTopic = topic;
  room.usedTopics.push(topic);

  room.phase = "playing";

  room.strokes = [];
  room.canvasSnapshot = null;

  room.roundStartAt = Date.now();
  room.durationSec = Number(durationSec) || 90;

  return room;
}

function addStroke(code, stroke) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.strokes.push(stroke);

  return room;
}

function clearStrokes(code) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.strokes = [];

  return room;
}

function setCanvasSnapshot(code, imageBase64) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.canvasSnapshot = imageBase64;

  return room;
}

function recordRoundResult(
  code,
  { roundNumber, topic, canvasSnapshot, similarityScore, roastText },
) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const safeRoundNumber = Number(roundNumber) || room.currentRound;

  const safeScore = Math.min(100, Math.max(0, Number(similarityScore) || 0));

  const existingResultIndex = room.roundHistory.findIndex(
    (result) => Number(result.roundNumber) === safeRoundNumber,
  );

  const result = {
    roundNumber: safeRoundNumber,

    topic: topic || room.currentTopic || "Topik tidak tersedia",

    canvasSnapshot: canvasSnapshot || null,

    similarityScore: safeScore,

    roastText: roastText || "Gambar yang sangat unik!",
  };

  if (existingResultIndex >= 0) {
    const previousScore =
      Number(room.roundHistory[existingResultIndex].similarityScore) || 0;

    room.totalScore = room.totalScore - previousScore + safeScore;

    room.roundHistory[existingResultIndex] = result;
  } else {
    room.roundHistory.push(result);
    room.totalScore += safeScore;
  }

  room.roundHistory.sort(
    (firstResult, secondResult) =>
      Number(firstResult.roundNumber) - Number(secondResult.roundNumber),
  );

  room.roundStartAt = null;
  room.durationSec = 0;
  room.canvasSnapshot = null;
  room.strokes = [];

  room.phase =
    room.currentRound >= room.maxRounds ? "finished" : "round-result";

  return room;
}

function deleteRoom(code) {
  return rooms.delete(code);
}

module.exports = {
  DEFAULT_MAX_ROUNDS,
  generateRoomCode,
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  setTopicPool,
  startNextRound,
  addStroke,
  clearStrokes,
  setCanvasSnapshot,
  recordRoundResult,
  deleteRoom,
};
