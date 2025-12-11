-- 1. 관리자 확인 (username 'admin'이 없으면 생성)
-- 비밀번호는 '1234'의 BCrypt 해시값
INSERT INTO users (email, password, username, role, created_at)
SELECT 'admin@example.com', '$2a$10$YourHashedPasswordHere', 'admin', 'ROLE_ADMIN', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- 2. 자격증 종목 (ExamSeries) 생성
INSERT INTO exam_series (name, description, created_at, updated_at)
SELECT '정보처리기사', '국가기술자격 정보처리기사 필기 기출문제', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM exam_series WHERE name = '정보처리기사');

-- 3. 시험 (Exam) 생성
-- series_id: exam_series 테이블의 id
-- created_by: users 테이블의 id
-- total_score: 100점 만점 설정 추가
INSERT INTO exams (title, series_id, round, created_by, duration_sec, total_score, is_published, created_at, updated_at)
SELECT 
    '2024년 1회 정보처리기사 필기', 
    (SELECT id FROM exam_series WHERE name = '정보처리기사' LIMIT 1),
    1, -- 1회차
    (SELECT id FROM users WHERE username = 'admin' LIMIT 1),
    9000, -- 150분 (9000초)
    100,  -- 총점
    true, -- 공개 여부
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE title = '2024년 1회 정보처리기사 필기');

-- 4. 문제 (Questions) 삽입
-- exam_id는 위에서 생성한 시험의 ID를 조회하여 사용
INSERT INTO questions (exam_id, type, text, choices, answer_key, score, explanation)
SELECT 
    (SELECT id FROM exams WHERE title = '2024년 1회 정보처리기사 필기' LIMIT 1),
    'MCQ',
    '객체지향 분석 방법론 중 E-R 다이어그램을 사용하여 객체의 행위를 모델링하며, 객체 식별, 구조식별, 주체 정의, 속성 및 관계 정의, 서비스 정의 등의 과정으로 구성되는 것은?',
    '["Coad와 Yourdon 방법", "Booch 방법", "Jacobson 방법", "Wirfs-Brock 방법"]',
    'Coad와 Yourdon 방법',
    5,
    'Coad와 Yourdon 방법은 E-R 다이어그램을 사용하여 객체의 행위를 모델링합니다.'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE text LIKE '객체지향 분석 방법론 중 E-R 다이어그램을 사용하여%');

INSERT INTO questions (exam_id, type, text, choices, answer_key, score, explanation)
SELECT 
    (SELECT id FROM exams WHERE title = '2024년 1회 정보처리기사 필기' LIMIT 1),
    'MCQ',
    '트랜잭션이 올바르게 처리되고 있는지 데이터를 감시하고 제어하는 미들웨어는?',
    '["RPC", "ORB", "TP monitor", "HUB"]',
    'TP monitor',
    5,
    'TP monitor(Transaction Processing Monitor)는 트랜잭션이 올바르게 처리되고 있는지 감시하고 제어하는 미들웨어입니다.'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE text LIKE '트랜잭션이 올바르게 처리되고 있는지%');

INSERT INTO questions (exam_id, type, text, choices, answer_key, score, explanation)
SELECT 
    (SELECT id FROM exams WHERE title = '2024년 1회 정보처리기사 필기' LIMIT 1),
    'MCQ',
    '자료 흐름도(Data Flow Diagram)의 구성 요소로 옳은 것은?',
    '["process, data flow, data store, terminator", "process, data flow, data store, relationship", "entity, process, data store, terminator", "entity, relationship, data store, terminator"]',
    'process, data flow, data store, terminator',
    5,
    '자료 흐름도(DFD)의 구성 요소: Process(처리), Data Flow(자료 흐름), Data Store(자료 저장소), Terminator(단말)'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE text LIKE '자료 흐름도(Data Flow Diagram)의 구성 요소로 옳은 것은?%');

INSERT INTO questions (exam_id, type, text, choices, answer_key, score, explanation)
SELECT 
    (SELECT id FROM exams WHERE title = '2024년 1회 정보처리기사 필기' LIMIT 1),
    'MCQ',
    'UML(Unified Modeling Language)에 대한 설명 중 틀린 것은?',
    '["UML은 소프트웨어 시스템의 산출물을 가시화, 명세화, 구축, 문서화하는 언어이다.", "UML은 OMG(Object Management Group)에서 표준으로 채택되었다.", "UML의 다이어그램은 구조 다이어그램과 행위 다이어그램으로 구분된다.", "State Diagram은 객체들 사이의 메시지 교환을 나타내며, Sequence Diagram은 하나의 객체가 가진 상태와 그 상태의 변화에 의한 동작순서를 나타낸다."]',
    'State Diagram은 객체들 사이의 메시지 교환을 나타내며, Sequence Diagram은 하나의 객체가 가진 상태와 그 상태의 변화에 의한 동작순서를 나타낸다.',
    5,
    'State Diagram(상태 다이어그램)은 객체의 상태 변화를, Sequence Diagram(순차 다이어그램)은 객체 간의 메시지 교환을 시간 순서로 나타냅니다. 보기는 설명이 반대로 되어 있습니다.'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE text LIKE 'UML(Unified Modeling Language)에 대한 설명 중 틀린 것은?%');

INSERT INTO questions (exam_id, type, text, choices, answer_key, score, explanation)
SELECT 
    (SELECT id FROM exams WHERE title = '2024년 1회 정보처리기사 필기' LIMIT 1),
    'MCQ',
    '사용자 인터페이스(UI)의 특징으로 틀린 것은?',
    '["사용자의 만족도를 높여야 한다.", "사용자의 편의성을 높임으로써 작업시간을 증가시킨다.", "사용자의 수행 오류를 최소화해야 한다.", "사용자 중심으로 설계되어야 한다."]',
    '사용자의 편의성을 높임으로써 작업시간을 증가시킨다.',
    5,
    'UI는 사용자의 편의성을 높여 작업 시간을 단축시키는 것을 목적으로 합니다.'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE text LIKE '사용자 인터페이스(UI)의 특징으로 틀린 것은?%');
