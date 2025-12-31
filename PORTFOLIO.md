# 📂 Technical Deep Dive & Problem Solving Log

> **"기술을 위한 기술이 아닌, 문제를 해결하는 적정 기술(Appropriate Technology)을 지향합니다."**  
> 본 문서는 OptiCBT 프로젝트를 개발하며 마주한 기술적 난관, 그에 대한 해결책, 그리고 아키텍처 의사결정 과정을 기록한 엔지니어링 노트입니다.

---

## 1. 🛠 Tech Stack Strategy (기술 선정 배경)

프로젝트의 핵심 목표인 **"안정성", "성능", "생산성"**을 기준으로 기술 스택을 선정했습니다.

| 기술 (Tech)         | 선정 이유 (Why) & Trade-off 분석                                                                                                                                                                                                             |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spring Boot 3.x** | **[안정성/생태계]** 엔터프라이즈급 백엔드 로직(복잡한 채점, 트랜잭션 관리)을 안정적으로 구현하기 위해 선택했습니다. Node.js 대비 초기 설정 비용은 높지만, 정적 타입(Java)과 강력한 DI 컨테이너가 주는 유지보수성 이점이 크다고 판단했습니다. |
| **Next.js 15**      | **[UX/SEO]** 시험 응시 화면의 빠른 렌더링(SSR/CSR 하이브리드)과 검색 엔진 최적화를 위해 선택했습니다. React의 컴포넌트 생태계를 활용하면서도 Vercel의 강력한 최적화 기능을 누릴 수 있습니다.                                                 |
| **Redis 7.x**       | **[고성능]** 실시간 랭킹 산정(Sorted Set)과 JWT 블랙리스트 관리를 위해 필수적이었습니다. RDB로 처리하기엔 I/O 비용이 높은 작업들을 메모리 기반으로 처리하여 DB 부하를 격리했습니다.                                                          |
| **Docker Compose**  | **[일관성]** 로컬 개발 환경과 배포 환경의 차이(Environment Parity)를 없애기 위해 DB, Redis, App을 컨테이너로 오케스트레이션했습니다.                                                                                                         |

---

## 2. 🚀 Key Architectural Decisions (핵심 의사결정)

### Case Study 1: Kafka 도입 보류와 Direct Redis 채택 (Anti-Overengineering)

**배경 (Context)**  
시험 종료 직전, 수천 명의 사용자가 동시에 답안을 제출(`Submit`)하는 상황을 가정했습니다. 이 트래픽이 DB와 랭킹 서버에 몰릴 경우 장애가 발생할 우려가 있었습니다.

**가설 (Hypothesis)**  
"메시지 큐(Kafka)를 도입하여 트래픽을 비동기로 처리(Decoupling)해야만 시스템이 뻗지 않고 버틸 수 있을 것이다."

**검증 과정 (Verification with k6)**  
가설을 검증하기 위해 로컬 환경(Docker)에서 가상 유저(VU) 1500명을 대상으로 부하 테스트를 진행했습니다.

- **시나리오 A**: `Web Server` -> `Redis` (Direct Sync)
- **시나리오 B**: `Web Server` -> `Kafka` -> `Consumer` -> `Redis` (Async)

**결과 (Result)**

- **안정성**: 두 시나리오 모두 에러율 0%로 트래픽을 소화했습니다. (Redis의 쓰기 성능이 예상보다 강력함)
- **Latency**: Kafka 도입 시 P95 Latency가 약 **11% (0.8초)** 개선되었습니다.
- **비용**: Kafka 운영을 위해 Zookeeper 포함 최소 2개 이상의 무거운 컨테이너가 추가로 필요하며, 메모리 사용량이 급증했습니다.

**의사결정 (Decision)**  
**"Direct Redis 유지"**.  
11%의 성능 향상을 위해 인프라 복잡도를 2배로 늘리는 것은 **과잉 엔지니어링(Over-engineering)**이라고 판단했습니다. 초기 단계에서는 관리 포인트가 적은 Redis 아키텍처로 진행하고, 추후 트래픽이 5,000 VU를 넘어서는 시점에 Kafka 도입을 재검토하기로 결정했습니다.

> _관련 근거 자료: `docs/images/report.png` (벤치마크 리포트)_

---

### Case Study 2: 실시간 랭킹 시스템 최적화 (RDB vs Redis)

**문제 (Problem)**  
초기에는 MySQL의 `ORDER BY score DESC` 쿼리로 랭킹을 조회했습니다. 데이터가 10만 건이 넘어가자 랭킹 조회 API 응답 시간이 **500ms 이상**으로 느려졌고, DB CPU 점유율이 급증했습니다.

**해결 (Solution)**  
**Redis Sorted Set (ZSet)**을 도입했습니다.

- `ZADD key score member`: 시험 제출 시 O(log N)으로 점수 업데이트.
- `ZREVRANGE key start end`: O(log N + M)으로 상위 랭커 조회.

**성과 (Impact)**

- 랭킹 조회 속도: **500ms -> 5ms** (약 100배 개선)
- DB 부하: 랭킹 조회 트래픽을 Redis가 전담하게 되어 메인 DB의 부하를 획기적으로 줄였습니다.

---

### Case Study 3: 보안과 사용자 편의성의 균형 (JWT Strategy)

**문제 (Problem)**  
JWT(Access Token)는 Stateless하여 서버 확장에 유리하지만, 탈취되었을 때 서버에서 강제로 만료시키기 어렵다는(Logout 불가) 보안 취약점이 있었습니다.

**해결 (Solution)**  
**RTR (Refresh Token Rotation) + Redis Blacklist** 전략을 구현했습니다.

1.  **RTR**: Access Token이 만료되어 재발급받을 때, Refresh Token도 새로 발급(Rotation)하고 기존 것은 폐기합니다. 탈취된 Refresh Token의 수명을 1회성으로 제한했습니다.
2.  **Blacklist**: 사용자가 로그아웃 요청 시, 남은 유효기간을 가진 Access Token을 Redis에 저장하고, Filter 단에서 이를 거부하도록 설정했습니다.

**성과 (Impact)**  
세션 방식의 보안성(제어권)과 토큰 방식의 확장성(Stateless)을 모두 확보했습니다.

---

## 3. 🐛 Troubleshooting & Performance Tuning

### Issue 1: JPA N+1 문제 해결

**현상**: 시험 상세 조회(`getExam`) 시, 시험지(1) -> 문제(N) -> 보기(M)를 조회하면서 쿼리가 `1 + N + N*M`번 발생하는 현상 발견.
**원인**: JPA의 지연 로딩(Lazy Loading)으로 인해 연관된 엔티티를 사용할 때마다 쿼리가 추가 실행됨.
**해결**:

- 단순 연관 관계는 `Fetch Join` 사용.
- 복잡한 컬렉션 조회(문제+보기)는 `@EntityGraph(attributePaths = {"questions", "questions.choices"})`를 적용하여 **단 1회의 쿼리**로 모든 데이터를 가져오도록 최적화.

### Issue 2: Docker Network 통신 문제

**현상**: 컨테이너 내부의 Spring Boot가 Kafka에 접속하지 못하고 `Connection Refused` 에러 발생.
**원인**: Kafka가 `localhost:9092`로 광고(Advertised Listeners)하고 있었으나, 컨테이너 네트워크 내부에서는 `localhost`가 각 컨테이너 자신을 가리킴.
**해결**:

- Docker Compose 환경변수를 통해 `KAFKA_ADVERTISED_LISTENERS`를 분리 설정.
- **외부(Host)**용: `localhost:9093`
- **내부(Docker Network)**용: `kafka:9092`
- Spring Boot는 `kafka:9092` 서비스 명으로 접속하도록 설정하여 해결.

---

## 4. 📝 Retrospective (회고)

본 프로젝트는 단순한 기능 구현을 넘어, **"트래픽이 몰려도 죽지 않는 서비스"**를 설계하는 과정이었습니다. 이 과정에서 얻은 엔지니어링 인사이트는 다음과 같습니다.

### ✅ What Went Well (성과 및 배운 점)
*   **Evidence-Based Engineering**: "카프카가 좋다더라"라는 통설에 의존하지 않고, 직접 **k6 부하 테스트**를 수행하여 얻은 정량적 데이터(Latency 11% 차이)를 근거로 아키텍처를 결정했습니다. 이 경험을 통해 **기술 도입의 타당성을 증명하는 습관**을 길렀습니다.
*   **Deep Dive into Redis**: Redis를 단순 캐시로만 쓰던 수준을 넘어, `Sorted Set`을 활용한 랭킹 시스템과 `Blacklist`를 통한 보안 제어 등 **메인 데이터 저장소로서의 가능성과 활용법**을 깊이 있게 익혔습니다.

### 🚧 What Could Be Better (한계 및 아쉬움)
*   **Observability (관측 가능성) 부재**: 부하 테스트 중 서버의 상태를 로그(Log)로만 확인해야 했습니다. Prometheus와 Grafana를 도입하여 CPU, 메모리, 커넥션 풀 상태를 시각화했다면 병목 지점을 더 빠르고 정확하게 찾을 수 있었을 것입니다.
*   **Test Environment Parity**: 로컬 Docker 환경에서의 테스트는 네트워크 레이턴시가 거의 없어 실제 클라우드 환경(AWS 등)과는 결과가 다를 수 있음을 인지했습니다. 실제 분산 환경에서의 네트워크 오버헤드를 고려한 추가 테스트가 필요합니다.

### 🔭 Future Roadmap (서비스 확장 로드맵)

현재는 **서비스 초기 런칭(MVP)** 단계로, 리소스 효율성을 최우선으로 고려하여 아키텍처를 설계했습니다. 하지만 사용자 증가에 대비한 **단계별 스케일업 전략**이 수립되어 있습니다.

1.  **Phase 1 (Current): Direct Redis Architecture**
    *   **목표**: 빠른 개발 속도와 낮은 인프라 비용으로 초기 시장 진입.
    *   **한계**: 벤치마크 결과, 동시 접속자 **1,000명**까지 쾌적한 응답 속도(< 2s)를 유지하며, 최대 **1,500명**까지 에러 없이 처리가 가능함을 확인.

2.  **Phase 2 (Scale-Up): Kafka Event Streaming 도입**
    *   **Trigger**: 동시 접속자 **5,000명 돌파** 또는 **이벤트 발행량 초당 10,000건** 도달 시.
    *   **계획**: 현재 비활성화(`Sync`)해 둔 **Kafka Producer/Consumer 로직을 활성화(`Async`)**하여, 랭킹 업데이트와 로그 처리를 비동기로 전환합니다. 이미 코드는 구현되어 있으므로 설정 변경만으로 즉각적인 스케일업이 가능합니다.

3.  **Phase 3 (Stability): 데이터 영속성 강화**
    *   **계획**: Redis 데이터 유실에 대비해 Spring Batch를 도입, 주기적으로 RDB(MySQL)에 랭킹 데이터를 백업(Write-Back)하여 정합성을 보장합니다.
