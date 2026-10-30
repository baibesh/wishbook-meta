import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// cyrillic-ext carries the Kazakh letters (ә ғ қ ң ө ұ ү һ і).
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: "Fabulka — книга, где ваш ребёнок главный герой",
  description: "Персонализированные детские книги: сказка и иллюстрации с вашим ребёнком. Powered by Meta Muse models.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
