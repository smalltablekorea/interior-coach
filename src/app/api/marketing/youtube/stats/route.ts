import { NextResponse } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { getValidToken } from "@/lib/marketing-oauth/token-manager";

export async function GET() {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;

  const token = await getValidToken(auth.userId, "youtube");
  if (!token) {
    return NextResponse.json(
      { error: "YouTube 계정이 연결되지 않았습니다." },
      { status: 401 }
    );
  }

  try {
    // Fetch channel info
    const channelResp = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!channelResp.ok) throw new Error("YouTube 채널 조회 실패");
    const channelData = await channelResp.json();
    const channel = channelData.items?.[0];
    if (!channel) throw new Error("연결된 YouTube 채널이 없습니다");

    const stats = channel.statistics;

    // Fetch recent videos from uploads playlist
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    let recentVideos: {
      id: string;
      title: string;
      thumbnail: string;
      publishedAt: string;
      views: number;
      likes: number;
      comments: number;
      duration: string;
    }[] = [];

    if (uploadsPlaylistId) {
      const playlistResp = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (playlistResp.ok) {
        const playlistData = await playlistResp.json();
        const videoIds = (playlistData.items || [])
          .map((item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId)
          .join(",");

        if (videoIds) {
          const videosResp = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (videosResp.ok) {
            const videosData = await videosResp.json();
            recentVideos = (videosData.items || []).map(
              (v: {
                id: string;
                snippet: { title: string; thumbnails: { medium?: { url: string } }; publishedAt: string };
                statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
                contentDetails: { duration: string };
              }) => ({
                id: v.id,
                title: v.snippet.title,
                thumbnail: v.snippet.thumbnails?.medium?.url || "",
                publishedAt: v.snippet.publishedAt,
                views: parseInt(v.statistics.viewCount || "0"),
                likes: parseInt(v.statistics.likeCount || "0"),
                comments: parseInt(v.statistics.commentCount || "0"),
                duration: v.contentDetails.duration,
              })
            );
          }
        }
      }
    }

    return NextResponse.json({
      channel: {
        id: channel.id,
        title: channel.snippet.title,
        description: (channel.snippet.description || "").slice(0, 200),
        thumbnail: channel.snippet.thumbnails?.medium?.url,
        customUrl: channel.snippet.customUrl,
        subscriberCount: parseInt(stats.subscriberCount || "0"),
        viewCount: parseInt(stats.viewCount || "0"),
        videoCount: parseInt(stats.videoCount || "0"),
      },
      recentVideos,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "YouTube 데이터 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
