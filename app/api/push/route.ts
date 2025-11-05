export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { addMessage } from "@/app/api/messages/[sessionId]/route"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, text, spread_html } = body

    console.log("[v0 Server] Push request received for session:", sessionId)

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    // Add message to store
    addMessage(sessionId, { text, spread_html })

    // Return success immediately to n8n
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
