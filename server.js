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

    const serverReceive = Date.now();

    console.log("Data:", message.toString());

    const data = JSON.parse(message);

    // ===== TAMBAHAN UNTUK MENGUKUR DELAY =====
    console.log("ESP32 Timestamp :", data.ts);
    console.log("Server Receive  :", serverReceive);
    console.log("ESP32 -> Server :", serverReceive - data.ts, "ms");


    // ================= KIRIM KE DASHBOARD =================
    wss.clients.forEach(function each(client) {

      if (client.readyState === WebSocket.OPEN) {

        client.send(message.toString());

      }

    });

    console.log("Server Broadcast :", Date.now());
// ================= SIMPAN FIREBASE =================
    db.ref("histori").push({

    id: data.id,
    suhu: data.suhu,
    hum: data.hum,
    co: data.co,
    status: data.status,
    ts: data.ts

});

console.log("Data histori tersimpan");

  } catch (error) {

    console.log("Error:", error.message);

  }

});

  // ================= CLIENT DISCONNECT =================
  ws.on('close', function () {

    console.log("Client terputus");

  });

});
console.log("Server siap menerima koneksi WebSocket");