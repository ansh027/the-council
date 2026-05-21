interface VerdictData {
  opportunity_score: string
  biggest_risk: string
  biggest_opportunity: string
  one_thing: string
  verdict: string
}

function parseVerdict(text: string): VerdictData | null {
  try {
    // Each field may span multiple lines until the next ALL-CAPS label or end of string
    const score = text.match(/OPPORTUNITY SCORE:\s*(.+)/)?.[1]?.trim()
    const risk = text.match(/BIGGEST RISK:\s*(.+)/)?.[1]?.trim()
    const opportunity = text.match(/BIGGEST OPPORTUNITY:\s*(.+)/)?.[1]?.trim()
    const one_thing = text.match(/THE ONE THING[^:]*:\s*(.+)/)?.[1]?.trim()
    const verdict = text.match(/COUNCIL VERDICT:\s*(.+)/)?.[1]?.trim()

    if (!score || !risk || !opportunity || !one_thing || !verdict) return null

    return { opportunity_score: score, biggest_risk: risk, biggest_opportunity: opportunity, one_thing, verdict }
  } catch {
    return null
  }
}

const verdictStyle = (v: string) => {
  const lower = v.toLowerCase()
  if (lower.startsWith("don")) return "text-red-400 border-red-500 bg-red-950/20"
  if (lower.includes("condition")) return "text-amber-400 border-amber-500 bg-amber-950/20"
  return "text-emerald-400 border-emerald-500 bg-emerald-950/20"
}

export function VerdictBlock({ text }: { text: string }) {
  const data = parseVerdict(text)
  if (!data) return null

  return (
    <div className="mt-6 border border-purple-500/40 rounded-lg p-6 bg-purple-950/20">
      <div className="text-purple-400 text-xs tracking-widest uppercase font-bold mb-4">
        ⚖ Council Verdict
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Score */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <span className="text-zinc-500 text-sm">Opportunity Score</span>
          <span className="text-white font-bold">{data.opportunity_score}</span>
        </div>

        {/* Biggest Risk */}
        <div className="border-b border-zinc-800 pb-2">
          <div className="text-zinc-500 text-xs mb-1 uppercase tracking-wide">Biggest Risk</div>
          <div className="text-zinc-200 text-sm">{data.biggest_risk}</div>
        </div>

        {/* Biggest Opportunity */}
        <div className="border-b border-zinc-800 pb-2">
          <div className="text-zinc-500 text-xs mb-1 uppercase tracking-wide">Biggest Opportunity</div>
          <div className="text-zinc-200 text-sm">{data.biggest_opportunity}</div>
        </div>

        {/* One Thing to Validate */}
        <div className="border-b border-zinc-800 pb-2">
          <div className="text-zinc-500 text-xs mb-1 uppercase tracking-wide">Validate This First</div>
          <div className="text-zinc-200 text-sm">{data.one_thing}</div>
        </div>

        {/* Verdict */}
        <div className={`text-center text-base font-bold pt-2 border rounded px-4 py-3 ${verdictStyle(data.verdict)}`}>
          {data.verdict}
        </div>
      </div>
    </div>
  )
}
