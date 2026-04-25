import Link from "next/link";
import {
  Crown,
  Users,
  Bot,
  Trophy,
  Sparkles,
  ArrowRight,
  Castle,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { LandingBoard } from "@/components/landing-board";

export default function Home() {
  return (
    <div className="relative">
      <section className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-20 pt-12 md:flex-row md:items-center md:gap-16 md:px-8 md:pt-20">
        <div className="flex-1 space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" />
            Шахматная лига Қазақстана
          </div>

          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
            Шах и мат —{" "}
            <span className="relative inline-block">
              <span className="shimmer-text">за свою школу</span>
              <svg
                className="absolute -bottom-2 left-0 h-3 w-full text-primary"
                viewBox="0 0 200 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 8 Q 50 2, 100 7 T 198 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Играй против ИИ или друзей по ссылке. После партии{" "}
            <span className="font-semibold text-foreground">AI-тренер</span>{" "}
            разберёт твои ходы на казахском или русском. Лидерборды по школам
            и городам — покажи, кто сильнее.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/play"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Начать партию
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-base font-bold transition-colors hover:bg-muted"
            >
              <Trophy className="size-4" />
              Лидерборд
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-steppe animate-pulse" />
              Бесплатно навсегда
            </div>
            <div className="flex items-center gap-2">
              <Castle className="size-4 text-accent" />
              Все правила: рокировка, en passant, мат
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-sky" />
              Лидерборд по городам РК
            </div>
          </div>
        </div>

        <div className="flex-1">
          <LandingBoard />
        </div>
      </section>

      <section className="border-y border-border/50 bg-card/40 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px bg-border/50 md:grid-cols-3">
          <FeatureCell
            icon={Bot}
            title="ИИ-тренер"
            text="Stockfish от новичка до мастера. После партии — разбор ошибок Claude на казахском и русском."
          />
          <FeatureCell
            icon={Users}
            title="Игра по ссылке"
            text="Кинул ссылку другу — играете в реальном времени. Гостям регистрация не нужна."
          />
          <FeatureCell
            icon={GraduationCap}
            title="Школы соревнуются"
            text="Указал свою школу — твои победы прокачивают её рейтинг в лиге Казахстана."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
              <Crown className="size-3.5 text-accent" />
              ChessMate Pro
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight md:text-5xl">
              Этно-фигуры в стиле{" "}
              <span className="text-primary">кочевой степи</span>
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Беркут вместо ладьи, барс вместо коня, юрта вместо короля.
              Шесть наборов фигур в традициях казахского орнамента — у каждого
              своя история.
            </p>
            <Link
              href="/pro"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"
            >
              Посмотреть наборы
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "Беркут", emoji: "🦅" },
              { name: "Барс", emoji: "🐆" },
              { name: "Юрта", emoji: "🏠" },
              { name: "Қобыз", emoji: "🪕" },
              { name: "Тұлпар", emoji: "🐎" },
              { name: "Ою", emoji: "✨" },
            ].map((set) => (
              <div
                key={set.name}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-muted p-4 transition-transform hover:-translate-y-1"
              >
                <div className="absolute inset-0 kz-pattern opacity-50" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="text-3xl">{set.emoji}</div>
                  <div className="font-display text-sm font-bold">
                    {set.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-3">
              <h3 className="font-display text-3xl font-bold md:text-4xl">
                Готов сыграть первую партию?
              </h3>
              <p className="text-muted-foreground md:text-lg">
                Без регистрации. Открой доску — и вперёд.
              </p>
            </div>
            <Link
              href="/play"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5"
            >
              Играть сейчас
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCell({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Crown;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-background/60 p-8 transition-colors hover:bg-background">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary">
        <Icon className="size-6" strokeWidth={2} />
      </div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
