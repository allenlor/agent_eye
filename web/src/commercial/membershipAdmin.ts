import { prisma } from "@langfuse/shared/src/db";
import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";

import { auditLog } from "@/src/features/audit-logs/auditLog";

const roleSchema = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);

const membershipBody = z.object({
  userId: z.string().min(1),
  role: roleSchema.optional(),
});

function presentMembership(membership: {
  userId: string;
  role: string;
  user: { email: string | null; name: string | null };
}) {
  return {
    userId: membership.userId,
    role: membership.role,
    email: membership.user.email,
    name: membership.user.name,
  };
}

export async function listOrganizationMemberships(
  orgId: string,
  res: NextApiResponse,
) {
  const memberships = await prisma.organizationMembership.findMany({
    where: { orgId },
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return res.status(200).json({
    memberships: memberships.map(presentMembership),
  });
}

export async function upsertOrganizationMembership(
  orgId: string,
  apiKeyId: string | undefined,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const parsed = membershipBody
    .extend({ role: roleSchema })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const membership = await prisma.organizationMembership.upsert({
    where: { orgId_userId: { orgId, userId: user.id } },
    create: { orgId, userId: user.id, role: parsed.data.role },
    update: { role: parsed.data.role },
    include: { user: { select: { email: true, name: true } } },
  });

  if (apiKeyId) {
    await auditLog({
      resourceType: "orgMembership",
      resourceId: membership.id,
      action: "upsert",
      orgId,
      apiKeyId,
      after: membership,
    });
  }

  return res.status(200).json(presentMembership(membership));
}

export async function deleteOrganizationMembership(
  orgId: string,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const parsed = membershipBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const existing = await prisma.organizationMembership.findUnique({
    where: { orgId_userId: { orgId, userId: parsed.data.userId } },
    select: { id: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "Membership not found" });
  }

  await prisma.organizationMembership.delete({ where: { id: existing.id } });
  return res.status(200).json({
    message: "Membership deleted successfully",
    userId: parsed.data.userId,
  });
}

export async function listProjectMemberships(
  projectId: string,
  res: NextApiResponse,
) {
  const memberships = await prisma.projectMembership.findMany({
    where: { projectId },
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return res.status(200).json({
    memberships: memberships.map(presentMembership),
  });
}

export async function upsertProjectMembership(
  orgId: string,
  projectId: string,
  apiKeyId: string | undefined,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const parsed = membershipBody
    .extend({ role: roleSchema })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const orgMembership = await prisma.organizationMembership.findUnique({
    where: { orgId_userId: { orgId, userId: parsed.data.userId } },
    select: { id: true },
  });
  if (!orgMembership) {
    return res.status(404).json({
      error: "User is not a member of the organization",
    });
  }

  const membership = await prisma.projectMembership.upsert({
    where: {
      projectId_userId: { projectId, userId: parsed.data.userId },
    },
    create: {
      projectId,
      userId: parsed.data.userId,
      orgMembershipId: orgMembership.id,
      role: parsed.data.role,
    },
    update: { role: parsed.data.role },
    include: { user: { select: { email: true, name: true } } },
  });

  if (apiKeyId) {
    await auditLog({
      resourceType: "projectMembership",
      resourceId: `${projectId}:${parsed.data.userId}`,
      action: "upsert",
      orgId,
      projectId,
      apiKeyId,
      after: membership,
    });
  }

  return res.status(200).json(presentMembership(membership));
}

export async function deleteProjectMembership(
  projectId: string,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const parsed = membershipBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const existing = await prisma.projectMembership.findUnique({
    where: {
      projectId_userId: { projectId, userId: parsed.data.userId },
    },
    select: { userId: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "Project membership not found" });
  }

  await prisma.projectMembership.delete({
    where: {
      projectId_userId: { projectId, userId: parsed.data.userId },
    },
  });
  return res.status(200).json({
    message: "Project membership deleted successfully",
    userId: parsed.data.userId,
  });
}
