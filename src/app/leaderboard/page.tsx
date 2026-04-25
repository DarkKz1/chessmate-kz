import { Trophy, MapPin, GraduationCap, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Лидерборд · ChessMate KZ",
  description: "Рейтинг школ и городов Казахстана.",
};

const cityData = [
  { rank: 1, name: "Алматы", players: 142, wins: 891, change: "+12" },
  { rank: 2, name: "Астана", players: 128, wins: 814, change: "+8" },
  { rank: 3, name: "Шымкент", players: 84, wins: 542, change: "+15" },
  { rank: 4, name: "Караганда", players: 56, wins: 318, change: "+3" },
  { rank: 5, name: "Актобе", players: 41, wins: 247, change: "+6" },
  { rank: 6, name: "Тараз", players: 38, wins: 203, change: "−1" },
  { rank: 7, name: "Усть-Каменогорск", players: 31, wins: 187, change: "+4" },
  { rank: 8, name: "Павлодар", players: 29, wins: 165, change: "+2" },
];

const schoolData = [
  { rank: 1, school: "НИШ Алматы", city: "Алматы", elo: 1842 },
  { rank: 2, school: "БИЛ Астана", city: "Астана", elo: 1786 },
  { rank: 3, school: "РФМШ", city: "Алматы", elo: 1751 },
  { rank: 4, school: "НИШ Астана", city: "Астана", elo: 1722 },
  { rank: 5, school: "Haileybury Almaty", city: "Алматы", elo: 1698 },
  { rank: 6, school: "Quantum STEM", city: "Шымкент", elo: 1654 },
  { rank: 7, school: "НИШ Шымкент", city: "Шымкент", elo: 1631 },
  { rank: 8, school: "БИЛ Караганда", city: "Караганда", elo: 1598 },
];

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
            <Trophy className="size-3.5 text-accent" />
            Рейтинг
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            Кто сильнее?
          </h1>
        </div>
        <div className="hidden text-right text-xs text-muted-foreground md:block">
          Обновляется в реальном времени
          <br />
          <span className="font-mono text-foreground/70">
            демо-данные · бета
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <header className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Города</h2>
            </div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              За неделю
            </span>
          </header>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-semibold">#</th>
                <th className="px-4 py-2 font-semibold">Город</th>
                <th className="px-4 py-2 text-right font-semibold">Победы</th>
                <th className="px-4 py-2 text-right font-semibold">Δ</th>
              </tr>
            </thead>
            <tbody>
              {cityData.map((c) => (
                <tr
                  key={c.name}
                  className="border-t border-border/40 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                    {c.rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold">{c.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {c.players} игроков
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {c.wins}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-xs ${
                      c.change.startsWith("−")
                        ? "text-check"
                        : "text-steppe"
                    }`}
                  >
                    {c.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <header className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Школы</h2>
            </div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              ELO средний
            </span>
          </header>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-semibold">#</th>
                <th className="px-4 py-2 font-semibold">Школа</th>
                <th className="px-4 py-2 text-right font-semibold">ELO</th>
              </tr>
            </thead>
            <tbody>
              {schoolData.map((s) => (
                <tr
                  key={s.school}
                  className="border-t border-border/40 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                    {s.rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold">{s.school}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {s.city}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                    {s.elo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        <TrendingUp className="size-4 shrink-0 text-accent" />
        <p>
          Зарегистрируйся, выбери свою школу — и каждая твоя победа будет
          поднимать её в рейтинге. Команда из 5 человек уже даёт +50 ELO к
          школе. Это шахматный спорт за свой коллектив.
        </p>
      </div>
    </div>
  );
}
