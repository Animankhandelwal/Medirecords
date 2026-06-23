from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.assistant_service import chat_stream, suggest_specialist

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