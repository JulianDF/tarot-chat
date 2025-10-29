import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔮 memory store for active clients
const clients = new Map();

// browser opens connection
app.get("/events/:sessionId", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const id = req.params.sessionId;
  clients.set(id, res);

  // send initial ping
  res.write(`data: {"status":"connected"}\n\n`);

  req.on("close", () => {
    clients.delete(id);
  });
});

// n8n pushes message here
app.post("/push", (req, res) => {
  const { sessionId, text } = req.body;
  const client = clients.get(sessionId);
  if (client) {
    client.write(`data: ${JSON.stringify({ text })}\n\n`);
    res.send("OK");
  } else {
    res.status(404).send("No active client");
  }
});

app.listen(3000, () => console.log("✨ Tarot Stream server running on :3000"));
