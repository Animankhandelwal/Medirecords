"""Provider-agnostic LLM access, built on LlamaIndex's unified LLM interface.

Every call site picks a provider by name ("anthropic" | "groq" | "gemini") or
falls back to settings.LLM_PROVIDER. Swapping providers means passing a
different string — no other code changes.
"""
from typing import Generator, Optional
from llama_index.core.llms import LLM, ChatMessage, MessageRole
from app.core.config import settings


def get_llm(provider: Optional[str] = None, max_tokens: int = 2000) -> LLM:
    provider = (provider or settings.LLM_PROVIDER).lower()

    if provider == "anthropic":
        from llama_index.llms.anthropic import Anthropic
        return Anthropic(
            model=settings.ANTHROPIC_MODEL,
            api_key=settings.ANTHROPIC_API_KEY,
            max_tokens=max_tokens,
        )

    if provider == "groq":
        from llama_index.llms.groq import Groq
        return Groq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            max_tokens=max_tokens,
        )

    if provider == "gemini":
        from llama_index.llms.google_genai import GoogleGenAI
        return GoogleGenAI(
            model=settings.GEMINI_MODEL,
            api_key=settings.GOOGLE_API_KEY,
            max_tokens=max_tokens,
        )

    raise ValueError(f"Unknown LLM provider: {provider}")


def _to_chat_messages(messages: list[dict], system: Optional[str]) -> list[ChatMessage]:
    chat_messages = []
    if system:
        chat_messages.append(ChatMessage(role=MessageRole.SYSTEM, content=system))
    for m in messages:
        role = MessageRole.ASSISTANT if m["role"] == "assistant" else MessageRole.USER
        chat_messages.append(ChatMessage(role=role, content=m["content"]))
    return chat_messages


def complete(
    prompt: str,
    system: Optional[str] = None,
    max_tokens: int = 2000,
    provider: Optional[str] = None,
) -> str:
    """Single-turn completion, e.g. structured extraction or report generation."""
    llm = get_llm(provider, max_tokens)
    messages = _to_chat_messages([{"role": "user", "content": prompt}], system)
    return llm.chat(messages).message.content


def stream_complete(
    prompt: str,
    system: Optional[str] = None,
    max_tokens: int = 2000,
    provider: Optional[str] = None,
) -> Generator[str, None, None]:
    """Single-turn streaming completion."""
    llm = get_llm(provider, max_tokens)
    messages = _to_chat_messages([{"role": "user", "content": prompt}], system)
    for chunk in llm.stream_chat(messages):
        if chunk.delta:
            yield chunk.delta


def chat_stream(
    messages: list[dict],
    system: Optional[str] = None,
    max_tokens: int = 2000,
    provider: Optional[str] = None,
) -> Generator[str, None, None]:
    """Multi-turn streaming chat. messages: [{"role": "user"|"assistant", "content": str}, ...]"""
    llm = get_llm(provider, max_tokens)
    chat_messages = _to_chat_messages(messages, system)
    for chunk in llm.stream_chat(chat_messages):
        if chunk.delta:
            yield chunk.delta