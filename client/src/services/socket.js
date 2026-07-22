import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

console.log("Socket target:", SERVER_URL);

const socket = io(SERVER_URL);

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", {
    message: error.message,
    description: error.description,
    context: error.context,
  });
});

export default socket;
