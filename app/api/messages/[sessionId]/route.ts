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
    const { sessionId } = params

    const messages = messagesStore.get(sessionId) || []

    return Response.json({ messages })
  } catch (error) {
    console.error("[v0] Error in messages endpoint:", error)
    return Response.json({ messages: [] }, { status: 500 })
  }
}

// Helper function to add messages (used by push endpoint)
export function addMessage(sessionId: string, message: { text?: string; spread_html?: string }) {
  const messages = messagesStore.get(sessionId) || []
  const newMessage = {
    id: `${Date.now()}-${Math.random()}`,
    ...message,
    timestamp: Date.now(),
  }
  messages.push(newMessage)
  messagesStore.set(sessionId, messages)

  // Clean up old messages (keep last 100)
  if (messages.length > 100) {
    messagesStore.set(sessionId, messages.slice(-100))
  }

  console.log(`[v0] Added message for session ${sessionId}:`, newMessage)
}
