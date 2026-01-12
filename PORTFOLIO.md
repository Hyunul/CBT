# Technical Deep Dive & Problem-Solving Log

> "적당한 기술을, 적절한 시점에." CBT를 설계하고 구현하며 성능, 보안, 운영성의 균형을 맞춘 기록입니다.

---

## 1) Tech & Architecture 선택 근거
- Spring Boot 3 + JPA: 시험/문항/시도/채점 도메인의 트랜잭션 일관성을 확보
- Next.js(App Router): SSR/CSR 혼합으로 초기 로드와 SEO 확보
- Redis 7: ZSet 랭킹, JWT RTR 캐시, 블랙리스트 처리로 RDB 부하 절감
- Docker Compose: 로컬 환경 페리티 확보, 운영 시연 재현성 개선

---

## 2) 주요 의사결정과 결과
### Kafka vs Direct Redis (Anti-Overengineering)
- 가설: Kafka 비동기 파이프라인이 스파이크 트래픽에서 지연을 개선할 것
- 검증(k6, 1500 VU): Kafka 경유 시 P95 지연 11% 개선(0.8s), 오류율 0.1% vs 0%
- 결론: 운영 복잡도와 비용 대비 이득이 낮아 현 구간에서는 Direct Redis 유지
- 조건부 도입: 5k VU 이상 또는 이벤트 폭증 시 Kafka 전환 고려

### Redis ZSet 랭킹 도입
- 문제: MySQL ORDER BY 기준 10k+ 건에서 응답이 500ms 이상 발생
- 조치: ZADD/ZREVRANGE로 전환
- 결과: 응답 5ms 수준, DB 부하 제거

### JWT 보안 전략
- 문제: Stateless JWT만으로는 로그아웃/회수 불가
- 조치: RTR(Refresh Token Rotation) + Redis 저장/검증, Access 토큰 블랙리스트 처리
- 결과: 로그아웃 및 탈취 대응 가능, 키 관리 강제 필요

---

## 3) 공개 페이지 확장 포인트
- 시험 상세 공개 페이지 구성: Hero/Stats/문항 미리보기/랭킹/관련 시험/FAQ
- 랭킹은 시험별 상위 3명 스냅샷 제공
- 관련 시험은 같은 시리즈 기반으로 노출

---

## 4) 개선 여지 및 로드맵
- 권한/검증: 401/403 처리 정교화, 게스트 모드 동작 명확화
- 관측성: APM/메트릭 대시보드 도입으로 병목 조기 탐지
- 스케일 단계: Redis 백업/Failover 구성, Kafka 기반 비동기 파이프라인 검토

---

## 5) 참고 파일
- `docs/images/service-architecture.png` 전체 서비스 다이어그램
- `docs/images/report.png` Redis vs Kafka 부하 테스트 결과