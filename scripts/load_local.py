"""scraped/*.json 을 로컬 Compose 스택의 DB에 시험·문제로 넣는다. 로컬 전용.

  python scripts/scrape_chobopark.py          # scraped/, question-images/ 생성
  python scripts/load_local.py                # 시리즈 1개 + 회차별 시험 + 문제 삽입
  python scripts/load_local.py --print        # 실행할 SQL만 출력
  python scripts/load_local.py --replace      # 이 시리즈(응시 기록 포함)를 지우고 다시 삽입
  python scripts/load_local.py --kind written # 필기(scripts/parse_comcbt.py 결과)
  python scripts/load_local.py --kind security-written   # 정보보안기사 필기
  python scripts/load_local.py --kind written --update-content   # 응시 기록 유지, 문항 내용만 갱신
  python scripts/load_local.py --env-file test.env -p cbt-validation-local   # 임시 검증 스택

관리자 로그인 없이 db 컨테이너의 mysql로 직접 넣는다(scripts/smoke_test.py 와 같은 방식).
같은 이름의 시리즈가 이미 있으면 중단한다(--replace 제외).
"""
import argparse
import glob
import json
import os
import subprocess
import sys

KINDS = {
    "practical": {
        "dir": "scraped", "type": "PRACTICAL", "series": "정보처리기사 실기 (복원)",
        "series_desc": "chobopark.tistory.com 복원 문제(CC BY 4.0, 저작자 Life-Journey)",
        "title": "정보처리기사 실기 %s년 %s회 (복원)",
        "desc": "출처: Life-Journey, %s (CC BY 4.0)\n수험생 기억 기반 복원 문제로 실제 시험과 다를 수 있습니다.",
    },
    "written": {  # scripts/parse_comcbt.py 결과
        "dir": "scraped/written", "type": "WRITTEN", "series": "정보처리기사 필기",
        "series_desc": "2020년 개편 이후 정보처리기사 필기 기출문제(전자문제집 CBT 교사용 자료)",
        "title": "정보처리기사 필기 %s년 %s회",
        "desc": "출처: 전자문제집 CBT %s",
        "merged12": True,  # 파일 2020-12 = 2020년 1·2회 통합 시행
    },
    "security-written": {  # scripts/download_comcbt.py → parse_comcbt.py --cert 정보보안기사 결과
        "dir": "scraped/written-sec", "type": "WRITTEN", "series": "정보보안기사 필기",
        "series_desc": "정보보안기사 필기 기출문제 1~21회(전자문제집 CBT 교사용 자료)",
        "title": "정보보안기사 필기 %s년 %s회",
        "desc": "출처: 전자문제집 CBT %s",
    },
}
DURATION_SEC = 150 * 60
MYSQL = ["exec", "-T", "db", "sh", "-c",
         'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u "$MYSQL_USER" --default-character-set=utf8mb4 -N cbt_platform']
COMPOSE = ["docker", "compose"]


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"


def delete_sql(SERIES):
    """이 시리즈와 그 시험의 응시 기록·문제를 모두 지운다(--replace)."""
    exams = "SELECT e.id FROM exams e JOIN exam_series s ON s.id=e.series_id WHERE s.name=%s" % q(SERIES)
    return [
        "DELETE x FROM answers x JOIN attempts a ON a.id=x.attempt_id WHERE a.exam_id IN (%s);" % exams,
        "DELETE FROM attempts WHERE exam_id IN (SELECT id FROM (%s) t);" % exams,
        "DELETE FROM questions WHERE exam_id IN (SELECT id FROM (%s) t);" % exams,
        "DELETE FROM exams WHERE id IN (SELECT id FROM (%s) t);" % exams,
        "DELETE FROM exam_series WHERE name=%s;" % q(SERIES),
    ]


def round_order(kind, key):
    """파일 이름 <연도>-<회차> 의 시행 순서(문자열 정렬은 2017-10 이 2017-9 앞에 온다)."""
    year, rnd = key.split("-")
    return int(year), 1.5 if KINDS[kind].get("merged12") and rnd == "12" else int(rnd)


def exam_title(kind, key):
    year, rnd = key.split("-")
    rnd = "1·2" if KINDS[kind].get("merged12") and rnd == "12" else rnd
    return KINDS[kind]["title"] % (year, rnd)


def update_sql(rounds, kind):
    """--update-content: 문항 내용(본문·보기·정답·해설·태그)만 제자리 갱신한다. 응시·답안 기록은 그대로 둔다.

    문항은 시험별 id 순서 = 파일의 문항 순서로 대응시킨다(적재 때 순서대로 넣었으므로).
    """
    ranked = ("SELECT x.id, e.title, ROW_NUMBER() OVER (PARTITION BY x.exam_id ORDER BY x.id) rn"
              " FROM questions x JOIN exams e ON e.id=x.exam_id JOIN exam_series s ON s.id=e.series_id"
              " WHERE s.name=%s" % q(KINDS[kind]["series"]))
    out = ["START TRANSACTION;"]
    for key, data in rounds:
        for n, x in enumerate(data["questions"], 1):
            out.append(
                "UPDATE questions t JOIN (%s) r ON r.id=t.id SET t.text=%s, t.choices=%s, t.answer_key=%s,"
                " t.answer_keywords=%s, t.explanation=%s, t.tags=%s WHERE r.title=%s AND r.rn=%d;"
                % (ranked, q(x["text"]), q(x["choices"]), q(x["answerKey"]), q(x["answerKeywords"]),
                   q(x["explanation"]), q(x["tags"]), q(exam_title(kind, key)), n))
    out.append("COMMIT;")
    return "\n".join(out) + "\n"


def count_sql(kind):
    return ("SELECT e.title, COUNT(x.id) FROM exams e JOIN exam_series s ON s.id=e.series_id"
            " LEFT JOIN questions x ON x.exam_id=e.id WHERE s.name=%s GROUP BY e.id ORDER BY e.round;"
            % q(KINDS[kind]["series"]))


def build_sql(rounds, kind, replace=False):
    k = KINDS[kind]
    out = ["START TRANSACTION;"] + (delete_sql(k["series"]) if replace else []) + [
           "INSERT INTO exam_series(name, description, created_at, updated_at) VALUES (%s, %s, NOW(6), NOW(6));"
           % (q(k["series"]), q(k["series_desc"])),
           "SET @s = LAST_INSERT_ID();"]
    for no, (key, data) in enumerate(rounds, 1):
        out.append("INSERT INTO exams(series_id, round, title, description, duration_sec, type, is_published,"
                   " created_at, updated_at) VALUES (@s, %d, %s, %s, %d, %s, 1, NOW(6), NOW(6));"
                   % (no, q(exam_title(kind, key)), q(k["desc"] % data["source"]), DURATION_SEC, q(k["type"])))
        out.append("SET @e = LAST_INSERT_ID();")
        rows = ["(@e, %s, %s, %s, %s, %s, %s, %s, %s)" % (
            q(x["type"]), q(x["text"]), q(x["choices"]), q(x["answerKey"]), q(x["answerKeywords"]),
            q(x["score"]), q(x["tags"]), q(x["explanation"])) for x in data["questions"]]
        out.append("INSERT INTO questions(exam_id, type, text, choices, answer_key, answer_keywords,"
                   " score, tags, explanation) VALUES\n" + ",\n".join(rows) + ";")
    out.append("COMMIT;")
    return "\n".join(out) + "\n"


def mysql(sql):
    return subprocess.run(COMPOSE + MYSQL, input=sql, text=True, encoding="utf-8",
                          capture_output=True, check=True).stdout.strip()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--kind", choices=sorted(KINDS), default="practical")
    ap.add_argument("--dir", help="기본값: 종류별 scraped 디렉터리")
    ap.add_argument("--print", action="store_true")
    ap.add_argument("--replace", action="store_true", help="기존 시리즈(응시 기록 포함)를 지우고 다시 넣는다")
    ap.add_argument("--update-content", action="store_true",
                    help="응시 기록은 두고 문항 내용만 제자리 갱신한다(재파싱으로 본문·보기를 고쳤을 때)")
    ap.add_argument("--env-file", help="임시 검증 스택용 env 파일")
    ap.add_argument("-p", "--project", help="Compose 프로젝트 이름(예: cbt-validation-local)")
    args = ap.parse_args()
    if args.env_file:
        COMPOSE += ["--env-file", args.env_file]
    if args.project:
        COMPOSE += ["-p", args.project]

    SERIES = KINDS[args.kind]["series"]
    src = args.dir or KINDS[args.kind]["dir"]
    files = sorted(glob.glob(os.path.join(src, "*-*.json")),
                   key=lambda f: round_order(args.kind, os.path.basename(f)[:-5]))
    if not files:
        sys.exit("%s/*.json 이 없습니다. 스크래핑·파싱 스크립트를 먼저 실행하세요." % src)
    rounds = [(os.path.basename(f)[:-5], json.load(open(f, encoding="utf-8"))) for f in files]
    sql = update_sql(rounds, args.kind) if args.update_content else build_sql(rounds, args.kind, args.replace)
    assert q("a'b\\,c") == "'a''b\\\\,c'"  # 작은따옴표·백슬래시 이스케이프

    if args.print:
        sys.stdout.write(sql)
        sys.exit()
    if args.update_content:
        # 시험별 문항 수가 파일과 같을 때만 순서 대응이 맞다
        have = dict(line.split("\t") for line in mysql(count_sql(args.kind)).splitlines() if line)
        want = {exam_title(args.kind, key): str(len(d["questions"])) for key, d in rounds}
        if have != want:
            sys.exit("DB와 파일의 시험·문항 수가 다릅니다. 갱신하지 않습니다.\nDB: %s\n파일: %s" % (have, want))
        mysql(sql)
        print("문항 %d개 내용 갱신(응시 기록 유지)" % sum(int(v) for v in want.values()))
        sys.exit()
    if not args.replace and mysql("SELECT COUNT(*) FROM exam_series WHERE name=%s;" % q(SERIES)) != "0":
        sys.exit("이미 '%s' 시리즈가 있습니다. 다시 넣으려면 --replace 를 쓰세요." % SERIES)
    mysql(sql)
    print(mysql("SELECT e.title, COUNT(x.id) FROM exams e JOIN exam_series s ON s.id=e.series_id"
                " LEFT JOIN questions x ON x.exam_id=e.id WHERE s.name=%s GROUP BY e.id ORDER BY e.round;"
                % q(SERIES)))
