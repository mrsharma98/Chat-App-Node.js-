const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const app = express();
const server = http.createServer(app);
// creating a server
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

// basically when a client opens localhost:3000
io.on("connection", (socket) => {
  console.log("New websocket connection.");

  // to send a msg to a particular client
  socket.emit("message", generateMessage("Welcome"));

  socket.broadcast.emit("message", generateMessage("A new user has joined!"));
  // this will send message to everybody except the socket who has sent the message

  // to send msg to everyone

  socket.on("sendMessage", (message, callback) => {
    // checking for bad-words
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }

    // callback to acknowledge the event
    io.emit("message", generateMessage(message));
    callback();
  });

  // sharing location
  socket.on("sendLocation", (coords, callback) => {
    io.emit(
      "locationMessage",
      generateLocationMessage(
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    io.emit("message", generateMessage("A user has left"));
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
