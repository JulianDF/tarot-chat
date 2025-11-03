const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// define API routes first
app.post("/push", (req, res) => {
  const { sessionId, text } = req.body;
  console.log("📨 Received push from n8n");
  console.log("sessionId:", sessionId);
  console.log("text preview:", text?.slice?.(0, 80));

  const client = clients.get(sessionId);

  if (client) {
    client.write(`data: ${JSON.stringify({ text })}\n\n`);
    console.log("✅ Sent update to client", sessionId);
    res.send("OK");
  } else {
    console.warn("⚠️ No active SSE client for session:", sessionId);
    res.status(404).send("No active client");
  }
});

app.post("/webhook/tarot-chat", async (req, res) => {
  try {
    const response = await fetch("https://n8n-1-114-4-docker-image.onrender.com/webhook/tarot-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    console.error("❌ Error proxying to n8n:", err);
    res.status(500).send("Proxy error");
  }
});

app.get("/events/:sessionId", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const id = req.params.sessionId;
  clients.set(id, res);
  res.write(`data: {"status":"connected"}\n\n`);

  req.on("close", () => clients.delete(id));
});

// static files last
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✨ Tarot stream server running on port ${PORT}`)
);
