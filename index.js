try {
  const express = require("express");
  const app = express();

  app.use(express.static("frontend"));
  const PORT = process.env.PORT || 3000;

  const server = express()
    .use((req, res) =>
      res.sendFile("/frontend/views/index.html", { root: __dirname })
    )
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

  const WebSocket = require("ws");

  const socketServer = new WebSocket.Server({ server: app });
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
