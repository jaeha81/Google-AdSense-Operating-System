from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Site

router = APIRouter(prefix="/api/sites", tags=["sites"])


class SiteCreate(BaseModel):
    name: str
    url: str
    platform: str
    status: str = "pending"
    monthly_revenue: float = 0.0


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    platform: Optional[str] = None
    status: Optional[str] = None
    monthly_revenue: Optional[float] = None
    content_count: Optional[int] = None


@router.get("/")
def list_sites(db: Session = Depends(get_db)):
    return db.query(Site).order_by(Site.created_at.desc()).all()


@router.post("/")
def create_site(data: SiteCreate, db: Session = Depends(get_db)):
    site = Site(**data.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.patch("/{site_id}")
def update_site(site_id: int, data: SiteUpdate, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(site, k, v)
    db.commit()
    db.refresh(site)
    return site


@router.delete("/{site_id}")
def delete_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(site)
    db.commit()
    return {"ok": True}
