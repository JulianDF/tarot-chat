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

export function addMessage(sessionId: string, message: { text?: string; spread_html?: string }) {
  const messages = messagesStore.get(sessionId) || []
  const now = Date.now()

  // Check if there's a recent message (within last 5 seconds) that we should merge with
  const recentMessage = messages.length > 0 ? messages[messages.length - 1] : null
  const shouldMerge = recentMessage && now - recentMessage.timestamp < 5000

  if (shouldMerge) {
    // Merge new data into existing message
    console.log(`[v0] Merging message for session ${sessionId}`)
    if (message.text) recentMessage.text = message.text
    if (message.spread_html) recentMessage.spread_html = message.spread_html
    recentMessage.timestamp = now

    console.log(`[v0] Merged message:`, {
      id: recentMessage.id,
      hasText: !!recentMessage.text,
      hasSpread: !!recentMessage.spread_html,
      textLength: recentMessage.text?.length || 0,
      spreadLength: recentMessage.spread_html?.length || 0,
    })
  } else {
    // Create new message
    const newMessage = {
      id: `${now}-${Math.random()}`,
      ...message,
      timestamp: now,
    }
    messages.push(newMessage)

    console.log(`[v0] Created new message for session ${sessionId}:`, {
      id: newMessage.id,
      hasText: !!newMessage.text,
      hasSpread: !!newMessage.spread_html,
      textLength: newMessage.text?.length || 0,
      spreadLength: newMessage.spread_html?.length || 0,
    })
  }

  messagesStore.set(sessionId, messages)

  // Clean up old messages (keep last 100)
  if (messages.length > 100) {
    messagesStore.set(sessionId, messages.slice(-100))
  }
}
