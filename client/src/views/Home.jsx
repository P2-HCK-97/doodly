import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { showToast } from "../utils/toastify";
import PlayerAvatar from "../components/PlayerAvatar";
import socket from "../services/socket";
import { useGame } from "../contexts/GameContext";

export default function Home() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const navigate = useNavigate();
  const { dispatch } = useGame();
  const modalRef = useRef(null);

  const avatarSeed = username.trim() || "Doodly";

  const handleCreateRoom = () => {
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      showToast.error("Isi username dulu ya!");
      return;
    }

    setIsCreatingRoom(true);

    socket.emit(
      "room:create",
      {
        username: cleanUsername,
      },
      (response) => {
        console.log("Create room response:", response);
        if (response?.error) {
          setIsCreatingRoom(false);
          showToast.error(response.error);
          return;
        }

        if (!response?.room?.code) {
          setIsCreatingRoom(false);
          showToast.error("Gagal membuat room");
          return;
        }

        setIsCreatingRoom(false);
        dispatch({ type: "ROOM_JOINED", payload: response.room });
        navigate(`/lobby/${response.room.code}`);
      },
    );
  };

  const handleJoinRoom = () => {
    const cleanUsername = username.trim();
    const cleanRoomCode = roomCode.trim().toUpperCase();

    if (!cleanUsername || !cleanRoomCode) {
      showToast.error("Pastikan username dan kode room terisi!");
      return;
    }

    socket.emit(
      "room:join",
      {
        code: cleanRoomCode,
        username: cleanUsername,
      },
      (response) => {
        if (response?.error) {
          /*
           * Error join hanya bersifat informasi, tidak ada
           * keputusan yang perlu diambil user. Toast cukup, dan
           * modal join tetap terbuka supaya kode bisa langsung
           * diperbaiki tanpa membuka ulang dialog.
           */
          showToast.error(response.error);

          /*
           * Kode mati / room selesai: kosongkan input supaya
           * user tidak submit ulang kode yang sama.
           */
          if (
            response.code === "ROOM_NOT_FOUND" ||
            response.code === "ROOM_FINISHED"
          ) {
            setRoomCode("");
          }

          return;
        }

        if (!response?.room?.code) {
          showToast.error("Gagal bergabung ke room");
          return;
        }

        modalRef.current?.close();

        dispatch({ type: "ROOM_JOINED", payload: response.room });
        navigate(`/lobby/${response.room.code}`);
      },
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes moveDots {
            0% {
              background-position: 0px 0px;
            }

            100% {
              background-position: 32px 32px;
            }
          }

          .animate-dots {
            animation: moveDots 2s linear infinite;
          }

          dialog::backdrop {
            background: rgba(0, 0, 0, 0.6);
          }
        `}
      </style>

      <div
        className="min-h-screen flex items-center justify-center p-6 font-sans text-black animate-dots"
        style={{
          backgroundColor: "#FDF8E4",
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="relative bg-white border-[3px] border-black w-full max-w-sm p-8 shadow-[8px_8px_0px_0px_#000000] mt-6">
          <h1 className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-2 text-xl font-black border-[3px] border-black -rotate-2">
            DOODLY
          </h1>

          <div className="flex justify-center mb-6 mt-4">
            <PlayerAvatar seed={avatarSeed} size="lg" />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
              Main Sekarang!
            </h2>

            <div className="flex items-start gap-2">
              <div className="w-1.5 h-full min-h-[32px] bg-[#EB4B98] mt-1" />

              <p className="text-sm font-semibold leading-tight">
                Gambar kolaborasi bareng teman dan siap-siap di-roasting AI!
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="username"
              className="block text-xs font-bold mb-2 uppercase"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Siapa namamu?"
              className="w-full border-[3px] border-black px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_#000000] transition-shadow"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={handleCreateRoom}
              className="block w-full text-center bg-[#EB4B98] hover:bg-[#FFE600] border-[3px] border-black py-3 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-200 cursor-pointer"
            >
              Create Room
            </button>

            <div className="text-center text-sm font-semibold">
              Punya kode ruangan?{" "}
              <button
                type="button"
                onClick={() => modalRef.current?.showModal()}
                className="underline font-bold hover:text-[#EB4B98] decoration-2 underline-offset-2 transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer"
              >
                Join di sini
              </button>
            </div>
          </div>
        </div>
      </div>

      <dialog
        ref={modalRef}
        id="join_modal"
        className="m-auto bg-transparent p-4 w-full max-w-sm"
      >
        <div className="bg-white border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_#000000] text-black">
          <h3 className="font-black text-2xl uppercase tracking-tight mb-2">
            Gabung Room
          </h3>

          <p className="text-sm font-semibold mb-6">
            Masukkan kode rahasia dari temanmu.
          </p>

          <input
            type="text"
            placeholder="Contoh: X7A9B"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            maxLength={6}
            className="w-full border-[3px] border-black px-4 py-3 text-center text-xl tracking-widest font-bold text-black placeholder-gray-500 focus:outline-none focus:shadow-[4px_4px_0px_0px_#000000] transition-shadow uppercase mb-6"
          />

          <div className="flex gap-4">
            <form method="dialog" className="flex-1">
              <button className="w-full text-center bg-[#E2E8F0] hover:bg-gray-300 border-[3px] border-black py-2 font-black text-sm uppercase text-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-200 cursor-pointer">
                Batal
              </button>
            </form>

            <button
              type="button"
              onClick={handleJoinRoom}
              className="flex-1 text-center bg-[#FFE600] hover:bg-[#EB4B98] border-[3px] border-black py-2 font-black text-sm uppercase text-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-200 cursor-pointer"
            >
              Masuk
            </button>
          </div>
        </div>
      </dialog>

      {/* Loading Overlay Neo-Brutalism */}
      {isCreatingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-[3px] border-black w-full max-w-sm p-8 shadow-[8px_8px_0px_0px_#000000] relative text-black text-center">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFE600] border-[3px] border-black px-4 py-1 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] -rotate-2 animate-bounce">
              MEMPROSES AI...
            </div>

            <div className="py-6 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-[4px] border-black border-t-[#EB4B98] rounded-full animate-spin"></div>

              <div className="space-y-1">
                <h3 className="font-black text-xl uppercase tracking-tight">
                  MEMBUAT ROOM...
                </h3>
                <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                  Menyiapkan topik gambar kolaboratif seru untuk tim kamu! 🎨
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}