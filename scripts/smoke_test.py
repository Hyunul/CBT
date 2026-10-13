"""Exercise a disposable local Compose stack; never use against production."""
import argparse
import concurrent.futures
import json
import subprocess
import urllib.error
import urllib.request
import uuid

parser = argparse.ArgumentParser()
parser.add_argument("--env-file", required=True)
parser.add_argument("--project", required=True)
parser.add_argument("--base-url", default="http://localhost:18080")
args = parser.parse_args()
if not args.project.startswith("cbt-validation-") or args.base_url != "http://localhost:18080":
    parser.error("Only the disposable cbt-validation stack on localhost:18080 is allowed")


def request(path, method="GET", body=None, token=None, guest=None, expected=200):
    headers = {}
    if token:
        headers["Authorization"] = "Bearer " + token
    if guest:
        headers["X-Attempt-Key"] = guest
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    req = urllib.request.Request(args.base_url + path, data, headers, method=method)
    try:
        res = urllib.request.urlopen(req, timeout=20)
    except urllib.error.HTTPError as error:
        res = error
    status = res.code
    raw = res.read()
    assert status == expected, (method, path, status, expected, raw[:200])
    return (json.loads(raw) if raw else None), res.headers


username = "smoke_" + uuid.uuid4().hex[:12]
password = uuid.uuid4().hex
user, _ = request("/api/auth/signup", "POST", {
    "username": username, "email": username + "@example.com",
    "password": password, "role": "ROLE_ADMIN",
})
assert user["data"]["role"] == "ROLE_USER"
request("/api/series", "POST", {"name": "unauthorized"}, expected=401)
login, _ = request("/api/auth/login", "POST", {"username": username, "password": password})
tokens = login["data"]
request("/api/series", "POST", {"name": "unauthorized"}, token=tokens["accessToken"], expected=403)
request("/api/attempts/history", token=tokens["refreshToken"], expected=401)

# Promote only the newly created fixture in the explicitly named disposable database.
sql = "UPDATE users SET role='ROLE_ADMIN' WHERE username='" + username + "';"
subprocess.run([
    "docker", "compose", "--env-file", args.env_file, "-p", args.project,
    "exec", "-T", "db", "sh", "-c",
    'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u "$MYSQL_USER" cbt_platform',
], input=sql, text=True, check=True, capture_output=True)
login, _ = request("/api/auth/login", "POST", {"username": username, "password": password})
token = login["data"]["accessToken"]
request("/api/attempts/history", token=tokens["accessToken"], expected=401)
series, _ = request("/api/series", "POST", {"name": username}, token=token)
exam, _ = request("/api/exams", "POST", {
    "title": username, "durationSec": 600, "seriesId": series["data"]["id"], "round": 1,
}, token=token)
exam_id = exam["data"]["id"]
request("/api/exams/" + str(exam_id), expected=404)
request("/api/attempts/start/" + str(exam_id), "POST", expected=404)
question = {
    "text": "1+1?", "type": "MCQ", "choices": '{"1":"2","2":"3"}',
    "answerKey": "1", "score": 10, "explanation": "Addition",
}
request(f"/api/exams/{exam_id}/questions", "PUT", {"questions": [question]}, token=token)
request(f"/api/exams/{exam_id}/publish?on=true", "PATCH", token=token)
exam, _ = request(f"/api/exams/{exam_id}")
assert exam["data"]["questionCount"] == 1 and exam["data"]["totalScore"] == 10
assert "email" not in exam["data"]["author"]
attempt, headers = request(f"/api/attempts/start/{exam_id}", "POST")
key = headers["X-Attempt-Key"]
request(f"/api/attempts/{attempt}", expected=403)
detail, _ = request(f"/api/attempts/{attempt}", guest=key)
answer = [{"questionId": detail["questions"][0]["id"], "selectedChoices": "1"}]
request(f"/api/attempts/{attempt}/result", guest=key, expected=409)
request(f"/api/attempts/{attempt}/answers", "POST", answer, guest=key, expected=204)
detail, _ = request(f"/api/attempts/{attempt}", guest=key)
assert detail["answers"][0]["selectedChoices"] == "1"
with concurrent.futures.ThreadPoolExecutor(2) as pool:
    results = list(pool.map(lambda _: request(f"/api/attempts/{attempt}/submit", "POST", answer, guest=key)[0], range(2)))
assert results[0] == results[1] and results[0]["totalScore"] == 10
request(f"/api/attempts/{attempt}/answers", "POST", answer, guest=key, expected=409)
request(f"/api/attempts/{attempt}/result", guest=key)
member_attempt, _ = request(f"/api/attempts/start/{exam_id}", "POST", token=token)
request(f"/api/attempts/{member_attempt}/submit", "POST", answer, token=token)
request(f"/api/attempts/{member_attempt}/submit", "POST", answer, token=token)
rank, _ = request(f"/api/ranking/exam/{exam_id}")
assert rank[0]["score"] == 10
global_rank, _ = request("/api/ranking/global/submissions")
assert next(row for row in global_rank if row["username"] == username)["score"] == 1
request(f"/api/exams/{exam_id}/questions", "PUT", {"questions": [question]}, token=token, expected=409)

old_refresh = login["data"]["refreshToken"]
rotated, _ = request("/api/auth/refresh", "POST", {"refreshToken": old_refresh})
assert rotated["data"]["refreshToken"] != old_refresh
request("/api/auth/refresh", "POST", {"refreshToken": old_refresh}, expected=401)
def refresh_race(_):
    req = urllib.request.Request(args.base_url + "/api/auth/refresh",
        json.dumps({"refreshToken": rotated["data"]["refreshToken"]}).encode(),
        {"Content-Type": "application/json"}, method="POST")
    try:
        res = urllib.request.urlopen(req, timeout=20)
    except urllib.error.HTTPError as error:
        res = error
    return res.code, json.loads(res.read())

with concurrent.futures.ThreadPoolExecutor(2) as pool:
    rotations = list(pool.map(refresh_race, range(2)))
assert sorted(status for status, _ in rotations) == [200, 401]
rotated = next(body for status, body in rotations if status == 200)
request("/api/auth/logout", "POST", {"refreshToken": rotated["data"]["refreshToken"]})
request("/api/attempts/history", token=rotated["data"]["accessToken"], expected=401)
request("/api/auth/refresh", "POST", {"refreshToken": rotated["data"]["refreshToken"]}, expected=401)
print("PASS: signup roles, admin authorization, hidden exams, guest ownership, answer restore,")
print("concurrent/idempotent submission, grading, rankings, refresh rotation and logout revocation")
