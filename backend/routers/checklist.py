from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ChecklistItem

router = APIRouter(prefix="/api/checklist", tags=["checklist"])

_SEED = [
    {"week": 1, "day_range": "1~7", "task": "네이버 아이디 3개 생성", "category": "계정"},
    {"week": 1, "day_range": "1~7", "task": "블로그스팟 5개 개설 + 글 12개 발행", "category": "콘텐츠"},
    {"week": 1, "day_range": "1~7", "task": "구글 애드센스 신청", "category": "수익화"},
    {"week": 1, "day_range": "1~7", "task": "네이버 블로그 3개 개설 → 애드포스트 신청", "category": "계정"},
    {"week": 1, "day_range": "1~7", "task": "쇼핑커넥트 즉시 운영 시작", "category": "수익화"},
    {"week": 1, "day_range": "1~7", "task": "황금비서/로워드/블랙키위 가입 + 키워드 20개 작성", "category": "키워드"},
    {"week": 2, "day_range": "8~14", "task": "홈판용 글 3개 발행", "category": "콘텐츠"},
    {"week": 2, "day_range": "8~14", "task": "쇼핑커넥트 연계 글 3개 발행", "category": "콘텐츠"},
    {"week": 2, "day_range": "8~14", "task": "블로그스팟 수익형 글 5개 → 네이버 백링크", "category": "SEO"},
    {"week": 2, "day_range": "8~14", "task": "네이버 지식인 답변 30개 + 백링크 삽입", "category": "SEO"},
    {"week": 3, "day_range": "15~30", "task": "애드포스트 승인 + 첫 수익 확인", "category": "수익화"},
    {"week": 3, "day_range": "15~30", "task": "구글 애드센스 승인 확인", "category": "수익화"},
    {"week": 3, "day_range": "15~30", "task": "쇼핑커넥트 커미션 수익 시작 확인", "category": "수익화"},
    {"week": 3, "day_range": "15~30", "task": "유입 키워드 분석 → 유사 글 확장", "category": "키워드"},
    {"week": 3, "day_range": "15~30", "task": "2개월차 콘텐츠 캘린더 완성", "category": "콘텐츠"},
]


@router.get("/")
def list_checklist(db: Session = Depends(get_db)):
    items = db.query(ChecklistItem).order_by(ChecklistItem.week, ChecklistItem.id).all()
    if not items:
        seed = [ChecklistItem(**item) for item in _SEED]
        db.add_all(seed)
        db.commit()
        items = db.query(ChecklistItem).order_by(ChecklistItem.week, ChecklistItem.id).all()
    return items


@router.patch("/{item_id}/toggle")
def toggle_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item.completed = 0 if item.completed else 1
    db.commit()
    db.refresh(item)
    return item
