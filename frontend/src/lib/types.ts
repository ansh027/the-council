/**
 * lib/types.ts — Shared TypeScript types for The Council frontend
 */

export interface AgentMessage {
  agent_id: string
  agent_title: string
  agent_color: string
  round: string
  content: string
  model_used: string
  is_fallback: boolean
  is_complete: boolean
}

export interface DebateState {
  question: string
  messages: AgentMessage[]
  current_agent: string | null
  current_model: string
  is_complete: boolean
  error: string | null
}
