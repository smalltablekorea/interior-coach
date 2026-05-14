/**
 * 월간 리포트 통계 집계 + HTML 빌더.
 *
 * Q2=a: HTML 리포트 → Vercel Blob → URL.
 * Q3=a: 운영자 수동 트리거.
 */

import { eq, and, gte, lt, sql } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import {
  agencyClients,
  agencyContentJobs,
  agencyContentDrafts,
  agencyPublications,
  agencyMonthlyReports,
  type agencyClients as _ac,
} from "@/lib/db/schema";

type Client = typeof _ac.$inferSelect;

export interface KeywordRank {
  keyword: string;
  rank: number | null;
  publicationId: string;
}

export interface MonthlyStats {
  yearMonth: string;
  monthStart: string; // YYYY-MM-01
  monthEnd: string; // 다음 달 YYYY-MM-01
  totalPublished: number;
  byChannel: { naver_blog: number; threads: number; instagram: number };
  avgPublishTimeSeconds: number | null;
  searchVisibility: {
    total: number;
    rank1_10: number;
    rank11_30: number;
    rank31plus: number;
    notFound: number;
    keywords: KeywordRank[];
  };
}

interface PublicationRow {
  publicationId: string;
  channel: string;
  publishedAt: Date | null;
  publishDurationSeconds: number | null;
  externalPostUrl: string | null;
  searchRankResult: unknown;
  draftHashtags: unknown;
}

function monthBounds(yearMonth: string): { start: string; end: string } {
  // "2026-05" → start = 2026-05-01, end = 2026-06-01
  const [yStr, mStr] = yearMonth.split("-");
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const start = `${yearMonth}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, end };
}

export async function aggregateMonthlyStats(
  clientId: string,
  yearMonth: string,
): Promise<MonthlyStats> {
  const { start, end } = monthBounds(yearMonth);

  const rows = await db
    .select({
      publicationId: agencyPublications.id,
      channel: agencyPublications.channel,
      publishedAt: agencyPublications.publishedAt,
      publishDurationSeconds: agencyPublications.publishDurationSeconds,
      externalPostUrl: agencyPublications.externalPostUrl,
      searchRankResult: agencyPublications.searchRankResult,
      draftHashtags: agencyContentDrafts.hashtags,
    })
    .from(agencyPublications)
    .innerJoin(agencyContentDrafts, eq(agencyContentDrafts.id, agencyPublications.draftId))
    .innerJoin(agencyContentJobs, eq(agencyContentJobs.id, agencyContentDrafts.jobId))
    .where(
      and(
        eq(agencyContentJobs.clientId, clientId),
        gte(agencyPublications.publishedAt, sql`${start}::timestamp`),
        lt(agencyPublications.publishedAt, sql`${end}::timestamp`),
      ),
    );

  const pubs = rows as PublicationRow[];

  const byChannel = { naver_blog: 0, threads: 0, instagram: 0 };
  let totalDuration = 0;
  let durationCount = 0;
  const keywords: KeywordRank[] = [];

  for (const p of pubs) {
    if (p.channel === "naver_blog") byChannel.naver_blog++;
    else if (p.channel === "threads") byChannel.threads++;
    else if (p.channel === "instagram") byChannel.instagram++;

    if (p.channel === "naver_blog" && p.publishDurationSeconds != null) {
      totalDuration += p.publishDurationSeconds;
      durationCount++;
    }

    const rank = p.searchRankResult as
      | { queries?: Array<{ keyword: string; rank: number | null }> }
      | null;
    if (rank?.queries) {
      for (const q of rank.queries) {
        keywords.push({
          keyword: q.keyword,
          rank: q.rank,
          publicationId: p.publicationId,
        });
      }
    }
  }

  let rank1_10 = 0,
    rank11_30 = 0,
    rank31plus = 0,
    notFound = 0;
  for (const k of keywords) {
    if (k.rank == null) notFound++;
    else if (k.rank <= 10) rank1_10++;
    else if (k.rank <= 30) rank11_30++;
    else rank31plus++;
  }

  return {
    yearMonth,
    monthStart: start,
    monthEnd: end,
    totalPublished: pubs.length,
    byChannel,
    avgPublishTimeSeconds: durationCount > 0 ? Math.round(totalDuration / durationCount) : null,
    searchVisibility: {
      total: keywords.length,
      rank1_10,
      rank11_30,
      rank31plus,
      notFound,
      keywords,
    },
  };
}

function esc(s: string | null | undefined): string {
  return (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function fmtDuration(secs: number | null): string {
  if (secs == null) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}분 ${s}초`;
}

function bar(value: number, max: number): string {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return `<div style="background:#f3f4f6;border-radius:6px;height:10px;overflow:hidden;"><div style="background:#10b981;width:${pct}%;height:100%;"></div></div>`;
}

export function buildHtmlReport(client: Client, stats: MonthlyStats): string {
  const ch = stats.byChannel;
  const maxCh = Math.max(ch.naver_blog, ch.threads, ch.instagram, 1);
  const vis = stats.searchVisibility;
  const visTotal = vis.total || 1;

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${esc(client.businessName)} ${esc(stats.yearMonth)} 마케팅 대행 리포트</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", sans-serif; max-width: 880px; margin: 0 auto; padding: 40px 24px; color: #111; line-height: 1.6; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin-top: 36px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
  .sub { color: #6b7280; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .card { padding: 18px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .card .label { font-size: 12px; color: #6b7280; }
  .card .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th, td { text-align: left; padding: 8px 4px; border-bottom: 1px solid #f3f4f6; }
  th { color: #6b7280; font-weight: 500; }
  .row { display: grid; grid-template-columns: 100px 1fr 60px; gap: 12px; align-items: center; margin: 8px 0; font-size: 14px; }
  .rank-1-10 { color: #10b981; font-weight: 600; }
  .rank-11-30 { color: #f59e0b; }
  .rank-31 { color: #6b7280; }
  .rank-na { color: #9ca3af; font-style: italic; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
</style>
</head>
<body>
<h1>${esc(client.businessName)}</h1>
<p class="sub">${esc(stats.yearMonth)} 월간 마케팅 대행 리포트 · 스몰테이블 마케팅 대행</p>

<h2>발행 요약</h2>
<div class="grid">
  <div class="card"><div class="label">총 발행</div><div class="value">${stats.totalPublished}건</div></div>
  <div class="card"><div class="label">평균 발행 소요 시간 (네이버)</div><div class="value">${fmtDuration(stats.avgPublishTimeSeconds)}</div></div>
</div>

<h2>채널별 발행</h2>
<div class="row">네이버 블로그${bar(ch.naver_blog, maxCh)}<span>${ch.naver_blog}건</span></div>
<div class="row">Threads${bar(ch.threads, maxCh)}<span>${ch.threads}건</span></div>
<div class="row">Instagram${bar(ch.instagram, maxCh)}<span>${ch.instagram}건</span></div>

<h2>검색 노출 (네이버 블로그 ${vis.total}개 키워드)</h2>
<div class="row"><span class="rank-1-10">1~10위</span>${bar(vis.rank1_10, visTotal)}<span>${vis.rank1_10}건</span></div>
<div class="row"><span class="rank-11-30">11~30위</span>${bar(vis.rank11_30, visTotal)}<span>${vis.rank11_30}건</span></div>
<div class="row"><span class="rank-31">31위+</span>${bar(vis.rank31plus, visTotal)}<span>${vis.rank31plus}건</span></div>
<div class="row"><span class="rank-na">노출 안 됨</span>${bar(vis.notFound, visTotal)}<span>${vis.notFound}건</span></div>

${vis.keywords.length > 0 ? `
<h2>키워드별 순위</h2>
<table>
  <thead><tr><th>키워드</th><th>순위</th></tr></thead>
  <tbody>
    ${vis.keywords
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
      .map((k) => {
        const cls =
          k.rank == null ? "rank-na" : k.rank <= 10 ? "rank-1-10" : k.rank <= 30 ? "rank-11-30" : "rank-31";
        const txt = k.rank == null ? "노출 안 됨" : `${k.rank}위`;
        return `<tr><td>${esc(k.keyword)}</td><td class="${cls}">${txt}</td></tr>`;
      })
      .join("")}
  </tbody>
</table>
` : ""}

<footer>
  생성일: ${new Date().toISOString().slice(0, 10)} · 스몰테이블 마케팅 대행 콘솔 자동 생성
</footer>
</body>
</html>`;
}

/**
 * 통계 집계 → HTML 빌드 → Blob 저장 → agency_monthly_reports upsert.
 * 수동 POST 라우트와 cron 라우트가 공유.
 */
export async function generateAndStoreReport(client: Client, yearMonth: string) {
  const stats = await aggregateMonthlyStats(client.id, yearMonth);
  const html = buildHtmlReport(client, stats);

  const blob = await put(
    `agency/${client.id}/reports/${yearMonth}-${Date.now()}.html`,
    html,
    { access: "public", contentType: "text/html; charset=utf-8" },
  );

  const [existing] = await db
    .select({ id: agencyMonthlyReports.id })
    .from(agencyMonthlyReports)
    .where(
      and(
        eq(agencyMonthlyReports.clientId, client.id),
        eq(agencyMonthlyReports.yearMonth, yearMonth),
      ),
    )
    .limit(1);

  const values = {
    clientId: client.id,
    yearMonth,
    totalPublished: stats.totalPublished,
    searchVisibility: stats.searchVisibility,
    avgPublishTimeSeconds: stats.avgPublishTimeSeconds,
    reportUrl: blob.url,
  };

  let report;
  if (existing) {
    [report] = await db
      .update(agencyMonthlyReports)
      .set({ ...values, generatedAt: new Date() })
      .where(eq(agencyMonthlyReports.id, existing.id))
      .returning();
  } else {
    [report] = await db.insert(agencyMonthlyReports).values(values).returning();
  }

  return { report, stats };
}

/** 운영자 workspace의 active 클라이언트 전체 조회 */
export async function listActiveClientsForOperator(operatorWorkspaceId: string) {
  return db
    .select()
    .from(agencyClients)
    .where(
      and(
        eq(agencyClients.operatorWorkspaceId, operatorWorkspaceId),
        eq(agencyClients.status, "active"),
      ),
    );
}

/** "직전 달" yearMonth 계산 (오늘 기준) */
export function previousYearMonth(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based, 0=1월
  // 이번 달이 1월이면 직전 달 = 작년 12월
  const prevMonth = month === 0 ? 12 : month;
  const prevYear = month === 0 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
}
