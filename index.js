try {
  const express = require("express");
  const app = express();

  app.use(express.static("frontend"));

  app.get("/", function (req, res) {
    res.sendFile(__dirname + "/frontend/views/index.html");
  });

  const port = process.env.PORT || 8180;

  app.listen(port, function () {
    console.log("Our app is running on http://localhost:" + port);
  });

  const WebSocket = require("ws");

  const socketServer = new WebSocket.Server({ port: 80 });
  let answerOrder = [];

  socketServer.on("connection", (socketClient) => {
    try {
      socketClient.send(JSON.stringify({ answerOrder }));
    } catch (err) {
      console.log(err);
    }

    socketClient.on("message", (message) => {
      try {
        const messageString = message.toString();
        const messageJSON = JSON.parse(messageString);

        if (messageJSON.answerer) {
          answerOrder.push(messageJSON.answerer);
        }

        if (messageJSON.reset) {
          answerOrder = [];
        }

        socketServer.clients.forEach((client) => {
          try {
            if (client.readyState === WebSocket.OPEN) {
              if (messageJSON.answerer || messageJSON.reset) {
                client.send(JSON.stringify({ answerOrder }));
              }
              if (messageJSON.reset) {
                client.send(JSON.stringify({ answerOrder, reset: true }));
              }
            }
          } catch (err) {
            console.log(err);
          }
        });
      } catch (err) {
        console.log(err);
      }
    });

    socketClient.on("close", (socketClient) => {
      console.log("closed");
      console.log("Number of clients: ", socketServer.clients.size);
    });
  });

  setInterval(() => {
    socketServer.clients.forEach((client) => {
      client.send(JSON.stringify({ date: new Date().toTimeString() }));
    });
  }, 1000);
} catch (err) {
  console.error(err);
  process.exit(1);
}
