import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Условия использования" };

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-4 py-10">
      <LegalPage doc="terms" />
    </main>
  );
}
