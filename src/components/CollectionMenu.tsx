import { useEffect, useRef, useState } from "react";
import { Download, Info, RefreshCw, Settings, Upload } from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCollection } from "@/store/useCollection";

export function CollectionMenu() {
  const [version, setVersion] = useState("…");
  const inputRef = useRef<HTMLInputElement>(null);
  const createBackup = useCollection((state) => state.createBackup);
  const restoreBackup = useCollection((state) => state.restoreBackup);

  useEffect(() => {
    void getVersion().then(setVersion).catch(() => setVersion("développement"));
  }, []);

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
    if (!window.confirm("Restaurer cette sauvegarde remplacera les cases actuellement cochées. Continuer?")) return;
    try {
      restoreBackup(await file.text());
      window.alert("La collection a été restaurée avec succès.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Impossible de restaurer cette sauvegarde.");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" title="Collection et mises à jour"><Settings className="size-4" /></Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Info className="size-5" /></div>
          <div><p className="font-semibold">Triforce Checklist</p><p className="text-xs text-muted-foreground">Version {version}</p></div>
        </div>
        <div className="grid gap-2">
          <Button variant="secondary" className="justify-start" onClick={() => window.dispatchEvent(new Event("triforce:check-update"))}><RefreshCw className="size-4" />Vérifier les mises à jour</Button>
          <Button variant="secondary" className="justify-start" onClick={exportCollection}><Download className="size-4" />Exporter ma collection</Button>
          <Button variant="secondary" className="justify-start" onClick={() => inputRef.current?.click()}><Upload className="size-4" />Restaurer une sauvegarde</Button>
          <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { void importCollection(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">La sauvegarde contient les cases des jeux, consoles et amiibo. Les images personnalisées restent sur cet ordinateur.</p>
      </PopoverContent>
    </Popover>
  );
}

