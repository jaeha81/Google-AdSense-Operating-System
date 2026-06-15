# Google AdSense Operating System

> AI 에이전트 탑재 구글 애드센스 수익화 운영 시스템  
> "디지털 건물주" 전략을 자동화한 풀스택 대시보드

## 개요

92년생 블로거가 5년간 75억 적립한 Google AdSense 전략을 벤치마킹하여,  
AI 에이전트로 자동화한 수익화 운영 시스템입니다.

**핵심 전략 (벤치마킹 원본)**
- 다중 블로그 플랫폼 (티스토리/블로그스팟/워드프레스) 동시 운영
- SEO 최적화 콘텐츠 자동 생산
- 고수익 키워드 발굴 및 데이터베이스화
- 13곳 이상 동시 수익화

## 기능

| 모듈 | 기능 |
|------|------|
| 📊 대시보드 | KPI 카드, 수익 추이 차트, 에이전트 활동 피드 |
| 🏢 사이트 포트폴리오 | 디지털 건물 (블로그 사이트) 등록/관리 |
| 🔑 키워드 리서치 | AI 에이전트로 수익성 높은 키워드 20개 자동 발굴 |
| ✍️ 콘텐츠 파이프라인 | AI 블로그 포스트 생성 + 칸반 상태 관리 |
| 💰 수익 트래커 | 사이트별 월별 애드센스 수익 기록 + 차트 |
| 🤖 AI 에이전트 | 키워드/콘텐츠/SEO/수익분석 에이전트 통합 실행 |

## 스택

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + Recharts
- **Backend**: FastAPI (Python) + SQLite
- **AI**: Claude API (claude-sonnet-4-6)

## 실행 방법

### 1. 백엔드

```bash
cd backend
pip install fastapi uvicorn anthropic sqlalchemy
# .env 파일 생성
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
# 서버 실행
uvicorn main:app --reload --port 8000
```

### 2. 프론트엔드

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### API 문서

백엔드 실행 후 → http://localhost:8000/docs

## AI 에이전트

| 에이전트 | 입력 | 출력 |
|----------|------|------|
| 키워드 리서치 | 니치 주제 (재테크, 다이어트...) | 고수익 키워드 20개 + CPC/경쟁도 |
| 콘텐츠 생성 | 키워드 ID | SEO 최적화 블로그 포스트 초안 |
| SEO 감사 | 콘텐츠 ID | SEO 점수 + 개선 제안 |
| 수익 분석 | 사이트 ID | 수익 추이 분석 + 다음달 예측 |

## 환경변수

```
ANTHROPIC_API_KEY=sk-ant-...        # Claude API 키
NEXT_PUBLIC_API_URL=http://localhost:8000  # 백엔드 URL
```
