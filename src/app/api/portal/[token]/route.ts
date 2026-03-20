import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  customerPortalTokens,
  customers,
  sites,
  contracts,
  contractPayments,
  constructionPhases,
  sitePhotos,
} from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Verify token
  const [tokenRow] = await db
    .select()
    .from(customerPortalTokens)
    .where(eq(customerPortalTokens.token, token))
    .limit(1);

  if (!tokenRow) {
    return NextResponse.json({ error: "유효하지 않은 링크입니다" }, { status: 404 });
  }

  if (new Date(tokenRow.expiresAt) < new Date()) {
    return NextResponse.json({ error: "만료된 링크입니다" }, { status: 410 });
  }

  const customerId = tokenRow.customerId;

  // Customer info
  const [customer] = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: "고객 정보를 찾을 수 없습니다" }, { status: 404 });
  }

  // Sites
  const customerSites = await db
    .select({
      id: sites.id,
      name: sites.name,
      status: sites.status,
      address: sites.address,
      startDate: sites.startDate,
      endDate: sites.endDate,
    })
    .from(sites)
    .where(eq(sites.customerId, customerId));

  // For each site: phases, contracts/payments, photos
  const sitesData = await Promise.all(
    customerSites.map(async (site) => {
      const phases = await db
        .select({
          category: constructionPhases.category,
          progress: constructionPhases.progress,
          status: constructionPhases.status,
          plannedStart: constructionPhases.plannedStart,
          plannedEnd: constructionPhases.plannedEnd,
        })
        .from(constructionPhases)
        .where(eq(constructionPhases.siteId, site.id))
        .orderBy(constructionPhases.sortOrder);

      const siteContracts = await db
        .select({
          id: contracts.id,
          contractAmount: contracts.contractAmount,
        })
        .from(contracts)
        .where(eq(contracts.siteId, site.id));

      let totalContract = 0;
      let totalPaid = 0;
      const paymentItems: { type: string; amount: number; status: string; dueDate: string | null }[] = [];

      for (const c of siteContracts) {
        totalContract += c.contractAmount;
        const payments = await db
          .select({
            type: contractPayments.type,
            amount: contractPayments.amount,
            status: contractPayments.status,
            dueDate: contractPayments.dueDate,
          })
          .from(contractPayments)
          .where(eq(contractPayments.contractId, c.id));

        for (const p of payments) {
          paymentItems.push(p);
          if (p.status === "완납") totalPaid += p.amount;
        }
      }

      const photos = await db
        .select({
          id: sitePhotos.id,
          url: sitePhotos.url,
          date: sitePhotos.date,
          category: sitePhotos.category,
          phase: sitePhotos.phase,
          caption: sitePhotos.caption,
        })
        .from(sitePhotos)
        .where(eq(sitePhotos.siteId, site.id))
        .orderBy(desc(sitePhotos.date))
        .limit(20);

      const overallProgress = phases.length > 0
        ? Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length)
        : 0;

      return {
        ...site,
        overallProgress,
        phases,
        totalContract,
        totalPaid,
        payments: paymentItems,
        photos,
      };
    })
  );

  return NextResponse.json({
    customer,
    sites: sitesData,
  });
}
