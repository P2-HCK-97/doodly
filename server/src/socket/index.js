const { Server } = require("socket.io");
const { registerRoomHandlers } = require("./handlers/room.handler");
const { registerRoundHandlers } = require("./handlers/round.handler");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
    },
  });

  io.on("connection", (socket) => {
    console.log("client connected:", socket.id);

    registerRoomHandlers(io, socket);
    registerRoundHandlers(io, socket);
  });

  return io;
}

module.exports = { initSocket };
