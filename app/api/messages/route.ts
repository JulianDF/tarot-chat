// In production, this would query a database; for now we use in-memory storage

const messageStore: Map<
  string,
  Array<{ text?: string; spread_html?: string; sessionId: string; id: string; timestamp: number }>
> = new Map()

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { sessionId, text, spread_html } = data

    if (!sessionId) {
      return Response.json({ error: "Missing sessionId" }, { status: 400 })
    }

    const messageId = Math.random().toString(36).substring(2)
    const message = {
      id: messageId,
      text: text || undefined,
      spread_html: spread_html || undefined,
      sessionId,
      timestamp: Date.now(),
    }

    if (!messageStore.has(sessionId)) {
      messageStore.set(sessionId, [])
    }

    messageStore.get(sessionId)!.push(message)

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error storing message:", error)
    return Response.json({ error: "Failed to store message" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 })
  }

  const messages = messageStore.get(sessionId) || []

  return Response.json({ messages, sessionId })
}
