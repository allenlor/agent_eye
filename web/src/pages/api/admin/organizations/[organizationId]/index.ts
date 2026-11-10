import { type NextApiRequest, type NextApiResponse } from "next";
import { logger } from "@langfuse/shared/src/server";
import {
  handleDeleteOrganization,
  handleGetOrganization,
  handleUpdateOrganization,
} from "@/src/commercial/adminOrganizations";
import { AdminApiAuthService } from "@/src/commercial/adminApiAuth";
import { routeParam } from "@/src/commercial/notAvailable";
import { hasEntitlementBasedOnPlan } from "@/src/features/entitlements/server";
import { getSelfHostedInstancePlanServerSide } from "@/src/features/entitlements/server/getPlan";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Verify admin API authentication, only allow on self-hosted (not on Langfuse Cloud)
    if (!AdminApiAuthService.handleAdminAuth(req, res)) {
      return;
    }

    if (
      !hasEntitlementBasedOnPlan({
        plan: getSelfHostedInstancePlanServerSide() ?? "oss",
        entitlement: "admin-api",
      })
    ) {
      return res.status(403).json({
        error: "This feature is not available on your current plan.",
      });
    }

    if (!req.method || !["GET", "PUT", "DELETE"].includes(req.method)) {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const organizationId = routeParam(req.query, "organizationId");
    if (!organizationId) {
      return res.status(400).json({ error: "Invalid request parameters" });
    }

    if (req.method === "GET") {
      return handleGetOrganization(organizationId, res);
    }
    if (req.method === "PUT") {
      return handleUpdateOrganization(organizationId, req, res);
    }
    return handleDeleteOrganization(organizationId, res);
  } catch (e) {
    logger.error("Failed to process organization request", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
