import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("=== WEBHOOK DEBUG ===")
    console.log("Full body:", JSON.stringify(body, null, 2))
    console.log("body.body:", body.body)
    console.log("body.body.sessionId:", body.body?.sessionId)
    console.log("body.sessionId:", body.sessionId)
    console.log("====================")

    return NextResponse.json({
      received: body,
      extracted: {
        fromBodyBody: body.body?.sessionId,
        fromBody: body.sessionId,
      },
    })
  } catch (error) {
    console.error("Debug webhook error:", error)
    return NextResponse.json({ error: "Failed to process" }, { status: 500 })
  }
}
