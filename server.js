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

  console.log("Client terhubung. Total client:", wss.clients.size);

  // ================= TERIMA DATA =================
ws.on('message', function incoming(message) {

  try {

    const serverReceive = Date.now();

    const data = JSON.parse(message);

    // ===== KALIBRASI CLOCK BROWSER (ping-pong) =====
    // Dipakai browser untuk estimasi selisih jam (clock offset) terhadap
    // server, supaya delay Server->Browser tidak terganggu jam laptop
    // yang kurang presisi. Balas langsung, jangan diproses sebagai data sensor.
    if (data.type === 'ping') {
      ws.send(JSON.stringify({
        type: 'pong',
        clientTime: data.clientTime,
        serverTime: Date.now()
      }));
      return;
    }

    const delayEspToServer = serverReceive - data.ts;

    console.log("ESP32 Timestamp :", data.ts);
    console.log("Server Receive  :", serverReceive);
    console.log("ESP32 -> Server :", delayEspToServer, "ms");

    // ===== TAMBAHKAN FIELD SEGMEN DELAY KE PAYLOAD =====
    // Supaya browser juga bisa mencatat delay ESP32->Server tanpa
    // harus mengandalkan Railway console log (yang sifatnya sementara).
    const enrichedData = {
      ...data,
      serverReceive: serverReceive,
      delayEspToServer: delayEspToServer
    };

    const enrichedMessage = JSON.stringify(enrichedData);

    // ================= KIRIM KE DASHBOARD =================
    wss.clients.forEach(function each(client) {

      if (client.readyState === WebSocket.OPEN) {

        client.send(enrichedMessage);

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
      ts: data.ts,
      serverReceive: serverReceive,
      delayEspToServer: delayEspToServer

    });

    console.log("Data histori tersimpan");

  } catch (error) {

    console.log("Error:", error.message);

  }

});

  // ================= CLIENT DISCONNECT =================
  ws.on('close', function () {

    console.log("Client terputus. Total client:", wss.clients.size);

  });

});
console.log("Server siap menerima koneksi WebSocket");
