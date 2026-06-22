#!/usr/bin/env node
// i18n 동기화 검증.
//   - ko.json 기준으로 en.json 과의 키 구조를 비교
//   - 누락 키 / 유령 키 / 타입 불일치(객체 vs 문자열) 모두 리포트
//   - 불일치 시 exit code 1 — 빌드/CI 가 머지를 막는다
//
// 사용:
//   npm run i18n:check
//
// 출력 형식은 GitHub Actions annotations 와 호환되도록 "::error file=..." 도 지원.
//   GITHUB_ACTIONS=true 환경변수 있으면 자동.

import fs from "node:fs";
import path from "node:path";

const MESSAGES_DIR = path.resolve(process.cwd(), "messages");
const BASE = "ko";
const TARGETS = ["en"];

const ghActions = process.env.GITHUB_ACTIONS === "true";

function load(locale) {
  const p = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(p)) {
    fail(`messages/${locale}.json 파일이 없습니다`);
  }
  const raw = fs.readFileSync(p, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    fail(`messages/${locale}.json 파싱 실패: ${e.message}`);
  }
}

function fail(msg) {
  console.error(`[i18n:check] ${msg}`);
  process.exit(1);
}

// path-style key 전부 평탄화 — "a.b.c": "value"
function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out.set(key, typeof v);
    }
  }
  return out;
}

function diff(baseMap, targetMap) {
  const missing = []; // base 에 있는데 target 에 없음 (= 번역 누락)
  const extra = [];   // target 에 있는데 base 에 없음 (= 유령 키)
  const typeMismatch = []; // 같은 키인데 타입 다름 (string vs object)

  for (const [k, t] of baseMap) {
    if (!targetMap.has(k)) {
      missing.push(k);
    } else if (targetMap.get(k) !== t) {
      typeMismatch.push({ key: k, base: t, target: targetMap.get(k) });
    }
  }
  for (const [k] of targetMap) {
    if (!baseMap.has(k)) extra.push(k);
  }

  return { missing, extra, typeMismatch };
}

function annotate(file, msg) {
  if (ghActions) {
    console.error(`::error file=${file}::${msg}`);
  } else {
    console.error(`  ${file}: ${msg}`);
  }
}

const base = load(BASE);
const baseFlat = flatten(base);
console.log(`[i18n:check] base = messages/${BASE}.json (${baseFlat.size} keys)`);

let hasError = false;

for (const tgt of TARGETS) {
  const target = load(tgt);
  const targetFlat = flatten(target);
  const { missing, extra, typeMismatch } = diff(baseFlat, targetFlat);

  console.log(`[i18n:check] target = messages/${tgt}.json (${targetFlat.size} keys)`);

  if (!missing.length && !extra.length && !typeMismatch.length) {
    console.log(`  ✓ ${tgt} synced with ${BASE}`);
    continue;
  }

  hasError = true;

  if (missing.length) {
    console.error(`\n  ✗ ${tgt}.json 누락 키 (${BASE}에는 있는데 ${tgt}에 없음) — ${missing.length}개:`);
    missing.forEach((k) => annotate(`messages/${tgt}.json`, `누락 키: ${k}`));
  }

  if (extra.length) {
    console.error(`\n  ✗ ${tgt}.json 유령 키 (${tgt}에는 있는데 ${BASE}에 없음) — ${extra.length}개:`);
    extra.forEach((k) => annotate(`messages/${tgt}.json`, `유령 키: ${k}`));
  }

  if (typeMismatch.length) {
    console.error(`\n  ✗ ${tgt}.json 타입 불일치 — ${typeMismatch.length}개:`);
    typeMismatch.forEach(({ key, base: b, target: t }) =>
      annotate(`messages/${tgt}.json`, `타입 불일치: ${key} (base=${b}, target=${t})`),
    );
  }
}

if (hasError) {
  console.error(`\n[i18n:check] FAILED — ko.json 과 en.json 의 키 구조가 어긋났습니다.`);
  console.error(`해결: 누락 키는 번역 추가, 유령 키는 ${BASE}.json 에서도 사용 중인지 확인 후 제거.`);
  process.exit(1);
}

console.log(`\n[i18n:check] OK — 모든 target 동기화됨`);
