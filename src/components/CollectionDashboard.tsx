import { useMemo } from "react";
import { BarChart3, Box, Gamepad2, ImageOff, Monitor, Printer, ScanLine, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AMIIBO } from "@/data/amiibo";
import { GAMES } from "@/data/games";
import { MISSING_VISUALS, REGIONS, boxedAmiibo } from "@/data/catalog";
import { SPECIAL_CONSOLES } from "@/data/specialConsoles";
import { REGION_LABELS, type Region } from "@/data/types";
import { useCollection } from "@/store/useCollection";

const anyGame = (value?: { cartridge: boolean; manual: boolean; box: boolean; cib: boolean }) => !!value && Object.values(value).some(Boolean);
const anyAmiibo = (value?: { figure: boolean; box: boolean; cib: boolean }) => !!value && Object.values(value).some(Boolean);
const pct = (owned: number, total: number) => total ? Math.round(owned / total * 100) : 0;

type Metric = { label: string; owned: number; total: number; icon: typeof Gamepad2 };
type MissingGroup = { label: string; items: string[] };

export function CollectionDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const games = useCollection((state) => state.games);
  const amiibo = useCollection((state) => state.amiibo);
  const consoles = useCollection((state) => state.consoles);

  const report = useMemo(() => {
    const byRegion = REGIONS.map((region) => {
      const regionalGames = GAMES.filter((item) => item.region === region);
      const regionalConsoles = SPECIAL_CONSOLES.filter((item) => item.region === region || item.region === "MONDE");
      const individuals = AMIIBO.filter((item) => (!item.regions || item.regions.includes(region)) && !item.pack);
      const boxed = boxedAmiibo(region);
      return {
        region,
        games: { owned: regionalGames.filter((item) => anyGame(games[item.id])).length, total: regionalGames.length },
        consoles: { owned: regionalConsoles.filter((item) => consoles[`${item.id}-${region}`]).length, total: regionalConsoles.length },
        boxed: { owned: boxed.filter((item) => anyAmiibo(amiibo[`boxed-${item.id}-${region}`])).length, total: boxed.length },
        individuals: { owned: individuals.filter((item) => anyAmiibo(amiibo[`${item.id}-${region}`])).length, total: individuals.length },
      };
    });

    const sum = (key: "games" | "consoles" | "boxed" | "individuals") => ({
      owned: byRegion.reduce((value, region) => value + region[key].owned, 0),
      total: byRegion.reduce((value, region) => value + region[key].total, 0),
    });
    const metrics: Metric[] = [
      { label: "Jeux", ...sum("games"), icon: Gamepad2 },
      { label: "Consoles", ...sum("consoles"), icon: Monitor },
      { label: "Amiibo en boîte", ...sum("boxed"), icon: Box },
      { label: "Amiibo individuels", ...sum("individuals"), icon: ScanLine },
    ];

    const missingGames = REGIONS.map((region) => ({
      region,
      groups: groupItems(
        GAMES.filter((item) => item.region === region && !anyGame(games[item.id])).map((item) => ({ group: item.console, label: item.title })),
      ),
    }));
    const missingConsoles = REGIONS.map((region) => ({
      region,
      groups: groupItems(
        SPECIAL_CONSOLES.filter((item) => (item.region === region || item.region === "MONDE") && !consoles[`${item.id}-${region}`]).map((item) => ({ group: item.family, label: item.name })),
      ),
    }));
    const missingBoxed = REGIONS.map((region) => ({
      region,
      groups: groupItems(boxedAmiibo(region).filter((item) => !anyAmiibo(amiibo[`boxed-${item.id}-${region}`])).map((item) => ({ group: item.series, label: item.name }))),
    }));
    const missingIndividuals = REGIONS.map((region) => ({
      region,
      groups: groupItems(AMIIBO.filter((item) => (!item.regions || item.regions.includes(region)) && !item.pack && !anyAmiibo(amiibo[`${item.id}-${region}`])).map((item) => ({ group: item.series, label: item.name }))),
    }));

    return {
      byRegion,
      metrics,
      gameCib: GAMES.filter((item) => games[item.id]?.cib).length,
      gameBoxed: GAMES.filter((item) => games[item.id]?.box || games[item.id]?.cib).length,
      gameManuals: GAMES.filter((item) => games[item.id]?.manual || games[item.id]?.cib).length,
      missingGames,
      missingConsoles,
      missingBoxed,
      missingIndividuals,
    };
  }, [games, amiibo, consoles]);

  if (!open) return null;
  const owned = report.metrics.reduce((sum, section) => sum + section.owned, 0);
  const total = report.metrics.reduce((sum, section) => sum + section.total, 0);

  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-background/95 p-4 backdrop-blur-sm print:static print:overflow-visible print:bg-white print:p-0">
    <div className="mx-auto max-w-5xl print:max-w-none">
      <div className="mb-5 flex items-start justify-between gap-4 print:hidden">
        <div><div className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" /><h2 className="text-xl font-bold">Tableau de collection</h2></div><p className="text-sm text-muted-foreground">Progression détaillée et checklist organisée.</p></div>
        <div className="flex gap-2"><Button onClick={() => window.print()}><Printer className="size-4" />Imprimer / PDF</Button><Button variant="outline" size="icon" onClick={onClose} aria-label="Fermer"><X className="size-4" /></Button></div>
      </div>
      <div className="hidden print:block"><h1 className="text-2xl font-bold">Triforce Checklist — Rapport de collection</h1><p>Généré le {new Date().toLocaleDateString("fr-CA")}</p></div>

      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-card p-5 print:break-inside-avoid">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-muted-foreground">Collection globale</p><p className="text-4xl font-black tabular-nums">{pct(owned, total)}%</p></div><div className="text-right"><p className="text-2xl font-bold tabular-nums">{owned}/{total}</p><p className="text-xs text-muted-foreground">pièces répertoriées</p></div></div>
        <Progress value={pct(owned, total)} className="mt-4 h-3" />
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
        {report.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_1fr] print:grid-cols-[1.45fr_1fr]">
        <div className="rounded-xl border bg-card p-4 print:break-inside-avoid"><h3 className="mb-3 font-semibold">Progression par région</h3><div className="space-y-3">{report.byRegion.map((row) => {
          const rowOwned = row.games.owned + row.consoles.owned + row.boxed.owned + row.individuals.owned;
          const rowTotal = row.games.total + row.consoles.total + row.boxed.total + row.individuals.total;
          return <div key={row.region}><div className="mb-1 flex justify-between text-sm"><b>{REGION_LABELS[row.region]}</b><span className="tabular-nums text-muted-foreground">{rowOwned}/{rowTotal} · {pct(rowOwned, rowTotal)}%</span></div><Progress value={pct(rowOwned, rowTotal)} /></div>;
        })}</div></div>
        <div className="rounded-xl border bg-card p-4 print:break-inside-avoid"><div className="flex items-center gap-2"><Trophy className="size-4 text-primary" /><h3 className="font-semibold">État des jeux</h3></div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><MiniStat label="CIB" value={report.gameCib} /><MiniStat label="Avec boîte" value={report.gameBoxed} /><MiniStat label="Avec livret" value={report.gameManuals} /></div></div>
      </section>

      <section className="mt-5 rounded-xl border bg-card p-4 print:break-inside-avoid"><div className="flex items-center gap-2"><ImageOff className="size-4 text-primary" /><h3 className="font-semibold">Visuels officiels en attente</h3></div>{MISSING_VISUALS.map((item) => <p key={item.id} className="mt-2 text-sm"><b>{item.label}</b> · {REGION_LABELS[item.region]} — <span className="text-muted-foreground">{item.reason}</span></p>)}</section>

      <section className="mt-6 print:text-[9px]"><h3 className="mb-3 text-lg font-semibold">Éléments manquants</h3><div className="space-y-3">
        <MissingCategory title="Jeux" icon={Gamepad2} regions={report.missingGames} />
        <MissingCategory title="Consoles" icon={Monitor} regions={report.missingConsoles} />
        <MissingCategory title="Amiibo en boîte" icon={Box} regions={report.missingBoxed} />
        <MissingCategory title="Amiibo individuels" icon={ScanLine} regions={report.missingIndividuals} />
      </div></section>
    </div>
  </div>;
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return <div className="rounded-xl border bg-card p-4 print:break-inside-avoid"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{metric.label}</p><Icon className="size-4 text-primary" /></div><p className="mt-1 text-2xl font-bold tabular-nums">{metric.owned}/{metric.total}</p><Progress value={pct(metric.owned, metric.total)} className="mt-3" /><p className="mt-1 text-xs text-muted-foreground">{pct(metric.owned, metric.total)}% complété</p></div>;
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-muted/50 p-2"><p className="text-xl font-bold tabular-nums">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>;
}

function groupItems(items: { group: string; label: string }[]): MissingGroup[] {
  const groups = new Map<string, string[]>();
  for (const item of items) groups.set(item.group, [...(groups.get(item.group) ?? []), item.label]);
  return [...groups].map(([label, values]) => ({ label, items: values }));
}

function MissingCategory({ title, icon: Icon, regions }: { title: string; icon: typeof Gamepad2; regions: { region: Region; groups: MissingGroup[] }[] }) {
  const total = regions.reduce((sum, region) => sum + region.groups.reduce((n, group) => n + group.items.length, 0), 0);
  return <details className="group rounded-xl border bg-card print:break-inside-auto"><summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold"><Icon className="size-4 text-primary" />{title}<span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">{total}</span></summary><div className="grid gap-3 border-t p-4 md:grid-cols-3 print:grid-cols-3">{regions.map(({ region, groups }) => <div key={region}><h4 className="mb-2 font-semibold text-primary">{REGION_LABELS[region]} <span className="text-xs text-muted-foreground">({groups.reduce((n, group) => n + group.items.length, 0)})</span></h4><div className="space-y-3">{groups.map((group) => <div key={group.label} className="break-inside-avoid"><h5 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{group.label}</h5><ul className="space-y-1">{group.items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-sm print:text-[9px]"><span className="mt-1 inline-block size-3 shrink-0 rounded-sm border print:size-2.5" /><span>{item}</span></li>)}</ul></div>)}</div></div>)}</div></details>;
}
