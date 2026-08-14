import { useEffect, useRef, useState } from "react";
import { Bug, Clock3, Download, Info, RefreshCw, Settings, Trash2, Upload } from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCollection } from "@/store/useCollection";
import { useI18n } from "@/i18n";
import { isTauri } from "@/lib/platform";

const REPORT_URL = "https://github.com/Icydragon1986/zelda-collection-checklist/issues/new?template=catalog-report.yml";

export function CollectionMenu() {
  const { language, t } = useI18n();
  const [version, setVersion] = useState("…");
  const inputRef = useRef<HTMLInputElement>(null);
  const createBackup = useCollection((state) => state.createBackup);
  const restoreBackup = useCollection((state) => state.restoreBackup);
  const automaticBackups = useCollection((state) => state.automaticBackups);
  const restoreAutomaticBackup = useCollection((state) => state.restoreAutomaticBackup);
  const clearAutomaticBackups = useCollection((state) => state.clearAutomaticBackups);

  useEffect(() => {
    if (!isTauri()) {
      setVersion(t("menu.webVersion"));
      return;
    }
    void getVersion().then(setVersion).catch(() => setVersion(t("menu.development")));
  }, [language]);

  const exportCollection = () => {
    const blob = new Blob([createBackup()], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `triforce-checklist-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importCollection = async (file?: File) => {
    if (!file) return;
    if (!window.confirm(t("backup.confirmFile"))) return;
    try {
      restoreBackup(await file.text());
      window.alert(t("backup.restored"));
    } catch (error) {
      window.alert(error instanceof Error && error.message === "invalid-backup" ? t("backup.invalid") : t("backup.failed"));
    }
  };

  const restoreAutomatic = (id: string) => {
    if (!window.confirm(t("backup.confirmAuto"))) return;
    try {
      restoreAutomaticBackup(id);
      window.alert(t("backup.restored"));
    } catch {
      window.alert(t("backup.failed"));
    }
  };

  const reportProblem = async () => {
    try {
      await openUrl(REPORT_URL);
    } catch {
      window.open(REPORT_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" title={t("menu.title")}><Settings className="size-4" /></Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Info className="size-5" /></div>
          <div><p className="font-semibold">Triforce Checklist</p><p className="text-xs text-muted-foreground">{t("menu.version", { version })}</p></div>
        </div>
        <div className="grid gap-2">
          {isTauri() && <Button variant="secondary" className="justify-start" onClick={() => window.dispatchEvent(new Event("triforce:check-update"))}><RefreshCw className="size-4" />{t("menu.checkUpdates")}</Button>}
          <Button variant="secondary" className="justify-start" onClick={exportCollection}><Download className="size-4" />{t("menu.export")}</Button>
          <Button variant="secondary" className="justify-start" onClick={() => inputRef.current?.click()}><Upload className="size-4" />{t("menu.restore")}</Button>
          <Button variant="secondary" className="h-auto justify-start whitespace-normal text-left" onClick={() => { void reportProblem(); }}><Bug className="size-4 shrink-0" />{t("menu.report")}</Button>
          <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { void importCollection(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
        <details className="mt-3 rounded-lg border bg-muted/20 p-2">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold"><Clock3 className="size-4 text-primary" />{t("menu.backups")}<span className="ml-auto rounded-full bg-muted px-2 py-0.5 tabular-nums">{automaticBackups.length}/10</span></summary>
          <p className="mt-2 text-[11px] text-muted-foreground">{t("menu.backupsActive")}</p>
          {automaticBackups.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">{t("menu.noBackups")}</p> : (
            <div className="mt-2 grid max-h-44 gap-1 overflow-y-auto pr-1">
              {automaticBackups.map((backup) => <button key={backup.id} type="button" onClick={() => restoreAutomatic(backup.id)} className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"><span>{new Date(backup.createdAt).toLocaleString(language === "fr" ? "fr-CA" : "en-CA", { dateStyle: "short", timeStyle: "short" })}</span><span className="text-primary">{t("menu.restoreBackup")}</span></button>)}
              <button type="button" onClick={() => { if (window.confirm(t("backup.confirmClear"))) clearAutomaticBackups(); }} className="mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" />{t("menu.clearBackups")}</button>
            </div>
          )}
        </details>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{t("menu.backupNote")}</p>
      </PopoverContent>
    </Popover>
  );
}
