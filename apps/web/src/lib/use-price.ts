"use client";

import { bookPrice, type BookKind } from "@fabulka/shared";
import { useI18n } from "@/i18n/i18n";
import { formatPrice } from "./format";

/** One more book of this kind, priced for the visitor's country: "1 900 ₸" or "$3.90". */
export function useBookPrice(kind: BookKind): string {
  return formatPrice(bookPrice(kind, useI18n().country));
}
