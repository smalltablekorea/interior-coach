import { describe, it, expect } from "vitest";

/**
 * Marketing automation unit tests (AI-34)
 * Tests for hashtag optimization, auto-caption generation, and cron scheduling logic
 */

// ── Hashtag Optimization Tests ──

describe("hashtag optimization", () => {
  it("generates hashtags within channel limits", () => {
    // Instagram: max 30
    const igTags = generateOptimizedHashtags({
      channel: "instagram",
      buildingType: "아파트",
      areaPyeong: 32,
    });
    expect(igTags.all.length).toBeLessThanOrEqual(30);
    expect(igTags.all.length).toBeGreaterThan(0);

    // X: max 5
    const xTags = generateOptimizedHashtags({
      channel: "x",
      buildingType: "아파트",
    });
    expect(xTags.all.length).toBeLessThanOrEqual(5);
  });

  it("includes brand tags", () => {
    const result = generateOptimizedHashtags({ channel: "instagram" });
    expect(result.primary).toContain("스몰테이블디자인");
  });

  it("adds building type tags", () => {
    const result = generateOptimizedHashtags({
      channel: "instagram",
      buildingType: "상가",
    });
    expect(result.secondary).toContain("상가인테리어");
    expect(result.secondary).toContain("매장인테리어");
  });

  it("adds area-based tags", () => {
    const result = generateOptimizedHashtags({
      channel: "instagram",
      areaPyeong: 32,
    });
    expect(result.secondary).toContain("30평대인테리어");
  });

  it("adds location tags to niche", () => {
    const result = generateOptimizedHashtags({
      channel: "instagram",
      location: "서울 강남구",
    });
    expect(result.niche).toContain("강남인테리어");
  });

  it("deduplicates tags", () => {
    const result = generateOptimizedHashtags({
      channel: "instagram",
      buildingType: "아파트",
      customTags: ["인테리어", "아파트인테리어"],
    });
    const unique = new Set(result.all);
    expect(unique.size).toBe(result.all.length);
  });

  it("provides strategy text per channel", () => {
    const ig = generateOptimizedHashtags({ channel: "instagram" });
    expect(ig.strategy).toContain("인스타그램");

    const x = generateOptimizedHashtags({ channel: "x" });
    expect(x.strategy).toContain("X");
  });
});

// ── Auto Caption Generation Tests ──

describe("auto caption generation", () => {
  it("generates instagram caption for site completion", () => {
    const caption = generateAutoCaption(
      "instagram",
      "잠실 르엘 34평",
      "아파트",
      34,
      "",
      "site_complete"
    );
    expect(caption.body).toContain("시공 완료");
    expect(caption.body).toContain("잠실 르엘 34평");
    expect(caption.hashtags.length).toBeGreaterThan(5);
    expect(caption.hashtags).toContain("인테리어");
    expect(caption.hashtags).toContain("아파트인테리어");
  });

  it("generates x tweet with shorter format", () => {
    const caption = generateAutoCaption(
      "x",
      "퍼스트월드 47평",
      "아파트",
      47,
      "목공",
      "phase_complete"
    );
    // X should have fewer hashtags
    expect(caption.hashtags.length).toBeLessThanOrEqual(5);
    expect(caption.body.length).toBeLessThan(300);
  });

  it("generates threads caption", () => {
    const caption = generateAutoCaption(
      "threads",
      "강남 빌라",
      "빌라",
      null,
      "",
      "site_complete"
    );
    expect(caption.body).toContain("강남 빌라");
    expect(caption.hashtags.length).toBeLessThanOrEqual(10);
  });

  it("adds trade-specific hashtags for phase completion", () => {
    const caption = generateAutoCaption(
      "instagram",
      "테스트현장",
      "아파트",
      30,
      "타일",
      "phase_complete"
    );
    expect(caption.hashtags).toContain("타일시공");
  });

  it("adds area-based hashtags", () => {
    const small = generateAutoCaption("instagram", "원룸", "오피스텔", 10, "", "site_complete");
    expect(small.hashtags).toContain("소형인테리어");

    const large = generateAutoCaption("instagram", "대형", "아파트", 50, "", "site_complete");
    expect(large.hashtags).toContain("대형인테리어");
  });
});

// ── Cron Schedule Tests ──

describe("shouldTrigger", () => {
  const now = new Date("2026-04-22T10:00:00Z");

  it("triggers if never triggered", () => {
    expect(shouldTrigger(null, "daily", now)).toBe(true);
  });

  it("triggers daily after 24h", () => {
    const yesterday = new Date("2026-04-21T09:00:00Z");
    expect(shouldTrigger(yesterday, "daily", now)).toBe(true);
  });

  it("does not trigger daily before 24h", () => {
    const recent = new Date("2026-04-22T09:30:00Z");
    expect(shouldTrigger(recent, "daily", now)).toBe(false);
  });

  it("triggers weekly after 7 days", () => {
    const lastWeek = new Date("2026-04-14T10:00:00Z");
    expect(shouldTrigger(lastWeek, "weekly", now)).toBe(true);
  });

  it("does not trigger weekly before 7 days", () => {
    const recent = new Date("2026-04-17T10:00:00Z");
    expect(shouldTrigger(recent, "weekly", now)).toBe(false);
  });

  it("handles every_12h schedule", () => {
    const moreThan12h = new Date("2026-04-21T21:00:00Z");
    expect(shouldTrigger(moreThan12h, "every_12h", now)).toBe(true);

    const lessThan12h = new Date("2026-04-22T00:00:00Z");
    expect(shouldTrigger(lessThan12h, "every_12h", now)).toBe(false);
  });

  it("handles every_3d schedule", () => {
    const moreThan3d = new Date("2026-04-18T10:00:00Z");
    expect(shouldTrigger(moreThan3d, "every_3d", now)).toBe(true);
  });

  it("defaults to daily for unknown schedule", () => {
    const yesterday = new Date("2026-04-21T09:00:00Z");
    expect(shouldTrigger(yesterday, "unknown_schedule", now)).toBe(true);
  });
});

// ── Template Application Tests ──

describe("applyTemplate", () => {
  it("replaces date variables", () => {
    const result = applyTemplate(
      "{{month}}월 인테리어 트렌드 — {{dayOfWeek}}요일 인사이트",
      "인테리어, 인테리어팁"
    );
    expect(result.body).toMatch(/\d+월 인테리어 트렌드/);
    expect(result.body).toMatch(/요일 인사이트/);
    expect(result.hashtags).toContain("인테리어");
    expect(result.hashtags).toContain("인테리어팁");
  });

  it("uses default hashtags when template is null", () => {
    const result = applyTemplate("테스트 본문", null);
    expect(result.hashtags).toContain("인테리어");
    expect(result.hashtags).toContain("스몰테이블디자인");
  });

  it("parses hashtags from various formats", () => {
    const result = applyTemplate("본문", "#태그1 #태그2, 태그3");
    expect(result.hashtags).toContain("태그1");
    expect(result.hashtags).toContain("태그2");
    expect(result.hashtags).toContain("태그3");
  });
});

// ── MARKETING_CHANNELS Tests ──

describe("MARKETING_CHANNELS", () => {
  it("includes X channel", async () => {
    const { MARKETING_CHANNELS } = await import("@/lib/constants");
    const xChannel = MARKETING_CHANNELS.find((c) => c.id === "x");
    expect(xChannel).toBeDefined();
    expect(xChannel!.name).toBe("X (트위터)");
  });

  it("includes all expected channels", async () => {
    const { MARKETING_CHANNELS } = await import("@/lib/constants");
    const ids = MARKETING_CHANNELS.map((c) => c.id);
    expect(ids).toContain("threads");
    expect(ids).toContain("instagram");
    expect(ids).toContain("x");
    expect(ids).toContain("naver_blog");
    expect(ids).toContain("youtube");
  });
});

// ── Inline implementations for testing (extracted from route files) ──

function generateOptimizedHashtags(input: {
  channel: string;
  buildingType?: string;
  areaPyeong?: number;
  location?: string;
  contentType?: string;
  customTags?: string[];
}) {
  const HASHTAG_DB = {
    primary: [
      "인테리어", "인테리어디자인", "리모델링", "홈인테리어", "인테리어시공",
    ],
    brand: ["스몰테이블디자인", "스몰테이블디자인그룹", "인테리어코치"],
    buildingType: {
      아파트: ["아파트인테리어", "아파트리모델링", "아파트올수리"],
      빌라: ["빌라인테리어", "빌라리모델링"],
      오피스텔: ["오피스텔인테리어", "원룸인테리어"],
      상가: ["상가인테리어", "매장인테리어", "상업인테리어"],
      주택: ["주택인테리어", "단독주택인테리어"],
    } as Record<string, string[]>,
    area: {
      small: ["소형인테리어", "10평대인테리어"],
      medium20: ["20평대인테리어", "신혼집인테리어"],
      medium30: ["30평대인테리어", "국민평수인테리어"],
      large: ["40평대인테리어", "대형인테리어"],
    } as Record<string, string[]>,
    style: ["모던인테리어", "미니멀인테리어", "내추럴인테리어"],
    trending: ["2026인테리어", "인테리어트렌드"],
    locations: {
      강남: ["강남인테리어", "강남리모델링"],
      서울: ["서울인테리어", "서울리모델링"],
    } as Record<string, string[]>,
  };

  const primary = [...HASHTAG_DB.primary.slice(0, 5), ...HASHTAG_DB.brand];
  const secondary: string[] = [];
  if (input.buildingType && HASHTAG_DB.buildingType[input.buildingType]) {
    secondary.push(...HASHTAG_DB.buildingType[input.buildingType]);
  }
  if (input.areaPyeong) {
    if (input.areaPyeong <= 15) secondary.push(...HASHTAG_DB.area.small);
    else if (input.areaPyeong <= 25) secondary.push(...HASHTAG_DB.area.medium20);
    else if (input.areaPyeong <= 35) secondary.push(...HASHTAG_DB.area.medium30);
    else secondary.push(...HASHTAG_DB.area.large);
  }

  const niche: string[] = [];
  if (input.location) {
    const locationKey = Object.keys(HASHTAG_DB.locations).find(
      (k) => input.location!.includes(k)
    );
    if (locationKey) niche.push(...HASHTAG_DB.locations[locationKey]);
  }
  niche.push(...HASHTAG_DB.style.slice(0, 3));

  const trending = [...HASHTAG_DB.trending.slice(0, 2)];
  const limits: Record<string, number> = {
    instagram: 30, threads: 10, x: 5, naver_blog: 15, youtube: 15,
  };
  const maxTags = limits[input.channel] || 15;

  const allTags = [
    ...primary, ...secondary, ...niche, ...trending, ...(input.customTags || []),
  ];
  const unique = [...new Set(allTags)].slice(0, maxTags);

  const strategy = input.channel === "instagram"
    ? "인스타그램: 대형 해시태그(도달범위) + 중형(타겟) + 소형(참여율) 3단계 전략."
    : input.channel === "x"
      ? "X: 핵심 키워드 3~5개만 사용."
      : "채널 특성에 맞는 해시태그 최적화.";

  return { primary, secondary, niche, trending, all: unique, strategy };
}

function generateAutoCaption(
  channel: string,
  siteName: string,
  buildingType: string | null,
  areaPyeong: number | null,
  phaseName: string,
  triggerType: string
) {
  const typeLabel = buildingType || "인테리어";
  const areaLabel = areaPyeong ? `${areaPyeong}평` : "";
  const baseHashtags = ["인테리어", "인테리어시공", "스몰테이블디자인", "인테리어업체", "리모델링"];

  if (buildingType) {
    const typeHashtags: Record<string, string[]> = {
      아파트: ["아파트인테리어", "아파트리모델링"],
      빌라: ["빌라인테리어"],
      오피스텔: ["오피스텔인테리어"],
      상가: ["상가인테리어", "매장인테리어"],
    };
    baseHashtags.push(...(typeHashtags[buildingType] || []));
  }

  if (areaPyeong) {
    if (areaPyeong <= 20) baseHashtags.push("소형인테리어", "원룸인테리어");
    else if (areaPyeong <= 30) baseHashtags.push("20평대인테리어");
    else if (areaPyeong <= 40) baseHashtags.push("30평대인테리어");
    else baseHashtags.push("대형인테리어", "40평대인테리어");
  }

  if (phaseName) {
    const phaseHashtags: Record<string, string[]> = {
      타일: ["타일시공", "욕실타일"],
      목공: ["목공사", "인테리어목공"],
      전기: ["전기공사", "조명시공"],
    };
    baseHashtags.push(...(phaseHashtags[phaseName] || [phaseName + "시공"]));
  }

  if (channel === "x") {
    const body = triggerType === "site_complete"
      ? `✨ ${siteName} ${typeLabel} ${areaLabel} 시공 완료!\n\n정성을 다한 결과물, 확인해 보세요.`
      : `🔨 ${siteName} ${phaseName} 공정 완료\n\n${typeLabel} ${areaLabel} 현장 진행 중입니다.`;
    return { body, hashtags: baseHashtags.slice(0, 5) };
  }

  if (channel === "threads") {
    const body = triggerType === "site_complete"
      ? `✨ ${siteName} ${typeLabel} ${areaLabel} 시공이 완료되었습니다.\n\n고객님의 꿈꾸던 공간이 현실이 되었습니다.`
      : `🔨 ${siteName} ${phaseName} 공정이 완료되었습니다.`;
    return { body, hashtags: baseHashtags.slice(0, 10) };
  }

  const body = triggerType === "site_complete"
    ? `✨ ${siteName} ${typeLabel} ${areaLabel} 시공 완료 ✨\n\n고객님의 꿈꾸던 공간이 현실이 되었습니다.\n\n🏠 ${typeLabel}${areaLabel ? ` ${areaLabel}` : ""}\n📍 스몰테이블디자인그룹`
    : `🔨 ${siteName} ${phaseName} 공정 완료\n\n${typeLabel}${areaLabel ? ` ${areaLabel}` : ""} 현장에서\n${phaseName} 작업이 마무리되었습니다.`;
  return { body, hashtags: baseHashtags.slice(0, 20) };
}

function shouldTrigger(
  lastTriggered: Date | null,
  schedule: string,
  now: Date
): boolean {
  if (!lastTriggered) return true;
  const elapsed = now.getTime() - new Date(lastTriggered).getTime();
  const hours = elapsed / (1000 * 60 * 60);

  switch (schedule) {
    case "daily": return hours >= 24;
    case "weekly": return hours >= 168;
    case "every_12h": return hours >= 12;
    case "every_3d": return hours >= 72;
    default: {
      const hourMatch = schedule.match(/every_(\d+)h/);
      if (hourMatch) return hours >= parseInt(hourMatch[1], 10);
      const dayMatch = schedule.match(/every_(\d+)d/);
      if (dayMatch) return hours >= parseInt(dayMatch[1], 10) * 24;
      return hours >= 24;
    }
  }
}

function applyTemplate(
  contentTemplate: string,
  hashtagTemplate: string | null
): { body: string; hashtags: string[] } {
  const now = new Date();
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];
  const month = now.getMonth() + 1;

  let body = contentTemplate
    .replace(/\{\{dayOfWeek\}\}/g, dayOfWeek)
    .replace(/\{\{month\}\}/g, String(month))
    .replace(/\{\{date\}\}/g, `${month}/${now.getDate()}`);

  const hashtags = hashtagTemplate
    ? hashtagTemplate.split(/[,\s#]+/).filter(Boolean).map((h) => h.trim())
    : ["인테리어", "인테리어팁", "스몰테이블디자인"];

  return { body, hashtags };
}
