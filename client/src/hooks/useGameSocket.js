import { useEffect } from "react";
import socket from "../services/socket";
import { useGame } from "../contexts/GameContext";

/**
 * Satu tempat buat semua listener socket.io yang dipakai bersama
 * (players update, round started, ai summary, dst).
 *
 * Event yang efeknya sama di semua view (dispatch ke GameContext) ditangani
 * di sini. Event/behaviour yang beda-beda per view (misal navigate di Lobby,
 * atau update state canvas di InGame) dilempar lewat callback opsional.
 *
 * @param {Object} options
 * @param {(payload: { topic: string }) => void} [options.onRoundStarted]
 * @param {(payload: { topic: string }) => void} [options.onRoundOver]
 * @param {(payload: object) => void} [options.onAiSummary]
 * @param {(payload: object) => void} [options.onCursorBroadcast]
 * @param {(payload: object) => void} [options.onStrokeBroadcast]
 * @param {() => void} [options.onCanvasClear]
 * @param {string} [options.fallbackTopic] dipakai kalau server gak kirim topic di round:aiSummary
 */
export default function useGameSocket({
    onRoundStarted,
    onRoundOver,
    onAiSummary,
    onCursorBroadcast,
    onStrokeBroadcast,
    onCanvasClear,
    onHostChanged,
    onPlayerLeft,
    onGameAborted,
    onRequestSnapshot,
    fallbackTopic,
} = {}) {
    const { dispatch } = useGame();

    useEffect(() => {
        const handlePlayersUpdate = (data) => {
            dispatch({ type: "SET_PLAYERS", payload: data.players });

            if (data.hostSocketId) {
                dispatch({ type: "SET_HOST", payload: data.hostSocketId });
            }
        };

        const handleHostChanged = (data) => {
            dispatch({ type: "SET_HOST", payload: data.hostSocketId });

            if (Array.isArray(data.players)) {
                dispatch({ type: "SET_PLAYERS", payload: data.players });
            }

            onHostChanged?.(data);
        };

        const handlePlayerLeft = (data) => {
            if (Array.isArray(data.players)) {
                dispatch({ type: "SET_PLAYERS", payload: data.players });
            }

            onPlayerLeft?.(data);
        };

        const handleGameAborted = (data) => {
            dispatch({ type: "GAME_ABORTED", payload: data });
            onGameAborted?.(data);
        };

        const handleRequestSnapshot = (data) => {
            onRequestSnapshot?.(data);
        };

        const handleRoundStarted = (payload) => {
            dispatch({ type: "ROUND_STARTED", payload: { topic: payload.topic } });
            onRoundStarted?.(payload);
        };

        const handleRoundOver = (payload) => {
            onRoundOver?.(payload);
        };

        const handleAiSummary = (data) => {
            onAiSummary?.(data);
        };

        const handleCursorBroadcast = (data) => {
            onCursorBroadcast?.(data);
        };

        const handleStrokeBroadcast = (data) => {
            onStrokeBroadcast?.(data);
        };

        const handleCanvasClear = () => {
            onCanvasClear?.();
        };

        socket.on("room:playersUpdate", handlePlayersUpdate);
        socket.on("round:started", handleRoundStarted);
        socket.on("round:over", handleRoundOver);
        socket.on("round:aiSummary", handleAiSummary);
        socket.on("canvas:cursorBroadcast", handleCursorBroadcast);
        socket.on("canvas:strokeBroadcast", handleStrokeBroadcast);
        socket.on("canvas:clear", handleCanvasClear);
        socket.on("room:hostChanged", handleHostChanged);
        socket.on("room:playerLeft", handlePlayerLeft);
        socket.on("game:aborted", handleGameAborted);
        socket.on("round:requestSnapshot", handleRequestSnapshot);

        return () => {
            socket.off("room:playersUpdate", handlePlayersUpdate);
            socket.off("round:started", handleRoundStarted);
            socket.off("round:over", handleRoundOver);
            socket.off("round:aiSummary", handleAiSummary);
            socket.off("canvas:cursorBroadcast", handleCursorBroadcast);
            socket.off("canvas:strokeBroadcast", handleStrokeBroadcast);
            socket.off("canvas:clear", handleCanvasClear);
            socket.off("room:hostChanged", handleHostChanged);
            socket.off("room:playerLeft", handlePlayerLeft);
            socket.off("game:aborted", handleGameAborted);
            socket.off("round:requestSnapshot", handleRequestSnapshot);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        dispatch,
        onRoundStarted,
        onRoundOver,
        onAiSummary,
        onCursorBroadcast,
        onStrokeBroadcast,
        onCanvasClear,
        onHostChanged,
        onPlayerLeft,
        onGameAborted,
        onRequestSnapshot,
        fallbackTopic,
    ]);
}