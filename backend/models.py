from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    platform = Column(String, nullable=False)  # naver / blogspot / wordpress
    status = Column(String, default="pending")  # approved / pending / rejected
    monthly_revenue = Column(Float, default=0.0)
    content_count = Column(Integer, default=0)
    daily_visitors = Column(Integer, default=0)
    ctr = Column(Float, default=0.0)
    rpm = Column(Float, default=0.0)
    avg_cpc = Column(Float, default=0.0)
    risk_score = Column(Integer, default=100)
    account_type = Column(String, default="mixed")  # search / homepage / shopping / mixed
    created_at = Column(DateTime, default=datetime.utcnow)


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, nullable=False)
    cpc = Column(Float, default=0.0)
    search_volume = Column(Integer, default=0)
    competition = Column(String, default="medium")  # low / medium / high
    category = Column(String, default="")
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    intent_type = Column(String, default="info")   # info / action
    age_group = Column(String, default="all")       # all / 40plus / young
    quadrant_x = Column(Float, default=0.5)         # SEO 유입 잠재력 0~1
    quadrant_y = Column(Float, default=0.5)         # 수익화 잠재력 0~1
    created_at = Column(DateTime, default=datetime.utcnow)


class Content(Base):
    __tablename__ = "content"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    keyword_id = Column(Integer, ForeignKey("keywords.id"), nullable=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    body = Column(Text, default="")
    status = Column(String, default="draft")  # draft / review / published
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Revenue(Base):
    __tablename__ = "revenue"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    amount = Column(Float, default=0.0)  # 합산 (하위 호환)
    adsense_usd = Column(Float, default=0.0)
    adpost_krw = Column(Float, default=0.0)
    shopping_krw = Column(Float, default=0.0)
    coupang_krw = Column(Float, default=0.0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    agent_type = Column(String, nullable=False)
    input_data = Column(Text, default="")
    output_data = Column(Text, default="")
    status = Column(String, default="running")  # running / completed / failed
    created_at = Column(DateTime, default=datetime.utcnow)


class DailyStat(Base):
    __tablename__ = "daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False, unique=True)  # YYYY-MM-DD
    visitors = Column(Integer, default=0)
    pageviews = Column(Integer, default=0)
    adsense_usd = Column(Float, default=0.0)
    adpost_krw = Column(Float, default=0.0)
    shopping_krw = Column(Float, default=0.0)
    coupang_krw = Column(Float, default=0.0)
    search_ratio = Column(Float, default=0.6)
    external_ratio = Column(Float, default=0.3)
    paid_ratio = Column(Float, default=0.1)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    week = Column(Integer, nullable=False)
    day_range = Column(String, default="")
    task = Column(String, nullable=False)
    completed = Column(Integer, default=0)  # 0 / 1
    category = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class RoadmapStep(Base):
    __tablename__ = "roadmap_steps"

    id = Column(Integer, primary_key=True, index=True)
    step_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    progress = Column(Integer, default=0)  # 0~100
    status = Column(String, default="not_started")  # not_started / in_progress / completed
    created_at = Column(DateTime, default=datetime.utcnow)


class OsmuItem(Base):
    __tablename__ = "osmu_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)          # 원본 콘텐츠 제목
    source = Column(String, default="blog")         # blog / video / short 등
    naver_blog = Column(Integer, default=0)         # 0/1
    tistory = Column(Integer, default=0)
    youtube_shorts = Column(Integer, default=0)
    instagram = Column(Integer, default=0)
    kakao = Column(Integer, default=0)
    threads = Column(Integer, default=0)
    notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
