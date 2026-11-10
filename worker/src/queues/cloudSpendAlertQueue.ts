import { Processor } from "bullmq";
import { logger, QueueJobs } from "@langfuse/shared/src/server";

export const cloudSpendAlertQueueProcessor: Processor = async (job) => {
  if (job.name === QueueJobs.CloudSpendAlertJob) {
    logger.info("Skipping cloud spend alert; it is not enabled in this build.", {
      jobId: job.id,
    });
  }
};
