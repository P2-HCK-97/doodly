import { Routes, Route } from "react-router";
import Home from "./views/Home";
import Lobby from "./views/Lobby";
import InGame from "./views/InGame";
import Result from "./views/Result";


function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/canvas" element={<InGame />} />
        <Route path="/result" element={<Result />} />
      </Routes >
    </>
  )
}

export default App
