import { type NextApiRequest, type NextApiResponse } from "next";
import { logger } from "@langfuse/shared/src/server";
import { AdminApiAuthService } from "@/src/commercial/adminApiAuth";
import { routeParam } from "@/src/commercial/notAvailable";
import { deleteOrganizationApiKey } from "@/src/commercial/apiKeysAdmin";
import { prisma } from "@langfuse/shared/src/db";
import { hasEntitlementBasedOnPlan } from "@/src/features/entitlements/server";
import { getSelfHostedInstancePlanServerSide } from "@/src/features/entitlements/server/getPlan";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== "DELETE") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

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

    const organizationId = routeParam(req.query, "organizationId");
    const apiKeyId = routeParam(req.query, "apiKeyId");
    if (!organizationId || !apiKeyId) {
      return res.status(400).json({ error: "Invalid request parameters" });
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return deleteOrganizationApiKey(organizationId, apiKeyId, res);
  } catch (e) {
    logger.error("Failed to process organization API key request", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
