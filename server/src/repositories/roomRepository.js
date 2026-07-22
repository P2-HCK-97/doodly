"use strict";

/**
 * In-memory data layer for all active rooms.
 * Pure CRUD on the `rooms` Map only — no business-logic validation
 * (e.g. "room full", "whose turn is it") lives here; that belongs
 * to the handlers/services that call into this repository.
 */

/** @type {Map<string, object>} */
const rooms = new Map();

const CODE_LENGTH = 5;
// Excludes visually-similar chars: I, O, 0, 1
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generates a random room code, retrying on collision against
 * the currently active rooms in the Map.
 */
function generateRoomCode() {
  let code;
  do {
    code = "";
    for (let i = 0; i < CODE_LENGTH; i += 1) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
  } while (rooms.has(code));

  return code;
}

/**
 * Creates a new room with the host as its first player.
 * topicPool starts empty — filled later by aiTopicGenService.
 */
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
    topicPool: [],
    usedTopics: [],
    currentTopic: null,
    strokes: [],
    roundStartAt: null,
    durationSec: 0,
    roundHistory: [],
    totalScore: 0,
    canvasSnapshot: null,
  };

  rooms.set(code, room);

  return room;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function setCanvasSnapshot(code, imageBase64) {
  const room = rooms.get(code);
  if (!room) return null;

  room.canvasSnapshot = imageBase64;

  return room;
}

/**
 * Adds a player, or replaces the existing entry if the same socketId
 * already joined (e.g. accidental double-click firing room:join twice)
 * so the room never ends up with duplicate players for one socket.
 */
function addPlayer(code, player) {
  const room = rooms.get(code);
  if (!room) return null;

  const playerObj = {
    ...player,
    isHost: player.socketId === room.hostSocketId,
  };

  const existingIndex = room.players.findIndex(
    (existing) => existing.socketId === player.socketId,
  );

  if (existingIndex === -1) {
    room.players.push(playerObj);
  } else {
    room.players[existingIndex] = playerObj;
  }

  return room;
}

/**
 * Removes a player by socketId. Never deletes the room even if it
 * ends up with zero players — kept alive in case they reconnect later.
 */
function removePlayer(code, socketId) {
  const room = rooms.get(code);
  if (!room) return null;

  room.players = room.players.filter((player) => player.socketId !== socketId);

  return room;
}

function setTopicPool(code, topics) {
  const room = rooms.get(code);
  if (!room) return null;

  room.topicPool = topics;

  return room;
}

/**
 * Picks one random topic not yet in usedTopics, resets the canvas
 * strokes, and starts the round clock. Returns null when every topic
 * in the pool has already been used (caller decides what happens next).
 */
function startNextRound(code, durationSec) {
  const room = rooms.get(code);
  if (!room) return null;

  const remainingTopics = room.topicPool.filter(
    (topic) => !room.usedTopics.includes(topic),
  );
  if (remainingTopics.length === 0) return null;

  const topic =
    remainingTopics[Math.floor(Math.random() * remainingTopics.length)];

  room.currentTopic = topic;
  room.usedTopics.push(topic);
  room.strokes = [];
  room.roundStartAt = Date.now();
  room.durationSec = durationSec;

  return room;
}

function addStroke(code, stroke) {
  const room = rooms.get(code);
  if (!room) return null;

  room.strokes.push(stroke);

  return room;
}

function clearStrokes(code) {
  const room = rooms.get(code);
  if (!room) return null;

  room.strokes = [];

  return room;
}

/**
 * Appends the round's AI result to roundHistory, folds the similarity
 * score into the room's cumulative totalScore, and clears currentTopic
 * / roundStartAt so the room is ready for the next round.
 */
function recordRoundResult(
  code,
  { topic, canvasSnapshot, similarityScore, roastText },
) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const validScore = Math.min(100, Math.max(0, Number(similarityScore) || 0));

  room.roundHistory.push({
    topic: topic || room.currentTopic,
    canvasSnapshot,
    similarityScore: validScore,
    roastText,
  });

  room.totalScore += validScore;
  room.currentTopic = null;
  room.roundStartAt = null;
  room.canvasSnapshot = null;
  room.strokes = [];

  return room;
}

function deleteRoom(code) {
  return rooms.delete(code);
}

module.exports = {
  generateRoomCode,
  createRoom,
  getRoom,
  setCanvasSnapshot,
  addPlayer,
  removePlayer,
  setTopicPool,
  startNextRound,
  addStroke,
  clearStrokes,
  recordRoundResult,
  deleteRoom,
};
