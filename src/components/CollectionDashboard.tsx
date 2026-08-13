import { useMemo } from "react";
import { BarChart3, ImageOff, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AMIIBO } from "@/data/amiibo";
import { GAMES } from "@/data/games";
import { MISSING_VISUALS, REGIONS, boxedAmiibo } from "@/data/catalog";
import { SPECIAL_CONSOLES } from "@/data/specialConsoles";
import { REGION_LABELS } from "@/data/types";
import { useCollection } from "@/store/useCollection";

const anyGame = (value?: { cartridge: boolean; manual: boolean; box: boolean; cib: boolean }) => !!value && Object.values(value).some(Boolean);
const anyAmiibo = (value?: { figure: boolean; box: boolean; cib: boolean }) => !!value && Object.values(value).some(Boolean);

export function CollectionDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const games = useCollection((state) => state.games);
  const amiibo = useCollection((state) => state.amiibo);
  const consoles = useCollection((state) => state.consoles);

  const report = useMemo(() => {
    const gameOwned = GAMES.filter((item) => anyGame(games[item.id])).length;
    const consoleEntries = REGIONS.flatMap((region) => SPECIAL_CONSOLES.filter((item) => item.region === region || item.region === "MONDE").map((item) => ({ item, region })));
    const consoleOwned = consoleEntries.filter(({ item, region }) => consoles[`${item.id}-${region}`]).length;
    const individualEntries = REGIONS.flatMap((region) => AMIIBO.filter((item) => (!item.regions || item.regions.includes(region)) && !item.pack).map((item) => ({ item, region })));
    const boxedEntries = REGIONS.flatMap((region) => boxedAmiibo(region).map((item) => ({ item, region })));
    const individualOwned = individualEntries.filter(({ item, region }) => anyAmiibo(amiibo[`${item.id}-${region}`])).length;
    const boxedOwned = boxedEntries.filter(({ item, region }) => anyAmiibo(amiibo[`boxed-${item.id}-${region}`])).length;
    return {
      sections: [
        { label: "Jeux", owned: gameOwned, total: GAMES.length },
        { label: "Consoles", owned: consoleOwned, total: consoleEntries.length },
        { label: "Amiibo en boîte", owned: boxedOwned, total: boxedEntries.length },
        { label: "Amiibo individuels", owned: individualOwned, total: individualEntries.length },
      ],
      missingGames: GAMES.filter((item) => !anyGame(games[item.id])),
      missingConsoles: consoleEntries.filter(({ item, region }) => !consoles[`${item.id}-${region}`]),
      missingBoxed: boxedEntries.filter(({ item, region }) => !anyAmiibo(amiibo[`boxed-${item.id}-${region}`])),
      missingIndividuals: individualEntries.filter(({ item, region }) => !anyAmiibo(amiibo[`${item.id}-${region}`])),
    };
  }, [games, amiibo, consoles]);

  if (!open) return null;
  const owned = report.sections.reduce((sum, section) => sum + section.owned, 0);
  const total = report.sections.reduce((sum, section) => sum + section.total, 0);

  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-background/95 p-4 backdrop-blur-sm print:static print:overflow-visible print:bg-white print:p-0">
    <div className="mx-auto max-w-5xl print:max-w-none">
      <div className="mb-5 flex items-start justify-between gap-4 print:hidden">
        <div><div className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" /><h2 className="text-xl font-bold">Tableau de collection</h2></div><p className="text-sm text-muted-foreground">Vue d’ensemble et checklist imprimable.</p></div>
        <div className="flex gap-2"><Button onClick={() => window.print()}><Printer className="size-4" />Imprimer / PDF</Button><Button variant="outline" size="icon" onClick={onClose} aria-label="Fermer"><X className="size-4" /></Button></div>
      </div>
      <div className="hidden print:block"><h1 className="text-2xl font-bold">Triforce Checklist — Rapport de collection</h1><p>Généré le {new Date().toLocaleDateString("fr-CA")}</p></div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
        {report.sections.map((section) => { const percent = section.total ? Math.round(section.owned / section.total * 100) : 0; return <div key={section.label} className="rounded-xl border bg-card p-4 print:break-inside-avoid"><p className="text-sm text-muted-foreground">{section.label}</p><p className="mt-1 text-2xl font-bold tabular-nums">{section.owned}/{section.total}</p><Progress value={percent} className="mt-3" /><p className="mt-1 text-xs text-muted-foreground">{percent}% complété</p></div>; })}
      </section>
      <div className="mt-4 rounded-xl border bg-primary/5 p-4 print:break-inside-avoid"><p className="text-sm font-medium">Collection globale</p><p className="text-3xl font-bold">{owned}/{total} <span className="text-base font-normal text-muted-foreground">({total ? Math.round(owned / total * 100) : 0}%)</span></p></div>
      <section className="mt-6 rounded-xl border bg-card p-4 print:break-inside-avoid"><div className="flex items-center gap-2"><ImageOff className="size-4 text-primary" /><h3 className="font-semibold">Visuels officiels en attente</h3></div>{MISSING_VISUALS.map((item) => <p key={item.id} className="mt-2 text-sm"><b>{item.label}</b> · {REGION_LABELS[item.region]} — <span className="text-muted-foreground">{item.reason}</span></p>)}</section>
      <section className="mt-6 print:text-[10px]"><h3 className="mb-3 text-lg font-semibold">Éléments manquants</h3><div className="grid gap-5 md:grid-cols-2 print:grid-cols-2">
        <MissingList title={`Jeux (${report.missingGames.length})`} items={report.missingGames.map((x) => `${REGION_LABELS[x.region]} · ${x.console} · ${x.title}`)} />
        <MissingList title={`Consoles (${report.missingConsoles.length})`} items={report.missingConsoles.map(({ item, region }) => `${REGION_LABELS[region]} · ${item.name}`)} />
        <MissingList title={`Amiibo en boîte (${report.missingBoxed.length})`} items={report.missingBoxed.map(({ item, region }) => `${REGION_LABELS[region]} · ${item.series} · ${item.name}`)} />
        <MissingList title={`Amiibo individuels (${report.missingIndividuals.length})`} items={report.missingIndividuals.map(({ item, region }) => `${REGION_LABELS[region]} · ${item.series} · ${item.name}`)} />
      </div></section>
    </div>
  </div>;
}

function MissingList({ title, items }: { title: string; items: string[] }) {
  return <div className="break-inside-avoid"><h4 className="mb-2 font-semibold">{title}</h4><ul className="space-y-1">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2"><span className="inline-block size-3 shrink-0 rounded-sm border print:size-2.5" /><span>{item}</span></li>)}</ul></div>;
}
