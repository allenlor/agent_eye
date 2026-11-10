import { prisma } from "@langfuse/shared/src/db";
import {
  createAndAddApiKeysToDb,
  deleteApiKeyFromDb,
  redis,
} from "@langfuse/shared/src/server";
import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";

const noteSchema = z.object({
  note: z.string().optional(),
});

function presentKey(key: {
  id: string;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  note: string | null;
  publicKey: string;
  displaySecretKey: string;
}) {
  return {
    id: key.id,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    lastUsedAt: key.lastUsedAt,
    note: key.note,
    publicKey: key.publicKey,
    displaySecretKey: key.displaySecretKey,
  };
}

export async function listOrganizationApiKeys(
  organizationId: string,
  res: NextApiResponse,
) {
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      orgId: organizationId,
      scope: "ORGANIZATION",
      isInAppAgentKey: false,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      lastUsedAt: true,
      note: true,
      publicKey: true,
      displaySecretKey: true,
    },
  });
  return res.status(200).json({ apiKeys: apiKeys.map(presentKey) });
}

export async function createOrganizationApiKey(
  organizationId: string,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const parsed = noteSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const created = await createAndAddApiKeysToDb({
    prisma,
    entityId: organizationId,
    scope: "ORGANIZATION",
    note: parsed.data.note,
  });

  return res.status(201).json({
    id: created.id,
    createdAt: created.createdAt,
    publicKey: created.publicKey,
    secretKey: created.secretKey,
    displaySecretKey: created.displaySecretKey,
    note: created.note,
  });
}

export async function deleteOrganizationApiKey(
  organizationId: string,
  apiKeyId: string,
  res: NextApiResponse,
) {
  const existing = await prisma.apiKey.findFirst({
    where: {
      id: apiKeyId,
      orgId: organizationId,
      scope: "ORGANIZATION",
      isInAppAgentKey: false,
    },
    select: { id: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "API key not found" });
  }

  await deleteApiKeyFromDb({
    prisma,
    id: apiKeyId,
    entityId: organizationId,
    scope: "ORGANIZATION",
    redis,
  });
  return res.status(200).json({ success: true });
}

export async function listProjectApiKeys(
  projectId: string,
  res: NextApiResponse,
) {
  const apiKeys = await prisma.apiKey.findMany({
    where: { projectId, scope: "PROJECT", isInAppAgentKey: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
      lastUsedAt: true,
      note: true,
      publicKey: true,
      displaySecretKey: true,
    },
  });
  return res.status(200).json({ apiKeys: apiKeys.map(presentKey) });
}

export async function createProjectApiKey(
  projectId: string,
  createdByApiKeyId: string | undefined,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const parsed = noteSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  const created = await createAndAddApiKeysToDb({
    prisma,
    entityId: projectId,
    scope: "PROJECT",
    note: parsed.data.note,
    createdByApiKeyId,
  });

  return res.status(201).json({
    id: created.id,
    createdAt: created.createdAt,
    publicKey: created.publicKey,
    secretKey: created.secretKey,
    displaySecretKey: created.displaySecretKey,
    note: created.note,
  });
}

export async function deleteProjectApiKey(
  projectId: string,
  apiKeyId: string,
  res: NextApiResponse,
) {
  const existing = await prisma.apiKey.findFirst({
    where: {
      id: apiKeyId,
      projectId,
      scope: "PROJECT",
      isInAppAgentKey: false,
    },
    select: { id: true },
  });
  if (!existing) {
    return res.status(404).json({ message: "API key not found" });
  }

  await deleteApiKeyFromDb({
    prisma,
    id: apiKeyId,
    entityId: projectId,
    scope: "PROJECT",
    redis,
  });
  return res.status(200).json({ success: true });
}
