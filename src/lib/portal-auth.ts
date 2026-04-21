import { db } from "@/lib/db";
import { customerPortalTokens, customers, sites } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export type PortalTokenValid = {
  valid: true;
  tokenId: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    workspaceId: string | null;
  };
  site: {
    id: string;
    name: string;
    address: string | null;
    buildingType: string | null;
    areaPyeong: number | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    progress: number | null;
    budget: number | null;
    spent: number | null;
  };
  workspaceId: string | null;
};

export type PortalTokenInvalid = {
  valid: false;
};

export type PortalTokenResult = PortalTokenValid | PortalTokenInvalid;

export async function validatePortalToken(
  token: string
): Promise<PortalTokenResult> {
  try {
    // Find the token that hasn't expired
    const tokenRows = await db
      .select()
      .from(customerPortalTokens)
      .where(
        and(
          eq(customerPortalTokens.token, token),
          gt(customerPortalTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (tokenRows.length === 0) {
      return { valid: false };
    }

    const portalToken = tokenRows[0];

    // Get the customer
    const customerRows = await db
      .select()
      .from(customers)
      .where(eq(customers.id, portalToken.customerId))
      .limit(1);

    if (customerRows.length === 0) {
      return { valid: false };
    }

    const customer = customerRows[0];

    // Get the site for this customer
    const siteRows = await db
      .select()
      .from(sites)
      .where(eq(sites.customerId, customer.id))
      .limit(1);

    if (siteRows.length === 0) {
      return { valid: false };
    }

    const site = siteRows[0];

    return {
      valid: true,
      tokenId: portalToken.id,
      customerId: customer.id,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        workspaceId: customer.workspaceId,
      },
      site: {
        id: site.id,
        name: site.name,
        address: site.address,
        buildingType: site.buildingType,
        areaPyeong: site.areaPyeong,
        status: site.status,
        startDate: site.startDate,
        endDate: site.endDate,
        progress: site.progress,
        budget: site.budget,
        spent: site.spent,
      },
      workspaceId: customer.workspaceId,
    };
  } catch (error) {
    console.error("Portal token validation error:", error);
    return { valid: false };
  }
}
