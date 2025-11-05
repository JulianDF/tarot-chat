export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// In-memory message store
const messagesStore = new Map<string, Array<{ id: string; text?: string; spread_html?: string; timestamp: number }>>()

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> | { sessionId: string } },
) {
  try {
    const params = await Promise.resolve(context.params)
    const sessionId = params.sessionId.trim()

    const messages = messagesStore.get(sessionId) || []

    console.log(`[v0 GET] Session ${sessionId}: ${messages.length} messages`)

    return Response.json({ messages })
  } catch (error) {
    console.error("[v0] Error in messages endpoint:", error)
    return Response.json({ messages: [] }, { status: 500 })
  }
}

export function addMessage(sessionId: string, message: { text?: string; spread_html?: string }) {
  const messages = messagesStore.get(sessionId) || []
  const now = Date.now()

  const newMessage = {
    id: `${now}-${Math.random()}`,
    ...message,
    timestamp: now,
  }

  messages.push(newMessage)
  messagesStore.set(sessionId, messages)

  console.log(
    `[v0 addMessage] Session ${sessionId}: Added message (hasText: ${!!message.text}, hasSpread: ${!!message.spread_html})`,
  )

  // Clean up old messages (keep last 100)
  if (messages.length > 100) {
    messagesStore.set(sessionId, messages.slice(-100))
  }
}
