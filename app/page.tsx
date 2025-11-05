"use client"

import { useState, useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import ChatInterface from "@/components/chat-interface"
import SpreadViewer from "@/components/spread-viewer"

export default function TarotApp() {
  const [sessionId, setSessionId] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; text: string; timestamp: number; role: "user" | "agent" }>
  >([])
  const [spreadHtml, setSpreadHtml] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
  }

  const startPolling = () => {
    console.log("[v0] Starting polling for session:", sessionId)

    stopPolling()

    const poll = async () => {
      try {
        const response = await fetch(`/api/messages/${sessionId}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const data = await response.json()

        console.log("[v0] Polled messages:", data.messages?.length || 0, "messages")

        if (data.messages && Array.isArray(data.messages)) {
          // Find the most recent spread_html
          const messagesWithSpread = data.messages.filter((m: any) => m.spread_html)
          if (messagesWithSpread.length > 0) {
            const latestSpread = messagesWithSpread[messagesWithSpread.length - 1]
            if (latestSpread.spread_html !== spreadHtml) {
              console.log("[v0] Setting spread HTML, length:", latestSpread.spread_html.length)
              setSpreadHtml(latestSpread.spread_html)
            }
          }

          const agentMessages = data.messages
            .filter((m: any) => m.text)
            .map((m: any) => ({
              id: m.id,
              text: m.text,
              timestamp: m.timestamp,
              role: "agent" as const,
            }))

          setChatMessages((prev) => {
            const userMessages = prev.filter((m) => m.role === "user")
            const allMessages = [...userMessages, ...agentMessages]
            // Sort by timestamp to maintain order
            allMessages.sort((a, b) => a.timestamp - b.timestamp)
            return allMessages
          })
        }
      } catch (error) {
        console.error("[v0] Polling error:", error)
      }
    }

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

    console.log("[v0] Sending message to n8n with sessionId:", sessionId)

    const userMessageId = uuidv4()
    setChatMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        text: question,
        timestamp: Date.now(),
        role: "user",
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

      console.log("[v0] n8n response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setChatMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          text: "Failed to send message. Please try again.",
          timestamp: Date.now(),
          role: "agent",
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
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-hidden">
        <ChatInterface
          messages={chatMessages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onNewReading={handleNewReading}
        />
      </div>

      <div className="flex-1 flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-card/30 backdrop-blur-sm overflow-hidden">
        <SpreadViewer spreadHtml={spreadHtml} sessionId={sessionId} />
      </div>
    </main>
  )
}
