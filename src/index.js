// Sending events from server to client
// socket.emit --> sends event to a specific client
// io.emit --> sends an event to every conneced client
// socket.broadcast.emit --> sends an event to every connected client, except the client who sends

// sending events in rooms
// io.to.emit --> it emits an event to everybody in an specific room.
// socket.broadcast.to.emit --> sends an event in a room to every connected client, except the client who sends

const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

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

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    // to send a msg to a particular client
    socket.emit("message", generateMessage("Admin", "Welcome"));

    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );
    // this will send message to everybody except the socket who has sent the message

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  // to send msg to everyone
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    // checking for bad-words
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }

    // callback to acknowledge the event
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  // sharing location
  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username}  has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
