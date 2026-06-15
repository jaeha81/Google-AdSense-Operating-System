from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os, json
from database import get_db
from models import AgentLog, Keyword, Content, Site, Revenue
import agents.keyword_agent as keyword_agent
import agents.content_agent as content_agent
import agents.seo_agent as seo_agent
import agents.revenue_agent as revenue_agent

router = APIRouter(prefix="/api/agents", tags=["agents"])


def _agent_error(e: Exception) -> HTTPException:
    msg = str(e)
    if "resource_exhausted" in msg.lower() or "429" in msg or "quota" in msg.lower():
        return HTTPException(
            status_code=402,
            detail={
                "error": "quota_exceeded",
                "message": "Gemini API 할당량 초과입니다. aistudio.google.com에서 AI Studio API 키를 발급받거나, Google Cloud 결제를 활성화하세요.",
                "raw": msg[:300],
            },
        )
    if "unauthenticated" in msg.lower() or "api_key" in msg.lower() or "401" in msg or "403" in msg:
        return HTTPException(
            status_code=401,
            detail={
                "error": "invalid_api_key",
                "message": "GEMINI_API_KEY가 유효하지 않습니다. aistudio.google.com에서 키를 재발급하세요.",
                "raw": msg[:300],
            },
        )
    return HTTPException(status_code=500, detail={"error": "agent_error", "message": msg[:300]})


DEMO_KEYWORDS = [
    {"keyword": "재테크 초보 가이드", "cpc": 2.1, "search_volume": 8200, "competition": "low", "category": "재테크"},
    {"keyword": "주식 투자 방법", "cpc": 1.8, "search_volume": 12000, "competition": "medium", "category": "재테크"},
    {"keyword": "적금 금리 비교", "cpc": 2.5, "search_volume": 6500, "competition": "low", "category": "재테크"},
]

DEMO_CONTENT = {
    "title": "재테크 초보를 위한 완벽 가이드 — 월 100만원 저축 전략",
    "body": "## 재테크, 어디서부터 시작해야 할까?\n\n재테크 초보라면 먼저 비상금부터 모아야 합니다...\n\n## 핵심 전략 3가지\n\n1. 자동이체 설정\n2. 소비 패턴 분석\n3. 투자 공부 시작",
    "word_count": 2100,
}

DEMO_SEO = {
    "score": 84,
    "title_score": 88,
    "content_score": 80,
    "keyword_density": 2.8,
    "suggestions": ["내부 링크 2개 추가", "이미지 alt 태그 작성", "FAQ 섹션 추가"],
    "meta_description": "재테크 초보를 위한 실전 가이드. 월 100만원 저축 전략과 투자 시작법을 단계별로 알아보세요.",
}

DEMO_REVENUE = {
    "trend": "상승",
    "growth_rate": 23.5,
    "next_month_prediction": 1580.0,
    "analysis": "3개월 연속 상승세. 재테크 키워드 CPC 평균 $2.1로 수익성 양호.",
    "strategies": ["고CPC 키워드 콘텐츠 10편 추가", "모바일 광고 배치 최적화", "뉴스레터 구독자 확보"],
}


class KeywordAgentRequest(BaseModel):
    niche: str


class ContentAgentRequest(BaseModel):
    keyword_id: int
    site_id: Optional[int] = None


class SeoAgentRequest(BaseModel):
    content_id: int


class RevenueAgentRequest(BaseModel):
    site_id: int


@router.get("/status")
def agent_status():
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return {"status": "error", "reason": "GEMINI_API_KEY not set"}
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        client.models.generate_content(model="gemini-2.0-flash", contents="hi")
        return {"status": "ok", "provider": "Google Gemini 2.0 Flash", "key_prefix": api_key[:8] + "..."}
    except Exception as e:
        msg = str(e)
        return {"status": "error", "reason": msg[:200]}


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
        raise _agent_error(e)


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
        raise _agent_error(e)


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
        raise _agent_error(e)


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
        raise _agent_error(e)


@router.post("/pipeline/demo")
def run_pipeline_demo(db: Session = Depends(get_db)):
    """크레딧 없이 전체 파이프라인 E2E 검증 (keyword→content→seo→revenue 순서대로 DB 저장)."""
    niche = "재테크"

    # 1. keyword — DB 저장
    kw_log = AgentLog(agent_type="keyword", input_data=niche, status="running")
    db.add(kw_log)
    db.commit()
    keywords_saved = []
    for kd in DEMO_KEYWORDS:
        kw = Keyword(
            keyword=kd["keyword"],
            cpc=kd["cpc"],
            search_volume=kd["search_volume"],
            competition=kd["competition"],
            category=kd["category"],
        )
        db.add(kw)
        keywords_saved.append(kw)
    kw_log.output_data = json.dumps(DEMO_KEYWORDS, ensure_ascii=False)
    kw_log.status = "completed"
    db.commit()
    db.refresh(keywords_saved[0])

    # 2. content — 첫 번째 키워드로 DB 저장
    content_log = AgentLog(agent_type="content", input_data=keywords_saved[0].keyword, status="running")
    db.add(content_log)
    db.commit()
    content_obj = Content(
        title=DEMO_CONTENT["title"],
        keyword_id=keywords_saved[0].id,
        body=DEMO_CONTENT["body"],
        word_count=DEMO_CONTENT["word_count"],
        status="draft",
    )
    db.add(content_obj)
    content_log.output_data = DEMO_CONTENT["title"]
    content_log.status = "completed"
    db.commit()
    db.refresh(content_obj)

    # 3. seo — 콘텐츠 기반 분석 (DB 저장)
    seo_log = AgentLog(agent_type="seo", input_data=content_obj.title, status="running")
    db.add(seo_log)
    seo_log.output_data = json.dumps(DEMO_SEO, ensure_ascii=False)
    seo_log.status = "completed"
    db.commit()

    # 4. revenue — 분석 결과 (DB 저장)
    rev_log = AgentLog(agent_type="revenue", input_data=niche, status="running")
    db.add(rev_log)
    rev_log.output_data = json.dumps(DEMO_REVENUE, ensure_ascii=False)
    rev_log.status = "completed"
    db.commit()

    return {
        "pipeline": "keyword→content→seo→revenue",
        "mode": "demo",
        "niche": niche,
        "step1_keywords": {"saved": len(DEMO_KEYWORDS), "sample": DEMO_KEYWORDS[0]},
        "step2_content": {"title": content_obj.title, "word_count": content_obj.word_count, "id": content_obj.id},
        "step3_seo": {"score": DEMO_SEO["score"], "suggestions_count": len(DEMO_SEO["suggestions"])},
        "step4_revenue": {"trend": DEMO_REVENUE["trend"], "growth_rate": DEMO_REVENUE["growth_rate"], "next_month": DEMO_REVENUE["next_month_prediction"]},
        "db_saved": True,
        "logs_written": 4,
    }
