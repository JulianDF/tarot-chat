export const runtime = "nodejs"

import { NextResponse } from "next/server"

// In-memory storage for SSE clients
const clientsMap = new Map<string, WritableStreamDefaultWriter>()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, text, spread_html } = body

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    // Get the client connection for this session
    const writer = clientsMap.get(sessionId)

    if (!writer) {
      return NextResponse.json({ error: "No active client" }, { status: 404 })
    }

    // Prepare the message
    const message: any = { sessionId }
    if (text) message.text = text
    if (spread_html) message.spread_html = spread_html

    // Send message to the connected client via SSE
    const encoder = new TextEncoder()
    await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Push error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Export function to register clients from the events endpoint
export function registerClient(sessionId: string, writer: WritableStreamDefaultWriter) {
  clientsMap.set(sessionId, writer)
}

export function unregisterClient(sessionId: string) {
  clientsMap.delete(sessionId)
}
