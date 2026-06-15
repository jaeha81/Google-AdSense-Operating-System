from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import RoadmapStep

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

_SEED = [
    {
        "step_number": 1,
        "title": "STEP 1 — 네이버 블로그 기초",
        "description": "키워드 훈련 / 애드포스트 첫 수익 / 습관 형성",
        "progress": 0,
        "status": "not_started",
    },
    {
        "step_number": 2,
        "title": "STEP 2 — 애드센스 수익 극대화",
        "description": "블로그스팟 개설 / 애드센스 승인 / 달러 파이프라인",
        "progress": 0,
        "status": "not_started",
    },
    {
        "step_number": 3,
        "title": "STEP 3 — 자동화 & 수익 다각화",
        "description": "AI 자동화 / OSMU / 전자책·강의 / 브랜딩",
        "progress": 0,
        "status": "not_started",
    },
]


class RoadmapUpdate(BaseModel):
    progress: Optional[int] = None
    status: Optional[str] = None


@router.get("/")
def list_roadmap(db: Session = Depends(get_db)):
    steps = db.query(RoadmapStep).order_by(RoadmapStep.step_number).all()
    if not steps:
        seed = [RoadmapStep(**s) for s in _SEED]
        db.add_all(seed)
        db.commit()
        steps = db.query(RoadmapStep).order_by(RoadmapStep.step_number).all()
    return steps


@router.patch("/{step_id}")
def update_step(step_id: int, data: RoadmapUpdate, db: Session = Depends(get_db)):
    step = db.query(RoadmapStep).filter(RoadmapStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(step, k, v)
    db.commit()
    db.refresh(step)
    return step
