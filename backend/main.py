from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import sites, keywords, content, revenue, agents

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Google AdSense Operating System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sites.router)
app.include_router(keywords.router)
app.include_router(content.router)
app.include_router(revenue.router)
app.include_router(agents.router)


@app.get("/")
def root():
    return {"name": "Google AdSense OS", "version": "1.0.0", "status": "running"}


@app.get("/api/stats")
def get_stats(db=None):
    from sqlalchemy.orm import Session
    from database import SessionLocal
    from models import Site, Keyword, Content, Revenue
    from sqlalchemy import func

    db = SessionLocal()
    try:
        site_count = db.query(func.count(Site.id)).scalar()
        keyword_count = db.query(func.count(Keyword.id)).scalar()
        content_count = db.query(func.count(Content.id)).scalar()
        total_revenue = db.query(func.sum(Revenue.amount)).scalar() or 0.0

        from datetime import datetime
        now = datetime.utcnow()
        monthly_revenue = (
            db.query(func.sum(Revenue.amount))
            .filter(Revenue.year == now.year, Revenue.month == now.month)
            .scalar()
            or 0.0
        )

        published_count = (
            db.query(func.count(Content.id))
            .filter(Content.status == "published")
            .scalar()
        )

        return {
            "site_count": site_count,
            "keyword_count": keyword_count,
            "content_count": content_count,
            "published_count": published_count,
            "total_revenue": round(total_revenue, 2),
            "monthly_revenue": round(monthly_revenue, 2),
        }
    finally:
        db.close()
