const { Server } = require("socket.io");
const { registerRoomHandlers } = require("./handlers/room.handler");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
    },
  });

  io.on("connection", (socket) => {
    console.log("client connected:", socket.id);

    registerRoomHandlers(io, socket);
  });

  return io;
}

module.exports = { initSocket };
