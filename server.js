const WebSocket = require('ws');
const admin = require('firebase-admin');

// ================= FIREBASE =================
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kualitasudara-39e2b-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// ================= DATA TERBARU =================
let latestData = null;

// ================= WEBSOCKET =================
const PORT = process.env.PORT || 81;

const wss = new WebSocket.Server({
  port: PORT
});

console.log(`WebSocket server aktif di port ${PORT}`);

// ================= CLIENT CONNECT =================
wss.on('connection', function connection(ws) {

  console.log("Client terhubung");

  // ================= TERIMA DATA =================
  ws.on('message', function incoming(message) {

    try {

      console.log("Data:", message.toString());

      const data = JSON.parse(message);

      // simpan data terbaru
      latestData = data;

      // ================= KIRIM KE DASHBOARD =================
      wss.clients.forEach(function each(client) {

        if (client.readyState === WebSocket.OPEN) {

          client.send(message.toString());

        }

      });

    } catch (error) {

      console.log("Error:", error.message);

    }

  });

  // ================= CLIENT DISCONNECT =================
  ws.on('close', function () {

    console.log("Client terputus");

  });

});

// ================= SIMPAN HISTORI SETIAP 10 DETIK =================
setInterval(() => {

  if (latestData) {

    db.ref("histori").push({

      suhu: latestData.suhu,
      hum: latestData.hum,
      co: latestData.co,
      ts: Date.now()

    });

    console.log("Data histori tersimpan");

  }

}, 7000);