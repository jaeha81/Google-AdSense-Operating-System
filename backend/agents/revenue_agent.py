import os
import json
from google import genai

_client = None
_MODEL = "gemini-2.0-flash"


def _get_client() -> genai.Client:
    """Lazily create the Gemini client so the app still imports without a key."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
    return _client


def run(site_name: str, revenue_data: list[dict]) -> dict:
    data_str = json.dumps(revenue_data, ensure_ascii=False, indent=2)

    prompt = f"""당신은 구글 애드센스 수익 분석 전문가입니다.

사이트: {site_name}
수익 데이터 (월별):
{data_str}

위 수익 데이터를 분석하고 성장 전략을 제안하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "trend": "상승",
  "growth_rate": 15.5,
  "next_month_prediction": 1200.0,
  "analysis": "3줄 이내 수익 추이 분석",
  "strategies": [
    "고수익 키워드로 콘텐츠 10개 추가 발행",
    "모바일 광고 단가 최적화",
    "저성과 콘텐츠 리라이팅"
  ]
}}

trend는 "상승", "하락", "정체" 중 하나.
growth_rate는 % 단위.
next_month_prediction은 달러 기준."""

    response = _get_client().models.generate_content(model=_MODEL, contents=prompt)
    raw = response.text.strip()
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        return {"error": "Parse failed", "strategies": []}
    return json.loads(raw[start:end])
