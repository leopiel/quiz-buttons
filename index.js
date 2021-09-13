"use strict";

const express = require("express");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const INDEX = "/frontend/views/index.html";

const server = express()
  .use(express.static("frontend"))
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new WebSocket.Server({ server });
let answerOrder = [];

wss.on("connection", (socketClient) => {
  try {
    console.log("NEW CONNECTION");
    socketClient.send(JSON.stringify({ answerOrder }));
    console.log("HERE");
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

      wss.clients.forEach((client) => {
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

    socketClient.on("close", (socketClient) => {
      console.log("closed");
      console.log("Number of clients: ", wss.clients.size);
    });
  });
});

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({ date: new Date().toTimeString() }));
  });
}, 1000);
