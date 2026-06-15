from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Revenue

router = APIRouter(prefix="/api/revenue", tags=["revenue"])


class RevenueCreate(BaseModel):
    site_id: int
    year: int
    month: int
    amount: float
    notes: str = ""


class RevenueUpdate(BaseModel):
    amount: Optional[float] = None
    notes: Optional[str] = None


@router.get("/")
def list_revenue(db: Session = Depends(get_db)):
    return db.query(Revenue).order_by(Revenue.year.desc(), Revenue.month.desc()).all()


@router.get("/summary")
def revenue_summary(db: Session = Depends(get_db)):
    total = db.query(func.sum(Revenue.amount)).scalar() or 0.0
    avg = db.query(func.avg(Revenue.amount)).scalar() or 0.0
    max_row = db.query(Revenue).order_by(Revenue.amount.desc()).first()
    return {
        "total": round(total, 2),
        "monthly_avg": round(avg, 2),
        "best_month": {
            "year": max_row.year if max_row else None,
            "month": max_row.month if max_row else None,
            "amount": max_row.amount if max_row else 0,
        },
    }


@router.post("/")
def create_revenue(data: RevenueCreate, db: Session = Depends(get_db)):
    rev = Revenue(**data.model_dump())
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev


@router.patch("/{rev_id}")
def update_revenue(rev_id: int, data: RevenueUpdate, db: Session = Depends(get_db)):
    rev = db.query(Revenue).filter(Revenue.id == rev_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Revenue record not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(rev, k, v)
    db.commit()
    db.refresh(rev)
    return rev


@router.delete("/{rev_id}")
def delete_revenue(rev_id: int, db: Session = Depends(get_db)):
    rev = db.query(Revenue).filter(Revenue.id == rev_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Revenue record not found")
    db.delete(rev)
    db.commit()
    return {"ok": True}
