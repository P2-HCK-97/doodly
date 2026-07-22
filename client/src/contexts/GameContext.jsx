import { createContext, useContext, useReducer } from 'react';
  
const GameContext = createContext(null);

const initialState = {
  roomCode: '',
  hostSocketId: '',
  players: [],
  currentTopic: '',
  phase: 'lobby', // 'lobby' | 'playing' | 'result'
  roundHistory: [],
  totalScore: 0,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'ROOM_JOINED':
      return {
        ...state,
        roomCode: action.payload.code || state.roomCode,
        hostSocketId: action.payload.hostSocketId || state.hostSocketId,
        players: action.payload.players || [],
        currentTopic: action.payload.currentTopic || state.currentTopic,
        phase: action.payload.phase || 'lobby',
        totalScore: action.payload.totalScore || 0,
      };
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'ROUND_STARTED':
      return { ...state, phase: 'playing', currentTopic: action.payload.topic };
    case 'ROUND_OVER':
      return { ...state, phase: 'result' };
    case 'AI_SUMMARY_RECEIVED':
      return {
        ...state,
        totalScore: action.payload.roomTotalScore ?? state.totalScore,
        roundHistory: [...state.roundHistory, action.payload],
      };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame harus dipakai di dalam <GameProvider>');
  return context;
}