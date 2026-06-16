import os
from google import genai

_client = None
_MODEL = "gemini-2.0-flash"


def _get_client() -> genai.Client:
    """Lazily create the Gemini client so the app still imports without a key."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
    return _client


def run(keyword: str, site_name: str = "") -> dict:
    prompt = f"""당신은 구글 애드센스 수익화에 최적화된 블로그 콘텐츠 작성 전문가입니다.

타겟 키워드: {keyword}
{"타겟 사이트: " + site_name if site_name else ""}

위 키워드를 메인으로 SEO 최적화된 한국어 블로그 포스트를 작성하세요.

조건:
- 제목: 클릭률 높은 매력적인 제목 (키워드 포함)
- 본문: 2000~2500자
- 구조: H2/H3 헤딩 사용, 명확한 단락 구분
- SEO: 키워드를 자연스럽게 5~7회 포함
- 독자 가치: 실용적 정보, 리스트, 팁 포함
- 마크다운 형식으로 작성

응답 형식:
TITLE: [제목]
---
[본문 마크다운]"""

    response = _get_client().models.generate_content(model=_MODEL, contents=prompt)
    raw = response.text.strip()

    title = ""
    body = raw
    if raw.startswith("TITLE:"):
        lines = raw.split("\n", 2)
        title = lines[0].replace("TITLE:", "").strip()
        body = lines[2].strip() if len(lines) > 2 else ""

    return {
        "title": title or f"{keyword} 완벽 가이드",
        "body": body,
        "word_count": len(body),
    }
