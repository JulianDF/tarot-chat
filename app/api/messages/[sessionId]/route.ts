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

    console.log(`[v0 GET] Retrieving messages for session ${sessionId}:`, {
      messageCount: messages.length,
      allSessionIds: Array.from(messagesStore.keys()),
      messages: messages.map((m) => ({
        id: m.id,
        hasText: !!m.text,
        hasSpread: !!m.spread_html,
        textLength: m.text?.length || 0,
        spreadLength: m.spread_html?.length || 0,
      })),
    })

    return Response.json({ messages })
  } catch (error) {
    console.error("[v0] Error in messages endpoint:", error)
    return Response.json({ messages: [] }, { status: 500 })
  }
}

export function addMessage(sessionId: string, message: { text?: string; spread_html?: string }) {
  const messages = messagesStore.get(sessionId) || []
  const now = Date.now()

  console.log("\n" + "=".repeat(80))
  console.log(`[v0 addMessage] 🔔 NEW MESSAGE ARRIVING`)
  console.log("=".repeat(80))
  console.log(`Session: ${sessionId}`)
  console.log(
    `Adding: ${message.text ? "TEXT" : ""}${message.text && message.spread_html ? " + " : ""}${message.spread_html ? "SPREAD_HTML" : ""}`,
  )
  console.log(`Current message count: ${messages.length}`)

  if (messages.length > 0) {
    console.log(`\nExisting messages:`)
    messages.forEach((m, i) => {
      console.log(`  [${i}] id: ${m.id}, hasText: ${!!m.text}, hasSpread: ${!!m.spread_html}`)
    })
  }

  const recentMessage = messages.length > 0 ? messages[messages.length - 1] : null

  if (recentMessage) {
    console.log(`\n📋 Most recent message:`)
    console.log(`  id: ${recentMessage.id}`)
    console.log(`  hasText: ${!!recentMessage.text}`)
    console.log(`  hasSpread: ${!!recentMessage.spread_html}`)
  } else {
    console.log(`\n📋 No recent message found`)
  }

  const canMerge =
    recentMessage && ((message.text && !recentMessage.text) || (message.spread_html && !recentMessage.spread_html))

  console.log(`\n🔀 Merge decision: ${canMerge ? "✅ MERGE" : "❌ CREATE NEW"}`)
  if (recentMessage) {
    console.log(`  Reason:`)
    if (message.text && !recentMessage.text) {
      console.log(`    ✓ Adding TEXT to message that has NO text`)
    }
    if (message.spread_html && !recentMessage.spread_html) {
      console.log(`    ✓ Adding SPREAD to message that has NO spread`)
    }
    if (message.text && recentMessage.text) {
      console.log(`    ✗ Recent message already has TEXT`)
    }
    if (message.spread_html && recentMessage.spread_html) {
      console.log(`    ✗ Recent message already has SPREAD`)
    }
  }

  if (canMerge) {
    console.log(`\n🔗 MERGING into existing message ${recentMessage!.id}`)
    if (message.text) {
      console.log(`  Adding TEXT (${message.text.length} chars)`)
      recentMessage!.text = message.text
    }
    if (message.spread_html) {
      console.log(`  Adding SPREAD_HTML (${message.spread_html.length} chars)`)
      recentMessage!.spread_html = message.spread_html
    }
    recentMessage!.timestamp = now

    console.log(`\n✅ Merged result:`)
    console.log(`  id: ${recentMessage!.id}`)
    console.log(`  hasText: ${!!recentMessage!.text}`)
    console.log(`  hasSpread: ${!!recentMessage!.spread_html}`)
  } else {
    const newMessage = {
      id: `${now}-${Math.random()}`,
      ...message,
      timestamp: now,
    }
    messages.push(newMessage)

    console.log(`\n➕ CREATED new message:`)
    console.log(`  id: ${newMessage.id}`)
    console.log(`  hasText: ${!!newMessage.text}`)
    console.log(`  hasSpread: ${!!newMessage.spread_html}`)
  }

  messagesStore.set(sessionId, messages)

  console.log(`\n📊 Final state for session ${sessionId}:`)
  console.log(`  Total messages: ${messages.length}`)
  messages.forEach((m, i) => {
    console.log(`  [${i}] id: ${m.id}, hasText: ${!!m.text}, hasSpread: ${!!m.spread_html}`)
  })
  console.log("=".repeat(80) + "\n")

  // Clean up old messages (keep last 100)
  if (messages.length > 100) {
    messagesStore.set(sessionId, messages.slice(-100))
  }
}
