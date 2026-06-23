"""
Sakana AI Fugu - OpenAI-compatible client
Model: fugu  (use fugu-ultra for the most capable version)
API base: https://api.sakana.ai/v1

Reads credentials from .env (SAKANA_API_KEY).
"""

import os
from openai import OpenAI

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_URL = "https://api.sakana.ai/v1"
API_KEY = os.environ.get("SAKANA_API_KEY", "")


def get_client() -> OpenAI:
    if not API_KEY:
        raise ValueError("Set the SAKANA_API_KEY environment variable first.")
    return OpenAI(api_key=API_KEY, base_url=BASE_URL)


def ask(prompt: str, model: str = "fugu") -> str:
    client = get_client()
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        timeout=120.0,
    )
    return response.choices[0].message.content


def ask_stream(prompt: str, model: str = "fugu") -> None:
    client = get_client()
    stream = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        stream=True,
        timeout=120.0,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            print(delta, end="", flush=True)
    print()


if __name__ == "__main__":
    print(ask("How many r in word strawberry"))
