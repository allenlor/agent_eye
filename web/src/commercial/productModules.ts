import { LLMAdapter } from "@langfuse/shared";

export const PRODUCT_MODULES = [
  "dashboards",
  "tracing",
  "evaluation",
  "prompt-management",
  "playground",
  "datasets",
] as const;

export type ProductModule = (typeof PRODUCT_MODULES)[number];

export type InstanceLink = {
  name: string;
  url: string;
};

export type UiCustomization = {
  hostname?: string;
  documentationHref?: string;
  supportHref?: string;
  feedbackHref?: string;
  logoLightModeHref?: string;
  logoDarkModeHref?: string;
  defaultModelAdapter?: keyof typeof LLMAdapter;
  defaultBaseUrlOpenAI?: string;
  defaultBaseUrlAnthropic?: string;
  defaultBaseUrlAzure?: string;
  instanceLinks: InstanceLink[] | null;
  visibleModules: ProductModule[];
};
