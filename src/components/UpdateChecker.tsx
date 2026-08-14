import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, X } from "lucide-react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { translate, useLanguage } from "@/i18n";

type UpdateStatus = { message: string; settled: boolean };

export function UpdateChecker() {
  const checked = useRef(false);
  const [status, setStatus] = useState<UpdateStatus>();

  useEffect(() => {
    if (checked.current || !("__TAURI_INTERNALS__" in window)) return;
    checked.current = true;
    const runCheck = async (manual = false) => {
      const t = (key: string, values?: Record<string, string | number>) => translate(useLanguage.getState().language, key, values);
      try {
        if (manual) setStatus({ message: t("updates.searching"), settled: false });
        const update = await check();
        if (!update) {
          if (manual) setStatus({ message: t("updates.current"), settled: true });
          return;
        }
        const accepted = window.confirm(t("updates.available", { version: update.version }));
        if (!accepted) return;
        setStatus({ message: t("updates.downloading", { version: update.version }), settled: false });
        await update.downloadAndInstall((event) => {
          if (event.event === "Finished") setStatus({ message: t("updates.installing"), settled: false });
        });
        await relaunch();
      } catch (error) {
        console.error("Échec de la recherche de mise à jour", error);
        setStatus({ message: t("updates.failed"), settled: true });
      }
    };
    const manualCheck = () => { void runCheck(true); };
    window.addEventListener("triforce:check-update", manualCheck);
    const timer = window.setTimeout(() => { void runCheck(); }, 2500);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("triforce:check-update", manualCheck);
    };
  }, []);

  if (!status) return null;
  return (
    <div className="fixed right-4 bottom-4 z-[90] flex max-w-sm items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm shadow-2xl">
      {status.settled ? <Download className="size-5 text-primary" /> : <LoaderCircle className="size-5 animate-spin text-primary" />}
      <span>{status.message}</span>
      {status.settled && <button type="button" onClick={() => setStatus(undefined)} aria-label={translate(useLanguage.getState().language, "cover.close")} className="rounded p-1 hover:bg-muted"><X className="size-4" /></button>}
    </div>
  );
}
