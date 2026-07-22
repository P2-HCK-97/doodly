'use strict';

const express = require('express');
const { getRoom } = require('../repositories/roomRepository');

const router = express.Router();

/**
 * GET /rooms/:code/history
 * Read-only lookup of a room's round history — players, past rounds
 * (topic/snapshot/score/roast), and cumulative score so far.
 */
router.get('/:code/history', (req, res) => {
  try {
    const { code } = req.params;
    const room = getRoom(code);

    if (!room) {
      res.status(404).json({ error: 'Room tidak ditemukan' });
      return;
    }

    res.status(200).json({
      code: room.code,
      players: room.players,
      roundHistory: room.roundHistory,
      totalScore: room.totalScore,
    });
  } catch (error) {
    console.error(`GET /rooms/:code/history error: ${error.message}`);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;

// Contoh mount di app.js (referensi doang, jangan edit app.js beneran):
//
//   const roomRoutes = require('./routes/room.routes');
//   app.use('/rooms', roomRoutes);
