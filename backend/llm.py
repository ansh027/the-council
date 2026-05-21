"""
llm.py — Claude Cascade Logic
Opus → Sonnet → Haiku → Persona-accurate fallback
25-second timeout per attempt. Never fails silently.
"""

import asyncio
import anthropic
import os
from typing import AsyncGenerator

DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

# Model cascade order — Opus first (highest quality), Sonnet, Haiku
MODELS = (
    ["claude-haiku-4-5-20251001"]
    if DEV_MODE else
    ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"]
)


TIMEOUT_SECONDS = 25.0

# Initialize Anthropic client (reads ANTHROPIC_API_KEY from env)
client = anthropic.AsyncAnthropic()


async def stream_agent_response(
    agent_id: str,
    system_prompt: str,
    messages: list[dict],
    fallback_text: str,
) -> AsyncGenerator[dict, None]:
    """
    Stream a response for a given agent, cascading through models on failure.

    Yields dicts of shape:
      {"type": "token", "content": str, "model": str, "is_fallback": False}
      {"type": "done", "model": str, "is_fallback": bool}
    """
    last_error = None

    for model in MODELS:
        try:
            print(f"[LLM] Serving {agent_id} with {model}")

            async with asyncio.timeout(TIMEOUT_SECONDS):
                async with client.messages.stream(
                    model=model,
                    max_tokens=800 if agent_id == "arbiter" else (600 if model == "claude-opus-4-6" else 500),
                    system=system_prompt,
                    messages=messages,
                ) as stream:
                    async for text in stream.text_stream:
                        yield {"type": "token", "content": text, "model": model, "is_fallback": False}

                    yield {"type": "done", "model": model, "is_fallback": False}
                    return  # Success — stop cascade

        except asyncio.TimeoutError:
            last_error = f"Timeout on {model}"
            print(f"[LLM] [WARN] Timeout on {model} for {agent_id} — cascading")
            continue

        except anthropic.RateLimitError:
            print(f"[RATE LIMIT] {model} — dropping to next tier")
            await asyncio.sleep(2)
            continue

        except anthropic.APIStatusError as e:
            last_error = f"API error on {model}: {e.status_code}"
            print(f"[LLM] [ERROR] API error on {model} for {agent_id}: {e.status_code}")
            print(f"[LLM] [ERROR] Full message: {e.message}")
            print(f"[LLM] [ERROR] Response body: {e.body}")
            print(f"[LLM] [ERROR] — cascading to next model")
            continue

        except anthropic.APIConnectionError as e:
            last_error = f"Connection error on {model}: {e}"
            print(f"[LLM] [WARN] Connection error on {model} for {agent_id} — cascading")
            continue

        except Exception as e:
            last_error = f"Unexpected error on {model}: {e}"
            print(f"[LLM] [WARN] Unexpected error on {model} for {agent_id}: {e} — cascading")
            continue

    # All models failed — serve persona-accurate fallback word by word
    print(f"[LLM] [WARN] All models failed for {agent_id}. Serving fallback. Last error: {last_error}")
    words = fallback_text.split(" ")
    for i, word in enumerate(words):
        token = word if i == 0 else " " + word
        yield {"type": "token", "content": token, "model": "fallback", "is_fallback": True}
        await asyncio.sleep(0.03)  # Simulate natural streaming speed

    yield {"type": "done", "model": "fallback", "is_fallback": True}
