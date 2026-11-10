import { Processor } from "bullmq";
import { logger, QueueJobs } from "@langfuse/shared/src/server";

export const cloudUsageMeteringQueueProcessor: Processor = async (job) => {
  if (job.name === QueueJobs.CloudUsageMeteringJob) {
    logger.info(
      "Skipping cloud usage metering; it is not enabled in this build.",
      { jobId: job.id },
    );
  }
};
