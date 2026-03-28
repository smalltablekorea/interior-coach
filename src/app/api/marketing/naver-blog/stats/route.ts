import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { marketingChannels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const [channel] = await db
      .select()
      .from(marketingChannels)
      .where(
        and(
          eq(marketingChannels.userId, auth.userId),
          eq(marketingChannels.channel, "naver_blog")
        )
      )
      .limit(1);

    if (!channel?.isActive || !channel.accountId) {
      return NextResponse.json(
        { error: "네이버 블로그가 연결되지 않았습니다." },
        { status: 401 }
      );
    }

    const blogId = channel.accountId;

    // Fetch blog RSS feed
    const rssUrl = `https://rss.blog.naver.com/${blogId}.xml`;
    const rssResp = await fetch(rssUrl, {
      headers: { "User-Agent": "InteriorCoach/1.0" },
    });

    if (!rssResp.ok) {
      return NextResponse.json({
        blogId,
        blogUrl: `https://blog.naver.com/${blogId}`,
        posts: [],
        totalPosts: 0,
        error: "RSS 피드를 가져올 수 없습니다. 블로그가 공개 설정인지 확인해주세요.",
      });
    }

    const rssText = await rssResp.text();

    // Parse RSS XML
    const posts: {
      title: string;
      link: string;
      description: string;
      pubDate: string;
    }[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(rssText)) !== null) {
      const itemXml = match[1];
      const title = extractTag(itemXml, "title");
      const link = extractTag(itemXml, "link");
      const description = extractTag(itemXml, "description");
      const pubDate = extractTag(itemXml, "pubDate");

      posts.push({
        title: decodeHtmlEntities(title),
        link,
        description: decodeHtmlEntities(stripHtml(description)).slice(0, 150),
        pubDate,
      });
    }

    const blogTitle = extractTag(rssText, "title") || blogId;

    // Fetch total post count
    let totalPosts = posts.length;
    try {
      const postCountResp = await fetch(
        `https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&currentPage=1&countPerPage=1`,
        {
          headers: {
            "User-Agent": "InteriorCoach/1.0",
            Referer: `https://blog.naver.com/${blogId}`,
          },
        }
      );
      if (postCountResp.ok) {
        const postCountText = await postCountResp.text();
        const totalCountMatch = postCountText.match(/"totalCount"\s*:\s*(\d+)/);
        if (totalCountMatch) totalPosts = parseInt(totalCountMatch[1]) || posts.length;
      }
    } catch { /* optional */ }

    // Fetch visitor stats (last 7 days)
    let todayVisitors = 0;
    let weeklyVisitors = 0;
    try {
      const visitorResp = await fetch(
        `https://blog.naver.com/NVisitorgp4Ajax.naver?blogId=${blogId}`,
        {
          headers: {
            "User-Agent": "InteriorCoach/1.0",
            Referer: `https://blog.naver.com/${blogId}`,
          },
        }
      );
      if (visitorResp.ok) {
        const visitorText = await visitorResp.text();
        const cntMatches = [...visitorText.matchAll(/cnt="(\d+)"/g)];
        if (cntMatches.length > 0) {
          todayVisitors = parseInt(cntMatches[cntMatches.length - 1][1]) || 0;
          weeklyVisitors = cntMatches.reduce((sum, m) => sum + (parseInt(m[1]) || 0), 0);
        }
      }
    } catch { /* optional */ }

    return NextResponse.json({
      blogId,
      blogTitle: decodeHtmlEntities(blogTitle),
      blogUrl: `https://blog.naver.com/${blogId}`,
      totalPosts,
      todayVisitors,
      weeklyVisitors,
      recentPosts: posts.slice(0, 20),
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "네이버 블로그 데이터 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractTag(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`);
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const simpleRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const simpleMatch = simpleRegex.exec(xml);
  return simpleMatch ? simpleMatch[1].trim() : "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}
