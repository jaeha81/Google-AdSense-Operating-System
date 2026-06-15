from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import sites, keywords, content, revenue, agents, daily_stats, checklist, roadmap, calculator, osmu

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Google AdSense Operating System API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sites.router)
app.include_router(keywords.router)
app.include_router(content.router)
app.include_router(revenue.router)
app.include_router(agents.router)
app.include_router(daily_stats.router)
app.include_router(checklist.router)
app.include_router(roadmap.router)
app.include_router(calculator.router)
app.include_router(osmu.router)


@app.get("/")
def root():
    return {"name": "Google AdSense OS", "version": "2.0.0", "status": "running"}


@app.get("/api/stats")
def get_stats():
    from sqlalchemy.orm import Session
    from database import SessionLocal
    from models import Site, Keyword, Content, Revenue, DailyStat
    from sqlalchemy import func
    from datetime import datetime, date, timedelta

    db = SessionLocal()
    try:
        site_count = db.query(func.count(Site.id)).scalar()
        keyword_count = db.query(func.count(Keyword.id)).scalar()
        content_count = db.query(func.count(Content.id)).scalar()
        published_count = (
            db.query(func.count(Content.id))
            .filter(Content.status == "published")
            .scalar()
        )

        now = datetime.utcnow()
        monthly_revenue = (
            db.query(func.sum(Revenue.amount))
            .filter(Revenue.year == now.year, Revenue.month == now.month)
            .scalar()
            or 0.0
        )

        # 플랫폼별 수익 (이번달)
        rev_rows = (
            db.query(Revenue)
            .filter(Revenue.year == now.year, Revenue.month == now.month)
            .all()
        )
        adsense_usd = sum(r.adsense_usd for r in rev_rows)
        adpost_krw = sum(r.adpost_krw for r in rev_rows)
        shopping_krw = sum(r.shopping_krw for r in rev_rows)
        coupang_krw = sum(r.coupang_krw for r in rev_rows)

        # 일 평균 방문자 (최근 7일)
        cutoff = str(date.today() - timedelta(days=7))
        recent_stats = db.query(DailyStat).filter(DailyStat.date >= cutoff).all()
        avg_visitors = (
            round(sum(s.visitors for s in recent_stats) / len(recent_stats))
            if recent_stats
            else 0
        )

        # 평균 CPC
        avg_cpc = db.query(func.avg(Keyword.cpc)).scalar() or 0.0

        return {
            "site_count": site_count,
            "keyword_count": keyword_count,
            "content_count": content_count,
            "published_count": published_count,
            "monthly_revenue": round(monthly_revenue, 2),
            "adsense_usd": round(adsense_usd, 2),
            "adpost_krw": round(adpost_krw),
            "shopping_krw": round(shopping_krw),
            "coupang_krw": round(coupang_krw),
            "avg_visitors": avg_visitors,
            "avg_cpc": round(avg_cpc, 2),
        }
    finally:
        db.close()
