import { LandingHero } from "@/components/landing-hero";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-base font-semibold tracking-tight"
        >
          ChessMate
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col">
        <LandingHero />
      </main>

      <footer className="border-t border-border/40 px-6 py-5 text-center text-xs text-muted-foreground md:px-10">
        Каждая партия делает тебя сильнее в одном конкретном месте.
      </footer>
    </div>
  );
}
