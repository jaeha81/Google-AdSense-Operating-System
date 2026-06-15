from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import DailyStat

router = APIRouter(prefix="/api/daily-stats", tags=["daily-stats"])


class DailyStatCreate(BaseModel):
    date: str
    visitors: int = 0
    pageviews: int = 0
    adsense_usd: float = 0.0
    adpost_krw: float = 0.0
    shopping_krw: float = 0.0
    coupang_krw: float = 0.0
    search_ratio: float = 0.6
    external_ratio: float = 0.3
    paid_ratio: float = 0.1


@router.get("/")
def list_daily_stats(limit: int = 30, db: Session = Depends(get_db)):
    return (
        db.query(DailyStat)
        .order_by(DailyStat.date.desc())
        .limit(limit)
        .all()
    )


@router.post("/")
def upsert_daily_stat(data: DailyStatCreate, db: Session = Depends(get_db)):
    existing = db.query(DailyStat).filter(DailyStat.date == data.date).first()
    if existing:
        for k, v in data.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    stat = DailyStat(**data.model_dump())
    db.add(stat)
    db.commit()
    db.refresh(stat)
    return stat


@router.get("/summary")
def daily_summary(db: Session = Depends(get_db)):
    from datetime import date, timedelta

    cutoff = str(date.today() - timedelta(days=30))
    stats = db.query(DailyStat).filter(DailyStat.date >= cutoff).all()

    if not stats:
        return {
            "avg_visitors": 0,
            "total_adsense_usd": 0.0,
            "total_krw": 0,
            "data_points": 0,
        }

    avg_visitors = sum(s.visitors for s in stats) / len(stats)
    total_adsense = sum(s.adsense_usd for s in stats)
    total_krw = sum(s.adpost_krw + s.shopping_krw + s.coupang_krw for s in stats)

    return {
        "avg_visitors": round(avg_visitors),
        "total_adsense_usd": round(total_adsense, 2),
        "total_krw": round(total_krw),
        "data_points": len(stats),
    }
