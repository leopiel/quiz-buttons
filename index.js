try {
  const express = require('express');
  const app = express();
  const WebSocket = require('ws');


  app.use(express.static('frontend'));

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/frontend/views/index.html');
  });

  // app.post('/submitTeamName', function (req, res) {
  //   try {
  //     console.log('GOT ANSWERS ', req.body);


  //     res.json({
  //       ...req.body,
  //     });
  //   } catch (err) {
  //     console.log(err);
  //   }
  // });



  const socketServer = new WebSocket.Server({ port: 3030 });
  let answerOrder = [];

  socketServer.on('connection', (socketClient) => {
    socketClient.send(JSON.stringify({ answerOrder }));

    socketClient.on('message', (message) => {
      const messageString = message.toString();
      const messageJSON = JSON.parse(messageString);

      if (messageJSON.answerer) {
        answerOrder.push(messageJSON.answerer);
      }

      if (messageJSON.reset) {
        answerOrder = [];
      }

      socketServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          if (messageJSON.answerer || messageJSON.reset) {
            client.send(JSON.stringify({ answerOrder }));
          }

          if (messageJSON.reset) {
            client.send(JSON.stringify({ answerOrder, reset: true }));
          }
        }
      });
    });

    socketClient.on('close', (socketClient) => {
      console.log('closed');
      console.log('Number of clients: ', socketServer.clients.size);
    });
  });

  const port = process.env.PORT || 80;

  app.listen(port, function () {
    console.log('Our app is running on http://localhost:' + port);
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
