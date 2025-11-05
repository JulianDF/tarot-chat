export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { addMessage } from "@/app/api/messages/[sessionId]/route"

export async function POST(request: Request) {
  try {
    let body = await request.json()

    console.log("=".repeat(80))
    console.log("[v0 Server] 🔔 PUSH REQUEST RECEIVED")
    console.log("=".repeat(80))
    console.log("[v0 Server] Full body:", JSON.stringify(body, null, 2))

    if (Array.isArray(body) && body.length > 0) {
      console.log("[v0 Server] Body is an array, extracting first element")
      body = body[0]
    }

    let { sessionId, text, spread_html } = body

    console.log("[v0 Server] 🔑 SESSION ID:", sessionId || "❌ MISSING!")

    if (!spread_html && body.spreadHtml) {
      spread_html = body.spreadHtml
      console.log("[v0 Server] Found spreadHtml (camelCase)")
    }
    if (!spread_html && body.spread) {
      spread_html = body.spread
      console.log("[v0 Server] Found spread")
    }

    console.log("[v0 Server] Extracted values:")
    console.log("  - sessionId:", sessionId)
    console.log("  - text:", text ? `${text.substring(0, 100)}... (${text.length} chars)` : "undefined")
    console.log(
      "  - spread_html:",
      spread_html ? `${spread_html.substring(0, 100)}... (${spread_html.length} chars)` : "undefined",
    )

    if (!sessionId) {
      console.error("[v0 Server] ❌ ERROR: Missing sessionId in request")
      console.error("[v0 Server] This means n8n is not correctly passing the sessionId!")
      console.error("[v0 Server] Check your n8n workflow configuration.")
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    if (!text && !spread_html) {
      console.error("[v0 Server] ❌ ERROR: Neither text nor spread_html provided")
      return NextResponse.json({ error: "Either text or spread_html is required" }, { status: 400 })
    }

    // Add message to store
    console.log("[v0 Server] ✅ Adding message to store for session:", sessionId)
    addMessage(sessionId, { text, spread_html })
    console.log("=".repeat(80))

    // Return success immediately to n8n
    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      received: {
        hasText: !!text,
        hasSpread: !!spread_html,
        textLength: text?.length || 0,
        spreadLength: spread_html?.length || 0,
      },
    })
  } catch (error) {
    console.error("[v0 Server] ❌ Push error:", error)
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
