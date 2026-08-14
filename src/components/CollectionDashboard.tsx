import { useMemo, useState } from "react";
import { BarChart3, Box, Gamepad2, ImageOff, Monitor, Printer, RotateCcw, ScanLine, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AMIIBO } from "@/data/amiibo";
import { GAMES } from "@/data/games";
import { MISSING_VISUALS, REGIONS, boxedAmiibo } from "@/data/catalog";
import { SPECIAL_CONSOLES } from "@/data/specialConsoles";
import { CATEGORY_LABELS, type GameCategory, type Region } from "@/data/types";
import { useCollection } from "@/store/useCollection";
import { categoryLabel, regionLabel, useI18n } from "@/i18n";

const anyGame = (value?: { cartridge: boolean; manual: boolean; box: boolean; cib: boolean }) => !!value && Object.values(value).some(Boolean);
const anyAmiibo = (value?: { figure: boolean; box: boolean; cib: boolean }) => !!value && Object.values(value).some(Boolean);
const pct = (owned: number, total: number) => total ? Math.round(owned / total * 100) : 0;

type AnalysisCategory = "all" | "games" | "consoles" | "boxed" | "individuals";
type AnalysisRegion = "all" | Region;
type AnalysisGameCategory = "all" | GameCategory;
type Metric = { key: Exclude<AnalysisCategory, "all">; label: string; owned: number; total: number; icon: typeof Gamepad2 };
type MissingGroup = { label: string; items: string[] };

const ANALYSIS_CATEGORIES: AnalysisCategory[] = ["all", "games", "consoles", "boxed", "individuals"];

const GAME_CATEGORIES = Object.keys(CATEGORY_LABELS) as GameCategory[];

export function CollectionDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { language, t } = useI18n();
  const games = useCollection((state) => state.games);
  const amiibo = useCollection((state) => state.amiibo);
  const consoles = useCollection((state) => state.consoles);
  const [analysisRegion, setAnalysisRegion] = useState<AnalysisRegion>("all");
  const [analysisCategory, setAnalysisCategory] = useState<AnalysisCategory>("all");
  const [analysisGameCategory, setAnalysisGameCategory] = useState<AnalysisGameCategory>("all");

  const report = useMemo(() => {
    const selectedRegions = analysisRegion === "all" ? REGIONS : [analysisRegion];
    const regionalBreakdown = selectedRegions.map((region) => {
      const regionalGames = GAMES.filter((item) => item.region === region && (analysisGameCategory === "all" || item.category === analysisGameCategory));
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
      owned: regionalBreakdown.reduce((value, region) => value + region[key].owned, 0),
      total: regionalBreakdown.reduce((value, region) => value + region[key].total, 0),
    });
    const allMetrics: Metric[] = [
      { key: "games", label: t("tabs.games"), ...sum("games"), icon: Gamepad2 },
      { key: "consoles", label: t("tabs.consoles"), ...sum("consoles"), icon: Monitor },
      { key: "boxed", label: t("tabs.boxedAmiibo"), ...sum("boxed"), icon: Box },
      { key: "individuals", label: t("tabs.individualAmiibo"), ...sum("individuals"), icon: ScanLine },
    ];
    const metrics = analysisCategory === "all" ? allMetrics : allMetrics.filter((metric) => metric.key === analysisCategory);
    const activeMetricKeys = new Set(metrics.map((metric) => metric.key));
    const byRegion = regionalBreakdown.map((row) => {
      const values = (["games", "consoles", "boxed", "individuals"] as const).filter((key) => activeMetricKeys.has(key));
      return {
        region: row.region,
        owned: values.reduce((total, key) => total + row[key].owned, 0),
        total: values.reduce((total, key) => total + row[key].total, 0),
      };
    });

    const missingGames = selectedRegions.map((region) => ({
      region,
      groups: groupItems(
        GAMES.filter((item) => item.region === region && (analysisGameCategory === "all" || item.category === analysisGameCategory) && !anyGame(games[item.id])).map((item) => ({ group: item.console, label: item.title })),
      ),
    }));
    const missingConsoles = selectedRegions.map((region) => ({
      region,
      groups: groupItems(
        SPECIAL_CONSOLES.filter((item) => (item.region === region || item.region === "MONDE") && !consoles[`${item.id}-${region}`]).map((item) => ({ group: item.family, label: item.name })),
      ),
    }));
    const missingBoxed = selectedRegions.map((region) => ({
      region,
      groups: groupItems(boxedAmiibo(region).filter((item) => !anyAmiibo(amiibo[`boxed-${item.id}-${region}`])).map((item) => ({ group: item.series, label: item.name }))),
    }));
    const missingIndividuals = selectedRegions.map((region) => ({
      region,
      groups: groupItems(AMIIBO.filter((item) => (!item.regions || item.regions.includes(region)) && !item.pack && !anyAmiibo(amiibo[`${item.id}-${region}`])).map((item) => ({ group: item.series, label: item.name }))),
    }));

    const filteredGames = GAMES.filter((item) => selectedRegions.includes(item.region) && (analysisGameCategory === "all" || item.category === analysisGameCategory));
    return {
      byRegion,
      metrics,
      gameCib: filteredGames.filter((item) => games[item.id]?.cib).length,
      gameBoxed: filteredGames.filter((item) => games[item.id]?.box || games[item.id]?.cib).length,
      gameManuals: filteredGames.filter((item) => games[item.id]?.manual || games[item.id]?.cib).length,
      missingGames,
      missingConsoles,
      missingBoxed,
      missingIndividuals,
      missingVisuals: MISSING_VISUALS.filter((item) => selectedRegions.includes(item.region)),
    };
  }, [games, amiibo, consoles, analysisRegion, analysisCategory, analysisGameCategory, language]);

  if (!open) return null;
  const owned = report.metrics.reduce((sum, section) => sum + section.owned, 0);
  const total = report.metrics.reduce((sum, section) => sum + section.total, 0);
  const includesGames = analysisCategory === "all" || analysisCategory === "games";
  const includesConsoles = analysisCategory === "all" || analysisCategory === "consoles";
  const includesBoxed = analysisCategory === "all" || analysisCategory === "boxed";
  const includesIndividuals = analysisCategory === "all" || analysisCategory === "individuals";
  const regionScope = analysisRegion === "all" ? t("dashboard.allRegions") : regionLabel(analysisRegion, language);
  const categoryScope = analysisCategory === "all" ? t("dashboard.allCategories") : t(analysisCategory === "boxed" ? "tabs.boxedAmiibo" : analysisCategory === "individuals" ? "tabs.individualAmiibo" : `tabs.${analysisCategory}`);
  const gameScope = analysisGameCategory === "all" ? t("dashboard.allGameTypes") : categoryLabel(analysisGameCategory, language);
  const scopeSummary = `${regionScope} · ${categoryScope}${includesGames && analysisGameCategory !== "all" ? ` · ${gameScope}` : ""}`;

  const resetAnalysisFilters = () => {
    setAnalysisRegion("all");
    setAnalysisCategory("all");
    setAnalysisGameCategory("all");
  };

  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-background/95 p-4 backdrop-blur-sm print:static print:overflow-visible print:bg-white print:p-0">
    <div className="mx-auto max-w-5xl print:max-w-none">
      <div className="mb-5 flex items-start justify-between gap-4 print:hidden">
        <div><div className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" /><h2 className="text-xl font-bold">{t("dashboard.title")}</h2></div><p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p></div>
        <div className="flex gap-2"><Button onClick={() => window.print()}><Printer className="size-4" />{t("dashboard.print")}</Button><Button variant="outline" size="icon" onClick={onClose} aria-label={t("dashboard.close")}><X className="size-4" /></Button></div>
      </div>
      <div className="hidden print:block"><h1 className="text-2xl font-bold">{t("dashboard.reportTitle")}</h1><p>{t("dashboard.generated", { date: new Date().toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA") })}</p></div>

      <section className="mb-4 grid gap-3 rounded-xl border bg-card/80 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] print:hidden">
        <AnalysisSelect label={t("dashboard.region")} value={analysisRegion} onChange={(value) => setAnalysisRegion(value as AnalysisRegion)}>
          <option value="all">{t("dashboard.allRegions")}</option>
          {REGIONS.map((region) => <option key={region} value={region}>{regionLabel(region, language)}</option>)}
        </AnalysisSelect>
        <AnalysisSelect label={t("dashboard.category")} value={analysisCategory} onChange={(value) => setAnalysisCategory(value as AnalysisCategory)}>
          {ANALYSIS_CATEGORIES.map((value) => <option key={value} value={value}>{value === "all" ? t("dashboard.allCategories") : t(value === "boxed" ? "tabs.boxedAmiibo" : value === "individuals" ? "tabs.individualAmiibo" : `tabs.${value}`)}</option>)}
        </AnalysisSelect>
        <AnalysisSelect label={t("dashboard.gameType")} value={analysisGameCategory} onChange={(value) => setAnalysisGameCategory(value as AnalysisGameCategory)} disabled={!includesGames}>
          <option value="all">{t("dashboard.allGameTypes")}</option>
          {GAME_CATEGORIES.map((value) => <option key={value} value={value}>{categoryLabel(value, language)}</option>)}
        </AnalysisSelect>
        <Button variant="outline" className="self-end" onClick={resetAnalysisFilters} disabled={analysisRegion === "all" && analysisCategory === "all" && analysisGameCategory === "all"}><RotateCcw className="size-4" />{t("dashboard.reset")}</Button>
      </section>
      <p className="mb-3 hidden text-sm print:block">{t("dashboard.scope", { scope: scopeSummary })}</p>

      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-card p-5 print:break-inside-avoid">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-muted-foreground">{scopeSummary}</p><p className="text-4xl font-black tabular-nums">{pct(owned, total)}%</p></div><div className="text-right"><p className="text-2xl font-bold tabular-nums">{owned}/{total}</p><p className="text-xs text-muted-foreground">{t("dashboard.items")}</p></div></div>
        <Progress value={pct(owned, total)} className="mt-4 h-3" />
      </section>

      <section className={`mt-4 grid gap-3 ${report.metrics.length === 1 ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4"}`}>
        {report.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className={`mt-5 grid gap-4 ${includesGames ? "lg:grid-cols-[1.45fr_1fr] print:grid-cols-[1.45fr_1fr]" : "lg:grid-cols-1 print:grid-cols-1"}`}>
        <div className="rounded-xl border bg-card p-4 print:break-inside-avoid"><h3 className="mb-3 font-semibold">{t("dashboard.byRegion")}</h3><div className="space-y-3">{report.byRegion.map((row) => {
          return <div key={row.region}><div className="mb-1 flex justify-between text-sm"><b>{regionLabel(row.region, language)}</b><span className="tabular-nums text-muted-foreground">{row.owned}/{row.total} · {pct(row.owned, row.total)}%</span></div><Progress value={pct(row.owned, row.total)} /></div>;
        })}</div></div>
        {includesGames && <div className="rounded-xl border bg-card p-4 print:break-inside-avoid"><div className="flex items-center gap-2"><Trophy className="size-4 text-primary" /><h3 className="font-semibold">{t("dashboard.gameState")}</h3></div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><MiniStat label="CIB" value={report.gameCib} /><MiniStat label={t("dashboard.withBox")} value={report.gameBoxed} /><MiniStat label={t("dashboard.withManual")} value={report.gameManuals} /></div></div>}
      </section>

      {includesBoxed && report.missingVisuals.length > 0 && <section className="mt-5 rounded-xl border bg-card p-4 print:break-inside-avoid"><div className="flex items-center gap-2"><ImageOff className="size-4 text-primary" /><h3 className="font-semibold">{t("dashboard.pendingVisuals")}</h3></div>{report.missingVisuals.map((item) => <p key={item.id} className="mt-2 text-sm"><b>{item.label}</b> · {regionLabel(item.region, language)} — <span className="text-muted-foreground">{item.reason}</span></p>)}</section>}

      <section className="mt-6 print:text-[9px]"><h3 className="mb-3 text-lg font-semibold">{t("dashboard.missingItems")}</h3><div className="space-y-3">
        {includesGames && <MissingCategory title={t("tabs.games")} icon={Gamepad2} regions={report.missingGames} />}
        {includesConsoles && <MissingCategory title={t("tabs.consoles")} icon={Monitor} regions={report.missingConsoles} />}
        {includesBoxed && <MissingCategory title={t("tabs.boxedAmiibo")} icon={Box} regions={report.missingBoxed} />}
        {includesIndividuals && <MissingCategory title={t("tabs.individualAmiibo")} icon={ScanLine} regions={report.missingIndividuals} />}
      </div></section>
    </div>
  </div>;
}

function AnalysisSelect({ label, value, onChange, disabled = false, children }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; children: React.ReactNode }) {
  return <label className={`grid gap-1 text-xs font-medium text-muted-foreground ${disabled ? "opacity-50" : ""}`}><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed">{children}</select></label>;
}

function MetricCard({ metric }: { metric: Metric }) {
  const { t } = useI18n();
  const Icon = metric.icon;
  return <div className="rounded-xl border bg-card p-4 print:break-inside-avoid"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{metric.label}</p><Icon className="size-4 text-primary" /></div><p className="mt-1 text-2xl font-bold tabular-nums">{metric.owned}/{metric.total}</p><Progress value={pct(metric.owned, metric.total)} className="mt-3" /><p className="mt-1 text-xs text-muted-foreground">{t("dashboard.completed", { percent: pct(metric.owned, metric.total) })}</p></div>;
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
  const { language } = useI18n();
  const total = regions.reduce((sum, region) => sum + region.groups.reduce((n, group) => n + group.items.length, 0), 0);
  return <details className="group rounded-xl border bg-card print:break-inside-auto"><summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold"><Icon className="size-4 text-primary" />{title}<span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">{total}</span></summary><div className="grid gap-3 border-t p-4 md:grid-cols-3 print:grid-cols-3">{regions.map(({ region, groups }) => <div key={region}><h4 className="mb-2 font-semibold text-primary">{regionLabel(region, language)} <span className="text-xs text-muted-foreground">({groups.reduce((n, group) => n + group.items.length, 0)})</span></h4><div className="space-y-3">{groups.map((group) => <div key={group.label} className="break-inside-avoid"><h5 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{group.label}</h5><ul className="space-y-1">{group.items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-sm print:text-[9px]"><span className="mt-1 inline-block size-3 shrink-0 rounded-sm border print:size-2.5" /><span>{item}</span></li>)}</ul></div>)}</div></div>)}</div></details>;
}
