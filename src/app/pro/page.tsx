import Link from "next/link";
import { Check, Crown, Sparkles, Zap, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Pro · ChessMate KZ",
  description: "Этно-фигуры, AI Coach без лимитов и кастомизация доски.",
};

const skinPacks = [
  {
    name: "Беркут",
    emoji: "🦅",
    desc: "Хищный беркут вместо ладьи. Цвета охры, угля и золота.",
    accent: "from-amber-500/20 to-orange-700/20",
  },
  {
    name: "Барс",
    emoji: "🐆",
    desc: "Снежный барс — конь, который видит больше других.",
    accent: "from-sky/20 to-steppe/20",
  },
  {
    name: "Юрта",
    emoji: "🏠",
    desc: "Король — юрта, символ дома. Защити её любой ценой.",
    accent: "from-primary/20 to-accent/20",
  },
  {
    name: "Қобыз",
    emoji: "🪕",
    desc: "Слон — қобыз. Ходит по диагонали, как звуки степи.",
    accent: "from-steppe/20 to-sky/20",
  },
  {
    name: "Тұлпар",
    emoji: "🐎",
    desc: "Крылатый тұлпар — конь из легенд, мчится через всю доску.",
    accent: "from-accent/20 to-primary/20",
  },
  {
    name: "Ою",
    emoji: "✨",
    desc: "Орнамент ою — каждая фигура как казахский узор. Минимализм.",
    accent: "from-card to-muted",
  },
];

const features = [
  { icon: Crown, text: "6 эксклюзивных наборов фигур" },
  { icon: Sparkles, text: "AI Coach без лимитов на разборы" },
  { icon: Zap, text: "Кастомные доски и темы" },
  { icon: Check, text: "Анимация ходов, звуки степи" },
  { icon: Check, text: "Поддержка проекта" },
];

export default function ProPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-20">
      <div className="mb-16 max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
          <Crown className="size-3.5 text-accent" />
          ChessMate Pro
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
          Шахматы в стиле{" "}
          <span className="text-primary">кочевой степи</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Шесть наборов фигур, выполненных в традициях казахского орнамента —
          у каждого своя история и характер.
        </p>
      </div>

      <div className="mb-16 grid gap-6 md:grid-cols-3">
        {skinPacks.map((set) => (
          <div
            key={set.name}
            className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${set.accent} opacity-50`}
            />
            <div className="absolute inset-0 kz-pattern opacity-30" />
            <div className="relative">
              <div className="mb-4 text-5xl">{set.emoji}</div>
              <h3 className="font-display text-2xl font-bold">{set.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {set.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
        <div className="space-y-5">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Всё это — в Pro
          </h2>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <f.icon className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-base">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 md:min-w-[280px]">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Lifetime
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold">2 990 ₸</span>
            <span className="font-mono text-sm text-muted-foreground line-through">
              5 990
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Один платёж — навсегда. Без подписок и сюрпризов.
          </p>
          <Link
            href="/play"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5"
          >
            Получить Pro
            <ArrowRight className="size-4" />
          </Link>
          <p className="text-center text-[11px] text-muted-foreground">
            Тестовый режим — Stripe Checkout. На бета-этапе бесплатно.
          </p>
        </div>
      </div>
    </div>
  );
}
