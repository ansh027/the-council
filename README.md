# The Council

> **Five AI experts debate your idea. One verdict.**

The Council is an AI debate platform where five specialized expert personas argue about your business idea, startup decision, or strategic question — in real time, with streaming tokens and a structured final verdict.

Built for the **DevNetwork AI & ML Hackathon 2026**.

---

## The Problem

Every AI tool gives you one answer. One perspective. One voice.

But real decisions — the ones that matter — were made in rooms where smart people *disagreed* with each other. Where someone pushed back. Where the fatal assumption got named before it cost you everything.

For a founder about to pitch investors. For a product manager deciding what to build next. For anyone who's ever wished they had a room of smart, honest advisors before making a call they can't take back.

The Council brings that room to anyone with an idea.

---

## How It Works

1. **Submit your idea** — a startup concept, a business decision, a strategic question (up to 500 characters)
2. **The Council convenes** — five AI agents debate it across 7 sequential turns, each reading the *full conversation* before responding
3. **Positions evolve** — agents acknowledge strong counter-arguments rather than just answering the original question
4. **The Arbiter delivers a verdict** — structured, decisive, with an opportunity score and concrete recommendation

---

## The Five Council Members

| Agent | Color | Role |
|---|---|---|
| **The Skeptic** | 🔴 Red | Finds the fatal assumption and hammers it. Short, punchy, adversarial. |
| **The Strategist** | 🟢 Green | Finds the market angle others miss. Pattern recognition across a hundred markets. |
| **The Economist** | 🔵 Blue | Thinks only in unit economics. CAC, LTV, margin, payback — every claim needs a number. |
| **The Contrarian** | 🟡 Amber | Finds the failure mode nobody imagined. Non-obvious, second-order, historically grounded. |
| **The Arbiter** | 🟣 Purple | Reads the full debate. Delivers the final structured verdict. Decisive and final. |

### Debate Order (7 turns)

```
Skeptic (R1) → Strategist (R1) → Economist (R1) → Contrarian (R1)
→ Skeptic (R2) → Strategist (R2) → Arbiter (Final Verdict)
```

### The Verdict Format

```
OPPORTUNITY SCORE: [X/10 with rationale]
BIGGEST RISK: [Specific, concrete]
BIGGEST OPPORTUNITY: [The most compelling upside]
THE ONE THING TO VALIDATE FIRST: [Single question to answer before spending another dollar]
COUNCIL VERDICT: Go / Go with conditions / Don't go
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│   Landing Page → Question Input → Debate Page (streaming)   │
└────────────────────────┬────────────────────────────────────┘
                         │ WebSocket (wss://)
┌────────────────────────▼────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│                                                             │
│   /ws/debate ─→ orchestrator.py ─→ agents (sequential)     │
│                       │                                     │
│                   llm.py (cascade)                          │
│                       │                                     │
│         Claude Opus 4 ──┤                                    │
│         Claude Sonnet 4 ┤  (25s timeout per attempt)        │
│         Claude Haiku 4 ─┤                                    │
│         Fallback ───────┘  (persona-accurate, always runs)  │
└─────────────────────────────────────────────────────────────┘
```

### Resilience Cascade

Every agent turn runs through a 3-tier cascade with 25-second timeouts:

1. **Claude Opus** — primary, highest quality
2. **Claude Sonnet** — auto-triggered on Opus timeout or error
3. **Claude Haiku** — auto-triggered on Sonnet failure
4. **Persona-accurate fallback** — pre-written in each agent's voice, streamed word-by-word

The user sees a provider badge change. The debate never stops. No error states. No broken UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, WebSockets |
| LLM | Anthropic Claude API (Opus / Sonnet / Haiku) |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Deployment | Railway (backend), Vercel (frontend) |

---

## Project Structure

```
the-council/
├── backend/
│   ├── agents.py          # 5 agent configs with system prompts
│   ├── llm.py             # Claude cascade logic (Opus → Sonnet → Haiku → fallback)
│   ├── orchestrator.py    # Debate loop + conversation history
│   ├── main.py            # FastAPI app (health + WebSocket endpoint)
│   ├── railway.toml       # Railway deployment config
│   ├── test_debate.py     # Terminal test — no server needed
│   ├── test_websocket.py  # WebSocket client test
│   ├── requirements.txt
│   └── .env.example       # ANTHROPIC_API_KEY template
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing page + question input
│   │   │   ├── debate/page.tsx    # Live streaming debate page
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── AgentCard.tsx      # Streaming agent response card
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── VerdictBlock.tsx   # Structured verdict renderer
│   │   └── lib/
│   │       ├── websocket.ts       # WebSocket manager
│   │       └── types.ts           # Shared TypeScript types
│   └── next.config.ts
├── .gitignore
└── README.md
```

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
DEV_MODE=false
```

> Set `DEV_MODE=true` to use Haiku-only during development (much faster and cheaper).

Start the server:
```bash
python main.py
```

Verify it's running:
```
GET http://localhost:8000/health
→ {"status": "ok", "service": "The Council"}
```

### Terminal Test (no frontend needed)

```bash
cd backend
python test_debate.py "Should I quit my job and build a startup?"
```

### WebSocket Test

```bash
# Terminal 1
python main.py

# Terminal 2
python test_websocket.py "Is Bitcoin still worth investing in?"
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Start the frontend:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

### Backend → Railway

1. Push repo to GitHub
2. Railway → New Project → Deploy from GitHub → select `backend/` as root directory
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy — Railway picks up `railway.toml` automatically
5. Copy your Railway URL (e.g. `https://the-council-xxx.railway.app`)

### Frontend → Vercel

1. Vercel → New Project → Import from GitHub → Root Directory: `frontend/`
2. Add environment variable:
   ```
   NEXT_PUBLIC_WS_URL=wss://the-council-xxx.railway.app
   ```
   > **Important:** Use `wss://` (not `ws://`) — browsers block unencrypted WebSockets on HTTPS pages.
3. Deploy

---

## Demo Questions

These questions are pre-loaded on the landing page:

- *"Should I quit my job and build a startup in 2026?"*
- *"Is Bitcoin still a good investment or is it too late?"*
- *"I want to build an AI tutoring product for students in Nepal"*
- *"Should I raise a seed round or stay bootstrapped?"*
- *"Is starting a YouTube channel still worth it in 2026?"*

---

## How It Works Under the Hood

**The single thing that makes or breaks this project:** prompt quality. Agents sounding genuinely different. Agents actually talking to each other.

The key engineering decisions that deliver this:

1. **Full conversation history** — every agent reads the complete debate before responding, not just the original question
2. **Position-evolution rule** — agents are explicitly instructed to acknowledge strong counter-arguments
3. **Cross-referencing mandate** — The Strategist, Economist, and Contrarian are instructed to name prior agents' arguments before presenting their own
4. **Locked personalities** — system prompts define voice, sentence structure, and thinking style, not just topic focus
5. **Resilience cascade** — Opus → Sonnet → Haiku → persona-accurate fallback ensures the debate always completes, regardless of API latency or rate limits

---

## License

MIT

---

*The Council. Every important decision deserves one.*
