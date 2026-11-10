import { Processor } from "bullmq";
import { logger, QueueJobs } from "@langfuse/shared/src/server";
import { z } from "zod";

import {
  processDataRetention,
  scheduleDataRetention,
} from "../commercial/dataRetention";

const retentionJobData = z.object({
  payload: z.object({
    projectId: z.string(),
  }),
});

export const dataRetentionProcessor: Processor = async (job) => {
  if (job.name !== QueueJobs.DataRetentionJob) return;
  try {
    await scheduleDataRetention();
  } catch (error) {
    logger.error("Failed to schedule data retention", error);
    throw error;
  }
};

export const dataRetentionProcessingProcessor: Processor = async (job) => {
  if (job.name !== QueueJobs.DataRetentionProcessingJob) return;
  const parsed = retentionJobData.safeParse(job.data);
  if (!parsed.success) {
    logger.error("Invalid data retention job", { jobId: job.id });
    return;
  }
  try {
    await processDataRetention(parsed.data.payload.projectId);
  } catch (error) {
    logger.error("Failed to process data retention", error);
    throw error;
  }
};
