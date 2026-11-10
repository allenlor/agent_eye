import { Processor } from "bullmq";
import { logger, QueueJobs } from "@langfuse/shared/src/server";

export const cloudFreeTierUsageThresholdQueueProcessor: Processor = async (
  job,
) => {
  if (job.name === QueueJobs.CloudFreeTierUsageThresholdJob) {
    logger.info(
      "Skipping free-tier usage threshold; it is not enabled in this build.",
      { jobId: job.id },
    );
  }
};
