"""chobopark.tistory.com 정보처리기사 실기 복원 문제를 문제 일괄 저장 API 형식으로 추출한다.

출력: <out>/<회차>.json = {"source": url, "questions": [QuestionCreateReq...]}
      PUT /api/exams/{examId}/questions 에 그대로 보낼 수 있다(source는 Jackson이 무시).
이미지: 서명 URL이 만료되므로 <images>/ 에 내려받고 본문에는 [이미지: 파일명]만 남긴다.
      <images> 는 백엔드가 /api/question-images/ 로 서빙하는 디렉터리(기본 question-images/).

원문은 CC BY 4.0(저작자: Life-Journey). 시험 설명에 출처를 표기할 것.

  python scripts/scrape_chobopark.py --out scraped
  python scripts/scrape_chobopark.py --self-test
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.request
from html.parser import HTMLParser

ROUNDS = {
    "2020-1": 196, "2020-2": 195, "2020-3": 194, "2020-4": 192,
    "2021-1": 191, "2021-2": 210, "2021-3": 217,
    "2022-1": 271, "2022-2": 423, "2022-3": 424,
    "2023-1": 372, "2023-2": 420, "2023-3": 453,
    "2024-1": 476, "2024-2": 483, "2024-3": 495,
    "2025-1": 540, "2025-2": 554, "2025-3": 558,
    "2026-1": 561, "2026-2": 562,
}
UA = {"User-Agent": "Mozilla/5.0"}
BLOCK = {"p", "div", "tr", "li", "h1", "h2", "h3", "h4", "figure", "table"}
VOID = {"br", "img", "hr", "input", "meta", "link", "source", "wbr", "col"}
QSTART = re.compile(r"^[ \t]*(\d{1,2})\.[ \t]*", re.M)
MORELESS = re.compile(
    r'<div[^>]*data-ke-type="moreLess".*?<div class="moreless-content">(.*?)</div>\s*</div>', re.S)  # 속성 순서는 글마다 다름
SCORE = 5  # 실기 100점 / 20문항


class ToText(HTMLParser):
    """본문 HTML → 줄 단위 텍스트. 코드 블록 줄번호·Color Scripter 배지는 버린다."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.images = [], []
        self.depth, self.skip_at, self.code_at = 0, None, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in VOID:
            if self.skip_at is None:
                if tag == "br":
                    self.out.append("\n")
                elif tag == "img" and a.get("src"):
                    self.images.append(a["src"])
                    self.out.append("\n[[IMG%d]]\n" % (len(self.images) - 1))
            return
        self.depth += 1
        if self.skip_at is not None:
            return
        style = (a.get("style") or "").replace(" ", "")
        if ("border-right:2pxsolid" in style  # 줄번호 칸
                or "vertical-align:bottom" in style  # cs 배지 칸
                or "colorscripter.com" in (a.get("href") or "")
                or "font-style:italic" in style and "font-size:9px" in style):
            self.skip_at = self.depth
            return
        if "colorscripter-code" in (a.get("class") or "").split():  # 코드 블록 → ``` 펜스
            self.code_at = self.depth
            self.nl()
            self.out.append("```\n")
            return
        if tag in BLOCK:
            self.nl()
        elif tag == "td" and self.out and not self.out[-1].endswith("\n"):
            self.out.append(" | ")

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.skip_at == self.depth:
            self.skip_at = None
        elif self.code_at == self.depth:
            self.code_at = None
            self.nl()
            self.out.append("```\n")
        elif self.skip_at is None and tag in BLOCK:
            self.nl()
        self.depth -= 1

    def nl(self):  # 블록 경계마다 줄바꿈은 한 번만
        if self.out and not self.out[-1].endswith("\n"):
            self.out.append("\n")

    def handle_data(self, data):
        if self.skip_at is None and not ("\n" in data and not data.strip()):  # 태그 사이 줄바꿈 무시
            self.out.append(data.replace("\xa0", " "))


def to_text(html):
    p = ToText()
    p.feed(html)
    lines = [l.rstrip() for l in "".join(p.out).split("\n")]
    text = re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
    return text, p.images


def article(html):
    start = html.index("tt_article_useless_p_margin")
    start = html.index(">", start) + 1
    end = html.find("container_postbtn", start)
    return html[start:end if end > 0 else None]


def parse(html):
    """[(번호, 문제 텍스트, 정답 텍스트, 이미지 URL 목록)] — 정답 '더보기' 블록 기준으로 자른다."""
    # 정답 블록 안에는 div가 없다 → [문제0, 정답0, 문제1, 정답1, ..., 꼬리]
    parts = MORELESS.split(article(html))
    items = []
    for q_html, a_html in zip(parts[0::2], parts[1::2]):
        text, images = to_text(q_html)
        m = QSTART.search(text)  # 첫 'N. ' 앞(소개글·빈 줄)은 버린다
        if m is None:
            raise ValueError("문항 번호를 찾지 못함: " + text[:80])
        answer, _ = to_text(a_html)
        items.append((int(m.group(1)), text[m.end():], answer, images))
    return items


def to_question(no, text, answer, image_names, round_key):
    for i, name in enumerate(image_names):
        text = text.replace("[[IMG%d]]" % i, "[이미지: %s]" % name)
    tags = ["정보처리기사", "실기", round_key] + (["이미지"] if image_names else [])
    # 2020~2023년 글은 '더보기' 안에 정답 뒤 빈 줄을 두고 작성자 해설을 붙였다 → 첫 빈 줄에서 나눈다
    answer, _, explanation = answer.partition("\n\n")
    return {
        "text": text,
        "type": "SUBJECTIVE",
        "choices": None,
        "answerKey": None,
        # 채점은 쉼표로 나눈 후보 중 하나와 완전일치 → 정답 속 쉼표는 "\," 로 이스케이프
        "answerKeywords": answer.strip().replace(",", "\\,"),
        "score": SCORE,
        "tags": ",".join(tags),
        "explanation": explanation.strip() or None,
    }


def review_flags(q):
    a = q["answerKeywords"] or ""
    flags = []
    if not a:
        flags.append("정답 없음")
    if "\n" in a:
        flags.append("정답 여러 줄(부분 정답 문항)")
    if len(a) > 150:
        flags.append("정답 %d자(해설이 섞였는지 확인)" % len(a))
    if "이미지" in q["tags"]:
        flags.append("이미지 포함")
    return flags


def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read()


def run(out, images_dir, only):
    os.makedirs(out, exist_ok=True)
    os.makedirs(images_dir, exist_ok=True)
    report = []
    for key, post in ROUNDS.items():
        if only and key not in only:
            continue
        url = "https://chobopark.tistory.com/%d" % post
        items = parse(fetch(url).decode("utf-8"))
        questions = []
        for no, text, answer, images in items:
            names = []
            for i, src in enumerate(images):
                ext = os.path.splitext(src.split("?")[0])[1] or ".png"
                name = "%s_q%02d_%d%s" % (key, no, i + 1, ext)
                with open(os.path.join(images_dir, name), "wb") as f:
                    f.write(fetch(src))
                names.append(name)
            q = to_question(no, text, answer, names, key)
            questions.append(q)
            for flag in review_flags(q):
                report.append("%s Q%d: %s" % (key, no, flag))
        nums = [n for n, *_ in items]
        if nums != list(range(1, len(nums) + 1)):
            report.append("%s: 문항 번호 불연속 %s" % (key, nums))
        with open(os.path.join(out, key + ".json"), "w", encoding="utf-8") as f:
            json.dump({"source": url, "questions": questions}, f, ensure_ascii=False, indent=2)
        print("%s: %d문항 → %s.json" % (key, len(questions), key))
        time.sleep(1)
    with open(os.path.join(out, "review.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(report) + "\n")
    print("검토 필요 %d건 → review.txt" % len(report))


def self_test():
    html = """<div class="tt_article_useless_p_margin contents_style"><p>안녕하세요 소개글</p>
<p><b>1. 출력 값을 쓰시오.</b></p>
<div class="colorscripter-code"><table><tr>
<td style="padding: 6px; border-right: 2px solid #e5e5e5;"><div>1</div><div>2</div></td>
<td><div style="white-space: pre;">int&nbsp;a&nbsp;=&nbsp;1;</div>
<div style="white-space: pre;">&nbsp;&nbsp;print(a&nbsp;&lt;&lt;&nbsp;2);</div>
<div style="font-size: 9px; font-style: italic;"><a href="http://colorscripter.com/info#e">Colored by Color Scripter</a></div></td>
<td style="vertical-align: bottom;"><a href="http://colorscripter.com/info#e">cs</a></td></tr></table></div>
<div data-ke-type="moreLess" data-text-more="더보기"><a class="btn-toggle-moreless">더보기</a>
<div class="moreless-content"><p>1. 4</p>
<p>2. 8</p></div></div>
<p><b>2. 표를 보고 답하시오.</b></p><figure class="imageblock"><img src="https://x/img.png?sig=1"></figure>
<table><tr><td>사번</td><td>이름</td></tr></table>
<div data-ke-type="moreLess"><a class="btn-toggle-moreless">더보기</a>
<div class="moreless-content"><p>ㄱ: A, ㄴ: B</p></div></div>
<div class="container_postbtn"></div>"""
    items = parse(html)
    assert [i[0] for i in items] == [1, 2], items
    no, text, answer, images = items[0]
    assert text == "출력 값을 쓰시오.\n```\nint a = 1;\n  print(a << 2);\n```", repr(text)
    assert answer == "1. 4\n2. 8" and images == [], repr(answer)
    assert items[1][1].startswith("표를 보고"), items[1][1]  # 이전 정답이 다음 문제에 새지 않음
    q = to_question(*items[1][:3], ["2024-1_q02_1.png"], "2024-1")
    assert "[이미지: 2024-1_q02_1.png]" in q["text"] and "사번 | 이름" in q["text"], q["text"]
    assert "소개글" not in text and "Color Scripter" not in text and "cs" not in text.split()
    assert q["answerKeywords"] == "ㄱ: A\\, ㄴ: B", q["answerKeywords"]
    old = to_question(3, "서술하시오.", "테스트 원리\n\n해설 첫 줄, 둘째\n- 항목", [], "2020-1")
    assert old["answerKeywords"] == "테스트 원리" and old["explanation"] == "해설 첫 줄, 둘째\n- 항목", old
    assert parse('<div class="tt_article_useless_p_margin"><p><b>1. 문제</b></p>'
                 '<div data-text-less="닫기" data-ke-type="moreLess"><a>더보기</a>'
                 '<div class="moreless-content"><p>답</p></div></div>')[0][2] == "답"  # 속성 순서가 다른 글
    assert review_flags(q) == ["이미지 포함"], review_flags(q)
    print("self-test ok")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="scraped")
    ap.add_argument("--images", default="question-images")
    ap.add_argument("--only", nargs="*", help="예: 2024-1 2025-2")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    self_test() if args.self_test else run(args.out, args.images, args.only)
