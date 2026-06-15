from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import OsmuItem

router = APIRouter(prefix="/api/osmu", tags=["osmu"])

PLATFORMS = ["naver_blog", "tistory", "youtube_shorts", "instagram", "kakao", "threads"]


class OsmuCreate(BaseModel):
    title: str
    source: str = "blog"
    naver_blog: int = 0
    tistory: int = 0
    youtube_shorts: int = 0
    instagram: int = 0
    kakao: int = 0
    threads: int = 0
    notes: str = ""


class OsmuUpdate(BaseModel):
    title: Optional[str] = None
    naver_blog: Optional[int] = None
    tistory: Optional[int] = None
    youtube_shorts: Optional[int] = None
    instagram: Optional[int] = None
    kakao: Optional[int] = None
    threads: Optional[int] = None
    notes: Optional[str] = None


@router.get("/")
def list_osmu(db: Session = Depends(get_db)):
    return db.query(OsmuItem).order_by(OsmuItem.created_at.desc()).all()


@router.get("/summary")
def osmu_summary(db: Session = Depends(get_db)):
    items = db.query(OsmuItem).all()
    total = len(items)
    platform_counts = {p: sum(getattr(i, p) for i in items) for p in PLATFORMS}
    total_distributions = sum(platform_counts.values())
    avg_platforms = round(total_distributions / total, 1) if total else 0
    return {
        "total_items": total,
        "total_distributions": total_distributions,
        "avg_platforms_per_item": avg_platforms,
        "platform_counts": platform_counts,
    }


@router.post("/")
def create_osmu(data: OsmuCreate, db: Session = Depends(get_db)):
    item = OsmuItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}")
def update_osmu(item_id: int, data: OsmuUpdate, db: Session = Depends(get_db)):
    item = db.query(OsmuItem).filter(OsmuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="OSMU item not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_osmu(item_id: int, db: Session = Depends(get_db)):
    item = db.query(OsmuItem).filter(OsmuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="OSMU item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
