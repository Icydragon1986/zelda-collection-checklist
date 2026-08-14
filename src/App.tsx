import { useEffect, useMemo, useState } from "react";
import { BarChart3, Box, Gamepad2, Monitor, ScanLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FilterBar } from "@/components/FilterBar";
import { RegionView } from "@/components/RegionView";
import { AmiiboView } from "@/components/AmiiboView";
import { SpecialConsoleView } from "@/components/SpecialConsoleView";
import { GAMES } from "@/data/games";
import { AMIIBO } from "@/data/amiibo";
import { SPECIAL_CONSOLES } from "@/data/specialConsoles";
import type { Region } from "@/data/types";
import { useCollection } from "@/store/useCollection";
import { useFilters } from "@/store/useFilters";
import { UpdateChecker } from "@/components/UpdateChecker";
import { CollectionMenu } from "@/components/CollectionMenu";
import { CollectionDashboard } from "@/components/CollectionDashboard";
import { Button } from "@/components/ui/button";
import { boxedAmiibo, validateCatalog } from "@/data/catalog";
import { LanguageToggle } from "@/components/LanguageToggle";
import { regionLabel, useI18n } from "@/i18n";
import { InstallWebAppBanner } from "@/components/InstallWebAppBanner";

const REGIONS: Region[] = ["NA", "PAL", "JP"];
type CategoryTab = "games" | "consoles" | "amiibo";
type AmiiboMode = "boxed" | "individual";

function App() {
  const { language, t } = useI18n();
  const [category, setCategory] = useState<CategoryTab>("games");
  const [region, setRegion] = useState<Region>("NA");
  const [amiiboMode, setAmiiboMode] = useState<AmiiboMode>("boxed");
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const ready = useCollection((s) => s.ready);
  const games = useCollection((s) => s.games);
  const amiibo = useCollection((s) => s.amiibo);
  const consoles = useCollection((s) => s.consoles);
  const categories = useFilters((s) => s.categories);
  const isCategoryVisible = useFilters((s) => s.isCategoryVisible);

  useEffect(() => { void useCollection.getState().init(); }, []);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const catalogErrors = validateCatalog();
    if (catalogErrors.length) console.warn("Erreurs du catalogue Zelda:", catalogErrors);
  }, []);

  const counts = useMemo(() => Object.fromEntries(REGIONS.map((r) => {
    if (category === "games") {
      const items = GAMES.filter((g) => g.region === r && isCategoryVisible(g.category));
      return [r, { owned: items.filter((g) => !!games[g.id] && Object.values(games[g.id]).some(Boolean)).length, total: items.length }];
    }
    if (category === "amiibo") {
      const boxed = amiiboMode === "boxed";
      const items = boxed ? boxedAmiibo(r) : AMIIBO.filter((a) => (!a.regions || a.regions.includes(r)) && !a.pack);
      return [r, { owned: items.filter((a) => {
        const own = amiibo[`${boxed ? "boxed-" : ""}${a.id}-${r}`];
        return !!own && (own.figure || own.box || own.cib);
      }).length, total: items.length }];
    }
    const items = SPECIAL_CONSOLES.filter((c) => c.region === r || c.region === "MONDE");
    return [r, { owned: items.filter((c) => consoles[`${c.id}-${r}`]).length, total: items.length }];
  })) as Record<Region, { owned: number; total: number }>, [category, amiiboMode, games, amiibo, consoles, categories, isCategoryVisible]);

  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">{t("app.loading")}</div>;

  const regionTabs = (content: (r: Region) => React.ReactNode) => (
    <Tabs value={region} onValueChange={(v) => setRegion(v as Region)}>
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted/40 p-1 sm:flex sm:w-fit sm:flex-wrap sm:justify-start">
        {REGIONS.map((r) => <TabsTrigger key={r} value={r} className="min-w-0 gap-1 px-2 py-1.5 text-[11px] sm:px-3 sm:text-sm"><span className="truncate">{regionLabel(r, language)}</span><Badge variant="secondary" className="hidden text-[10px] tabular-nums min-[390px]:inline-flex">{counts[r].owned}/{counts[r].total}</Badge></TabsTrigger>)}
      </TabsList>
      {REGIONS.map((r) => <TabsContent key={r} value={r} className="mt-4">{content(r)}</TabsContent>)}
    </Tabs>
  );

  return <TooltipProvider><UpdateChecker /><div className="min-h-screen bg-background"><div className="mx-auto flex max-w-5xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8">
    <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={`${import.meta.env.BASE_URL}triforce-checklist-logo.png`}
          alt=""
          aria-hidden="true"
          className="size-11 shrink-0 object-contain drop-shadow-sm sm:size-[3.25rem]"
        />
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl"><span className="text-primary">Triforce</span> Checklist</h1>
          <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
        </div>
      </div>
      <div className="flex w-full shrink-0 justify-end gap-2 sm:w-auto"><Button variant="outline" size="icon" title={t("app.stats")} onClick={() => setDashboardOpen(true)}><BarChart3 className="size-4" /></Button><CollectionMenu /><LanguageToggle /><ThemeToggle /></div>
    </header>
    <InstallWebAppBanner />
    <FilterBar />
    <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryTab)}>
      <TabsList className="grid !h-auto w-full grid-cols-3 gap-1.5 rounded-xl border border-border/60 bg-card/70 p-1.5 shadow-sm">
        <TabsTrigger value="games" className="h-11 rounded-lg px-4 py-2 text-sm font-semibold data-active:!border-primary/30 data-active:!bg-primary data-active:!text-primary-foreground data-active:shadow-md"><Gamepad2 className="size-4" />{t("tabs.games")}</TabsTrigger>
        <TabsTrigger value="consoles" className="h-11 rounded-lg px-4 py-2 text-sm font-semibold data-active:!border-primary/30 data-active:!bg-primary data-active:!text-primary-foreground data-active:shadow-md"><Monitor className="size-4" />{t("tabs.consoles")}</TabsTrigger>
        <TabsTrigger value="amiibo" className="h-11 rounded-lg px-4 py-2 text-sm font-semibold data-active:!border-primary/30 data-active:!bg-primary data-active:!text-primary-foreground data-active:shadow-md"><ScanLine className="size-4" />{t("tabs.amiibo")}</TabsTrigger>
      </TabsList>
      <TabsContent value="games" className="mt-4">{regionTabs((r) => <RegionView region={r} />)}</TabsContent>
      <TabsContent value="consoles" className="mt-4">{regionTabs((r) => <SpecialConsoleView region={r} />)}</TabsContent>
      <TabsContent value="amiibo" className="mt-4">
        <Tabs value={amiiboMode} onValueChange={(v) => setAmiiboMode(v as AmiiboMode)}>
          <TabsList className="grid !h-auto w-full grid-cols-2 gap-1 rounded-xl border border-border/60 bg-card/50 p-1 sm:w-[28rem]">
            <TabsTrigger value="boxed" className="h-10 gap-2 rounded-lg"><Box className="size-4" />{t("tabs.boxedAmiibo")}</TabsTrigger>
            <TabsTrigger value="individual" className="h-10 gap-2 rounded-lg"><ScanLine className="size-4" />{t("tabs.individualAmiibo")}</TabsTrigger>
          </TabsList>
          <TabsContent value="boxed" className="mt-4">{regionTabs((r) => <AmiiboView region={r} boxed />)}</TabsContent>
          <TabsContent value="individual" className="mt-4">{regionTabs((r) => <AmiiboView region={r} />)}</TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  </div></div><CollectionDashboard open={dashboardOpen} onClose={() => setDashboardOpen(false)} /></TooltipProvider>;
}

export default App;
