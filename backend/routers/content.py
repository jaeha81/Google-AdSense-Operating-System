from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Content

router = APIRouter(prefix="/api/content", tags=["content"])


class ContentCreate(BaseModel):
    title: str
    keyword_id: Optional[int] = None
    site_id: Optional[int] = None
    body: str = ""
    status: str = "draft"
    word_count: int = 0


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    keyword_id: Optional[int] = None
    site_id: Optional[int] = None
    body: Optional[str] = None
    status: Optional[str] = None
    word_count: Optional[int] = None


@router.get("/")
def list_content(db: Session = Depends(get_db)):
    return db.query(Content).order_by(Content.created_at.desc()).all()


@router.post("/")
def create_content(data: ContentCreate, db: Session = Depends(get_db)):
    content = Content(**data.model_dump())
    db.add(content)
    db.commit()
    db.refresh(content)
    return content


@router.patch("/{content_id}")
def update_content(content_id: int, data: ContentUpdate, db: Session = Depends(get_db)):
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(content, k, v)
    db.commit()
    db.refresh(content)
    return content


@router.delete("/{content_id}")
def delete_content(content_id: int, db: Session = Depends(get_db)):
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    db.delete(content)
    db.commit()
    return {"ok": True}
