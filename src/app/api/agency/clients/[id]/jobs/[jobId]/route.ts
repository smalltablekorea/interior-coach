import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agencyClients,
  agencyContentJobs,
  agencyContentDrafts,
} from "@/lib/db/schema";
import { requireAgencyOperator } from "@/lib/agency/api-auth";
import { ok, notFound, err, serverError } from "@/lib/api/response";

const JOB_STATUSES = new Set(["generating", "qc_failed", "ready", "published", "cancelled"]);
const PATCHABLE_DRAFT_FIELDS = ["title", "bodyMarkdown", "hashtags"] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> },
) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;
  const { id: clientId, jobId } = await params;

  try {
    const [client] = await db
      .select({ id: agencyClients.id, businessName: agencyClients.businessName })
      .from(agencyClients)
      .where(
        and(
          eq(agencyClients.id, clientId),
          eq(agencyClients.operatorWorkspaceId, auth.workspaceId),
        ),
      )
      .limit(1);
    if (!client) return notFound("클라이언트를 찾을 수 없습니다");

    const [job] = await db
      .select()
      .from(agencyContentJobs)
      .where(
        and(eq(agencyContentJobs.id, jobId), eq(agencyContentJobs.clientId, clientId)),
      )
      .limit(1);
    if (!job) return notFound("잡을 찾을 수 없습니다");

    const [draft] = await db
      .select()
      .from(agencyContentDrafts)
      .where(eq(agencyContentDrafts.jobId, jobId))
      .limit(1);

    return ok({ job, draft: draft ?? null });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> },
) {
  const auth = await requireAgencyOperator();
  if (!auth.ok) return auth.response;
  const { id: clientId, jobId } = await params;

  try {
    const body = await request.json();
    const [client] = await db
      .select({ id: agencyClients.id })
      .from(agencyClients)
      .where(
        and(
          eq(agencyClients.id, clientId),
          eq(agencyClients.operatorWorkspaceId, auth.workspaceId),
        ),
      )
      .limit(1);
    if (!client) return notFound("클라이언트를 찾을 수 없습니다");

    // 잡 상태 변경 (강제 ready / cancelled)
    let updatedJob = null;
    if (typeof body.status === "string") {
      if (!JOB_STATUSES.has(body.status)) {
        return err(`status는 ${[...JOB_STATUSES].join("/")} 중 하나여야 합니다`);
      }
      const [u] = await db
        .update(agencyContentJobs)
        .set({ status: body.status, updatedAt: new Date() })
        .where(
          and(eq(agencyContentJobs.id, jobId), eq(agencyContentJobs.clientId, clientId)),
        )
        .returning();
      if (!u) return notFound("잡을 찾을 수 없습니다");
      updatedJob = u;
    }

    // draft 수정 (title/body/hashtags)
    let updatedDraft = null;
    const draftUpdate: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of PATCHABLE_DRAFT_FIELDS) {
      if (k in body) draftUpdate[k] = body[k];
    }
    if (Object.keys(draftUpdate).length > 1) {
      const [d] = await db
        .update(agencyContentDrafts)
        .set(draftUpdate)
        .where(eq(agencyContentDrafts.jobId, jobId))
        .returning();
      updatedDraft = d ?? null;
    }

    if (!updatedJob && !updatedDraft) {
      return err("수정할 필드가 없습니다 (status / title / bodyMarkdown / hashtags)");
    }

    return ok({ job: updatedJob, draft: updatedDraft });
  } catch (error) {
    return serverError(error);
  }
}
