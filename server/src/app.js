const express = require("express");
const cors = require("cors");
const roomRoutes = require("./routes/room.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  }),
);

app.use(express.json());

app.use("/rooms", roomRoutes);

module.exports = app;
