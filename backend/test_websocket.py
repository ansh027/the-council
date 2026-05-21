import asyncio
import websockets
import json
import sys

async def test():
    # Always require an explicit argument — no silent default.
    # This ensures:
    #   python test_websocket.py ""            → sends ""  (tests empty-string validation)
    #   python test_websocket.py "$(python -c "print('a'*501)")"  → tests 500+ char validation
    if len(sys.argv) < 2:
        print("Usage: python test_websocket.py \"<question>\"")
        print("  Pass \"\" explicitly to test empty-string validation.")
        sys.exit(1)

    question = sys.argv[1]
    uri = "ws://localhost:8000/ws/debate"

    print(f"\n{'='*60}")
    print(f"CONNECTING TO: {uri}")
    print(f"QUESTION: {question!r}  (len={len(question)})")
    print(f"{'='*60}\n")

    async with websockets.connect(uri) as websocket:
        await websocket.send(json.dumps({"question": question}))

        while True:
            message = await websocket.recv()
            data = json.loads(message)

            if data["type"] == "token":
                print(data["content"], end="", flush=True)
            elif data["type"] == "agent_start":
                print(f"\n\n{'='*50}")
                print(f"{data['agent_title']} — {data['round']}")
                print(f"{'='*50}")
            elif data["type"] == "agent_end":
                print(f"\n[Model: {data['model_used']} | Fallback: {data['is_fallback']}]")
            elif data["type"] == "debate_complete":
                print("\n\nDEBATE COMPLETE VIA WEBSOCKET")
                break
            elif data["type"] == "error":
                print(f"\nERROR: {data['message']}")
                break

asyncio.run(test())
