"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const DEMO_QUESTIONS = [
  "Should I quit my job and build a startup in 2026?",
  "Is Bitcoin still a good investment or is it too late?",
  "I want to build an AI tutoring product for students in Nepal",
  "Should I raise a seed round or stay bootstrapped?",
  "Is starting a YouTube channel still worth it in 2026?",
]

const COUNCIL_MEMBERS = [
  { id: "skeptic",    title: "The Skeptic",    color: "#EF4444", role: "Finds the fatal assumption and hammers it" },
  { id: "strategist", title: "The Strategist", color: "#10B981", role: "Finds the market angle others miss" },
  { id: "economist",  title: "The Economist",  color: "#3B82F6", role: "Thinks only in unit economics" },
  { id: "contrarian", title: "The Contrarian", color: "#F59E0B", role: "Names the failure mode nobody imagined" },
  { id: "arbiter",    title: "The Arbiter",    color: "#8B5CF6", role: "Reads everything. Delivers the final verdict" },
]

export default function Home() {
  const [question, setQuestion] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const submit = () => {
    const q = question.trim()
    if (!q) return
    router.push(`/debate?q=${encodeURIComponent(q)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-64 -left-64 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-64 -right-64 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, #EF4444 0%, transparent 70%)" }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-zinc-900/60">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {COUNCIL_MEMBERS.map((m) => (
              <div
                key={m.id}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: m.color }}
              />
            ))}
          </div>
          <span className="text-zinc-400 text-sm font-medium tracking-wide ml-1">The Council</span>
        </div>
        <div className="text-zinc-600 text-xs tracking-widest uppercase">AI Advisory Panel</div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div
          className="text-center mb-12"
          style={{ opacity: isMounted ? 1 : 0, transition: "opacity 0.6s ease" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 rounded-full px-4 py-1.5 text-xs text-zinc-400 tracking-wide mb-8 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Five experts. One verdict.
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white mb-5 leading-none">
            The Council
          </h1>

          {/* Subtitle */}
          <p className="text-zinc-400 text-xl max-w-lg mx-auto leading-relaxed">
            Submit your idea. Five AI advisors debate it in real time.
            <br />
            <span className="text-zinc-500">Get a verdict you can act on.</span>
          </p>
        </div>

        {/* Input card */}
        <div
          className="w-full max-w-2xl"
          style={{ opacity: isMounted ? 1 : 0, transition: "opacity 0.6s ease 0.15s" }}
        >
          <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 backdrop-blur-sm shadow-2xl">
            <textarea
              id="question-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your idea, startup, or decision…"
              maxLength={500}
              rows={3}
              className="w-full bg-transparent px-5 pt-4 pb-2 text-white placeholder-zinc-600 resize-none focus:outline-none text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-zinc-600 text-xs font-mono tabular-nums">
                {question.length}/500
              </span>
              <button
                id="submit-btn"
                onClick={submit}
                disabled={!question.trim()}
                className="flex items-center gap-2 bg-white text-black font-semibold px-5 py-2 rounded-lg text-sm hover:bg-zinc-100 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
              >
                Convene The Council
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Demo questions */}
          <div className="mt-5">
            <div className="text-zinc-700 text-xs uppercase tracking-widest mb-3">Try an example</div>
            <div className="flex flex-col gap-1.5">
              {DEMO_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="text-left text-zinc-500 text-sm hover:text-zinc-200 transition-colors duration-150 px-1 py-0.5 rounded leading-snug"
                >
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Council members strip */}
      <section className="relative z-10 border-t border-zinc-900/80 px-8 py-8 mt-auto">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {COUNCIL_MEMBERS.map((m) => (
              <div key={m.id} className="group">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform duration-200"
                    style={{ backgroundColor: m.color }}
                  />
                  <span
                    className="text-xs font-bold tracking-wide"
                    style={{ color: m.color }}
                  >
                    {m.title}
                  </span>
                </div>
                <p className="text-zinc-600 text-xs leading-snug pl-4">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
