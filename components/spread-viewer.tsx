"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Sparkles, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type Spread = {
  id: string
  html: string
  timestamp: number
}

interface SpreadViewerProps {
  spreads: Spread[]
  currentIndex: number
  onPrevious: () => void
  onNext: () => void
  sessionId: string
}

export default function SpreadViewer({ spreads, currentIndex, onPrevious, onNext, sessionId }: SpreadViewerProps) {
  const [copied, setCopied] = useState(false)

  const currentSpread = spreads[currentIndex]
  const spreadHtml = currentSpread?.html || ""

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (spreads.length <= 1) return

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        onPrevious()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        onNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [spreads.length, onPrevious, onNext])

  const handleCopy = async () => {
    if (spreadHtml) {
      await navigator.clipboard.writeText(spreadHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold">Reading Spread</h2>
              <p className="text-sm text-muted-foreground">Card layout & interpretation</p>
            </div>
          </div>
          {spreadHtml && (
            <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2 bg-transparent">
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Spread Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 relative">
        {spreadHtml && spreads.length > 1 && (
          <div className="sticky top-0 z-20 flex items-center justify-center gap-4 mb-6 pb-4">
            <Button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              variant="outline"
              size="sm"
              className="gap-1 bg-background/95 backdrop-blur-sm shadow-lg hover:bg-background"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground font-medium px-3 py-1.5 rounded-md bg-background/95 backdrop-blur-sm shadow-lg border border-border">
              {currentIndex + 1} of {spreads.length} readings
            </span>
            <Button
              onClick={onNext}
              disabled={currentIndex === spreads.length - 1}
              variant="outline"
              size="sm"
              className="gap-1 bg-background/95 backdrop-blur-sm shadow-lg hover:bg-background"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {!spreadHtml ? (
          <div className="h-full flex flex-col items-center justify-center text-center relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-40 brightness-125">
              <img
                src="/tarot-card-deck-stack-mystical.jpg"
                alt="Tarot deck placeholder"
                className="max-w-xs object-contain"
              />
            </div>
            <div className="relative z-10">
              <div className="p-4 rounded-full bg-primary/5 border border-primary/20 mb-4">
                <Sparkles className="w-8 h-8 text-primary/50" />
              </div>
              <h3 className="text-lg font-serif text-muted-foreground mb-2">No spread yet</h3>
              <p className="text-sm text-muted-foreground">Ask a question to receive your reading</p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <Card className="bg-gradient-to-br from-primary/20 via-primary/5 to-secondary/20 backdrop-blur-sm border-primary/30 overflow-hidden shadow-2xl relative">
              {/* Radial glow effect behind cards */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />
              <div
                className="spread-content prose prose-invert max-w-none p-8 [&_*]:max-w-full [&_img]:max-w-full [&_div]:max-w-full [&_table]:max-w-full relative z-10"
                dangerouslySetInnerHTML={{ __html: spreadHtml }}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
