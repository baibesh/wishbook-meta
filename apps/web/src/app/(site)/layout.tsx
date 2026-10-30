import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense
        fallback={
          <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-4">
            <Logo />
          </div>
        }
      >
        <SiteHeader />
      </Suspense>
      {children}
      <SiteFooter />
    </div>
  );
}
