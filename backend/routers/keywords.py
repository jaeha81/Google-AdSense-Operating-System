from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Keyword

router = APIRouter(prefix="/api/keywords", tags=["keywords"])


class KeywordCreate(BaseModel):
    keyword: str
    cpc: float = 0.0
    search_volume: int = 0
    competition: str = "medium"
    category: str = ""
    site_id: Optional[int] = None


class KeywordUpdate(BaseModel):
    keyword: Optional[str] = None
    cpc: Optional[float] = None
    search_volume: Optional[int] = None
    competition: Optional[str] = None
    category: Optional[str] = None
    site_id: Optional[int] = None


@router.get("/")
def list_keywords(db: Session = Depends(get_db)):
    return db.query(Keyword).order_by(Keyword.cpc.desc()).all()


@router.post("/")
def create_keyword(data: KeywordCreate, db: Session = Depends(get_db)):
    kw = Keyword(**data.model_dump())
    db.add(kw)
    db.commit()
    db.refresh(kw)
    return kw


@router.post("/bulk")
def bulk_create_keywords(items: list[KeywordCreate], db: Session = Depends(get_db)):
    keywords = [Keyword(**item.model_dump()) for item in items]
    db.add_all(keywords)
    db.commit()
    return {"created": len(keywords)}


@router.patch("/{kw_id}")
def update_keyword(kw_id: int, data: KeywordUpdate, db: Session = Depends(get_db)):
    kw = db.query(Keyword).filter(Keyword.id == kw_id).first()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(kw, k, v)
    db.commit()
    db.refresh(kw)
    return kw


@router.delete("/{kw_id}")
def delete_keyword(kw_id: int, db: Session = Depends(get_db)):
    kw = db.query(Keyword).filter(Keyword.id == kw_id).first()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    db.delete(kw)
    db.commit()
    return {"ok": True}
