import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
  "image/gif", "image/bmp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
]);
// 모바일(특히 iOS HEIC) 에서 file.type 가 비어 오는 경우가 잦아 확장자로 보조 판단.
const ALLOWED_EXT_RE = /\.(jpe?g|png|webp|heic|heif|gif|bmp|pdf|xlsx?|xls)$/i;

export async function POST(request: NextRequest) {
  // folder별 권한 카테고리 매핑. daily-log 는 construction(현장 운영)에 속함.
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "general";
  const category =
    folder === "specbook"
      ? "specbook"
      : folder === "daily-log" || folder === "daily-logs"
        ? "construction"
        : "sites";
  const auth = await requireWorkspaceAuth(
    category as "specbook" | "sites" | "construction",
    "write",
  );
  if (!auth.ok) return auth.response;

  try {

    if (!file) return err("파일이 필요합니다");
    if (file.size > MAX_SIZE) return err("파일 크기는 10MB 이하만 가능합니다");
    const typeOk = file.type ? ALLOWED_TYPES.has(file.type) : false;
    const extOk = ALLOWED_EXT_RE.test(file.name);
    if (!typeOk && !extOk) return err("지원하지 않는 파일 형식입니다");

    const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
    const path = `${folder}/${auth.userId}/${Date.now()}-${safeName}`;

    const blob = await put(path, file, { access: "public" });

    return ok({
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    return serverError(error);
  }
}
