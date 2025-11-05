export const runtime = "nodejs"

import { registerClient, unregisterClient } from "@/lib/sse-clients"

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  // Await params in Next.js 16
  const { sessionId } = await context.params

  console.log("[v0 Server] SSE connection request for session:", sessionId)

  // Create a TransformStream for SSE
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Register the client connection
  registerClient(sessionId, writer)

  // Send initial connection message
  try {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ status: "connected" })}\n\n`))
    console.log("[v0 Server] SSE connection established for session:", sessionId)
  } catch (error) {
    console.error("[v0 Server] Error sending initial SSE message:", error)
  }

  // Handle client disconnect
  const close = () => {
    console.log("[v0 Server] SSE client disconnected:", sessionId)
    unregisterClient(sessionId)
    writer.close().catch(() => {})
  }

  // Clean up on disconnect
  request.signal.addEventListener("abort", close)

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
