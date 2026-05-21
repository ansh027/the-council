"""
main.py — FastAPI Application
Exposes:
  GET  /health         — health check
  POST /debate         — synchronous debate (for testing only)
  WS   /ws/debate      — WebSocket streaming debate (primary)
"""

import json
import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from orchestrator import run_debate

# Load .env before anything else
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate required environment variables on startup."""
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to backend/.env"
        )
    print("[Server] The Council backend is alive [OK]")
    yield
    print("[Server] Shutting down.")


app = FastAPI(
    title="The Council API",
    description="AI debate platform — five expert personas, one verdict.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow local frontend + production Vercel domain
# Note: CORSMiddleware does not support wildcard subdomains in allow_origins.
# Use allow_origin_regex to cover all *.vercel.app preview URLs.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://the-council.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/health")
@app.head("/health")
async def health():
    return {"status": "ok", "service": "The Council"}


# ---------------------------------------------------------------------------
# WebSocket Debate — Primary Endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws/debate")
async def websocket_debate(websocket: WebSocket):
    await websocket.accept()
    print(f"[WS] Client connected: {websocket.client}")

    try:
        # Receive the question from the client
        raw = await websocket.receive_text()
        data = json.loads(raw)
        question = data.get("question", "").strip()

        if not question:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Question cannot be empty."
            }))
            await websocket.close()
            return

        if len(question) > 500:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Question too long ({len(question)} chars). Max 500 characters."
            }))
            await websocket.close()
            return

        print(f"[WS] Debate starting for: {question[:80]}...")

        # Stream debate events to client
        async for event in run_debate(question):
            await websocket.send_text(json.dumps(event))

        # Explicitly close with code 1000 (normal) so client doesn't see 1006
        await websocket.close(code=1000, reason="Debate complete")
        print(f"[WS] Debate complete.")

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected mid-debate.")

    except json.JSONDecodeError:
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Invalid JSON. Expected: {\"question\": \"...\"}"
            }))
        except Exception:
            pass

    except Exception as e:
        print(f"[WS] Unexpected error: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Server error: {str(e)}"
            }))
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

