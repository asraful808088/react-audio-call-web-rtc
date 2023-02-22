const connectUsers = {};
const createSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    socket.on("init", (name) => {
      for (let index = 0; index < Object.keys(connectUsers).length; index++) {
        if (Object.keys(connectUsers)[index] === name) {
          socket.emit("usedError", "your user name already used!!!!!");
          return;
        }
      }
      for (const key in connectUsers) {
        socket.to(connectUsers[key]).emit("newUser", name);
      }
      connectUsers[name] = socket.id;
      socket.emit("successInit", { allUsers: Object.keys(connectUsers) });
    });
    socket.on("offer", (data) => {
      socket.to(connectUsers[data.to]).emit("offer", {
        other: data.from,
        offer: data.offer,
      });
    });
    socket.on("candidate", (data) => {
      socket.to(connectUsers[data.to]).emit("candidate", data.candidate);
    });
    socket.on("ans", (data) => {
      socket.to(connectUsers[data.to]).emit("ans", { ans: data.ans });
    });
    socket.on("end", (data) => {
      socket.to(connectUsers[data.to]).emit("end");
    });
    socket.on("busy", (data) => {
      socket.to(connectUsers[data.to]).emit("busy");
    });
    socket.on("disconnect", () => {
      Object.keys(connectUsers).forEach((element) => {
        if (connectUsers[element] === socket.id) {
          delete connectUsers[element];
          for (const key in connectUsers) {
            socket.to(connectUsers[key]).emit("removeUser", element);
          }
          return;
        }
      });
    });
  });
};
module.exports = { createSocket };
