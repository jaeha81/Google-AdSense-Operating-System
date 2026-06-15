import os
import json
from google import genai

_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
_MODEL = "gemini-2.0-flash"


def run(title: str, body: str, keyword: str) -> dict:
    prompt = f"""당신은 구글 SEO 전문가입니다.

타겟 키워드: {keyword}
제목: {title}
본문 (첫 500자): {body[:500]}...

위 콘텐츠를 SEO 관점에서 분석하고 평가하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "score": 75,
  "title_score": 80,
  "content_score": 70,
  "keyword_density": 2.5,
  "suggestions": [
    "제목에 키워드를 앞쪽에 배치하세요",
    "메타 설명을 추가하세요",
    "내부 링크를 2~3개 추가하세요"
  ],
  "meta_description": "추천 메타 설명 (160자 이내)"
}}

score는 0-100점."""

    response = _client.models.generate_content(model=_MODEL, contents=prompt)
    raw = response.text.strip()
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        return {"score": 0, "suggestions": [], "error": "Parse failed"}
    return json.loads(raw[start:end])
