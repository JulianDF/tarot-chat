export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getClient, hasClient } from "@/lib/sse-clients"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, text, spread_html } = body

    console.log("[v0 Server] Push request received for session:", sessionId)

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    // Check if client exists
    if (!hasClient(sessionId)) {
      console.log("[v0 Server] No active client for session:", sessionId)
      return NextResponse.json({ error: "No active client" }, { status: 404 })
    }

    // Get the client connection for this session
    const writer = getClient(sessionId)

    if (!writer) {
      return NextResponse.json({ error: "No active client" }, { status: 404 })
    }

    // Prepare the message
    const message: any = { sessionId }
    if (text) message.text = text
    if (spread_html) message.spread_html = spread_html

    console.log("[v0 Server] Sending message to client:", sessionId)

    // Send message to the connected client via SSE
    const encoder = new TextEncoder()
    await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))

    console.log("[v0 Server] Message sent successfully to session:", sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0 Server] Push error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
