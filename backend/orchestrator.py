"""
orchestrator.py — Debate Loop
Runs agents sequentially across rounds. Each agent sees full debate history.
"""

import asyncio
from typing import AsyncGenerator
from agents import AGENTS, get_agent
from llm import stream_agent_response

# Full debate order — 7 turns total
DEBATE_ORDER = [
    ("skeptic",    "Round 1"),
    ("strategist", "Round 1"),
    ("economist",  "Round 1"),
    ("contrarian", "Round 1"),
    ("skeptic",    "Round 2"),
    ("strategist", "Round 2"),
    ("arbiter",    "Final"),
]

async def run_debate(question: str) -> AsyncGenerator[dict, None]:
    if not question or not question.strip():
        yield {"type": "error", "message": "Question cannot be empty."}
        return

    if len(question) > 500:
        yield {"type": "error", "message": "Question must be 500 characters or less."}
        return

    conversation_history: list[dict] = []

    initial_user_message = (
        f"The council has been convened to debate the following:\n\n"
        f"\"{question}\"\n\n"
        f"Each council member will now speak in turn."
    )
    conversation_history.append({"role": "user", "content": initial_user_message})

    for agent_id, round_label in DEBATE_ORDER:
        agent_config = next(a for a in AGENTS if a["id"] == agent_id)
        agent_title = agent_config["title"]
        agent_color = agent_config["color"]

        yield {
            "type": "agent_start",
            "agent_id": agent_id,
            "agent_title": agent_title,
            "agent_color": agent_color,
            "round": round_label,
        }

        # Build turn instruction
        if agent_id == "arbiter":
            turn_instruction = (
                f"The council debate is now complete. "
                f"As The Arbiter, you have read every argument above. "
                f"Deliver your final synthesis and structured verdict now. "
                f"You MUST reference each council member by their exact title."
            )
        elif round_label == "Round 2":
            turn_instruction = (
                f"This is Round 2. It is {agent_title}'s turn to respond directly. "
                f"You MUST quote or reference a specific argument made in Round 1 "
                f"by another council member and either attack it, defend against it, "
                f"or build on it. Do not repeat your Round 1 position — advance the debate."
            )
        else:
            prior_context = ""
            if len(conversation_history) > 1:
                prior_context = (
                    " You MUST directly acknowledge or quote a specific argument "
                    "made by a previous council member before presenting your own position."
                )
            turn_instruction = (
                f"It is now {agent_title}'s turn to speak in Round 1.{prior_context} "
                f"Respond in character as {agent_title}."
            )

        conversation_history.append({"role": "user", "content": turn_instruction})

        full_response = ""
        model_used = "unknown"
        is_fallback = False

        async for event in stream_agent_response(
            agent_id=agent_id,
            system_prompt=agent_config["system_prompt"],
            messages=conversation_history,
            fallback_text=agent_config["fallback_opening"],
        ):
            if event["type"] == "token":
                full_response += event["content"]
                model_used = event["model"]
                yield {
                    "type": "token",
                    "agent_id": agent_id,
                    "agent_title": agent_title,
                    "agent_color": agent_color,
                    "content": event["content"],
                    "model": event["model"],
                }
            elif event["type"] == "done":
                model_used = event["model"]
                is_fallback = event["is_fallback"]

        conversation_history.append({"role": "assistant", "content": full_response})

        yield {
            "type": "agent_end",
            "agent_id": agent_id,
            "agent_title": agent_title,
            "round": round_label,
            "model_used": model_used,
            "is_fallback": is_fallback,
        }

        await asyncio.sleep(0.1)

    yield {"type": "debate_complete"}
