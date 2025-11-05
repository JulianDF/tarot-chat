"use client"

import { useState, useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import ChatInterface from "@/components/chat-interface"
import SpreadViewer from "@/components/spread-viewer"

export default function TarotApp() {
  const [sessionId, setSessionId] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; text: string; timestamp: number }>>([])
  const [spreadHtml, setSpreadHtml] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const lastProcessedIdRef = useRef<Set<string>>(new Set())

  // Initialize session
  useEffect(() => {
    initializeSession()
  }, [])

  useEffect(() => {
    if (sessionId) {
      connectToSSE()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [sessionId])

  const initializeSession = () => {
    const newSessionId = uuidv4()
    setSessionId(newSessionId)
    setChatMessages([])
    setSpreadHtml("")
    lastProcessedIdRef.current.clear()
  }

  const connectToSSE = () => {
    console.log("[v0] Connecting to SSE for session:", sessionId)

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const sseUrl = `/api/events/${sessionId}`
    console.log("[v0] SSE URL:", sseUrl)

    // Create new SSE connection
    try {
      const eventSource = new EventSource(sseUrl)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log("[v0] SSE connection opened successfully")
      }

      eventSource.onmessage = (event) => {
        console.log("[v0] SSE message received:", event.data)

        try {
          const data = JSON.parse(event.data)

          // Handle status messages
          if (data.status === "connected") {
            console.log("[v0] SSE connected successfully")
            return
          }

          // Generate unique ID for deduplication
          const messageId = data.id || uuidv4()

          // Only process each message once
          if (!lastProcessedIdRef.current.has(messageId)) {
            lastProcessedIdRef.current.add(messageId)

            // Handle chat messages
            if (data.text) {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: messageId,
                  text: data.text,
                  timestamp: Date.now(),
                },
              ])
            }

            // Handle spread HTML
            if (data.spread_html) {
              setSpreadHtml(data.spread_html)
            }
          }
        } catch (error) {
          console.error("[v0] Error parsing SSE message:", error)
        }
      }

      eventSource.onerror = (error) => {
        console.error("[v0] SSE error details:", {
          readyState: eventSource.readyState,
          url: sseUrl,
          error: error,
          errorType: error.type,
          target: error.target,
        })

        // Check readyState to understand the error
        if (eventSource.readyState === EventSource.CONNECTING) {
          console.log("[v0] SSE is reconnecting...")
        } else if (eventSource.readyState === EventSource.CLOSED) {
          console.log("[v0] SSE connection closed")
          eventSource.close()

          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (sessionId) {
              console.log("[v0] Attempting to reconnect SSE...")
              connectToSSE()
            }
          }, 3000)
        }
      }
    } catch (error) {
      console.error("[v0] Error creating EventSource:", error)
    }
  }

  const handleSendMessage = async (question: string) => {
    if (!question.trim() || !sessionId) return

    const userMessageId = uuidv4()
    setChatMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        text: `<div class="text-foreground/90">${question}</div>`,
        timestamp: Date.now(),
      },
    ])

    setIsLoading(true)
    try {
      const response = await fetch("https://n8n-1-114-4-docker-image.onrender.com/webhook/tarot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: {
            question,
            sessionId,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setChatMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          text: '<div class="text-red-400">Failed to send message. Please try again.</div>',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewReading = () => {
    // Close existing SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    initializeSession()
  }

  return (
    <main className="h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 flex flex-col lg:flex-row overflow-hidden">
      {/* Top/Left - Chat Interface */}
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-hidden">
        <ChatInterface
          messages={chatMessages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onNewReading={handleNewReading}
        />
      </div>

      {/* Bottom/Right - Spread Viewer */}
      <div className="flex-1 flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-card/30 backdrop-blur-sm overflow-hidden">
        <SpreadViewer spreadHtml={spreadHtml} sessionId={sessionId} />
      </div>
    </main>
  )
}
