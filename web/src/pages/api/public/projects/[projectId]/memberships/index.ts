import { cors, runMiddleware } from "@/src/features/public-api/server/cors";
import { prisma } from "@langfuse/shared/src/db";
import { logger } from "@langfuse/shared/src/server";
import { hasEntitlementBasedOnPlan } from "@/src/features/entitlements/server";
import {
  deleteProjectMembership,
  listProjectMemberships,
  upsertProjectMembership,
} from "@/src/commercial/membershipAdmin";

import { type NextApiRequest, type NextApiResponse } from "next";
import { shadowAuth, writeOrgError } from "@/src/features/public-api/server";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runMiddleware(req, res, cors);

  if (!["GET", "PUT", "DELETE"].includes(req.method || "")) {
    logger.error(
      `Method not allowed for ${req.method} on /api/public/projects/[projectId]/memberships`,
    );
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { projectId } = req.query;
  if (!projectId || typeof projectId !== "string") {
    return res.status(400).json({
      error: "projectId is required",
    });
  }

  // CHECK AUTH
  const authCheck = await shadowAuth({
    req,
    action: req.method === "GET" ? "projectMembers:read" : "projectMembers:CUD",
    allowedAccessLevels: ["organization"],
  });
  if (!authCheck.success) {
    return writeOrgError(res, authCheck.error);
  }
  // END CHECK AUTH

  // Check if organization has the rbac-project-roles entitlement
  if (
    !hasEntitlementBasedOnPlan({
      plan: authCheck.scope.plan,
      entitlement: "rbac-project-roles",
    })
  ) {
    return res.status(403).json({
      error: "Your plan does not include project role management.",
    });
  }

  // Check for admin-api entitlement
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

  // Verify the project belongs to the organization
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      orgId: authCheck.scope.orgId,
      deletedAt: null,
    },
  });

  if (!project) {
    return res.status(404).json({
      error: "Project not found or does not belong to this organization",
    });
  }

  if (req.method === "GET") {
    return listProjectMemberships(projectId, res);
  }
  if (req.method === "PUT") {
    return upsertProjectMembership(
      authCheck.scope.orgId,
      projectId,
      authCheck.scope.apiKeyId,
      req,
      res,
    );
  }
  return deleteProjectMembership(projectId, req, res);
}
