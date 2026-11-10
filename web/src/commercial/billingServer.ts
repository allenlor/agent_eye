import { type Plan } from "@langfuse/shared";

export function isCloudBillingEnabled(): boolean {
  return false;
}

export function mapStripeProductIdToPlan(_productId: string): Plan | null {
  return null;
}

export function emitChbProjectEvent(_params: {
  type: string;
  orgId: string;
  projectId: string;
}): void {}

export async function resolveBillingService(
  _ctx: unknown,
  _orgId: string,
): Promise<{
  service: {
    cancelImmediatelyAndInvoice: (orgId: string) => Promise<void>;
  };
}> {
  throw new Error("Cloud billing is not enabled in this build.");
}
