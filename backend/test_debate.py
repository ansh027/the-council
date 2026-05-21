"""
test_debate.py — Day 2 Terminal Test
Runs a full debate and prints it to the terminal.
Usage: python test_debate.py
"""

import asyncio
import sys
import os

# Add backend dir to path
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from orchestrator import run_debate


async def test(question: str):
    print("\n" + "=" * 60)
    print(f"QUESTION: {question}")
    print("=" * 60)

    async for message in run_debate(question):
        if message["type"] == "token":
            print(message["content"], end="", flush=True)

        elif message["type"] == "agent_start":
            color_codes = {
                "#EF4444": "\033[91m",  # Red
                "#10B981": "\033[92m",  # Green
                "#3B82F6": "\033[94m",  # Blue
                "#F59E0B": "\033[93m",  # Yellow
                "#8B5CF6": "\033[95m",  # Purple
            }
            reset = "\033[0m"
            color = color_codes.get(message["agent_color"], "")
            print(f"\n\n{color}{'='*50}{reset}")
            print(f"{color}{message['agent_title']} — {message['round']}{reset}")
            print(f"{color}{'='*50}{reset}")

        elif message["type"] == "agent_end":
            model = message["model_used"]
            fallback = " [FALLBACK]" if message["is_fallback"] else ""
            print(f"\n\n\033[90m[Model: {model}{fallback}]\033[0m")

        elif message["type"] == "debate_complete":
            print("\n\n" + "=" * 60)
            print("DEBATE COMPLETE")
            print("=" * 60)

        elif message["type"] == "error":
            print(f"\n\n[ERROR] {message['message']}")
            break


if __name__ == "__main__":
    # Run with a custom question or use default
    if len(sys.argv) > 1:
        q = " ".join(sys.argv[1:])
    else:
        q = "I want to build an AI tutoring app for students in Nepal"

    asyncio.run(test(q))
