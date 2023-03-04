const express = require("express");
const app = express();
const http = require("http");
const multer = require("multer");
const path = require("path");
const server = http.createServer(app);
const io = require("socket.io")(server);
const os = require("os");

const PORT = 9001;
const ip = "192.168.89.102" 

let sessions = [];

const storage = multer.diskStorage({
  destination: "./archivos",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

app.post("/archivos", upload.single("file"), (req, res) => {
  const fileUrl = `http://${ip}:${PORT}/archivos/${req.file.filename}`;
  res.json({ fileUrl });
});

// Manejador de conexiones de Socket.io
io.on("connection", (socket) => {
  socket.name = os.hostname + "==>" + socket.id;
  console.log("Cliente conectado:", socket.name);

  let sessionId = socket.name;

  sessions.push({ sessionId: sessionId, socket: socket });

  socket.on("chat message", (msg) => {
    console.log(`Mensaje recibido de ${socket.name}:`, msg);
    io.emit("chat message", { sender: socket.name, message: msg });
  });

  socket.on("file", (data) => {
    console.log(`Archivo recibido de ${socket.name}:`, data.message);
    io.emit("file", data);
  });

  socket.on("private message", (data) => {
    let recipient = sessions.find(
      (session) => session.sessionId === data.recipientId
    );
    if (recipient) {
      recipient.socket.emit("private message", data);
    }
  });

  socket.on("disconnect", () => {
    sessions = sessions.filter((session) => session.sessionId !== sessionId);
    console.log("Cliente desconectado:", socket.name);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor de chat escuchando en http://${ip}:9001`);
});