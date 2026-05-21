/**
 * lib/websocket.ts — WebSocket manager for The Council debate stream
 */

export type DebateMessage =
  | { type: "agent_start"; agent_id: string; agent_title: string; agent_color: string; round: string }
  | { type: "token"; agent_id: string; agent_title: string; agent_color: string; content: string; model: string }
  | { type: "agent_end"; agent_id: string; agent_title: string; round: string; model_used: string; is_fallback: boolean }
  | { type: "debate_complete" }
  | { type: "error"; message: string }

/**
 * Creates and returns a WebSocket connection that streams the debate.
 * The caller is responsible for closing the socket when done.
 */
export function createDebateSocket(
  question: string,
  onMessage: (msg: DebateMessage) => void,
  onError: (err: string) => void
): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"
  const ws = new WebSocket(`${wsUrl}/ws/debate`)

  // Track whether the debate finished successfully so we can suppress
  // the spurious 1006 close code that fires when the server closes first.
  let debateCompleted = false

  ws.onopen = () => {
    ws.send(JSON.stringify({ question }))
  }

  ws.onmessage = (event) => {
    try {
      const data: DebateMessage = JSON.parse(event.data)
      onMessage(data)

      // Close the socket from our side immediately after debate_complete.
      // This ensures code 1000 (normal) rather than 1006 (abnormal).
      if (data.type === "debate_complete") {
        debateCompleted = true
        ws.close(1000, "Debate complete")
      }
    } catch {
      onError("Failed to parse server message")
    }
  }

  ws.onerror = () => {
    // onerror fires before onclose — defer error reporting to onclose
    // so we can check the close code and debateCompleted state together.
  }

  ws.onclose = (event) => {
    // Suppress close errors if the debate completed successfully —
    // the 1006 here is just the server-side connection teardown.
    if (debateCompleted) return

    // Code 1000 = normal closure; 1001 = going away (page navigation)
    if (event.code !== 1000 && event.code !== 1001) {
      onError(`Connection closed unexpectedly (code ${event.code})`)
    }
  }

  return ws
}
