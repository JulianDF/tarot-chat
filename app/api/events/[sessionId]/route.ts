export const runtime = "nodejs"

// Store active SSE connections
const clientsMap = new Map<string, WritableStreamDefaultWriter>()

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params

  // Create a TransformStream for SSE
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Store the client connection
  clientsMap.set(sessionId, writer)

  // Send initial connection message
  writer.write(encoder.encode(`data: ${JSON.stringify({ status: "connected" })}\n\n`))

  // Handle client disconnect
  const close = () => {
    clientsMap.delete(sessionId)
    writer.close().catch(() => {})
  }

  // Clean up on disconnect
  request.signal.addEventListener("abort", close)

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

// Export function to get clients map (used by push endpoint)
export function getClientsMap() {
  return clientsMap
}
