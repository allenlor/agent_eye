import { loadUiCustomization } from "@/src/commercial/uiCustomizationServer";
import { createTRPCRouter, publicProcedure } from "@/src/server/api/trpc";

export const cloudBillingRouter = createTRPCRouter({});
export const spendAlertRouter = createTRPCRouter({});
export const verifiedDomainRouter = createTRPCRouter({});
export const ssoConfigRouter = createTRPCRouter({});
export const uiCustomizationRouter = createTRPCRouter({
  get: publicProcedure.query(() => loadUiCustomization()),
});
