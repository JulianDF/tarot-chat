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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastProcessedIdRef = useRef<Set<string>>(new Set())

  // Initialize session
  useEffect(() => {
    initializeSession()
  }, [])

  useEffect(() => {
    if (sessionId) {
      startPolling()
    }

    return () => {
      stopPolling()
    }
  }, [sessionId])

  const initializeSession = () => {
    const newSessionId = uuidv4()
    setSessionId(newSessionId)
    setChatMessages([])
    setSpreadHtml("")
    lastProcessedIdRef.current.clear()
  }

  const startPolling = () => {
    console.log("[v0] Starting polling for session:", sessionId)

    stopPolling() // Clear any existing interval

    const poll = async () => {
      try {
        const response = await fetch(`/api/messages/${sessionId}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const data = await response.json()

        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach((message: any) => {
            // Only process each message once
            if (!lastProcessedIdRef.current.has(message.id)) {
              lastProcessedIdRef.current.add(message.id)

              // Handle chat messages
              if (message.text) {
                setChatMessages((prev) => [
                  ...prev,
                  {
                    id: message.id,
                    text: message.text,
                    timestamp: message.timestamp,
                  },
                ])
              }

              // Handle spread HTML
              if (message.spread_html) {
                setSpreadHtml(message.spread_html)
              }
            }
          })
        }
      } catch (error) {
        console.error("[v0] Polling error:", error)
      }
    }

    // Poll immediately, then every second
    poll()
    pollingIntervalRef.current = setInterval(poll, 1000)
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
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
    stopPolling()
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
