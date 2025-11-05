export const runtime = "nodejs"

import { NextResponse } from "next/server"

// Forward to the push endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Forward the request to /api/push
    const pushUrl = new URL("/api/push", request.url)
    const pushResponse = await fetch(pushUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!pushResponse.ok) {
      const error = await pushResponse.json()
      return NextResponse.json(error, { status: pushResponse.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
