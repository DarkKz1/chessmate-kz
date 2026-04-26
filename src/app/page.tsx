import { LandingHero } from "@/components/landing-hero";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <Link
          href="/"
          className="flex items-baseline gap-2 font-hand text-[34px] font-bold tracking-tight text-ink"
        >
          mimic
          <span className="font-typewriter text-[10px] tracking-[0.2em] text-red-ink">
            ★
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col">
        <LandingHero />
      </main>

      <footer className="border-t-2 border-ink/20 px-6 py-6 text-center font-typewriter text-[11px] uppercase tracking-[0.18em] text-ink-light md:px-12">
        every game leaves a mark. mimic remembers it.
      </footer>
    </div>
  );
}
