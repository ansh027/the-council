"use client"
import { AgentMessage } from "@/lib/types"

interface Props {
  message: AgentMessage
  isActive: boolean
}

export function AgentCard({ message, isActive }: Props) {
  return (
    <div
      className={`rounded-xl mb-4 bg-zinc-900/70 border border-zinc-800/60 overflow-hidden transition-all duration-300 ${
        isActive ? "border-l-0" : ""
      }`}
      style={isActive ? { borderLeft: `3px solid ${message.agent_color}` } : { borderLeft: `3px solid ${message.agent_color}40` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800/40">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "animate-pulse" : ""}`}
            style={{ backgroundColor: isActive ? message.agent_color : `${message.agent_color}80` }}
          />
          <span
            className="font-bold text-xs tracking-widest uppercase"
            style={{ color: message.agent_color }}
          >
            {message.agent_title}
          </span>
          <span className="text-zinc-600 text-xs">{message.round}</span>
        </div>
        {message.model_used && (
          <ProviderBadge model={message.model_used} isFallback={message.is_fallback} />
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
          {isActive && (
            <span
              className="inline-block w-[2px] h-[14px] ml-0.5 align-middle cursor-blink"
              style={{ backgroundColor: message.agent_color }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ProviderBadge({ model, isFallback }: { model: string; isFallback: boolean }) {
  const { label, classes } = getBadgeProps(model, isFallback)

  return (
    <span className={`text-[10px] font-mono border rounded-md px-2 py-0.5 tracking-wide ${classes}`}>
      {label}
    </span>
  )
}

function getBadgeProps(model: string, isFallback: boolean) {
  if (isFallback) return { label: "FALLBACK",  classes: "text-red-400 border-red-500/40 bg-red-950/30" }
  if (model.includes("opus"))   return { label: "OPUS",    classes: "text-purple-400 border-purple-500/40 bg-purple-950/30" }
  if (model.includes("sonnet")) return { label: "SONNET",  classes: "text-blue-400 border-blue-500/40 bg-blue-950/30" }
  if (model.includes("haiku"))  return { label: "HAIKU",   classes: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30" }
  return { label: model.toUpperCase(), classes: "text-zinc-400 border-zinc-600 bg-zinc-800/30" }
}
