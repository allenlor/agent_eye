import { zhMessages } from "@/src/features/i18n/messages";

export type UiLanguage = "zh-CN" | "en";

/**
 * Product UI language. Defaults to Simplified Chinese.
 * Set NEXT_PUBLIC_LANGFUSE_UI_LOCALE=en to keep the English UI.
 * Automated tests stay on English so assertions keep matching source copy.
 */
export function uiLanguage(): UiLanguage {
  const configured = process.env.NEXT_PUBLIC_LANGFUSE_UI_LOCALE;
  if (configured === "en" || configured === "zh-CN") return configured;
  if (process.env.VITEST || process.env.NODE_ENV === "test") return "en";
  return "zh-CN";
}

export function isUiChinese(): boolean {
  return uiLanguage() === "zh-CN";
}

export function t(text: string): string {
  if (!isUiChinese()) return text;
  const leading = /^\s*/.exec(text)?.[0] ?? "";
  const trailing = /\s*$/.exec(text)?.[0] ?? "";
  const trimmed = text.trim();
  if (!trimmed) return text;
  const translated = zhMessages[trimmed];
  if (!translated) return text;
  return `${leading}${translated}${trailing}`;
}

export function localizeHeader<T>(header: T): T {
  if (typeof header === "string") return t(header) as T;
  return header;
}
