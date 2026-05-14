#!/bin/bash
set -e
echo "🔧 CI/CD 파이프라인 설치..."

REPO_ROOT=$(git rev-parse --show-toplevel)

# Check workflow scope
if ! gh auth status 2>&1 | grep -q workflow; then
    echo "⚠️  GitHub workflow 스코프 필요. 브라우저 인증:"
    gh auth refresh -h github.com -s workflow
fi

mkdir -p "$REPO_ROOT/.github/workflows"
cp "$REPO_ROOT/docs/ci-cd-setup/ci.yml" "$REPO_ROOT/.github/workflows/"
cp "$REPO_ROOT/docs/ci-cd-setup/deploy.yml" "$REPO_ROOT/.github/workflows/"
cp "$REPO_ROOT/docs/ci-cd-setup/pr-review.yml" "$REPO_ROOT/.github/workflows/"
git add .github/workflows/
git commit -m "feat: CI/CD 파이프라인 활성화"
git push origin main
echo "✅ 완료!"
