// Seed demo threads data
// Run: node scripts/seed-threads.mjs

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  const userId = "system";

  // Get existing sites
  const sites = await sql`SELECT id, name FROM sites WHERE user_id = ${userId} ORDER BY created_at LIMIT 3`;
  console.log("Found sites:", sites.map((s) => s.name));

  // 1. Threads Account
  console.log("Creating threads account...");
  await sql`
    INSERT INTO threads_account (id, user_id, username, is_connected, connected_at)
    VALUES (gen_random_uuid(), ${userId}, 'interiorcoach_kr', true, NOW())
  `;

  // 2. Templates
  console.log("Creating templates...");
  const templateData = [
    {
      name: "시공완료 포스팅",
      category: "시공완료",
      contentTemplate: "✨ 시공 완료!\n\n[현장명] 프로젝트가 마무리되었습니다.\n\n깔끔한 마감과 세심한 디테일로\n고객님의 꿈꾸던 공간을 완성했습니다.\n\n📐 면적: [면적]평\n🏗️ 기간: [기간]\n🎨 컨셉: [컨셉]\n\n인테리어 상담은 DM 주세요! 💬",
      hashtagTemplate: "#인테리어 #리모델링 #시공완료 #인테리어코치 #아파트인테리어",
    },
    {
      name: "시공팁 공유",
      category: "시공팁",
      contentTemplate: "💡 인테리어 꿀팁!\n\n오늘은 [주제]에 대해 알려드릴게요.\n\n1️⃣ [팁1]\n2️⃣ [팁2]\n3️⃣ [팁3]\n\n더 궁금한 점은 댓글로 물어봐주세요! 👇",
      hashtagTemplate: "#인테리어팁 #리모델링팁 #인테리어코치 #인테리어정보 #집꾸미기",
    },
    {
      name: "고객후기 공유",
      category: "고객후기",
      contentTemplate: "🏠 고객님 후기\n\n\"[후기 내용]\"\n- [지역] [건물유형] [면적]평 고객님\n\n소중한 후기 감사합니다! 🙏\n\n인테리어 상담 문의는 DM으로! 💬",
      hashtagTemplate: "#인테리어후기 #고객후기 #인테리어코치 #리모델링후기 #시공후기",
    },
    {
      name: "프로모션 안내",
      category: "프로모션",
      contentTemplate: "🎉 특별 프로모션!\n\n[프로모션 내용]\n\n📅 기간: [시작일] ~ [종료일]\n💰 혜택: [혜택 내용]\n\n선착순 마감이니 서둘러주세요! ⏰\n\n상담 예약: DM 또는 프로필 링크 📱",
      hashtagTemplate: "#인테리어할인 #리모델링이벤트 #인테리어코치 #인테리어프로모션",
    },
    {
      name: "현장 일상",
      category: "일상",
      contentTemplate: "🔨 오늘의 현장\n\n[현장 설명]\n\n매일매일 최선을 다하는\n인테리어코치 팀의 하루! 💪\n\n#현장스케치 #인테리어일상",
      hashtagTemplate: "#인테리어일상 #시공현장 #인테리어코치 #현장스케치 #인테리어업체",
    },
  ];

  const templateIds = [];
  for (const t of templateData) {
    const [result] = await sql`
      INSERT INTO threads_templates (id, user_id, name, category, content_template, hashtag_template, usage_count)
      VALUES (gen_random_uuid(), ${userId}, ${t.name}, ${t.category}, ${t.contentTemplate}, ${t.hashtagTemplate}, ${Math.floor(Math.random() * 10)})
      RETURNING id
    `;
    templateIds.push(result.id);
  }

  // 3. Posts
  console.log("Creating posts...");
  const postData = [
    {
      siteId: sites[0]?.id || null,
      content: "✨ 한남동 현대리버티하우스 시공 진행 중!\n\n62평 대형 아파트 리모델링 프로젝트입니다.\n현재 도장공사와 가구공사가 한창이에요.\n\n깔끔한 화이트톤 + 우드 포인트로\n모던하면서도 따뜻한 공간을 만들고 있습니다 🏠\n\n완성되면 Before/After 보여드릴게요!\n\n인테리어 상담은 DM 주세요 💬",
      hashtags: "#한남동인테리어 #아파트리모델링 #인테리어코치 #62평인테리어 #모던인테리어",
      status: "발행완료",
      publishedAt: "2026-03-10T10:00:00Z",
      likes: 45,
      comments: 8,
      views: 320,
    },
    {
      siteId: sites[1]?.id || null,
      content: "💡 인테리어 꿀팁 - 보일러 교체 시기!\n\n보일러 교체, 언제 해야 할까요?\n\n1️⃣ 사용 연한 10년 이상\n2️⃣ 난방비가 갑자기 늘었을 때\n3️⃣ 이상 소음이 발생할 때\n4️⃣ 온수가 잘 안 나올 때\n\n리모델링 할 때 함께 교체하면\n비용도 절약할 수 있어요! 👍\n\n궁금한 점은 댓글로! 👇",
      hashtags: "#보일러교체 #인테리어팁 #리모델링팁 #인테리어코치 #난방",
      status: "발행완료",
      publishedAt: "2026-03-12T14:00:00Z",
      likes: 67,
      comments: 15,
      views: 580,
    },
    {
      siteId: null,
      content: "🏠 고객님 후기\n\n\"처음 인테리어 하는 거라 걱정이 많았는데,\n인테리어코치 팀이 처음부터 끝까지\n꼼꼼하게 진행해주셔서 너무 만족합니다.\n특히 자재 선택할 때 전문적인 조언이 큰 도움이 됐어요!\"\n\n- 강서구 아파트 45평 고객님\n\n소중한 후기 감사합니다! 🙏",
      hashtags: "#인테리어후기 #고객후기 #인테리어코치 #리모델링후기 #45평인테리어",
      status: "발행완료",
      publishedAt: "2026-03-15T09:00:00Z",
      likes: 34,
      comments: 5,
      views: 210,
    },
    {
      siteId: sites[0]?.id || null,
      content: "🔨 오늘의 현장 - 한남동\n\n씽크대 주문제작 시공이 진행 중이에요.\n씽크연구소에서 맞춤 제작한 싱크대가\n드디어 설치되고 있습니다!\n\n주방은 집의 심장이니까,\n기능성과 디자인 모두 놓치지 않았어요 ✨\n\n매일매일 최선을 다하는\n인테리어코치 팀의 하루! 💪",
      hashtags: "#시공현장 #주방인테리어 #싱크대 #인테리어코치 #한남동",
      status: "발행완료",
      publishedAt: "2026-03-17T11:00:00Z",
      likes: 28,
      comments: 3,
      views: 180,
    },
    {
      siteId: sites[2]?.id || null,
      content: "🎉 3월 특별 프로모션!\n\n봄맞이 인테리어 상담 이벤트 🌸\n\n📅 기간: 3월 20일 ~ 3월 31일\n💰 혜택: 견적 상담 시 3D 시뮬레이션 무료 제공\n\n신혼집, 이사 전 리모델링 고민이시라면\n이번 기회를 놓치지 마세요!\n\n상담 예약: DM 또는 프로필 링크 📱",
      hashtags: "#인테리어이벤트 #봄인테리어 #인테리어코치 #리모델링할인 #3D시뮬레이션",
      status: "예약",
      scheduledAt: "2026-03-21T09:00:00Z",
      likes: 0,
      comments: 0,
      views: 0,
    },
    {
      siteId: null,
      content: "💡 타일 선택 가이드\n\n욕실 타일, 어떤 걸 골라야 할까요?\n\n1️⃣ 바닥: 미끄럼 방지 처리된 타일\n2️⃣ 벽면: 밝은 톤으로 공간감 UP\n3️⃣ 포인트: 패턴 타일로 포인트\n4️⃣ 크기: 작은 욕실은 큰 타일 추천\n\n타일 하나로 욕실 분위기가 확 바뀝니다! ✨",
      hashtags: "#욕실타일 #타일인테리어 #인테리어팁 #인테리어코치 #욕실리모델링",
      status: "예약",
      scheduledAt: "2026-03-24T10:00:00Z",
      likes: 0,
      comments: 0,
      views: 0,
    },
    {
      siteId: sites[1]?.id || null,
      content: "",
      hashtags: "",
      status: "작성중",
      scheduledAt: null,
      likes: 0,
      comments: 0,
      views: 0,
    },
    {
      siteId: null,
      content: "",
      hashtags: "",
      status: "작성중",
      scheduledAt: null,
      likes: 0,
      comments: 0,
      views: 0,
    },
  ];

  // Filter out posts with empty content for "작성중" status
  const postIds = [];
  for (const p of postData) {
    const content = p.content || "작성 중인 포스트입니다.";
    const [result] = await sql`
      INSERT INTO threads_posts (id, user_id, site_id, content, hashtags, status, scheduled_at, published_at, likes, comments, views)
      VALUES (
        gen_random_uuid(), ${userId}, ${p.siteId},
        ${content}, ${p.hashtags || null}, ${p.status},
        ${p.scheduledAt || null}, ${p.publishedAt || null},
        ${p.likes}, ${p.comments}, ${p.views}
      )
      RETURNING id
    `;
    postIds.push(result.id);
  }

  // 4. Auto Rules
  console.log("Creating auto rules...");
  await sql`
    INSERT INTO threads_auto_rules (id, user_id, name, type, template_id, is_active, trigger_count, config) VALUES
      (gen_random_uuid(), ${userId}, '시공완료 자동 포스팅', '시공완료자동', ${templateIds[0]}, true, 3, '{"autoPublish": false}'),
      (gen_random_uuid(), ${userId}, '매주 수요일 시공팁', '정기포스팅', ${templateIds[1]}, true, 5, '{"dayOfWeek": 3, "time": "10:00", "category": "시공팁"}'),
      (gen_random_uuid(), ${userId}, '시공사진 5장 이상 자동', '시공사진자동', ${templateIds[4]}, false, 0, '{"minPhotos": 5}')
  `;

  // 5. Comments (on published posts)
  console.log("Creating comments...");
  const publishedPostIds = postIds.slice(0, 4); // First 4 are published

  if (publishedPostIds.length >= 2) {
    await sql`
      INSERT INTO threads_comments (id, user_id, post_id, author_name, comment_text, reply_text, reply_status, is_auto_reply) VALUES
        (gen_random_uuid(), ${userId}, ${publishedPostIds[0]}, '집꾸미기좋아', '와 너무 예뻐요! 62평이면 얼마나 드나요?', '감사합니다! 😊 면적과 시공 범위에 따라 달라지는데요, 자세한 상담은 DM 주시면 안내드릴게요! 💬', '대기', true),
        (gen_random_uuid(), ${userId}, ${publishedPostIds[0]}, '인테리어초보', '한남동이면 고급 인테리어 전문인가요?', NULL, '대기', false),
        (gen_random_uuid(), ${userId}, ${publishedPostIds[1]}, '따뜻한집', '보일러 교체 비용이 궁금해요!', '안녕하세요! 보일러 종류와 평수에 따라 다르지만, 보통 150~300만원 정도입니다. DM으로 자세히 안내드릴게요! 🙏', '완료', true),
        (gen_random_uuid(), ${userId}, ${publishedPostIds[1]}, '신혼부부_집', '저희 집 보일러가 12년 됐는데 교체해야 할까요?', NULL, '대기', false),
        (gen_random_uuid(), ${userId}, ${publishedPostIds[2]}, '예비신혼', '후기 보니까 믿음이 가네요! 상담 받고 싶어요', '감사합니다! 😊 DM으로 연락 주시면 무료 상담 일정 잡아드릴게요! 💬', '완료', true)
    `;
  }

  console.log(`✅ Threads demo data seeded!`);
  console.log(`  - 1 account`);
  console.log(`  - ${templateData.length} templates`);
  console.log(`  - ${postData.length} posts`);
  console.log(`  - 3 auto rules`);
  console.log(`  - 5 comments`);
}

seed().catch(console.error);
