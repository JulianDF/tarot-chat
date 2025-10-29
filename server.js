import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const clients = new Map();

app.get("/events/:sessionId", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const id = req.params.sessionId;
  clients.set(id, res);
  res.write(`data: {"status":"connected"}\n\n`);

  req.on("close", () => clients.delete(id));
});

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

app.listen(3000, () => console.log("✨ Tarot stream server running on port 3000"));
