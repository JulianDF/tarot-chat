export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Store the message in memory or process it
    // The frontend will fetch from /api/messages to retrieve them
    console.log("[v0] Webhook received:", data)

    return Response.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }
}
