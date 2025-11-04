import { NextResponse } from "next/server";

const clients = new Map();

export async function POST(request) {
  const { sessionId, text } = await request.json();
  console.log("📨 Received push from n8n", sessionId, text?.slice?.(0, 60));

  const client = clients.get(sessionId);
  if (client) {
    client.write(`data: ${JSON.stringify({ text })}\n\n`);
    console.log("✅ Sent update to client", sessionId);
    return NextResponse.json({ ok: true });
  } else {
    console.warn("⚠️ No active SSE client for session:", sessionId);
    return NextResponse.json({ error: "No active client" }, { status: 404 });
  }
}

export function getClientsMap() {
  return clients;
}
