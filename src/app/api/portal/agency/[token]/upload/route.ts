import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { agencyWeeklyUploads, agencyAlerts } from "@/lib/db/schema";
import { verifyPortalToken } from "@/lib/agency/portal-token";
import { runGenerationPipeline } from "@/lib/agency/generate-pipeline";

const AUTO_GENERATE_ON_UPLOAD = process.env.AGENCY_AUTO_GENERATE !== "false";

const MAX_SIZE_PER_FILE = 5 * 1024 * 1024; // 압축 후 2MB 목표, 안전 마진 포함 5MB
const MAX_FILES = 30;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const RETAIN_DAYS = 180;

/** 입력일 기준 같은 주 월요일 (KST 기준 한 주 = 월~일) */
function thisWeekMonday(now: Date = new Date()): Date {
  const day = now.getDay(); // 0(일)~6(토)
  const offset = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(mon.getDate() + offset);
  return mon;
}

function toDateOnly(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const verified = await verifyPortalToken(token);

  if (!verified.ok) {
    const statusCode =
      verified.status === "not_found" ? 404 : verified.status === "expired" ? 410 : 403;
    return NextResponse.json(
      { ok: false, status: verified.status },
      { status: statusCode },
    );
  }

  const { client } = verified;

  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    const notes = (formData.get("notes") as string) || null;

    if (files.length === 0) {
      return NextResponse.json({ ok: false, error: "사진을 1장 이상 첨부해주세요" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { ok: false, error: `한 번에 최대 ${MAX_FILES}장까지 업로드 가능합니다` },
        { status: 400 },
      );
    }

    for (const f of files) {
      if (f.size > MAX_SIZE_PER_FILE) {
        return NextResponse.json(
          { ok: false, error: `${f.name} 파일이 너무 큽니다 (압축 후 5MB 이하)` },
          { status: 400 },
        );
      }
      if (!ALLOWED_TYPES.has(f.type)) {
        return NextResponse.json(
          { ok: false, error: `${f.name}: 지원하지 않는 이미지 형식 (${f.type})` },
          { status: 400 },
        );
      }
    }

    const monday = thisWeekMonday();
    const retainUntil = new Date();
    retainUntil.setDate(retainUntil.getDate() + RETAIN_DAYS);

    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const safeName = (f.name || `photo-${i + 1}`).replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
      const path = `agency/${client.id}/weekly/${toDateOnly(monday)}/${Date.now()}-${i}-${safeName}`;
      const blob = await put(path, f, { access: "public" });
      urls.push(blob.url);
    }

    const [upload] = await db
      .insert(agencyWeeklyUploads)
      .values({
        clientId: client.id,
        weekOfDate: toDateOnly(monday),
        imageUrls: urls,
        notesText: notes,
        uploadedVia: "portal",
        retainUntil,
      })
      .returning();

    await db.insert(agencyAlerts).values({
      clientId: client.id,
      type: "other",
      severity: "info",
      message: `${client.businessName} ${toDateOnly(monday)} 주차 신규 업로드 ${urls.length}장`,
    });

    // 자동 콘텐츠 생성 트리거 (fire-and-forget). AGENCY_AUTO_GENERATE=false 면 비활성.
    if (AUTO_GENERATE_ON_UPLOAD) {
      void runGenerationPipeline(client.id)
        .then((results) => {
          // eslint-disable-next-line no-console
          console.log(
            `[agency:auto-generate] clientId=${client.id} results=${results.map((r) => `${r.channel}=${r.status}`).join(",")}`,
          );
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(`[agency:auto-generate] clientId=${client.id} FAILED`, e);
        });
    }

    return NextResponse.json({
      ok: true,
      upload: {
        id: upload.id,
        weekOfDate: upload.weekOfDate,
        imageUrls: upload.imageUrls,
        retainUntil: upload.retainUntil,
      },
      autoGenerateTriggered: AUTO_GENERATE_ON_UPLOAD,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
