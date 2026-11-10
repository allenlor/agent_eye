import { cors, runMiddleware } from "@/src/features/public-api/server/cors";
import { logger } from "@langfuse/shared/src/server";
import { RateLimitService } from "@/src/features/public-api/server/RateLimitService";
import {
  deleteOrganizationMembership,
  listOrganizationMemberships,
  upsertOrganizationMembership,
} from "@/src/commercial/membershipAdmin";
import { shadowAuth, writeOrgError } from "@/src/features/public-api/server";
import { type NextApiRequest, type NextApiResponse } from "next";
import { hasEntitlementBasedOnPlan } from "@/src/features/entitlements/server";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runMiddleware(req, res, cors);

  if (!["GET", "PUT", "DELETE"].includes(req.method || "")) {
    logger.error(
      `Method not allowed for ${req.method} on /api/public/organizations/memberships`,
    );
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  // CHECK AUTH
  const authCheck = await shadowAuth({
    req,
    action:
      req.method === "GET"
        ? "organizationMembers:read"
        : "organizationMembers:CUD",
    allowedAccessLevels: ["organization"],
  });
  if (!authCheck.success) {
    return writeOrgError(res, authCheck.error);
  }
  // END CHECK AUTH

  if (
    !hasEntitlementBasedOnPlan({
      plan: authCheck.scope.plan,
      entitlement: "admin-api",
    })
  ) {
    return res.status(403).json({
      error: "This feature is not available on your current plan.",
    });
  }

  const rateLimitCheck = await RateLimitService.getInstance().rateLimitRequest(
    authCheck.scope,
    "public-api",
  );
  if (rateLimitCheck?.isRateLimited()) {
    return rateLimitCheck.sendRestResponseIfLimited(res);
  }

  if (req.method === "GET") {
    return listOrganizationMemberships(authCheck.scope.orgId, res);
  }
  if (req.method === "PUT") {
    return upsertOrganizationMembership(
      authCheck.scope.orgId,
      authCheck.scope.apiKeyId,
      req,
      res,
    );
  }
  return deleteOrganizationMembership(authCheck.scope.orgId, req, res);
}
