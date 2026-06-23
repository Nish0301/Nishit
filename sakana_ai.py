"""
Sakana AI Fugu - OpenAI-compatible client
Model: fugu-ultra
API base: https://api.sakana.ai/v1

Set env vars before running:
    export FUGU_API_KEY=your_api_key_here
    export FUGU_BASE_URL=https://api.sakana.ai  # optional, defaults below
"""

import os
from openai import OpenAI

FUGU_BASE_URL = os.environ.get("FUGU_BASE_URL", "https://api.sakana.ai").rstrip("/")
if not FUGU_BASE_URL.endswith("/v1"):
    FUGU_BASE_URL = f"{FUGU_BASE_URL}/v1"

FUGU_API_KEY = os.environ.get("FUGU_API_KEY", "")


def get_client() -> OpenAI:
    if not FUGU_API_KEY:
        raise ValueError("Set the FUGU_API_KEY environment variable first.")
    return OpenAI(api_key=FUGU_API_KEY, base_url=FUGU_BASE_URL)


def ask(prompt: str, model: str = "fugu-ultra", timeout: float = 120.0) -> str:
    client = get_client()
    response = client.responses.create(
        model=model,
        input=prompt,
        timeout=timeout,
    )
    return response.output_text


def ask_stream(prompt: str, model: str = "fugu-ultra") -> None:
    client = get_client()
    with client.responses.stream(model=model, input=prompt) as stream:
        for event in stream:
            if event.type == "response.output_text.delta":
                print(event.delta, end="", flush=True)
        print()


if __name__ == "__main__":
    print(ask("Hello! What can you do?"))
