const express = require("express");
const cors = require("cors");
// const mongoose = require("mongoose");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

// mongoose
//   .connect(process.env.MONGO_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("DB Connetion Successfull");
//   })
//   .catch((err) => {
//     console.log(err.message);
//   });

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);

const io = socket(server, {
  cors: {
    origin: "*",
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Connection established", socket.id);

  socket.on("add-user", (data) => {
    const { email } = data;
    onlineUsers.set(email, socket.id);
    broadcastOnlineUsers();
  });

  socket.on("request-online-users", () => {
    const onlineUsersArray = Array.from(onlineUsers.keys());
    socket.emit("get-online-users", onlineUsersArray);
  });

  socket.on("send-msg", (data) => {
    const { to, from, message } = data;
    const recipientSocket = onlineUsers.get(to);

    if (recipientSocket) {
      io.to(recipientSocket).emit("msg-receive", {
        from,
        message,
      });
    }
  });

  socket.on("disconnect", () => {
    // Remove user from online users when they disconnect
    for (const [email, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(email);
        break;
      }
    }
    broadcastOnlineUsers();
  });

  // Helper function to broadcast online users to all clients
  function broadcastOnlineUsers() {
    const onlineUsersArray = Array.from(onlineUsers.keys());
    io.emit("get-online-users", onlineUsersArray);
  }
});
