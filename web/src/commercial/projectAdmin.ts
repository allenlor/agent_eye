import { randomUUID } from "crypto";

import { Prisma } from "@prisma/client";
import { prisma } from "@langfuse/shared/src/db";
import {
  invalidateCachedOrgApiKeys,
  invalidateCachedProjectApiKeys,
  logger,
  ProjectDeleteQueue,
  QueueJobs,
  redis,
} from "@langfuse/shared/src/server";
import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";

import { auditLog } from "@/src/features/audit-logs/auditLog";
import { projectNameSchema } from "@/src/features/auth/lib/projectNameSchema";
import { parseMetadata } from "@/src/commercial/jsonMetadata";

const retentionField = z.number().int();

function retentionValue(
  value: number | undefined,
): { ok: true; days: number | undefined } | { ok: false } {
  if (value === undefined) return { ok: true, days: undefined };
  if (value === 0 || value >= 3) return { ok: true, days: value };
  return { ok: false };
}

function presentProject(project: {
  id: string;
  name: string;
  metadata: Prisma.JsonValue | null;
  retentionDays: number | null;
}) {
  return {
    id: project.id,
    name: project.name,
    metadata: project.metadata ?? {},
    ...(project.retentionDays ? { retentionDays: project.retentionDays } : {}),
  };
}

async function nameTaken(orgId: string, name: string, ignoreId?: string) {
  const existing = await prisma.project.findFirst({
    where: {
      orgId,
      name,
      deletedAt: null,
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function listOrganizationProjects(
  orgId: string,
  res: NextApiResponse,
) {
  const projects = await prisma.project.findMany({
    where: { orgId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return res.status(200).json({ projects });
}

export async function createProject(
  orgId: string,
  apiKeyId: string | undefined,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const parsed = z
    .object({
      name: projectNameSchema.shape.name,
      metadata: z.unknown().optional(),
      retention: retentionField.optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? "Invalid request body",
    });
  }

  const metadata = parseMetadata(parsed.data.metadata);
  if (!metadata.ok) {
    return res.status(400).json({
      message: "Invalid metadata. Should be a valid JSON object",
    });
  }
  const retention = retentionValue(parsed.data.retention);
  if (!retention.ok) {
    return res.status(400).json({ message: "Invalid retention value" });
  }
  if (await nameTaken(orgId, parsed.data.name)) {
    return res.status(409).json({
      message: "A project with this name already exists in your organization",
    });
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      orgId,
      metadata: metadata.metadata,
      retentionDays: retention.days,
    },
  });

  if (apiKeyId) {
    await auditLog({
      resourceType: "project",
      resourceId: project.id,
      action: "create",
      orgId,
      projectId: project.id,
      apiKeyId,
      after: project,
    });
  }
  await invalidateCachedOrgApiKeys(orgId);

  return res.status(201).json(presentProject(project));
}

export async function updateProject(
  orgId: string,
  projectId: string,
  apiKeyId: string | undefined,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const parsed = z
    .object({
      name: projectNameSchema.shape.name.optional(),
      metadata: z.unknown().optional(),
      retention: retentionField.optional(),
    })
    .safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? "Invalid request body",
    });
  }

  const metadata = parseMetadata(
    parsed.data.metadata === undefined ? undefined : parsed.data.metadata,
  );
  if (!metadata.ok) {
    return res.status(400).json({
      message: "Invalid metadata. Should be a valid JSON object",
    });
  }
  const retention = retentionValue(parsed.data.retention);
  if (!retention.ok) {
    return res.status(400).json({ message: "Invalid retention value" });
  }
  if (
    parsed.data.name &&
    (await nameTaken(orgId, parsed.data.name, projectId))
  ) {
    return res.status(409).json({
      message: "A project with this name already exists in your organization",
    });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(metadata.metadata === undefined
        ? {}
        : { metadata: metadata.metadata }),
      ...(retention.days === undefined
        ? {}
        : { retentionDays: retention.days }),
    },
  });

  if (apiKeyId) {
    await auditLog({
      resourceType: "project",
      resourceId: project.id,
      action: "update",
      orgId,
      projectId: project.id,
      apiKeyId,
      after: project,
    });
  }

  return res.status(200).json(presentProject(project));
}

export async function deleteProject(
  orgId: string,
  projectId: string,
  apiKeyId: string | undefined,
  res: NextApiResponse,
) {
  const gatewayIngestion = await prisma.gatewayConfig.findFirst({
    where: {
      organizationId: orgId,
      defaultIngestionProjectId: projectId,
    },
    select: { organizationId: true },
  });
  if (gatewayIngestion) {
    return res.status(409).json({
      message:
        "This project is used as the AI Gateway ingestion project. Select another ingestion project before deleting it.",
    });
  }

  await invalidateCachedProjectApiKeys(projectId, redis);
  await prisma.apiKey.deleteMany({
    where: { projectId, scope: "PROJECT" },
  });
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { deletedAt: new Date() },
  });
  if (apiKeyId) {
    await auditLog({
      resourceType: "project",
      resourceId: projectId,
      action: "delete",
      orgId,
      projectId,
      apiKeyId,
      before: project,
    });
  }
  await invalidateCachedOrgApiKeys(orgId);

  const queue = ProjectDeleteQueue.getInstance();
  if (queue) {
    try {
      await queue.add(QueueJobs.ProjectDelete, {
        timestamp: new Date(),
        id: randomUUID(),
        payload: { projectId, orgId },
        name: QueueJobs.ProjectDelete,
      });
    } catch (error) {
      logger.error("Failed to enqueue project deletion", error);
    }
  }

  return res.status(202).json({
    success: true,
    message: "Project deletion is being processed asynchronously",
  });
}
