"""comcbt.com 필기 기출 '교사용' PDF → 문제 일괄 저장 형식 JSON.

입력: scraped/comcbt/<연도>-<회차>.pdf  (예: 2022-2.pdf, 2020-1.pdf = 1·2회 통합)
출력: scraped/written/<연도>-<회차>.json = {"source": ..., "questions": [QuestionCreateReq...]}
      question-images/w<연도>-<회차>_q<번호>_<n>.png  (본문에는 [이미지: 파일명])

교사용 PDF는 정답 보기가 ❶❷❸❹(채움 번호)로 표시되어 있고, 마지막 쪽에 정답표가 있다.
두 정답을 대조해 다르면 review.txt 에 남긴다.

  python scripts/parse_comcbt.py
  python scripts/parse_comcbt.py --self-test
"""
import argparse
import glob
import json
import os
import re

import fitz  # PyMuPDF

PLAIN, FILLED = "①②③④", "❶❷❸❹"
MARK = re.compile("[%s%s]" % (PLAIN, FILLED))
QSTART = re.compile(r"^(\d{1,3})\.\s*(.*)$")
SUBJECT = re.compile(r"^(\d)과목\s*:\s*(.+)$")
MID_X = 298  # 2단 편집: 왼쪽 단 / 오른쪽 단 경계
SOURCE = "https://www.comcbt.com/xe/iz"


HANGUL = re.compile("[가-힣]")
LATIN = re.compile("[A-Za-z]")
SQL_WORDS = {"SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "ON", "SET", "BY", "INTO", "VALUES", "JOIN",
             "HAVING", "IN", "IS", "LIKE", "AS", "UPDATE", "DELETE", "INSERT", "GROUP", "ORDER", "DISTINCT"}


def needs_space(a, b):
    """공백 없이 끊긴 줄 경계에 공백이 있어야 하는가.

    한글은 단어 중간에서도 줄이 바뀌므로 기본은 붙인다. 다만 PDF가 줄 끝 공백을 지운 경우를 되살린다:
    한글→영문(`FROM 푸드|ORDER`), `;`·따옴표→영문(`j = 9;|int`), SQL 예약어→한글(`WHERE|공급자명`).
    영문→한글은 조사(`SQL|은`, `Hybrid|에`)라 붙인다.
    """
    x, y = a.rstrip()[-1], b.lstrip()[0]
    if LATIN.match(y) and (HANGUL.match(x) or x in ";'\""):
        return True
    words = a.split()
    return bool(HANGUL.match(y)) and bool(words) and words[-1] in SQL_WORDS


def join(a, b):
    """줄바꿈으로 끊긴 문장을 잇는다(한글은 공백 없이 끊기므로 대개 공백을 넣지 않는다)."""
    if not a.strip():
        return b.lstrip()
    if a.endswith(" ") or b.startswith(" ") or (b.strip() and needs_space(a, b)):
        return a.rstrip() + " " + b.lstrip()
    return a + b.lstrip()  # b 의 끝 공백은 다음 줄과 띄어 잇기 위해 남긴다(최종 저장 시 strip)


def page_items(page):
    """한 쪽의 줄·이미지를 (단, y, 종류, 값, x, 보기표시 좌표) 로 읽는 순서대로 돌려준다.

    보기표시 좌표 = 그 줄에 있는 ①~❹ 각각의 (x, y). 보기가 이미지일 때 어느 보기 밑에 있는지 가르는 데 쓴다.
    """
    items = []
    for b in page.get_text("rawdict")["blocks"]:
        x0, y0, x1, y1 = b["bbox"]
        if y0 < 40 or y0 > 805:  # 머리말·꼬리말
            continue
        col = 0 if x0 < MID_X else 1
        if b["type"] == 1:
            items.append((col, y0, "img", fitz.Rect(b["bbox"]), x0, None))
            continue
        for l in b["lines"]:
            chars = [c for s in l["spans"] for c in s["chars"]]
            t = "".join(c["c"] for c in chars)
            if t.strip() and "comcbt.com" not in t:
                marks = [(c["bbox"][0], c["bbox"][1]) for c in chars if MARK.match(c["c"])]
                # 단은 줄마다 정한다: 한 블록이 양쪽 단에 걸치기도 한다(2021-1 마지막 쪽 안내문이 왼쪽 문항에 붙던 문제)
                line_col = 0 if l["bbox"][0] < MID_X else 1
                items.append((line_col, l["bbox"][1], "txt", t, l["bbox"][0], marks))
    return sorted(items, key=lambda i: (i[0], i[1]))


def choice_for(marks, where, rect):
    """보기가 이미지일 때 그 이미지가 속한 보기 번호(0~3). 없으면 None(문제 본문 이미지).

    marks = [(쪽·단, 보기번호, x, y)]. ① 같은 줄에서 이미지 왼쪽에 가장 가까운 표시,
    ② 없으면 바로 위 줄 표시 중 가로로 가장 가까운 것.
    """
    here = [(i, x, y) for w, i, x, y in marks if w == where]
    beside = [(i, x) for i, x, y in here if rect.y0 - 4 <= y <= rect.y1 + 4 and x < rect.x0]
    if beside:
        return max(beside, key=lambda m: m[1])[0]
    above = [(i, x, y) for i, x, y in here if y <= rect.y0 + 2]
    if not above:
        return None
    row = max(y for i, x, y in above)
    return min((m for m in above if abs(m[2] - row) < 3), key=lambda m: abs(m[1] - rect.x0))[0]


def place_images(q):
    """읽는 순서대로 임시로 붙인 이미지를 좌표 기준 보기로 옮긴다."""
    for tok, where, rect, placed in q["imgs"]:
        idx = choice_for(q["marks"], where, rect)
        if idx is None or idx == placed:
            continue
        if placed is None:
            q["text"] = q["text"].replace("\n" + tok + "\n", "", 1)
        else:
            q["choices"][placed] = q["choices"][placed].replace(tok, "", 1)
        q["choices"][idx] = join(q["choices"][idx], tok)


def answer_table(text):
    """마지막 쪽 정답표: 번호 10개, 정답 10개가 번갈아 나온다."""
    tokens = re.findall(r"\d{1,3}|[%s]" % PLAIN, text)
    nums, marks, table = [], [], {}
    for t in tokens:
        if t in PLAIN:  # '②'.isdigit() 가 True 이므로 먼저 거른다
            marks.append(PLAIN.index(t) + 1)
            continue
        if marks:  # 새 번호 줄 시작 → 앞 줄 확정
            table.update(zip(nums, marks))
            nums, marks = [], []
        nums.append(int(t))
    table.update(zip(nums, marks))
    return table


def parse(doc, render_image):
    """문항 목록과 정답표. render_image(rect, page, 번호) → 이미지 토큰 문자열."""
    questions, subject, cur, target = [], None, None, None
    last = doc[len(doc) - 1]
    # 정답표는 마지막 쪽 오른쪽 단, '...에서 확인하세요.' 안내 아래에 있다
    items = page_items(last)
    notice = [c for c, y, k, v, x, _ in items if k == "txt" and "확인하세요" in v]
    tcol = notice[-1] if notice else None
    ttop = min([y for c, y, k, v, x, _ in items
                if c == tcol and k == "txt" and ("전자문제집 CBT" in v or "확인하세요" in v)] or [1e9])
    table_text = " ".join(v for c, y, k, v, x, _ in items if k == "txt" and c == tcol and y > ttop)
    for page in doc:
        for col, y, kind, val, x, marks_at in page_items(page):
            if page.number == last.number and col == tcol and y >= ttop:
                continue  # 안내문·정답표
            if kind == "img":
                if cur is not None:  # 일단 읽는 순서 위치에 붙이고, 문항이 끝나면 place_images 로 재배치
                    tok = render_image(val, page, cur["no"])
                    if target is None:
                        cur["text"] = cur["text"] + "\n" + tok + "\n"
                    else:
                        cur["choices"][target] = join(cur["choices"][target], tok)
                    cur["imgs"].append((tok, (page.number, col), val, target))
                continue
            t = val.replace("\xa0", " ")
            s = t.strip()
            m = SUBJECT.match(s)
            if m:
                subject = m.group(2).strip()
                continue
            edge = 23 if col == 0 else 305
            m = QSTART.match(t.lstrip())  # 끝 공백은 남겨야 다음 줄과 띄어 잇는다
            if m and abs(x - edge) < 4 and (cur is None or int(m.group(1)) == cur["no"] + 1):
                cur = {"no": int(m.group(1)), "subject": subject, "text": m.group(2), "choices": [], "marked": None,
                       "imgs": [], "marks": []}
                questions.append(cur)
                target = None
                continue
            if cur is None:
                continue
            parts = MARK.split(t)
            marks = MARK.findall(t)
            if parts[0].strip():  # 표시 앞부분 = 이어지는 문장
                if target is None:
                    cur["text"] = join(cur["text"], parts[0])
                else:
                    cur["choices"][target] = join(cur["choices"][target], parts[0])
            for n, (mk, body) in enumerate(zip(marks, parts[1:])):
                idx = (PLAIN + FILLED).index(mk) % 4
                while len(cur["choices"]) <= idx:
                    cur["choices"].append("")
                target = idx
                if n < len(marks_at):
                    cur["marks"].append(((page.number, col), idx) + tuple(marks_at[n]))
                cur["choices"][idx] = body.lstrip()
                if mk in FILLED:
                    cur["marked"] = idx + 1
    for q in questions:
        place_images(q)
    return questions, answer_table(table_text)


def to_question(q, key, answer):
    text = re.sub(r"\n{3,}", "\n\n", q["text"]).strip()
    return {
        "text": text,
        "type": "MCQ",
        "choices": json.dumps({str(i + 1): c.strip() for i, c in enumerate(q["choices"])}, ensure_ascii=False),
        "answerKey": str(answer) if answer else None,
        "answerKeywords": None,
        "score": 1,
        "tags": ",".join(["정보처리기사", "필기", key] + ([q["subject"]] if q["subject"] else [])),
        "explanation": None,
    }


def run(src, out, images_dir):
    os.makedirs(out, exist_ok=True)
    os.makedirs(images_dir, exist_ok=True)
    report = []
    for pdf in sorted(glob.glob(os.path.join(src, "*-*.pdf"))):
        key = os.path.basename(pdf)[:-4]
        doc = fitz.open(pdf)
        counter = {}

        def render(rect, page, no):
            n = counter[no] = counter.get(no, 0) + 1
            name = "w%s_q%03d_%d.png" % (key, no, n)
            page.get_pixmap(clip=rect, matrix=fitz.Matrix(2, 2)).save(os.path.join(images_dir, name))
            return "[이미지: %s]" % name

        qs, table = parse(doc, render)
        result = []
        for q in qs:
            ans = q["marked"] or table.get(q["no"])
            if q["marked"] and table.get(q["no"]) and q["marked"] != table[q["no"]]:
                report.append("%s Q%d: 표시 정답 %d ≠ 정답표 %d" % (key, q["no"], q["marked"], table[q["no"]]))
            if not ans:
                report.append("%s Q%d: 정답 없음" % (key, q["no"]))
            if len(q["choices"]) != 4 or not all(c.strip() for c in q["choices"]):
                report.append("%s Q%d: 보기 %d개 또는 빈 보기" % (key, q["no"], len(q["choices"])))
            if "전자문제집" in q["text"] + "".join(q["choices"]):
                report.append("%s Q%d: 사이트 안내문이 문항에 섞임" % (key, q["no"]))
            result.append(to_question(q, key, ans))
        nums = [q["no"] for q in qs]
        if nums != list(range(1, len(nums) + 1)) or len(nums) != 100:
            report.append("%s: 문항 번호 %d개, 불연속 여부 확인" % (key, len(nums)))
        with open(os.path.join(out, key + ".json"), "w", encoding="utf-8") as f:
            json.dump({"source": SOURCE, "questions": result}, f, ensure_ascii=False, indent=2)
        print("%s: %d문항, 이미지 %d개" % (key, len(result), sum(counter.values())))
    with open(os.path.join(out, "review.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(report) + "\n")
    print("검토 필요 %d건 → %s" % (len(report), os.path.join(out, "review.txt")))


def self_test():
    assert join("시간의 흐름을 나", "타낸다.") == "시간의 흐름을 나타낸다."
    assert join("모델링 ", "하는 것이다.") == "모델링 하는 것이다."
    assert join(join("설명으로 틀린 ", "것은? "), "(단, 1)") == "설명으로 틀린 것은? (단, 1)"
    # PDF가 줄 끝 공백을 지운 경계는 되살리고, 한글 단어 중간·조사는 붙인다
    assert join("SELECT 제품명 FROM 푸드", "ORDER BY 판매량 DESC;") == "SELECT 제품명 FROM 푸드 ORDER BY 판매량 DESC;"
    assert join("int i = 7, j = 9;", "int k;") == "int i = 7, j = 9; int k;"
    assert join("WHERE 지점명 = '강남지점'", "ORDER BY") == "WHERE 지점명 = '강남지점' ORDER BY"
    assert join("SELECT * FROM 공급자 WHERE", "공급자명 LIKE '%대%'") == "SELECT * FROM 공급자 WHERE 공급자명 LIKE '%대%'"
    assert join("절차형 SQL", "은?") == "절차형 SQL은?" and join("구축유형 중 Hybrid", "에 대한") == "구축유형 중 Hybrid에 대한"
    assert join("중국어과 학생 30", "명") == "중국어과 학생 30명" and join("비기능적", "(Nonfunctional)") == "비기능적(Nonfunctional)"
    assert answer_table("1 2 3 ② ① ④ 4 5 ③ ①") == {1: 2, 2: 1, 3: 4, 4: 3, 5: 1}
    doc = fitz.open()
    p = doc.new_page(width=595, height=841)
    font = fitz.Font("cjk")
    p.insert_font(fontname="k", fontbuffer=font.buffer)
    lines = [(23, 100, "1과목 : 소프트웨어 설계"), (23, 120, "1. 다음 중 틀린 것은?"),
             (23, 135, "   ① 객체 간의 동적 상호작용을 나"), (50, 147, "타낸다."),
             (23, 160, "   ❷ 정적 측면   ③ 셋째"), (23, 175, "   ④ 넷째"),
             (305, 100, "2. 둘째 문제는?"), (305, 115, "   ❶ 가   ② 나"), (305, 130, "   ③ 다   ④ 라")]
    for x, y, t in lines:
        p.insert_text((x, y), t, fontname="k", fontsize=8)
    last = doc.new_page(width=595, height=841)
    last.insert_font(fontname="k", fontbuffer=font.buffer)
    last.insert_text((23, 100), "3. 1대 1 연결은?", fontname="k", fontsize=8)  # 정답표에 섞이면 안 됨
    last.insert_text((23, 115), "   ① 10   ② 20   ❸ 30   ④ 40", fontname="k", fontsize=8)
    # 4번: 본문 이미지 1개 + 보기가 2×2 격자 이미지(①② 한 줄, 그 아래 각 이미지)
    pix = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 8, 8), 0)
    last.insert_text((23, 140), "4. 실행 결과는?", fontname="k", fontsize=8)
    last.insert_image(fitz.Rect(41, 145, 200, 175), pixmap=pix)
    for y, row in ((190, "   ①                 ❷"), (240, "   ③                 ④")):
        last.insert_text((23, y), row, fontname="k", fontsize=8)
        last.insert_image(fitz.Rect(41, y + 4, 120, y + 30), pixmap=pix)
        last.insert_image(fitz.Rect(150, y + 4, 230, y + 30), pixmap=pix)
    # 5번: 보기 이미지가 표시 '오른쪽'에 있고 이미지 위끝이 글자보다 높다(2020-12 Q50 배치)
    last.insert_text((23, 300), "5. 연산은?", fontname="k", fontsize=8)
    for y, (a, b) in ((330, ("❶", "②")), (360, ("③", "④"))):
        last.insert_text((40, y), a, fontname="k", fontsize=8)
        last.insert_text((142, y), b, fontname="k", fontsize=8)
        last.insert_image(fitz.Rect(54, y - 14, 85, y + 6), pixmap=pix)
        last.insert_image(fitz.Rect(156, y - 14, 183, y + 6), pixmap=pix)
    last.insert_text((305, 500), "오답은 CBT 에서 확인하세요.", fontname="k", fontsize=8)
    last.insert_text((310, 530), "1 2 3 4 5", fontname="k", fontsize=8)
    last.insert_text((310, 545), "② ① ③ ② ①", fontname="k", fontsize=8)
    qs, table = parse(doc, lambda r, pg, no: "[이미지: %d,%d]" % (round(r.x0), round(r.y0)))
    assert [q["no"] for q in qs] == [1, 2, 3, 4, 5], qs
    assert qs[4]["text"].strip() == "연산은?", repr(qs[4]["text"])
    assert [c.strip() for c in qs[4]["choices"]] == [
        "[이미지: 54,316]", "[이미지: 156,316]", "[이미지: 54,346]", "[이미지: 156,346]"], qs[4]["choices"]
    assert qs[3]["text"].strip() == "실행 결과는?\n[이미지: 41,145]", repr(qs[3]["text"])
    assert [c.strip() for c in qs[3]["choices"]] == [
        "[이미지: 41,194]", "[이미지: 150,194]", "[이미지: 41,244]", "[이미지: 150,244]"], qs[3]["choices"]
    assert qs[3]["marked"] == 2
    assert [c.strip() for c in qs[2]["choices"]] == ["10", "20", "30", "40"] and qs[2]["marked"] == 3, qs[2]
    assert qs[0]["subject"] == "소프트웨어 설계"
    assert [c.strip() for c in qs[0]["choices"]] == ["객체 간의 동적 상호작용을 나타낸다.", "정적 측면", "셋째", "넷째"], qs[0]["choices"]
    assert qs[0]["marked"] == 2 and qs[1]["marked"] == 1
    assert table == {1: 2, 2: 1, 3: 3, 4: 2, 5: 1}, table
    print("self-test ok")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="scraped/comcbt")
    ap.add_argument("--out", default="scraped/written")
    ap.add_argument("--images", default="question-images")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    self_test() if a.self_test else run(a.src, a.out, a.images)
