#!/bin/bash
# 인테리어코치 배포 스크립트
# 사용법: ./deploy.sh "커밋 메시지"
# git push + vercel --prod를 한번에 실행합니다.

set -e

MSG="${1:-deploy}"

echo "📦 Git push..."
git add -A
git commit -m "$MSG" || echo "변경사항 없음"
git push origin main

echo ""
echo "🚀 Vercel production 배포..."
npx vercel --prod --yes 2>&1 | tail -5

echo ""
echo "✅ 배포 완료: https://interior-coach-deploy.vercel.app"
