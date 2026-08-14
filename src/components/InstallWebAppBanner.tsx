import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { isStandaloneWebApp, isTauri } from "@/lib/platform";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "triforce-pwa-install-dismissed";

export function InstallWebAppBanner() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState<InstallPromptEvent>();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isTauri() || isStandaloneWebApp() || sessionStorage.getItem(DISMISSED_KEY)) return;
    const showTimer = window.setTimeout(() => setVisible(true), 1200);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  if (!visible) return null;
  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <aside className="rounded-xl border border-primary/30 bg-primary/10 p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary p-2 text-primary-foreground"><Download className="size-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("pwa.installTitle")}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {prompt ? t("pwa.installReady") : t("pwa.installIos")} {!prompt && <Share className="inline size-3.5" />}
          </p>
          {prompt && <Button size="sm" className="mt-2" onClick={() => { void prompt.prompt().then(() => dismiss()); }}>{t("pwa.installButton")}</Button>}
        </div>
        <button type="button" onClick={dismiss} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label={t("cover.close")}><X className="size-4" /></button>
      </div>
    </aside>
  );
}
