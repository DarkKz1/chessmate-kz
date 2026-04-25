import Link from "next/link";
import { Link2, Sparkles, Construction } from "lucide-react";

export const metadata = {
  title: "Игра по ссылке · ChessMate KZ",
};

export default function MultiplayerHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
      <div className="rounded-3xl border border-border bg-card p-8 text-center md:p-12">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
          <Construction className="size-8" />
        </div>
        <h1 className="font-display text-3xl font-bold md:text-5xl">
          Скоро: игра по ссылке
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          Реалтайм-партии через WebSocket с твоими друзьями. Кинул ссылку —
          и играете. Включаем 27 апреля вечером.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 md:flex-row">
          <Link
            href="/play/ai"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            <Sparkles className="size-4" />
            Сыграть с ИИ
          </Link>
          <Link
            href="/play/local"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-bold transition-colors hover:bg-muted"
          >
            <Link2 className="size-4" />
            На одном экране
          </Link>
        </div>
      </div>
    </div>
  );
}
