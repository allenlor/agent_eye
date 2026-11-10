import { env } from "@/src/env.mjs";
import {
  PRODUCT_MODULES,
  type InstanceLink,
  type ProductModule,
  type UiCustomization,
} from "@/src/commercial/productModules";

function listedModules(value: string | undefined): ProductModule[] {
  if (!value) return [];
  const allowed = new Set<string>(PRODUCT_MODULES);
  return value
    .split(",")
    .map((module) => module.trim().toLowerCase())
    .filter((module): module is ProductModule => allowed.has(module));
}

function visibleModules(): ProductModule[] {
  const visible = listedModules(env.LANGFUSE_UI_VISIBLE_PRODUCT_MODULES);
  if (env.LANGFUSE_UI_VISIBLE_PRODUCT_MODULES) return visible;

  const hidden = new Set(listedModules(env.LANGFUSE_UI_HIDDEN_PRODUCT_MODULES));
  if (hidden.size === 0) return [...PRODUCT_MODULES];
  return PRODUCT_MODULES.filter((module) => !hidden.has(module));
}

function instanceLinks(): InstanceLink[] | null {
  const raw = env.LANGFUSE_UI_INSTANCE_LINKS;
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const links = parsed.flatMap((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("name" in item) ||
        !("url" in item) ||
        typeof item.name !== "string" ||
        typeof item.url !== "string"
      ) {
        return [];
      }
      return [{ name: item.name, url: item.url }];
    });
    return links.length > 0 ? links : null;
  } catch {
    return null;
  }
}

export function loadUiCustomization(): UiCustomization {
  return {
    hostname: env.LANGFUSE_UI_API_HOST,
    documentationHref: env.LANGFUSE_UI_DOCUMENTATION_HREF,
    supportHref: env.LANGFUSE_UI_SUPPORT_HREF,
    feedbackHref: env.LANGFUSE_UI_FEEDBACK_HREF,
    logoLightModeHref: env.LANGFUSE_UI_LOGO_LIGHT_MODE_HREF,
    logoDarkModeHref: env.LANGFUSE_UI_LOGO_DARK_MODE_HREF,
    defaultModelAdapter: env.LANGFUSE_UI_DEFAULT_MODEL_ADAPTER,
    defaultBaseUrlOpenAI: env.LANGFUSE_UI_DEFAULT_BASE_URL_OPENAI,
    defaultBaseUrlAnthropic: env.LANGFUSE_UI_DEFAULT_BASE_URL_ANTHROPIC,
    defaultBaseUrlAzure: env.LANGFUSE_UI_DEFAULT_BASE_URL_AZURE,
    instanceLinks: instanceLinks(),
    visibleModules: visibleModules(),
  };
}
