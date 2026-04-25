import Link from "next/link";
import {
  Bot,
  Users,
  Link2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Играть · ChessMate KZ",
};

const modes = [
  {
    href: "/play/ai",
    icon: Bot,
    title: "Против ИИ",
    desc: "Stockfish 4 уровней — от новичка до мастера. Тренируйся в любое время.",
    accent: "primary",
    cta: "Начать тренировку",
  },
  {
    href: "/play/local",
    icon: Users,
    title: "Два игрока",
    desc: "Один экран, два игрока. Передавайте телефон друг другу.",
    accent: "steppe",
    cta: "Сыграть локально",
  },
  {
    href: "/play/m",
    icon: Link2,
    title: "Игра по ссылке",
    desc: "Создай комнату и кинь ссылку другу. Реалтайм через WebSocket.",
    accent: "accent",
    cta: "Создать комнату",
    badge: "Beta",
  },
];

export default function PlayHub() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-20">
      <div className="mb-12 max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
          <Sparkles className="size-3.5 text-accent" />
          Выбери режим
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
          Как сегодня{" "}
          <span className="text-primary">сыграем?</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Можно прямо сейчас — без регистрации. История партий и AI-разбор
          доступны после входа.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {modes.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className="group relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
          >
            <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/5 blur-3xl transition-opacity group-hover:opacity-100" />

            <div className="relative flex items-start justify-between">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary">
                <mode.icon className="size-7" strokeWidth={2} />
              </div>
              {mode.badge && (
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                  {mode.badge}
                </span>
              )}
            </div>

            <div className="relative">
              <h3 className="font-display text-2xl font-bold">{mode.title}</h3>
              <p className="mt-2 text-muted-foreground">{mode.desc}</p>
            </div>

            <div className="relative flex items-center gap-1.5 pt-2 text-sm font-bold text-primary">
              {mode.cta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
