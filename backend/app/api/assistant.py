from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.assistant_service import chat_stream

router = APIRouter(prefix="/assistant", tags=["assistant"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


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