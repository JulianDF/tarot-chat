export const runtime = "nodejs"

import { registerClient, unregisterClient } from "@/lib/sse-clients"

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> | { sessionId: string } },
) {
  try {
    const params = "then" in context.params ? await context.params : context.params
    const { sessionId } = params

    console.log("[v0 Server] SSE connection request for session:", sessionId)

    if (!sessionId) {
      return new Response("Missing sessionId", { status: 400 })
    }

    const encoder = new TextEncoder()
    let writer: WritableStreamDefaultWriter | null = null

    const stream = new ReadableStream({
      start(controller) {
        // Create a writer wrapper that writes to the controller
        const writerWrapper = {
          write: async (chunk: Uint8Array) => {
            try {
              controller.enqueue(chunk)
            } catch (error) {
              console.error("[v0 Server] Error writing to SSE stream:", error)
            }
          },
          close: async () => {
            try {
              controller.close()
            } catch (error) {
              console.error("[v0 Server] Error closing SSE stream:", error)
            }
          },
        } as WritableStreamDefaultWriter

        writer = writerWrapper

        // Register the client
        registerClient(sessionId, writer)

        // Send initial connection message
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "connected" })}\n\n`))
          console.log("[v0 Server] SSE connection established for session:", sessionId)
        } catch (error) {
          console.error("[v0 Server] Error sending initial SSE message:", error)
        }
      },
      cancel() {
        console.log("[v0 Server] SSE client disconnected:", sessionId)
        unregisterClient(sessionId)
      },
    })

    // Handle client disconnect via abort signal
    request.signal.addEventListener("abort", () => {
      console.log("[v0 Server] SSE client aborted connection:", sessionId)
      unregisterClient(sessionId)
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error("[v0 Server] SSE endpoint error:", error)
    return new Response(`SSE Error: ${error}`, { status: 500 })
  }
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
