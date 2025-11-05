// Shared client registry that both endpoints can access
const clientsMap = new Map<string, WritableStreamDefaultWriter>()

export function registerClient(sessionId: string, writer: WritableStreamDefaultWriter) {
  console.log("[v0 Server] Registering SSE client for session:", sessionId)
  clientsMap.set(sessionId, writer)
}

export function unregisterClient(sessionId: string) {
  console.log("[v0 Server] Unregistering SSE client for session:", sessionId)
  clientsMap.delete(sessionId)
}

export function getClient(sessionId: string): WritableStreamDefaultWriter | undefined {
  return clientsMap.get(sessionId)
}

export function hasClient(sessionId: string): boolean {
  return clientsMap.has(sessionId)
}
