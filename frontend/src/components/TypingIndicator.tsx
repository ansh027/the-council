interface Props {
  agentTitle: string
  agentColor: string
}

export function TypingIndicator({ agentTitle, agentColor }: Props) {
  return (
    <div className="flex items-center gap-3 p-4 mb-4 opacity-75">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: agentColor }}
      />
      <span className="text-zinc-500 text-sm">{agentTitle} is thinking</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
