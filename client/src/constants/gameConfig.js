export const DEFAULT_ROUND_DURATION = 90;

export const PLAYER_COLORS = [
  '#EB4B98', '#FFE600', '#4B9EFF', '#4BEB98', '#FF8A4B',
];

export const DUMMY_PLAYERS = [
  { socketId: 'dummy-1', username: 'Nabhan', color: PLAYER_COLORS[0], isHost: true },
  { socketId: 'dummy-2', username: 'Budi', color: PLAYER_COLORS[1], isHost: false },
  { socketId: 'dummy-3', username: 'Citra', color: PLAYER_COLORS[2], isHost: false },
];

export const DUMMY_CURSOR_POSITIONS = [
  { socketId: 'dummy-2', x: 180, y: 120 },
  { socketId: 'dummy-3', x: 320, y: 240 },
];

export const DRAWING_COLORS = [
  '#000000', '#EB4B98', '#FFE600', '#4B9EFF',
  '#4BEB98', '#FF8A4B', '#8B5CF6', '#FFFFFF',
];

export const BRUSH_SIZES = [
  { label: 'S', value: 2 },
  { label: 'M', value: 4 },
  { label: 'L', value: 8 },
];

export const DUMMY_TOPIC = 'Kucing';
export const MIN_PLAYERS_TO_START = 2;
export const DEFAULT_BRUSH_COLOR = '#000000';
export const DEFAULT_BRUSH_SIZE = 4;