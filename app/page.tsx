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
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastProcessedIdRef = useRef<Set<string>>(new Set())

  // Initialize session
  useEffect(() => {
    initializeSession()
  }, [])

  // Set up polling for messages
  useEffect(() => {
    if (sessionId) {
      startPolling()
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
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

  const startPolling = () => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/messages?sessionId=${sessionId}`)

        if (!response.ok) {
          console.error("[v0] API response not ok:", response.status)
          return
        }

        const data = await response.json()

        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach((msg: any) => {
            // Only process each message once
            if (!lastProcessedIdRef.current.has(msg.id)) {
              lastProcessedIdRef.current.add(msg.id)

              if (msg.text) {
                setChatMessages((prev) => [
                  ...prev,
                  {
                    id: msg.id,
                    text: msg.text,
                    timestamp: msg.timestamp || Date.now(),
                  },
                ])
              }

              if (msg.spread_html) {
                setSpreadHtml(msg.spread_html)
              }
            }
          })
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.error("[v0] JSON parse error - response was not valid JSON")
        } else {
          console.error("[v0] Polling error:", error)
        }
      }
    }, 1000)
  }

  const handleSendMessage = async (question: string) => {
    if (!question.trim() || !sessionId) return

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
      // Add error message to chat
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
