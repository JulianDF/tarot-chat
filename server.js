const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ Serve index.html on root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

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

  console.log("📨 Received push from n8n");
  console.log("sessionId:", sessionId);
  console.log("text preview:", text?.slice?.(0, 80));

  const client = clients.get(sessionId);

  if (client) {
    // Send the text chunk as an SSE message
    client.write(`data: ${JSON.stringify({ text })}\n\n`);
    console.log("✅ Sent update to client", sessionId);
    res.send("OK");
  } else {
    console.warn("⚠️ No active SSE client for session:", sessionId);
    res.status(404).send("No active client");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✨ Tarot stream server running on port ${PORT}`)
);
