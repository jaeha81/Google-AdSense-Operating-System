import os
import json
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


def run(niche: str) -> list[dict]:
    prompt = f"""당신은 구글 애드센스 전문 키워드 리서처입니다.

주제: {niche}

위 주제에 대해 구글 애드센스 수익화에 최적화된 한국어 키워드 20개를 생성하세요.
각 키워드는 CPC(클릭당 비용)가 높고 경쟁이 낮은 것을 우선합니다.

반드시 아래 JSON 배열 형식으로만 응답하세요 (다른 텍스트 없이):
[
  {{
    "keyword": "키워드명",
    "cpc": 1.5,
    "search_volume": 5000,
    "competition": "low",
    "category": "카테고리"
  }},
  ...
]

competition은 "low", "medium", "high" 중 하나.
cpc는 달러 기준 예상 값.
search_volume은 월간 검색량 예상치."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # JSON 배열만 추출
    start = raw.find("[")
    end = raw.rfind("]") + 1
    if start == -1 or end == 0:
        return []
    return json.loads(raw[start:end])
