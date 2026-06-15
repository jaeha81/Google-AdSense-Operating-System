from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
from database import get_db
from models import AgentLog, Keyword, Content, Site, Revenue
import agents.keyword_agent as keyword_agent
import agents.content_agent as content_agent
import agents.seo_agent as seo_agent
import agents.revenue_agent as revenue_agent

router = APIRouter(prefix="/api/agents", tags=["agents"])


class KeywordAgentRequest(BaseModel):
    niche: str


class ContentAgentRequest(BaseModel):
    keyword_id: int
    site_id: Optional[int] = None


class SeoAgentRequest(BaseModel):
    content_id: int


class RevenueAgentRequest(BaseModel):
    site_id: int


@router.get("/logs")
def list_logs(db: Session = Depends(get_db)):
    return db.query(AgentLog).order_by(AgentLog.created_at.desc()).limit(50).all()


@router.post("/keyword")
def run_keyword_agent(req: KeywordAgentRequest, db: Session = Depends(get_db)):
    log = AgentLog(agent_type="keyword", input_data=req.niche, status="running")
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        results = keyword_agent.run(req.niche)
        from routers.keywords import KeywordCreate
        keywords = [
            Keyword(
                keyword=r["keyword"],
                cpc=r.get("cpc", 0.0),
                search_volume=r.get("search_volume", 0),
                competition=r.get("competition", "medium"),
                category=r.get("category", req.niche),
            )
            for r in results
        ]
        db.add_all(keywords)
        log.output_data = json.dumps(results, ensure_ascii=False)
        log.status = "completed"
        db.commit()
        return {"keywords": results, "saved": len(keywords)}
    except Exception as e:
        log.status = "failed"
        log.output_data = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/content")
def run_content_agent(req: ContentAgentRequest, db: Session = Depends(get_db)):
    kw = db.query(Keyword).filter(Keyword.id == req.keyword_id).first()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")

    site_name = ""
    if req.site_id:
        site = db.query(Site).filter(Site.id == req.site_id).first()
        if site:
            site_name = site.name

    log = AgentLog(agent_type="content", input_data=kw.keyword, status="running")
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        result = content_agent.run(kw.keyword, site_name)
        content = Content(
            title=result["title"],
            keyword_id=req.keyword_id,
            site_id=req.site_id,
            body=result["body"],
            word_count=result["word_count"],
            status="draft",
        )
        db.add(content)
        log.output_data = result["title"]
        log.status = "completed"
        db.commit()
        db.refresh(content)
        return content
    except Exception as e:
        log.status = "failed"
        log.output_data = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seo")
def run_seo_agent(req: SeoAgentRequest, db: Session = Depends(get_db)):
    content = db.query(Content).filter(Content.id == req.content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    kw_text = ""
    if content.keyword_id:
        kw = db.query(Keyword).filter(Keyword.id == content.keyword_id).first()
        kw_text = kw.keyword if kw else ""

    log = AgentLog(agent_type="seo", input_data=content.title, status="running")
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        result = seo_agent.run(content.title, content.body, kw_text)
        log.output_data = json.dumps(result, ensure_ascii=False)
        log.status = "completed"
        db.commit()
        return result
    except Exception as e:
        log.status = "failed"
        log.output_data = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/revenue")
def run_revenue_agent(req: RevenueAgentRequest, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == req.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    revenue_rows = (
        db.query(Revenue)
        .filter(Revenue.site_id == req.site_id)
        .order_by(Revenue.year, Revenue.month)
        .all()
    )
    revenue_data = [
        {"year": r.year, "month": r.month, "amount": r.amount} for r in revenue_rows
    ]

    log = AgentLog(agent_type="revenue", input_data=site.name, status="running")
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        result = revenue_agent.run(site.name, revenue_data)
        log.output_data = json.dumps(result, ensure_ascii=False)
        log.status = "completed"
        db.commit()
        return result
    except Exception as e:
        log.status = "failed"
        log.output_data = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
