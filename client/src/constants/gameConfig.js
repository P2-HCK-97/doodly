export const DEFAULT_ROUND_DURATION = 90; // detik

export const PLAYER_COLORS = [
  '#EB4B98', '#FFE600', '#4B9EFF', '#4BEB98', '#FF8A4B',
];

export const DUMMY_PLAYERS = [
  { socketId: 'dummy-1', username: 'Andi', color: PLAYER_COLORS[0], isHost: true },
  { socketId: 'dummy-2', username: 'Budi', color: PLAYER_COLORS[1], isHost: false },
  { socketId: 'dummy-3', username: 'Citra', color: PLAYER_COLORS[2], isHost: false },
];

export const DUMMY_TOPIC = 'Kucing';
export const MIN_PLAYERS_TO_START = 2;