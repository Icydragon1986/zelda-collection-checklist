import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, X } from "lucide-react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function UpdateChecker() {
  const checked = useRef(false);
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    if (checked.current || !("__TAURI_INTERNALS__" in window)) return;
    checked.current = true;
    const runCheck = async (manual = false) => {
      try {
        if (manual) setStatus("Recherche d’une mise à jour…");
        const update = await check();
        if (!update) {
          if (manual) setStatus("Tu utilises déjà la version la plus récente.");
          return;
        }
        const accepted = window.confirm(`Une nouvelle version (${update.version}) est disponible.\n\nVeux-tu la télécharger et l'installer maintenant?`);
        if (!accepted) return;
        setStatus(`Téléchargement de la version ${update.version}…`);
        await update.downloadAndInstall((event) => {
          if (event.event === "Finished") setStatus("Installation terminée. Redémarrage…");
        });
        await relaunch();
      } catch (error) {
        console.error("Échec de la recherche de mise à jour", error);
        setStatus("Impossible de vérifier ou d’installer la mise à jour.");
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
  const settled = status.startsWith("Impossible") || status.startsWith("Tu utilises");
  return (
    <div className="fixed right-4 bottom-4 z-[90] flex max-w-sm items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm shadow-2xl">
      {settled ? <Download className="size-5 text-primary" /> : <LoaderCircle className="size-5 animate-spin text-primary" />}
      <span>{status}</span>
      {settled && <button type="button" onClick={() => setStatus(undefined)} aria-label="Fermer" className="rounded p-1 hover:bg-muted"><X className="size-4" /></button>}
    </div>
  );
}
