import { randomUUID } from "crypto";

import { prisma } from "@langfuse/shared/src/db";
import {
  DataRetentionProcessingQueue,
  deleteEventsOlderThanDays,
  deleteObservationsOlderThanDays,
  deleteScoresOlderThanDays,
  deleteTracesOlderThanDays,
  logger,
  QueueJobs,
} from "@langfuse/shared/src/server";

import { getRetentionCutoffDate } from "../features/utils/utilities";

export async function scheduleDataRetention(): Promise<void> {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null, retentionDays: { gt: 0 } },
    select: { id: true, retentionDays: true },
  });

  const queue = DataRetentionProcessingQueue.getInstance();
  if (!queue) {
    throw new Error("Data retention queue is not available");
  }

  if (projects.length === 0) return;

  await queue.addBulk(
    projects.map((project) => ({
      name: QueueJobs.DataRetentionProcessingJob,
      data: {
        id: randomUUID(),
        name: QueueJobs.DataRetentionProcessingJob,
        timestamp: new Date(),
        payload: {
          projectId: project.id,
          retention: project.retentionDays,
        },
      },
    })),
  );
}

export async function processDataRetention(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { retentionDays: true, deletedAt: true },
  });
  if (!project || project.deletedAt || !project.retentionDays) {
    logger.info("Skipping data retention for project", { projectId });
    return;
  }

  const cutoff = getRetentionCutoffDate(project.retentionDays, new Date());

  await deleteTracesOlderThanDays(projectId, cutoff);
  await deleteObservationsOlderThanDays(projectId, cutoff);
  await deleteScoresOlderThanDays(projectId, cutoff);
  await deleteEventsOlderThanDays(projectId, cutoff);
  logger.info("Finished data retention for project", {
    projectId,
    retentionDays: project.retentionDays,
  });
}
