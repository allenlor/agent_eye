import { type Processor } from "bullmq";
import { logger } from "@langfuse/shared/src/server";

export const meteringDataPostgresExportProcessor: Processor = async (job) => {
  logger.info("Skipping metering export; it is not enabled in this build.", {
    jobId: job.id,
    jobName: job.name,
  });
};
