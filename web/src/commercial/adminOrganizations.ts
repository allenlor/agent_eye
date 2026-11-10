import { Prisma } from "@prisma/client";
import { prisma } from "@langfuse/shared/src/db";
import { invalidateCachedOrgApiKeys, logger } from "@langfuse/shared/src/server";
import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";

import { auditLog } from "@/src/features/audit-logs/auditLog";
import { organizationNameSchema } from "@/src/features/organizations/utils/organizationNameSchema";

const organizationSelect = {
  id: true,
  name: true,
  createdAt: true,
  metadata: true,
  projects: {
    select: {
      id: true,
      name: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
    where: { deletedAt: null },
  },
} satisfies Prisma.OrganizationSelect;

const bodySchema = z.object({
  name: organizationNameSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function presentOrganization(
  organization: Prisma.OrganizationGetPayload<{
    select: typeof organizationSelect;
  }>,
) {
  return {
    id: organization.id,
    name: organization.name,
    createdAt: organization.createdAt,
    metadata: organization.metadata ?? {},
    projects: organization.projects,
  };
}

export async function handleGetOrganizations(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const organizations = await prisma.organization.findMany({
    select: organizationSelect,
    orderBy: { createdAt: "asc" },
  });
  return res.status(200).json({
    organizations: organizations.map(presentOrganization),
  });
}

export async function handleCreateOrganization(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: z.formatError(parsed.error),
    });
  }

  const organization = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
    },
    select: organizationSelect,
  });

  await auditLog({
    resourceType: "organization",
    resourceId: organization.id,
    action: "create",
    orgId: organization.id,
    apiKeyId: "ADMIN_KEY",
    after: organization,
  });
  logger.info("Created organization via admin API", {
    organizationId: organization.id,
  });

  return res.status(201).json(presentOrganization(organization));
}

export async function handleGetOrganization(
  organizationId: string,
  res: NextApiResponse,
) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: organizationSelect,
  });
  if (!organization) {
    return res.status(404).json({ error: "Organization not found" });
  }
  return res.status(200).json(presentOrganization(organization));
}

export async function handleUpdateOrganization(
  organizationId: string,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: z.formatError(parsed.error),
    });
  }

  const existing = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "Organization not found" });
  }

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      name: parsed.data.name,
      ...(parsed.data.metadata === undefined
        ? {}
        : { metadata: parsed.data.metadata as Prisma.InputJsonValue }),
    },
    select: organizationSelect,
  });

  await auditLog({
    resourceType: "organization",
    resourceId: organization.id,
    action: "update",
    orgId: organization.id,
    apiKeyId: "ADMIN_KEY",
    after: organization,
  });

  return res.status(200).json(presentOrganization(organization));
}

export async function handleDeleteOrganization(
  organizationId: string,
  res: NextApiResponse,
) {
  const existing = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      projects: { where: { deletedAt: null }, select: { id: true }, take: 1 },
    },
  });
  if (!existing) {
    return res.status(404).json({ error: "Organization not found" });
  }
  if (existing.projects.length > 0) {
    return res.status(400).json({
      error: "Cannot delete organization with existing projects",
    });
  }

  await invalidateCachedOrgApiKeys(organizationId);
  await prisma.organization.delete({ where: { id: organizationId } });
  return res.status(200).json({ success: true });
}
