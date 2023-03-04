import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Link,
  CircularProgress,
} from "@material-ui/core";

const socket = io("http://192.168.89.102:9001");

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [recipientId, setRecipientId] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    socket.on("chat message", (msg) => {
      setMessages([...messages, msg]);
    });

    socket.on("private message", (data) => {
      const { sender, message } = data;
      setMessages([...messages, { sender, message }]);
    });

    socket.on("file", (data) => {
      setFileUrl(data.fileUrl);
      setMessages([
        ...messages,
        { sender: data.sender, message: data.message, fileUrl: data.fileUrl },
      ]);
    });

    socket.on("typing", (data) => {
      setIsTyping(data.isTyping);
    });

    return () => {
      socket.off("chat message");
      socket.off("private message");
      socket.off("file");
      socket.off("typing");
    };
  }, [messages]);

  const handleSendMessage = () => {
    if (recipientId) {
      socket.emit("private message", {
        recipientId,
        message,
      });
      setMessages([...messages, { sender: "se envio", message }]);
      setMessage("");
    } else {
      socket.emit("chat message", message);
      setMessages([...messages, { sender: "se envio", message }]);
      setMessage("");
    }
  };

  const handleFileChange = async (e) => {
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const response = await fetch("http://192.168.89.102:9001/archivos", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const fileMessage = `se gurado en archivos: ${data.fileUrl}`;
      socket.emit("file", { sender: "se envio el archivo", message: fileMessage });
    } catch (error) {
      console.error(error);
    }
  };

  const handleTyping = (e) => {
    if (e.target.value !== "" && !isTyping) {
      setIsTyping(true);
      socket.emit("typing", { isTyping: true });
    } else if (e.target.value === "" && isTyping) {
      setIsTyping(false);
      socket.emit("typing", { isTyping: false });
    }
  };

  return (
    <Grid container direction="column" alignItems="center" spacing={2}>
      <Grid item>
        <Typography variant="h4" gutterBottom>
          Chat privado y global
        </Typography>
      </Grid>
      <Grid item>
        <TextField
          label="Mensaje"
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
        />
        {isTyping && (
          <Typography variant="body1">Alguien está escribiendo...</Typography>
        )}
      </Grid>
      <Grid item>
        <Button variant="contained" color="primary" onClick={handleSendMessage}>
          Enviar
        </Button>
      </Grid>
      <Grid item>
        <TextField
          label="id para enviar por privado"
          variant="outlined"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
        />
      </Grid>
      <Grid item>
        <input type="file" onChange={handleFileChange} />
      </Grid>
      <Grid item>
        {fileUrl && (
          <Link
            href={`http://192.168.89.102:9001${fileUrl}`}
            target="_blank"
            rel="noopener"
          >
            Archivo: {fileUrl}
          </Link>
        )}
      </Grid>
      <Grid item>
        {messages.length === 0 ? (
          <CircularProgress />
        ) : (
          messages.map((msg, index) => (
            <Typography key={index} variant="body1">
              <strong>{msg.sender}</strong>: {msg.message}{" "}
              {msg.fileUrl && (
                <Link
                  href={`http://192.168.89.102:9001${msg.fileUrl}`}
                  target="_blank"
                  rel="noopener"
                >
                  Archivo
                </Link>
              )}
            </Typography>
          ))
        )}
      </Grid>
    </Grid>
  );
}

export default App;
