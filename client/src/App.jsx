import { Routes, Route } from "react-router";
import Home from "./views/Home";
import Lobby from "./views/Lobby";
import InGame from "./views/InGame";
import Result from "./views/Result";
import { GameProvider } from "./contexts/GameContext";


export default function App() {

  return (
    <>
      <GameProvider>
        <Routes>
          <Route path="/" element={<Home />} />
        <Route path="/lobby/X7A9B" element={<Lobby />} />
        <Route path="/game/:roomCode" element={<InGame />} />
        <Route path="/result/:roomCode" element={<Result />} />
        </Routes >
      </GameProvider>
    </>
  )
}
