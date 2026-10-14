"""comcbt.com 기출 게시판의 '교사용' PDF를 내려받는다(scripts/parse_comcbt.py 입력).

  python scripts/download_comcbt.py --board ccw --out scraped/comcbt-sec   # 정보보안기사 필기

저장 이름: <연도>-<회차>.pdf (글 제목의 'YYYY년 MM월 DD일(N회)'). 이미 있으면 건너뛴다.
사이트가 브라우저가 아닌 요청을 끊으므로 브라우저 헤더를 붙인다.
"""
import argparse
import html
import os
import re
import time
import urllib.request

BASE = "https://www.comcbt.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*",
    "Accept-Language": "ko-KR,ko;q=0.9",
}
POST = r'href="([^"]*mid=%s[^"]*document_srl=\d+)"[^>]*>\s*([^<]*기출문제 및 CBT\s*(\d{4})년[^<(]*\((\d+)회\)[^<]*)<'
PDF = re.compile(r'href="([^"]*procFileDownload[^"]*)"[^>]*>\s*([^<]*교사용\)?\.pdf)\s*<')


def get(url, referer=None):
    h = dict(HEADERS, **({"Referer": referer} if referer else {}))
    with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=60) as r:
        return r.read()


def run(board, out, pages):
    os.makedirs(out, exist_ok=True)
    posts = {}
    for p in range(1, pages + 1):
        page = get("%s/xe/index.php?mid=%s&page=%d" % (BASE, board, p)).decode("utf-8", "replace")
        for m in re.finditer(POST % board, page):
            href, title, year, rnd = m.groups()
            posts.setdefault("%s-%s" % (year, rnd), (html.unescape(href), title.strip()))
    for key, (href, title) in sorted(posts.items()):
        path = os.path.join(out, key + ".pdf")
        if os.path.exists(path):
            continue
        url = href if href.startswith("http") else BASE + href
        m = PDF.search(get(url).decode("utf-8", "replace"))
        if not m:
            print("%s: 교사용 PDF 없음 (%s)" % (key, title))
            continue
        file_url = html.unescape(m.group(1))
        data = get(file_url if file_url.startswith("http") else BASE + file_url, referer=url)
        if not data.startswith(b"%PDF"):
            print("%s: PDF가 아닌 응답 %d바이트" % (key, len(data)))
            continue
        with open(path, "wb") as f:
            f.write(data)
        print("%s: %s (%d KB)" % (key, m.group(2), len(data) // 1024))
        time.sleep(1)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--board", default="ccw")
    ap.add_argument("--out", default="scraped/comcbt-sec")
    ap.add_argument("--pages", type=int, default=2)
    a = ap.parse_args()
    run(a.board, a.out, a.pages)
