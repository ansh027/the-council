"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createDebateSocket } from "@/lib/websocket"
import { AgentCard } from "@/components/AgentCard"
import { TypingIndicator } from "@/components/TypingIndicator"
import { VerdictBlock } from "@/components/VerdictBlock"
import { AgentMessage } from "@/lib/types"

const AGENT_ORDER = ["skeptic", "strategist", "economist", "contrarian", "arbiter"]
const TOTAL_AGENTS = AGENT_ORDER.length

function ProgressPips({ messages, currentAgentId }: { messages: AgentMessage[]; currentAgentId: string | null }) {
  const completedIds = new Set(messages.filter((m) => m.is_complete).map((m) => m.agent_id))
  const colors: Record<string, string> = {
    skeptic:    "#EF4444",
    strategist: "#10B981",
    economist:  "#3B82F6",
    contrarian: "#F59E0B",
    arbiter:    "#8B5CF6",
  }

  return (
    <div className="flex items-center gap-1.5">
      {AGENT_ORDER.map((id) => {
        const isDone    = completedIds.has(id)
        const isActive  = currentAgentId === id
        const color     = colors[id]
        return (
          <div
            key={id}
            title={id}
            className={`rounded-full transition-all duration-300 ${
              isDone    ? "w-2 h-2" :
              isActive  ? "w-3 h-3" :
              "w-2 h-2 opacity-25"
            }`}
            style={{ backgroundColor: color }}
          />
        )
      })}
    </div>
  )
}

function DebateContent() {
  const searchParams = useSearchParams()
  const question = searchParams.get("q") || ""

  const [messages, setMessages]             = useState<AgentMessage[]>([])
  const [currentAgent, setCurrentAgent]     = useState<{ id: string; title: string; color: string } | null>(null)
  const [currentModel, setCurrentModel]     = useState("Connecting…")
  const [isComplete, setIsComplete]         = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const bottomRef                           = useRef<HTMLDivElement>(null)
  const wsRef                               = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!question) return
    if (wsRef.current) wsRef.current.close()

    const ws = createDebateSocket(
      question,
      (msg) => {
        if (msg.type === "agent_start") {
          setCurrentAgent({ id: msg.agent_id, title: msg.agent_title, color: msg.agent_color })
          setMessages((prev) => [
            ...prev,
            {
              agent_id:    msg.agent_id,
              agent_title: msg.agent_title,
              agent_color: msg.agent_color,
              round:       msg.round,
              content:     "",
              model_used:  "",
              is_fallback: false,
              is_complete: false,
            },
          ])
        } else if (msg.type === "token") {
          setCurrentModel(
            msg.model.includes("opus")    ? "Claude Opus"    :
            msg.model.includes("sonnet")  ? "Claude Sonnet"  :
            msg.model.includes("haiku")   ? "Claude Haiku"   :
            "Degraded Mode"
          )
          setMessages((prev) =>
            prev.map((m, i) =>
              i === prev.length - 1
                ? { ...m, content: m.content + msg.content, model_used: msg.model }
                : m
            )
          )
        } else if (msg.type === "agent_end") {
          setCurrentAgent(null)
          setMessages((prev) =>
            prev.map((m, i) =>
              i === prev.length - 1
                ? { ...m, is_complete: true, is_fallback: msg.is_fallback }
                : m
            )
          )
        } else if (msg.type === "debate_complete") {
          setIsComplete(true)
          setCurrentAgent(null)
          setCurrentModel("Complete")
        } else if (msg.type === "error") {
          setError(msg.message)
          setCurrentAgent(null)
        }
      },
      (err) => {
        setError(err)
        setCurrentAgent(null)
      }
    )

    wsRef.current = ws
    return () => { ws.close(1000, "Component unmounting") }
  }, [question])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, currentAgent])

  const completedCount = messages.filter((m) => m.is_complete).length
  const progressPct = isComplete ? 100 : Math.round((completedCount / TOTAL_AGENTS) * 100)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60">
        {/* Progress bar */}
        <div className="h-0.5 bg-zinc-900">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: back + question */}
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="/"
              className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
              title="Back to home"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </a>
            <div className="min-w-0">
              <div className="text-xs tracking-widest text-zinc-600 uppercase mb-0.5">The Council</div>
              <div className="text-zinc-300 text-sm truncate">{question}</div>
            </div>
          </div>

          {/* Right: progress pips + model */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <ProgressPips messages={messages} currentAgentId={currentAgent?.id ?? null} />
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${
                isComplete  ? "bg-emerald-400" :
                error       ? "bg-red-400" :
                "bg-amber-400 animate-pulse"
              }`} />
              <span className="text-xs text-zinc-500 font-mono">{isComplete ? "Done" : error ? "Error" : currentModel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Debate feed */}
      <div className="max-w-3xl mx-auto px-5 py-8">

        {/* Error */}
        {error && (
          <div className="border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-6 bg-red-950/20 flex items-start gap-3">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span><strong>Connection error:</strong> {error}</span>
          </div>
        )}

        {/* Loading state */}
        {!error && messages.length === 0 && !currentAgent && (
          <div className="flex items-center gap-3 text-zinc-600 text-sm py-4">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" />
            Convening The Council…
          </div>
        )}

        {/* Agent cards */}
        {messages.map((msg, i) => (
          <div key={`${msg.agent_id}-${i}`} className="fade-slide-up">
            <AgentCard
              message={msg}
              isActive={!msg.is_complete && i === messages.length - 1}
            />
            {msg.agent_id === "arbiter" && msg.is_complete && (
              <VerdictBlock text={msg.content} />
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {currentAgent && (
          <TypingIndicator
            agentTitle={currentAgent.title}
            agentColor={currentAgent.color}
          />
        )}

        {/* Completion state */}
        {isComplete && (
          <div className="mt-12 text-center border-t border-zinc-800/60 pt-8">
            <div className="text-2xl mb-2">⚖</div>
            <p className="text-zinc-500 text-sm mb-6">The Council has delivered its verdict.</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-5 py-2.5 rounded-lg text-sm transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Submit another idea
            </a>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default function DebatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="flex items-center gap-2 text-zinc-600 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" />
            Loading…
          </div>
        </div>
      }
    >
      <DebateContent />
    </Suspense>
  )
}
