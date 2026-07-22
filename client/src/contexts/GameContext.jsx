import {
  createContext,
  useContext,
  useReducer,
} from "react";
import { DEFAULT_MAX_ROUNDS } from "../constants/gameConfig";

const GameContext = createContext(null);

const initialState = {
  roomCode: "",
  hostSocketId: "",
  players: [],

  phase: "lobby",
  currentTopic: "",

  currentRound: 0,
  maxRounds: DEFAULT_MAX_ROUNDS || 2,
  durationSec: 90,
  endsAt: null,

  roundHistory: [],
  totalScore: 0,

  isLastRound: false,
};

/**
 * Menambahkan hasil ronde baru atau memperbarui
 * hasil ronde yang sudah ada.
 *
 * Ini mencegah history ronde masuk dua kali ketika
 * event round:aiSummary tidak sengaja diterima ulang.
 */
function upsertRoundHistory(
  currentHistory,
  roundResult,
) {
  const safeHistory = Array.isArray(
    currentHistory,
  )
    ? currentHistory
    : [];

  const fallbackRoundNumber =
    safeHistory.length + 1;

  const roundNumber =
    Number(roundResult.roundNumber) ||
    fallbackRoundNumber;

  const normalizedResult = {
    roundNumber,

    topic:
      roundResult.topic ||
      "Topik tidak tersedia",

    canvasSnapshot:
      roundResult.canvasSnapshot || null,

    similarityScore: Math.min(
      100,
      Math.max(
        0,
        Number(
          roundResult.similarityScore,
        ) || 0,
      ),
    ),

    roastText:
      roundResult.roastText ||
      "Gambar yang sangat unik!",

    aiError: Boolean(
      roundResult.aiError,
    ),
  };

  const existingRoundIndex =
    safeHistory.findIndex(
      (round) =>
        Number(round.roundNumber) ===
        roundNumber,
    );

  let updatedHistory;

  if (existingRoundIndex >= 0) {
    updatedHistory = [
      ...safeHistory,
    ];

    updatedHistory[
      existingRoundIndex
    ] = {
      ...updatedHistory[
        existingRoundIndex
      ],
      ...normalizedResult,
    };
  } else {
    updatedHistory = [
      ...safeHistory,
      normalizedResult,
    ];
  }

  return updatedHistory.sort(
    (firstRound, secondRound) =>
      Number(firstRound.roundNumber) -
      Number(secondRound.roundNumber),
  );
}

function gameReducer(state, action) {
  switch (action.type) {
    case "ROOM_JOINED": {
      const room = action.payload || {};

      return {
        ...initialState,

        roomCode:
          room.code ||
          room.roomCode ||
          "",

        hostSocketId:
          room.hostSocketId || "",

        players: Array.isArray(
          room.players,
        )
          ? room.players
          : [],

        phase:
          room.phase || "lobby",

        currentTopic:
          room.currentTopic || "",

        currentRound:
          Number(room.currentRound) ||
          0,

        maxRounds:
          Number(room.maxRounds) || 2,

        durationSec:
          Number(room.durationSec) ||
          90,

        endsAt:
          room.endsAt || null,

        roundHistory:
          Array.isArray(
            room.roundHistory,
          )
            ? room.roundHistory
            : [],

        totalScore:
          Number(room.totalScore) ||
          0,

        isLastRound:
          Boolean(
            room.phase === "finished" ||
              Number(
                room.currentRound,
              ) >=
                Number(
                  room.maxRounds || 2,
                ),
          ),
      };
    }

    case "SET_PLAYERS":
      return {
        ...state,

        players: Array.isArray(
          action.payload,
        )
          ? action.payload
          : state.players,
      };

    case "ROUND_STARTED": {
      const payload =
        action.payload || {};

      const currentRound =
        Number(
          payload.currentRound,
        ) ||
        state.currentRound ||
        1;

      const maxRounds =
        Number(payload.maxRounds) ||
        state.maxRounds ||
        2;

      return {
        ...state,

        phase: "playing",

        currentTopic:
          payload.topic ||
          state.currentTopic,

        currentRound,
        maxRounds,

        durationSec:
          Number(
            payload.durationSec,
          ) ||
          state.durationSec ||
          90,

        endsAt:
          payload.endsAt || null,

        isLastRound: false,
      };
    }

    case "ROUND_OVER": {
      const payload =
        action.payload || {};

      return {
        ...state,

        phase: "evaluating",

        currentTopic:
          payload.topic ||
          state.currentTopic,

        currentRound:
          Number(
            payload.currentRound,
          ) ||
          state.currentRound,

        maxRounds:
          Number(payload.maxRounds) ||
          state.maxRounds,

        endsAt: null,
      };
    }

    case "AI_SUMMARY_RECEIVED": {
      const payload =
        action.payload || {};

      const currentRound =
        Number(payload.roundNumber) ||
        state.currentRound;

      const maxRounds =
        Number(payload.maxRounds) ||
        state.maxRounds ||
        2;

      const isLastRound = Boolean(
        payload.isLastRound ||
          currentRound >= maxRounds,
      );

      const updatedHistory =
        upsertRoundHistory(
          state.roundHistory,
          payload,
        );

      return {
        ...state,

        phase: isLastRound
          ? "finished"
          : "round-result",

        currentTopic:
          payload.topic ||
          state.currentTopic,

        currentRound,
        maxRounds,

        roundHistory:
          updatedHistory,

        totalScore:
          Number(
            payload.roomTotalScore,
          ) || 0,

        isLastRound,
        endsAt: null,
      };
    }

    case "GAME_FINISHED": {
      const payload =
        action.payload || {};

      const serverHistory =
        Array.isArray(
          payload.roundHistory,
        )
          ? payload.roundHistory
          : state.roundHistory;

      return {
        ...state,

        phase: "finished",
        isLastRound: true,

        currentRound:
          state.maxRounds,

        roundHistory:
          serverHistory,

        totalScore:
          Number(
            payload.totalScore,
          ) || state.totalScore,

        endsAt: null,
      };
    }

    case "HYDRATE_HISTORY": {
      const payload =
        action.payload || {};

      return {
        ...state,

        roomCode:
          payload.roomCode ||
          state.roomCode,

        phase:
          payload.phase ||
          "finished",

        roundHistory:
          Array.isArray(
            payload.roundHistory,
          )
            ? payload.roundHistory
            : state.roundHistory,

        totalScore:
          Number(
            payload.totalScore,
          ) || 0,

        currentRound:
          Number(
            payload.currentRound,
          ) ||
          payload.roundHistory?.length ||
          state.currentRound,

        maxRounds:
          Number(payload.maxRounds) ||
          state.maxRounds,

        isLastRound: true,
      };
    }

    case "RESET_GAME":
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

export function GameProvider({
  children,
}) {
  const [state, dispatch] =
    useReducer(
      gameReducer,
      initialState,
    );

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context =
    useContext(GameContext);

  if (!context) {
    throw new Error(
      "useGame harus dipakai di dalam <GameProvider>",
    );
  }

  return context;
}