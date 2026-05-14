/**
 * 자재 단가 검증 — 본문에서 가격 언급 추출 + materials DB와 매칭.
 *
 * Phase 3 (Q3=c) 후처리 정규식 매칭. 생성 시 컨텍스트로 주입할 자재 후보는
 * getRelevantMaterials() 에서 클라이언트 categories 기반 top-N.
 *
 * 결과는 agency_content_drafts.material_citations JSONB에 저장.
 */

import { and, or, ilike, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { materials } from "@/lib/db/schema";
import type { AgencyMaterialCitation } from "@/lib/db/schema";

export interface MaterialCandidate {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  unitPrice: number;
}

const CONTEXT_LIMIT = 30;
const WINDOW_BEFORE = 80;
const WINDOW_AFTER = 30;

/**
 * 클라이언트 categories 기반으로 시세 검증 컨텍스트 자재 후보 추출.
 * categories 비어있으면 일반 자재(unit_price 있는 것) top-N.
 */
export async function getRelevantMaterials(
  categories: string[] | null | undefined,
  limit = CONTEXT_LIMIT,
): Promise<MaterialCandidate[]> {
  const baseWhere = and(
    isNotNull(materials.unitPrice),
    isNull(materials.deletedAt),
  );

  if (!categories || categories.length === 0) {
    const rows = await db
      .select({
        id: materials.id,
        name: materials.name,
        category: materials.category,
        unit: materials.unit,
        unitPrice: materials.unitPrice,
      })
      .from(materials)
      .where(baseWhere)
      .limit(limit);
    return rows
      .filter((r): r is MaterialCandidate => r.unitPrice !== null)
      .slice(0, limit);
  }

  const catConditions = categories.map((c) => ilike(materials.category, `%${c}%`));
  const rows = await db
    .select({
      id: materials.id,
      name: materials.name,
      category: materials.category,
      unit: materials.unit,
      unitPrice: materials.unitPrice,
    })
    .from(materials)
    .where(and(or(...catConditions), baseWhere))
    .limit(limit);

  return rows
    .filter((r): r is MaterialCandidate => r.unitPrice !== null)
    .slice(0, limit);
}

const PRICE_RE = /(\d{1,3}(?:,\d{3})+|\d{2,})\s*(만\s*원|원)/g;

interface ExtractedPrice {
  match: string;
  value: number;
  index: number;
}

/** 본문에서 "12,000원" / "15만원" / "30만 원" 형태 추출 */
export function extractPrices(body: string): ExtractedPrice[] {
  const out: ExtractedPrice[] = [];
  const re = new RegExp(PRICE_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const numRaw = m[1].replace(/,/g, "");
    const num = parseInt(numRaw, 10);
    if (isNaN(num)) continue;
    const unit = m[2];
    const value = unit.includes("만") ? num * 10000 : num;
    if (value < 1000) continue; // 1천원 미만은 가격 언급 아님 (오탐 제거)
    out.push({ match: m[0], value, index: m.index });
  }
  return out;
}

/** 자재명 토큰 (2글자 이상, 첫 3개) */
function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[\s/_\-]+/)
    .filter((t) => t.length >= 2)
    .slice(0, 3);
}

/**
 * 본문에서 가격 언급 위치 인근의 자재명을 후보 자재와 매칭.
 * Delta% = (mentionedPrice - verifiedPrice) / verifiedPrice * 100
 */
export function citeMaterials(
  body: string,
  candidates: MaterialCandidate[],
): AgencyMaterialCitation[] {
  const prices = extractPrices(body);
  if (prices.length === 0 || candidates.length === 0) return [];

  const citations: AgencyMaterialCitation[] = [];

  for (const p of prices) {
    const start = Math.max(0, p.index - WINDOW_BEFORE);
    const end = Math.min(body.length, p.index + WINDOW_AFTER);
    const window = body.slice(start, end).toLowerCase();

    let best: MaterialCandidate | null = null;
    let bestScore = 0;
    for (const m of candidates) {
      const tokens = tokenize(m.name);
      if (tokens.length === 0) continue;
      const score = tokens.filter((t) => window.includes(t)).length;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }

    if (!best || bestScore < 1) continue;

    const verifiedPrice = best.unitPrice;
    const deltaPct =
      verifiedPrice > 0 ? ((p.value - verifiedPrice) / verifiedPrice) * 100 : null;

    citations.push({
      materialId: best.id,
      mentionedPrice: p.value,
      verifiedPrice,
      deltaPct: deltaPct !== null ? Math.round(deltaPct * 10) / 10 : null,
    });
  }

  return citations;
}

/**
 * 컨텍스트 주입용 자재 요약 (system prompt에 삽입).
 */
export function formatMaterialsContext(candidates: MaterialCandidate[]): string {
  if (candidates.length === 0) return "(자재 데이터 없음)";
  return candidates
    .map(
      (m) =>
        `- ${m.name} (${m.category ?? "—"}) · ${m.unit ?? "—"} ${m.unitPrice.toLocaleString()}원`,
    )
    .join("\n");
}
