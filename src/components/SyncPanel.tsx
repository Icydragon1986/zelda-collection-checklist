import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Cloud, Copy, LoaderCircle, QrCode, RefreshCw, ShieldCheck, Unplug, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSync, type SyncStatus } from "@/store/useSync";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { isTauri } from "@/lib/platform";

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function SyncPanel() {
  const { language, t } = useI18n();
  const configured = useSync((state) => state.configured);
  const storedEndpoint = useSync((state) => state.endpoint);
  const status = useSync((state) => state.status);
  const errorCode = useSync((state) => state.errorCode);
  const lastSyncedAt = useSync((state) => state.lastSyncedAt);
  const pairingUrl = useSync((state) => state.pairingUrl);
  const pairingQrValue = useSync((state) => state.pairingQrValue);
  const configure = useSync((state) => state.configure);
  const pairFromLink = useSync((state) => state.pairFromLink);
  const syncNow = useSync((state) => state.syncNow);
  const disconnect = useSync((state) => state.disconnect);
  const [endpoint, setEndpoint] = useState(storedEndpoint);
  const [token, setToken] = useState("");
  const [pairingInput, setPairingInput] = useState("");
  const [showPairing, setShowPairing] = useState(false);
  const [qrImage, setQrImage] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannerError, setScannerError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const desktop = isTauri();

  useEffect(() => setEndpoint(storedEndpoint), [storedEndpoint]);
  useEffect(() => {
    if (!showPairing || !pairingQrValue) {
      setQrImage(undefined);
      return;
    }
    void import("qrcode")
      .then(({ default: QRCode }) => QRCode.toDataURL(pairingQrValue, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#07170d", light: "#ffffff" },
      }))
      .then(setQrImage)
      .catch(() => setQrImage(undefined));
  }, [pairingQrValue, showPairing]);

  useEffect(() => {
    if (!scanning || !videoRef.current) return;
    let active = true;
    let scanner: { start: () => Promise<void>; stop: () => void; destroy: () => void } | undefined;

    void import("qr-scanner").then(async ({ default: QrScanner }) => {
      if (!active || !videoRef.current) return;
      if (!await QrScanner.hasCamera()) throw new Error("camera-unavailable");
      scanner = new QrScanner(videoRef.current, (result) => {
        if (!active) return;
        active = false;
        scanner?.stop();
        setScanning(false);
        setScannerError(false);
        void pairFromLink(result.data).catch(() => undefined);
      }, {
        preferredCamera: "environment",
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      });
      await scanner.start();
    }).catch((error) => {
      if (!active) return;
      console.warn("Caméra QR indisponible.", error);
      setScannerError(true);
      setScanning(false);
    });

    return () => {
      active = false;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [pairFromLink, scanning]);

  const errorMessage = useMemo(() => {
    if (!errorCode) return undefined;
    const key = `sync.error.${errorCode}`;
    const translated = t(key);
    return translated === key ? t("sync.error.generic") : translated;
  }, [errorCode, language]);

  const activate = async () => {
    try {
      await configure(endpoint, token);
      setToken("");
    } catch {
      // The store exposes a localized error code below the form.
    }
  };

  const pairThisDevice = async () => {
    try {
      await pairFromLink(pairingInput);
      setPairingInput("");
    } catch {
      // The store exposes a localized error code below the form.
    }
  };

  const copyPairing = async () => {
    if (!pairingUrl) return;
    await copyText(pairingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <details className="mt-3 rounded-lg border bg-muted/20 p-2">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold">
        <Cloud className="size-4 text-primary" />
        {t("sync.title")}
        <StatusPill status={status} label={t(`sync.status.${status}`)} />
      </summary>

      {!configured ? (
        <div className="mt-3 grid gap-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t(desktop ? "sync.setupHelp" : "sync.mobileSetupHelp")}</p>

          {desktop ? <>
            <label className="grid gap-1 text-[11px] font-medium">
              {t("sync.endpoint")}
              <Input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </label>
            <label className="grid gap-1 text-[11px] font-medium">
              {t("sync.token")}
              <Input type="password" value={token} onChange={(event) => setToken(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </label>
            <Button size="sm" onClick={() => { void activate(); }} disabled={!token.trim() || status === "connecting"}>
              {status === "connecting" ? <LoaderCircle className="size-4 animate-spin" /> : <Cloud className="size-4" />}
              {t("sync.activate")}
            </Button>
          </> : <>
            <Button size="sm" onClick={() => { setScannerError(false); setScanning(true); }} disabled={scanning || status === "connecting"}>
              {scanning ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
              {t("sync.scanWindowsQr")}
            </Button>
            {scanning && (
              <div className="relative overflow-hidden rounded-lg border bg-black">
                <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
                <Button variant="secondary" size="icon" className="absolute right-2 top-2" title={t("sync.stopScanner")} onClick={() => setScanning(false)}>
                  <X className="size-4" />
                </Button>
                <p className="absolute inset-x-2 bottom-2 rounded bg-black/70 p-2 text-center text-[11px] text-white">{t("sync.cameraHelp")}</p>
              </div>
            )}
            {scannerError && <p className="text-[11px] text-destructive">{t("sync.cameraError")}</p>}
          </>}

          <details className="rounded-md border bg-background/50 p-2" open={!desktop && scannerError}>
            <summary className="cursor-pointer text-[11px] font-medium">{t("sync.havePairingLink")}</summary>
            <div className="mt-2 grid gap-2">
              <Input value={pairingInput} onChange={(event) => setPairingInput(event.target.value)} placeholder={t("sync.pairingPlaceholder")} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
              <Button variant="secondary" size="sm" onClick={() => { void pairThisDevice(); }} disabled={!pairingInput.trim() || status === "connecting"}>
                <QrCode className="size-4" />{t("sync.pairThisDevice")}
              </Button>
            </div>
          </details>
          {errorMessage && <p className="text-[11px] text-destructive">{errorMessage}</p>}
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          <p className="break-all text-[11px] text-muted-foreground">{storedEndpoint}</p>
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />{t("sync.backgroundHelp")}
          </p>
          {lastSyncedAt && <p className="text-[11px] text-muted-foreground">{t("sync.lastSync", {
            date: new Date(lastSyncedAt).toLocaleString(language === "fr" ? "fr-CA" : "en-CA", { dateStyle: "short", timeStyle: "short" }),
          })}</p>}
          {errorMessage && <p className="text-[11px] text-destructive">{errorMessage}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => { void syncNow(); }} disabled={status === "connecting"}>
              <RefreshCw className={cn("size-4", status === "connecting" && "animate-spin")} />{t("sync.syncNow")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowPairing((value) => !value)}>
              <QrCode className="size-4" />{t("sync.pair")}
            </Button>
          </div>

          {showPairing && pairingUrl && pairingQrValue && (
            <div className="mt-1 rounded-lg border bg-white p-2 text-center text-zinc-950">
              {qrImage ? <img src={qrImage} alt={t("sync.qrAlt")} className="mx-auto aspect-square w-full max-w-64" /> : <LoaderCircle className="mx-auto my-10 size-6 animate-spin" />}
              <p className="mt-2 text-[11px] leading-relaxed">{t("sync.scanHelp")}</p>
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => { void copyPairing(); }}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? t("sync.copied") : t("sync.copyLink")}
              </Button>
              <p className="mt-2 text-[10px] text-zinc-600">{t("sync.privateQr")}</p>
            </div>
          )}

          <Button variant="ghost" size="sm" className="justify-start text-muted-foreground" onClick={() => {
            if (window.confirm(t("sync.disconnectConfirm"))) disconnect();
          }}>
            <Unplug className="size-4" />{t("sync.disconnect")}
          </Button>
        </div>
      )}
    </details>
  );
}

function StatusPill({ status, label }: { status: SyncStatus; label: string }) {
  const Icon = status === "synced" ? Check : status === "offline" || status === "error" ? WifiOff : status === "connecting" ? LoaderCircle : Cloud;
  return (
    <span className={cn(
      "ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
      status === "synced" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      (status === "offline" || status === "error") && "bg-destructive/10 text-destructive",
      (status === "connecting" || status === "pending") && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      status === "off" && "bg-muted text-muted-foreground",
    )}>
      <Icon className={cn("size-3", status === "connecting" && "animate-spin")} />{label}
    </span>
  );
}
