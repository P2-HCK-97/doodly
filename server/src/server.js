require("dotenv").config();

const app = require("./app");
const { initSocket } = require("./socket");

const PORT = process.env.PORT || 3000;

const httpServer = require("http").createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
