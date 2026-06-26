from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.assistant_service import chat_stream, suggest_specialist
from app.core import llm_orchestrator

router = APIRouter(prefix="/assistant", tags=["assistant"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class SpecialistSuggestion(BaseModel):
    specialist_type: str
    reasoning: str
    urgency: str
    summary_for_doctor: str


@router.post("/chat")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    def generate():
        for chunk in chat_stream(current_user, db, messages):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain")


_EXPLAIN_PROMPTS = {
    "lab_test": (
        "Explain what the \"{term}\" lab test measures in plain English for a patient with no medical background. "
        "Cover: (1) what it measures, (2) why doctors order it, (3) what high or low values generally mean. "
        "Use warm, clear language. Keep it under 90 words. Write in flowing sentences, no bullet points."
    ),
    "diagnosis": (
        "Explain what \"{term}\" means in plain English for a patient who has just received this diagnosis. "
        "Cover: (1) what this condition is, (2) how it affects the body day-to-day, (3) a brief reassuring note about how it is typically managed. "
        "Use empathetic, clear language. Keep it under 110 words. Write in flowing sentences, no bullet points."
    ),
}


@router.get("/explain")
def explain_term(
    term: str = Query(..., min_length=1, max_length=200),
    type: str = Query(..., pattern="^(lab_test|diagnosis)$"),
    current_user: User = Depends(get_current_user),
):
    """Return a plain-language explanation of a lab test or diagnosis."""
    prompt_template = _EXPLAIN_PROMPTS.get(type)
    if not prompt_template:
        raise HTTPException(400, "type must be 'lab_test' or 'diagnosis'")
    prompt = prompt_template.format(term=term)
    try:
        explanation = llm_orchestrator.complete(prompt, max_tokens=200)
    except Exception as exc:
        raise HTTPException(503, f"LLM unavailable: {exc}") from exc
    return {"term": term, "type": type, "explanation": explanation.strip()}


@router.post("/suggest-specialist", response_model=SpecialistSuggestion)
def suggest_specialist_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = [{"role": m.role, "content": m.content} for m in request.messages if m.content.strip()]
    if not messages:
        raise HTTPException(status_code=400, detail="Conversation is empty")
    return suggest_specialist(current_user, db, messages)