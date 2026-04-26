import { LandingHero } from "@/components/landing-hero";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <Link
          href="/"
          className="font-hand text-[34px] font-bold tracking-tight text-ink"
        >
          mimic
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col">
        <LandingHero />
      </main>

      {/* Author signature — handwritten, low-key. The kind of detail nobody
          adds to a submission, which is why it lands. */}
      <footer className="px-6 pb-8 pt-2 md:px-12">
        <div className="flex items-end justify-between border-t-2 border-ink/15 pt-4">
          <span className="font-typewriter text-[9px] uppercase tracking-[0.22em] text-ink-light">
            mimic · vol. 01
          </span>
          <span className="font-hand text-[18px] leading-none text-ink-soft">
            — diyar, astana hub
          </span>
        </div>
      </footer>
    </div>
  );
}
