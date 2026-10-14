// CBT 아키텍처 다이어그램 레이아웃 (architecture-diagram 스킬: ICONS + helpers.js 뒤에 붙여 use_figma로 실행)
// 로고: python -I ~/.claude/skills/architecture-diagram/fetch_icons.py icons.js \
//   nginx letsencrypt nextdotjs springboot mysql redis prometheus grafana googlecloud docker \
//   githubactions github google kakaotalk=3C1E1E python
// 결과: Figma https://www.figma.com/design/NA5G5TUkKbbAMTDLtwdDkp → docs/images/architecture.png (2x)

// ---- 머리말
text(root, 'CBT Exam Platform', F.b, 40, C.ink, 64, 44);
text(root, '시스템 아키텍처', F.m, 20, C.mute, 64, 102);
const url = label('https://cert-cbt.site', 0, 0, { color: '#2563EB', bg: '#EFF6FF', size: 16 });
url.x = 1856 - url.width; url.y = 66;

// ---- 사용자 · 외부
card(64, 320, 240, 150, { tag: 'CLIENT', color: '#334155', title: '사용자', lines: ['웹 브라우저', '게스트 · 회원 응시'] });
card(64, 560, 240, 140, { tag: 'OAUTH2', color: '#F59E0B', title: '소셜 로그인', lines: ['Google · Kakao'], logos: ['kakaotalk', 'google'] });

// ---- VM
box(360, 160, 1496, 620, { fill: '#EEF2F7', stroke: '#CBD5E1', radius: 24, dash: true, name: 'GCP VM' });
heading('GCP Compute Engine VM', 392, 182, { size: 18, logos: ['googlecloud'] });
heading('Docker Compose', 680, 184, { size: 15, color: '#2496ED', logos: ['docker'] });

card(400, 300, 270, 200, { tag: 'EDGE', color: '#009639', title: 'Nginx', logos: ['letsencrypt', 'nginx'],
  lines: ['리버스 프록시 · 단일 출처', "TLS (Let's Encrypt)", 'IP별 요청 제한', '인증 5r/s · 응시 시작 1r/s'] });
card(760, 230, 290, 140, { tag: 'FRONTEND', color: '#111827', title: 'Next.js 16', logos: ['nextdotjs'],
  lines: ['React 19 · TypeScript', 'Zustand · Tailwind CSS'] });
card(760, 440, 290, 200, { tag: 'BACKEND', color: '#6DB33F', title: 'Spring Boot 3.5', logos: ['springboot'],
  lines: ['Java 17 · Spring Security', 'JWT + Refresh Token 회전', 'JPA · Flyway', '서버 채점 · 종목별 랭킹'] });
card(1140, 230, 260, 130, { tag: 'VOLUME', color: '#8B5CF6', title: '문제 이미지', lines: ['읽기 전용 마운트'] });
card(1140, 400, 260, 140, { tag: 'DATABASE', color: '#00758F', title: 'MySQL 8', logos: ['mysql'],
  lines: ['시험 · 응시 · 답안 · 랭킹', '기준 데이터'] });
card(1140, 580, 260, 140, { tag: 'CACHE', color: '#DC382D', title: 'Redis 7', logos: ['redis'],
  lines: ['로그인 세션 · Refresh Token', 'OAuth 일회용 코드'] });

box(1450, 220, 376, 500, { fill: '#FFF7ED', stroke: '#FED7AA', radius: 20, name: 'Observability' });
heading('Observability', 1474, 240, { color: '#C2410C' });
card(1474, 280, 328, 150, { tag: 'METRICS', color: '#E6522C', title: 'Prometheus', logos: ['prometheus'],
  lines: ['Micrometer 메트릭 수집', '경보 규칙 4종'] });
card(1474, 530, 328, 150, { tag: 'DASHBOARD', color: '#F46800', title: 'Grafana', logos: ['grafana'],
  lines: ['지연 · 5xx · DB 풀 · 업무 지표', '127.0.0.1 바인딩 + SSH 터널'] });

// ---- 요청 흐름
arrow([[304, 395], [400, 395]], { color: '#334155' }); label('HTTPS', 352, 372);
arrow([[670, 370], [715, 370], [715, 300], [760, 300]], { color: '#334155' }); label('/', 715, 335);
arrow([[670, 430], [715, 430], [715, 540], [760, 540]], { color: '#334155' }); label('/api\n/oauth2', 715, 485);
arrow([[1050, 470], [1080, 470], [1080, 295], [1140, 295]]);
arrow([[1050, 520], [1100, 520], [1100, 470], [1140, 470]], { color: '#00758F' });
arrow([[1050, 600], [1100, 600], [1100, 650], [1140, 650]], { color: '#DC382D' });
arrow([[760, 610], [725, 610], [725, 650], [304, 650]], { color: '#F59E0B', dashed: true }); label('인가 코드 → 토큰 교환', 530, 650);
arrow([[1474, 400], [1430, 400], [1430, 752], [905, 752], [905, 640]], { color: '#E6522C', dashed: true });
label('/actuator/prometheus · 내부망 scrape', 1167, 752, { color: '#C2410C', bg: '#EEF2F7' });
arrow([[1638, 530], [1638, 430]], { color: '#F46800' }); label('PromQL', 1638, 480, { color: '#C2410C', bg: '#FFF7ED' });

// ---- CI/CD
box(64, 830, 1220, 190, { name: 'CI/CD', radius: 20 });
heading('CI/CD · GitHub Actions', 92, 848, { logos: ['githubactions'] });
const ci = chipRow(92, 900, [
  { text: 'main push', logo: 'github' }, { text: '단위 테스트 · 빌드' }, { text: '통합 검증\n(MySQL 포함 전체 스택)' },
  { text: '커밋 SHA 이미지 빌드' }, { text: 'Docker Hub', logo: 'docker', color: '#2496ED' }, { text: 'SCP · SSH 배포' },
]);
const deploy = ci.chips[ci.chips.length - 1];
arrow([[deploy.cx, 900], [deploy.cx, 780]], { color: '#334155' }); label('pull · compose up', deploy.cx, 806);

// ---- 데이터 파이프라인
box(1316, 830, 540, 190, { name: 'Data pipeline', radius: 20 });
heading('데이터 파이프라인 · Python', 1344, 848, { logos: ['python'] });
chipRow(1344, 900, [{ text: '기출 PDF · 블로그' }, { text: '파싱 · 정답 대조' }, { text: 'MySQL 적재' }], { gap: 24 });

return { rootId: root.id, nodes: ids.length };
