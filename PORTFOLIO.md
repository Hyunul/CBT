# Technical Deep Dive & Problem-Solving Log

> “적당한 기술을, 적절한 시점에.” OptiCBT를 설계·구현하며 성능·보안·운영성 사이의 균형을 맞춘 기록입니다.

---

## 1) Tech & Architecture 선택 근거
- **Spring Boot 3 + JPA**: 모듈화/트랜잭션 지원이 필요한 도메인(시험/문항/시도/채점)에 적합. 안정적 DI·검증 파이프라인으로 초기 리스크 축소.
- **Next.js(App Router)**: SSR/CSR 혼합, 빠른 초기 로드와 SEO 확보. 서버 리라이트로 BE/FE 경계 단순화.
- **Redis 7**: ZSet 기반 랭킹, JWT RTR 캐시, 블랙리스트 처리. RDB 정렬 대비 I/O를 크게 절감.
- **Docker Compose**: 로컬 환경 페리티 확보. MySQL/Redis/앱을 일관된 네트워크로 띄워 테스트/시연 용이.

---

## 2) 주요 의사결정 & 결과
### Kafka vs Direct Redis (Anti-Overengineering)
- **가설**: Kafka 비동기화가 스파이크 시 안정성/지연 개선을 줄 것.
- **검증(k6, 1500 VU)**: Redis 직결 대비 Kafka 경유 P95 ≈ 11% 개선(0.8s), 오류율 0.1% vs 0%. 운영 복잡도(브로커·컨슈머·모니터링)와 비용이 이득을 상회.
- **결론**: 현재 트래픽 구간에서는 **Direct Redis 유지**, 임계치(>5k VU, 이벤트 폭증) 도달 시 Kafka 단계적 도입 고려.

### Redis ZSet 랭킹 도입
- **문제**: MySQL ORDER BY 정렬 시 10k+ 건에서 >500ms 응답, DB CPU 스파이크.
- **조치**: ZADD/ZREVRANGE로 전환, 응답 ~5ms 수준, DB 부하 제거.

### JWT 보안 전략
- **문제**: Stateless JWT만으로는 로그아웃/회수 불가.
- **조치**: RTR(Refresh Token Rotation) + Redis 저장/검증, Access 토큰 블랙리스트로 로그아웃 처리. 키 관리 강제 필요.

---

## 3) 최근 수정/강화 포인트
- **관리자 라우트 가드(프런트)**: `/admin/**`에 클라이언트 가드 추가(로그인 확인 + ROLE_ADMIN 여부). 미인증 → `/login`, 권한 없음 → `/` 리다이렉트 후 토스트 안내.
- **가시성/품질**: k6 부하 리포트, Swagger 문서화. (추가 예정) Prometheus/Grafana로 메트릭 보강.
- **환경 변수 정렬**: 프런트 `NEXT_PUBLIC_API_URL`/`INTERNAL_API_URL`, 백엔드 `JWT_SECRET` 강제 주입 필요.

---

## 4) 개선 여지 & 로드맵
- **권한/검증**: 시도/시험 API의 401/403 정교화, 게스트 모드 여부 명시.
- **관측성**: APM·메트릭 대시보드 도입으로 병목 조기 탐지.
- **스케일 단계**: 트래픽 임계 구간 도달 시 Kafka 기반 비동기 파이프라인으로 전환, Redis 백업/Failover 구성.

---

## 5) 참고 파일
- `docs/images/service-architecture.png` — 전체 서비스 다이어그램
- `docs/images/report.png` — Redis vs Kafka 부하 테스트 결과
