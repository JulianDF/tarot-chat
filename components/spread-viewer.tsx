"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Sparkles, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SpreadViewerProps {
  spreadHtml: string
  sessionId: string
}

export default function SpreadViewer({ spreadHtml, sessionId }: SpreadViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (spreadHtml) {
      await navigator.clipboard.writeText(spreadHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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
      <div className="flex-1 overflow-y-auto px-6 py-6">
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
            <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-sm border-border/50 overflow-hidden shadow-xl">
              <div
                className="spread-content prose prose-invert max-w-none p-8 [&_*]:max-w-full [&_img]:max-w-full [&_div]:max-w-full [&_table]:max-w-full"
                dangerouslySetInnerHTML={{ __html: spreadHtml }}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
