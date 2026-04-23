# CI/CD 파이프라인 설정

## 설치 방법

```bash
cd interior-coach
bash docs/ci-cd-setup/install.sh
```

## GitHub Secrets 설정

Settings → Secrets and variables → Actions:

| Secret | 설명 |
|--------|------|
| VERCEL_TOKEN | Vercel 배포 토큰 |
| VERCEL_ORG_ID | Vercel 팀/개인 ID |
| VERCEL_PROJECT_ID | Vercel 프로젝트 ID |
| DATABASE_URL | Neon DB 연결 문자열 |
| NEXT_PUBLIC_SITE_URL | 사이트 URL |
| TELEGRAM_BOT_TOKEN | 텔레그램 봇 토큰 |
| TELEGRAM_CHAT_ID | 알림 채팅 ID |

## 워크플로우

- **ci.yml** — PR/push: ESLint + TypeScript + Vitest + Build
- **deploy.yml** — main push: Vercel 프로덕션 자동 배포 + 텔레그램 알림
- **pr-review.yml** — PR: 보안 스캔 + 코드 사이즈 체크
