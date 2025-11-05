export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { addMessage } from "@/app/api/messages/[sessionId]/route"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log("[v0 Server] Push request received - Full body:", JSON.stringify(body, null, 2))

    const { sessionId, text, spread_html } = body

    console.log("[v0 Server] Extracted values:")
    console.log("  - sessionId:", sessionId)
    console.log("  - text:", text ? `${text.substring(0, 100)}...` : "undefined")
    console.log("  - spread_html:", spread_html ? `${spread_html.substring(0, 100)}...` : "undefined")

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
