import { createContext, useContext, useReducer } from 'react';
import { DUMMY_PLAYERS, DUMMY_TOPIC } from '../constants/gameConfig';

const GameContext = createContext(null);

const initialState = {
  roomCode: 'X7A9B', // dummy, nanti diisi dari response socket
  players: DUMMY_PLAYERS,
  currentTopic: DUMMY_TOPIC,
  phase: 'lobby', // 'lobby' | 'playing' | 'result'
  roundHistory: [],
  totalScore: 0,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'ROUND_STARTED':
      return { ...state, phase: 'playing', currentTopic: action.payload.topic };
    case 'ROUND_OVER':
      return { ...state, phase: 'result' };
    case 'AI_SUMMARY_RECEIVED':
      return {
        ...state,
        totalScore: action.payload.roomTotalScore,
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