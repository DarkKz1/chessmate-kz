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
    </div>
  );
}
