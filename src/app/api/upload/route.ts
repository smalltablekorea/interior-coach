import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
]);

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "write");
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) return err("파일이 필요합니다");
    if (file.size > MAX_SIZE) return err("파일 크기는 10MB 이하만 가능합니다");
    if (!ALLOWED_TYPES.has(file.type)) return err("지원하지 않는 파일 형식입니다");

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
