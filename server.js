const WebSocket = require('ws');
const admin = require('firebase-admin');

// ================= FIREBASE =================
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kualitasudara-39e2b-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// ================= DATA TERBARU =================
let latestData = null;
let lastReceiveTime = 0;

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

      // Simpan data terbaru
      latestData = data;

      // Catat waktu data terakhir diterima
      lastReceiveTime = Date.now();

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

    // Hentikan histori jika koneksi terputus
    latestData = null;
    lastReceiveTime = 0;

  });

});

// ================= SIMPAN HISTORI SETIAP 7 DETIK =================
setInterval(() => {

  const now = Date.now();

  // Hanya simpan jika masih menerima data dalam 10 detik terakhir
  if (
    latestData &&
    (now - lastReceiveTime) < 10000
  ) {

    db.ref("histori").push({

      suhu: latestData.suhu,
      hum: latestData.hum,
      co: latestData.co,
      status: latestData.status,
      ts: Date.now()

    });

    console.log("Data histori tersimpan");

  }

}, 7000);

console.log("Server siap menerima koneksi WebSocket");