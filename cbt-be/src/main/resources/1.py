import mysql.connector
import json
from datetime import datetime

# Database connection config
db_config = {
    'user': 'root',
    'password': '1234',
    'host': 'localhost',
    'database': 'cbt_platform',
    'raise_on_warnings': True
}

# Data to insert
exam_series_name = "정보처리기사"
exams_data = [
    {
        "round": 1,
        "title": "2024년 1회 정보처리기사 실기",
        "duration": 9000, # 2.5 hours in seconds
        "total_score": 100
    },
    {
        "round": 2,
        "title": "2024년 2회 정보처리기사 실기",
        "duration": 9000,
        "total_score": 100
    },
    {
        "round": 3,
        "title": "2024년 3회 정보처리기사 실기",
        "duration": 9000,
        "total_score": 100
    }
]

# Helper to generate questions
def get_questions(exam_round):
    questions = []
    
    # Common topics mixed for variety, roughly based on recent trends
    # 20 questions per exam
    
    if exam_round == 1:
        # 2024 Round 1 Mock
        q_data = [
            ("Java", "다음 Java 코드의 출력 결과를 쓰시오.\nclass A {\n  public void paint() { System.out.print(\"A\"); }\n  public void draw() { System.out.print(\"B\"); paint(); }\n}\nclass B extends A {\n  public void paint() { System.out.print(\"C\"); }\n  public void draw() { System.out.print(\"D\"); paint(); }\n}\npublic class Main {\n  public static void main(String[] args) {\n    A a = new B();\n    a.draw();\n  }\n}", "DC"),
            ("Design Pattern", "객체를 생성하기 위한 인터페이스를 정의하는데, 어떤 클래스의 인스턴스를 만들지는 서브클래스에서 결정하도록 하는 디자인 패턴은?", "Factory Method,팩토리 메서드"),
            ("Network", "OSI 7계층 중 데이터의 전송을 담당하며, 오류 제어와 흐름 제어를 수행하는 계층은?", "Data Link Layer,데이터 링크 계층"),
            ("SQL", "STUDENT 테이블에서 'name'이 'Kim'인 튜플을 삭제하는 SQL문을 작성하시오.", "DELETE FROM STUDENT WHERE name = 'Kim';"),
            ("Security", "네트워크상에서 자체적으로 복제하여 전파되며, 독자적으로 실행되는 악성 프로그램은?", "Worm,웜"),
            ("C Language", "다음 C 언어 코드의 출력값은?\nint main() {\n int i = 0, sum = 0;\n while (i < 5) {\n i++;\n sum += i;\n }\n printf(\"%d\", sum);\n}", "15"),
            ("Database", "트랜잭션의 특징 중 하나로, 트랜잭션 내의 모든 연산이 완벽하게 수행되거나, 아니면 전혀 수행되지 않아야 함을 의미하는 것은?", "Atomicity,원자성"),
            ("Testing", "입력 조건의 중간값보다 경계값에서 오류가 발생할 확률이 높다는 점을 이용한 테스트 기법은?", "Boundary Value Analysis,경계값 분석"),
            ("Python", "다음 Python 코드의 결과는?\na = [1, 2, 3]\nb = a[:]\na[0] = 5\nprint(b[0])", "1"),
            ("OS", "프로세스 상태 전이 중, 준비(Ready) 상태에서 실행(Running) 상태로 변하는 과정을 무엇이라 하는가?", "Dispatch,디스패치"),
            ("UML", "UML 다이어그램 중 객체 간의 메시지 전달을 시간 순서대로 표현하며, 수직선은 객체의 생명선을 나타내는 다이어그램은?", "Sequence Diagram,시퀀스 다이어그램"),
            ("Algorithm", "FIFO(First In First Out) 구조를 가지며, 삽입은 한쪽 끝, 삭제는 반대쪽 끝에서 일어나는 자료구조는?", "Queue,큐"),
            ("Coupling", "모듈 간의 결합도(Coupling) 중 가장 결합도가 강한(안 좋은) 것은?", "Content Coupling,내용 결합"),
            ("Cohesion", "모듈 내부의 모든 기능이 단일 목적을 위해 수행되는 경우의 응집도는?", "Functional Cohesion,기능적 응집도"),
            ("Interface", "EAI 구축 유형 중, 애플리케이션 사이에 미들웨어를 두어 처리하는 방식은?", "Message Bus,메시지 버스"),
            ("Software Engineering", "소프트웨어 개발 생명주기(SDLC) 중 폭포수 모형의 단점을 보완하기 위해 점진적으로 시스템을 개발하는 모형은?", "Spiral Model,나선형 모형"),
            ("Web Standard", "비동기 통신 기술을 이용하여 서버와 브라우저가 데이터를 교환하는 방식(기술)의 약자는?", "AJAX"),
            ("Network", "IPv4의 주소 부족 문제를 해결하기 위해 개발된 128비트 주소 체계는?", "IPv6"),
            ("Secure Coding", "입력 데이터의 유효성을 검증하지 않아 발생하는 보안 약점 중 하나로, SQL 쿼리에 악의적인 구문을 삽입하는 공격은?", "SQL Injection,SQL 인젝션,SQL 삽입"),
            ("Concurrency", "둘 이상의 프로세스가 서로 상대방의 자원을 기다리며 무한 대기에 빠지는 현상은?", "Deadlock,교착상태")
        ]
    elif exam_round == 2:
        # 2024 Round 2 Mock
        q_data = [
            ("C Language", "다음 C 코드의 출력은?\nchar *str = \"KOREA\";\nprintf(\"%c\", *(str+2));", "R"),
            ("Database", "관계 데이터베이스에서 릴레이션의 모든 튜플을 유일하게 식별할 수 있는 속성 집합을 무엇이라 하는가?", "Super Key,슈퍼키"),
            ("OS", "페이지 교체 알고리즘 중 가장 오랫동안 사용되지 않은 페이지를 교체하는 기법은?", "LRU"),
            ("Network", "TCP/IP 프로토콜에서 IP 주소를 MAC 주소로 변환해주는 프로토콜은?", "ARP"),
            ("Java", "다음 Java 코드에서 알맞은 접근 제어자는? (패키지 외부에서도 접근 가능)\n[    ] class Car { ... }", "public"),
            ("Design Pattern", "복잡한 인스턴스를 조립하여 만드는 구조로, 생성과 표기를 분리하는 패턴은?", "Builder,빌더"),
            ("Security", "암호화 키와 복호화 키가 동일한 암호화 방식은?", "Symmetric Key Cryptography,대칭키 암호화,비공개키 암호화"),
            ("UML", "클래스 다이어그램에서 '전체-부분' 관계를 나타내며, 부분이 전체에 종속적이지 않은 관계(빈 마름모)는?", "Aggregation,집합 관계"),
            ("Refactoring", "코드의 외부 동작은 유지하면서 내부 구조를 개선하는 작업은?", "Refactoring,리팩토링"),
            ("SQL", "Employees 테이블에서 Salary가 5000 이상인 직원의 수를 구하는 쿼리는?\nSELECT [    ] FROM Employees WHERE Salary >= 5000;", "COUNT(*),COUNT"),
            ("Python", "다음 파이썬 코드의 출력값은?\ndef func(num):\n  if num < 2: return num\n  else: return func(num-1) + func(num-2)\nprint(func(4))", "3"),
            ("Protocol", "전자우편 전송에 사용되는 표준 프로토콜은?", "SMTP"),
            ("Normalization", "제3정규형(3NF)에서 BCNF로 갈 때 제거해야 하는 이상 현상의 원인은?", "결정자가 후보키가 아닌 함수 종속"),
            ("UX/UI", "사용자가 시스템을 이용하면서 느끼는 지각과 반응, 행동 등 총체적 경험을 의미하는 용어는?", "UX,User Experience,사용자 경험"),
            ("OS", "UNIX 시스템에서 파일의 권한 모드를 변경하는 명령어는?", "chmod"),
            ("Testing", "소프트웨어의 하위 모듈에서 상위 모듈 방향으로 통합하며 테스트하는 방식은?", "Bottom-up Integration,상향식 통합"),
            ("Data Structure", "이진 탐색 트리(BST)에서 노드를 삭제할 때 가장 복잡한 경우는 자식 노드가 몇 개일 때인가?", "2,2개"),
            ("Cloud", "클라우드 서비스 모델 중 소프트웨어를 웹에서 바로 사용할 수 있는 형태(예: Gmail, Dropbox)는?", "SaaS"),
            ("Network", "데이터 전송 시 오류 검출을 위해 데이터 뒤에 붙이는 코드로, 다항식 연산을 사용하는 방식은?", "CRC"),
            ("Design Pattern", "한 객체의 상태가 바뀌면 그 객체에 의존하는 다른 객체들에게 연락이 가고 자동으로 내용이 갱신되는 패턴은?", "Observer,옵저버")
        ]
    else:
        # 2024 Round 3 Mock
        q_data = [
            ("Java", "Java에서 인터페이스를 구현하기 위해 사용하는 키워드는?", "implements"),
            ("SQL", "테이블의 구조(컬럼 추가 등)를 변경할 때 사용하는 SQL 명령어는?", "ALTER"),
            ("Security", "시스템의 보안 취약점을 찾아내기 위해 모의 침투 테스트를 수행하는 화이트 해커 그룹을 지칭하는 용어는?", "Red Team,레드팀"),
            ("C Language", "다음 C 코드의 실행 결과는?\nint a=3, b=2;\nprintf(\"%d\", a&b);", "2"),
            ("OS", "HRN(Highest Response-ratio Next) 스케줄링에서 우선순위 계산 공식은? (대기시간: W, 서비스시간: S)", "(W+S)/S"),
            ("Design Pattern", "기능 계층과 구현 계층을 분리하여 독립적으로 확장할 수 있게 하는 패턴은?", "Bridge,브리지"),
            ("Database", "트랜잭션이 격리성(Isolation)을 만족하지 못할 때 발생하는 문제 중, 읽기 작업 반복 시 결과가 달라지는 현상은?", "Non-repeatable Read,비반복적 읽기"),
            ("UML", "유스케이스 다이어그램에서 두 유스케이스 간의 관계 중, 하나의 유스케이스가 다른 유스케이스를 반드시 실행해야 하는 관계는?", "Include,포함"),
            ("Python", "Python에서 리스트의 맨 마지막 요소를 제거하고 반환하는 메소드는?", "pop()"),
            ("Network", "사설 IP 주소를 공인 IP 주소로 변환하여 인터넷에 접속하게 해주는 기술은?", "NAT"),
            ("Software Engineering", "요구사항 명세서에 기술된 내용이 사용자의 요구를 만족하는지 확인하는 과정은?", "Validation,확인"),
            ("Algorithm", "정렬된 데이터에서 중앙값을 기준으로 범위를 반으로 줄여가며 찾는 탐색 알고리즘은?", "Binary Search,이진 탐색"),
            ("Security", "암호화된 데이터를 전송할 때, 중간에서 가로채어 재전송함으로써 정당한 사용자인 것처럼 속이는 공격은?", "Replay Attack,재전송 공격"),
            ("Design Pattern", "요청을 객체의 형태로 캡슐화하여, 서로 다른 요청을 큐에 저장하거나 로그로 남길 수 있게 하는 패턴은?", "Command,커맨드"),
            ("SQL", "SQL에서 중복된 행을 제거하기 위해 사용하는 키워드는?", "DISTINCT"),
            ("OS", "가상 메모리 시스템에서 프로세스가 실행되는 동안 자주 참조되는 페이지들의 집합을 무엇이라 하는가?", "Working Set,워킹 셋"),
            ("Testing", "프로그램의 논리적 경로를 최소한 한 번은 실행하도록 하는 화이트박스 테스트 기법은?", "Basis Path Testing,기초 경로 검사"),
            ("Java", "Java에서 예외 처리를 위해 사용하는 블록 조합은?", "try-catch-finally"),
            ("Coupling", "두 모듈이 동일한 전역 변수를 사용할 때의 결합도는?", "Common Coupling,공통 결합"),
            ("Hardware", "RAID 레벨 중 스트라이핑(Striping) 기술을 사용하여 입출력 속도를 높이지만 결함 허용은 제공하지 않는 레벨은?", "RAID 0")
        ]

    return q_data

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    # 1. Insert Exam Series
    cursor.execute("SELECT id FROM exam_series WHERE name = %s", (exam_series_name,))
    series = cursor.fetchone()
    if not series:
        print(f"Creating Series: {exam_series_name}")
        cursor.execute(
            "INSERT INTO exam_series (name, description, created_at, updated_at) VALUES (%s, %s, NOW(), NOW())",
            (exam_series_name, "정보처리기사 실기 기출문제 및 모의고사")
        )
        series_id = cursor.lastrowid
    else:
        series_id = series[0]
        print(f"Series exists: {series_id}")

    # 2. Insert Exams and Questions
    for exam_meta in exams_data:
        # Check if exam exists
        cursor.execute(
            "SELECT id FROM exams WHERE title = %s AND series_id = %s",
            (exam_meta["title"], series_id)
        )
        exam = cursor.fetchone()
        
        if not exam:
            print(f"Creating Exam: {exam_meta['title']}")
            cursor.execute(
                """
                INSERT INTO exams 
                (series_id, round, title, duration_sec, total_score, is_published, created_at, updated_at) 
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """,
                (series_id, exam_meta["round"], exam_meta["title"], exam_meta["duration"], exam_meta["total_score"], True)
            )
            exam_id = cursor.lastrowid
        else:
            exam_id = exam[0]
            print(f"Exam exists: {exam_meta['title']} ({exam_id})")
        
        # Check if questions already exist (simple check by count)
        cursor.execute("SELECT COUNT(*) FROM questions WHERE exam_id = %s", (exam_id,))
        count = cursor.fetchone()[0]
        
        if count == 0:
            print(f"Inserting questions for {exam_meta['title']}...")
            questions = get_questions(exam_meta["round"])
            
            for idx, q in enumerate(questions):
                tag = q[0]
                text = q[1]
                answer = q[2]
                
                # Assume SUBJECTIVE type for these
                cursor.execute(
                    """
                    INSERT INTO questions 
                    (exam_id, type, text, answer_keywords, score, tags, explanation) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (exam_id, 'SUBJECTIVE', text, answer, 5, tag, "해설이 준비중입니다.")
                )
            print(f"Inserted {len(questions)} questions.")
        else:
            print(f"Questions already exist for {exam_meta['title']}, skipping.")

    conn.commit()
    print("Data seeding completed successfully.")

except mysql.connector.Error as err:
    print(f"Error: {err}")
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
