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
    adsense_usd: float = 0.0
    adpost_krw: float = 0.0
    shopping_krw: float = 0.0
    coupang_krw: float = 0.0
    notes: str = ""


class RevenueUpdate(BaseModel):
    adsense_usd: Optional[float] = None
    adpost_krw: Optional[float] = None
    shopping_krw: Optional[float] = None
    coupang_krw: Optional[float] = None
    notes: Optional[str] = None


@router.get("/")
def list_revenue(db: Session = Depends(get_db)):
    return db.query(Revenue).order_by(Revenue.year.desc(), Revenue.month.desc()).all()


@router.get("/summary")
def revenue_summary(db: Session = Depends(get_db)):
    rows = db.query(Revenue).all()
    total_adsense = sum(r.adsense_usd for r in rows)
    total_adpost = sum(r.adpost_krw for r in rows)
    total_shopping = sum(r.shopping_krw for r in rows)
    total_coupang = sum(r.coupang_krw for r in rows)
    # amount 합산 기준 (하위호환 + 미입력 시 플랫폼 합산)
    total = sum(r.amount or (r.adsense_usd + r.adpost_krw / 1400 + r.shopping_krw / 1400 + r.coupang_krw / 1400) for r in rows)
    avg = total / len(rows) if rows else 0.0
    max_row = max(rows, key=lambda r: r.amount or 0, default=None)
    return {
        "total": round(total, 2),
        "monthly_avg": round(avg, 2),
        "best_month": {
            "year": max_row.year if max_row else None,
            "month": max_row.month if max_row else None,
            "amount": max_row.amount if max_row else 0,
        },
        "total_adsense_usd": round(total_adsense, 2),
        "total_adpost_krw": round(total_adpost),
        "total_shopping_krw": round(total_shopping),
        "total_coupang_krw": round(total_coupang),
    }


@router.post("/")
def create_revenue(data: RevenueCreate, db: Session = Depends(get_db)):
    payload = data.model_dump()
    payload["amount"] = payload["adsense_usd"]  # 하위호환
    rev = Revenue(**payload)
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
    rev.amount = rev.adsense_usd  # 하위호환
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
