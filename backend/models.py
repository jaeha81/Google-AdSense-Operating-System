from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    platform = Column(String, nullable=False)  # tistory / blogspot / wordpress / naver
    status = Column(String, default="pending")  # approved / pending / rejected
    monthly_revenue = Column(Float, default=0.0)
    content_count = Column(Integer, default=0)
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
    amount = Column(Float, default=0.0)
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
