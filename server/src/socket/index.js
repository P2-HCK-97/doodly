const { Server } = require("socket.io");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
    },
  });

  io.on("connection", (socket) => {
    console.log("client connected:", socket.id);
  });

  return io;
}

module.exports = { initSocket };