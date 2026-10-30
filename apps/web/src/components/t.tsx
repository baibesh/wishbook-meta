"use client";

import { useI18n } from "@/i18n/i18n";
import type { MessageKey } from "@/i18n/messages";

/** A translated string for server components, which cannot use the hook themselves. */
export function T({ k, vars }: { k: MessageKey; vars?: Record<string, string | number> }) {
  return <>{useI18n().t(k, vars)}</>;
}
