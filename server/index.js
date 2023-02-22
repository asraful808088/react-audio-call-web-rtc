require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const PORT = process.env.PORT;
require("./socket/socket").createSocket(server);
server.listen(PORT, (err) => {
  if (!err) {
    console.log(`server start on ${PORT} PORT || http://localhost:${PORT}`);
  } else {
    console.log(err);
  }
});
