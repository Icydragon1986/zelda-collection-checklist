import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection } from "@/store/useCollection";

export function Cover({
  id,
  src,
  alt,
  className,
  shape = "box",
}: {
  id: string;
  src: string | undefined;
  alt: string;
  className?: string;
  shape?: "box" | "square";
}) {
  const customPath = useCollection((s) => s.customCovers[id]);
  const setCustomCover = useCollection((s) => s.setCustomCover);
  const clearCustomCover = useCollection((s) => s.clearCustomCover);
  const [remoteFailed, setRemoteFailed] = useState(false);
  const [customSrc, setCustomSrc] = useState<string | undefined>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!customPath) {
      setCustomSrc(undefined);
      return;
    }
    import("@tauri-apps/api/core")
      .then(({ convertFileSrc }) => {
        if (!cancelled) setCustomSrc(convertFileSrc(customPath));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [customPath]);

  const resolvedSrc = customSrc ?? (!remoteFailed ? src : undefined);
  const showImage = !!resolvedSrc;

  useEffect(() => {
    if (!previewOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [previewOpen]);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await setCustomCover(id, file);
    } catch (error) {
      console.error("Impossible d'enregistrer l'image personnalisée.", error);
    }
  };

  return (
    <div
      role={showImage ? "button" : undefined}
      tabIndex={showImage ? 0 : undefined}
      onClick={(event) => {
        if (!showImage) return;
        event.stopPropagation();
        event.preventDefault();
        setPreviewOpen(true);
      }}
      onKeyDown={(event) => {
        if (showImage && (event.key === "Enter" || event.key === " ")) {
          event.stopPropagation();
          event.preventDefault();
          setPreviewOpen(true);
        }
      }}
      title={showImage ? "Agrandir l'image" : undefined}
      className={cn(
        "group relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/40",
        showImage && "cursor-zoom-in",
        shape === "box" ? "aspect-[3/4]" : "aspect-square",
        className,
      )}
    >
      {showImage ? (
        <img
          src={resolvedSrc}
          alt={alt}
          loading="lazy"
          onError={() => setRemoteFailed(true)}
          className="h-full w-full object-contain p-0.5"
        />
      ) : (
        <TriforcePlaceholder />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={handlePick}
      />
      <div
        role="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          inputRef.current?.click();
        }}
        title="Ajouter ou remplacer l'image"
        className="absolute right-1.5 bottom-1.5 flex cursor-pointer items-center justify-center rounded-full bg-black/75 p-2 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 focus:opacity-100"
      >
        <ImagePlus className="size-4" />
      </div>
      {customSrc && (
        <div
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            void clearCustomCover(id);
          }}
          title="Retirer l'image personnalisée"
          className="absolute top-0.5 right-0.5 hidden cursor-pointer rounded-full bg-black/70 p-0.5 text-white group-hover:block"
        >
          <X className="size-3" />
        </div>
      )}
      {showImage && <Maximize2 className="pointer-events-none absolute top-1.5 left-1.5 size-4 rounded bg-black/65 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100" />}
      {previewOpen && resolvedSrc && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Aperçu de ${alt}`}
          onClick={(event) => {
            event.stopPropagation();
            setPreviewOpen(false);
          }}
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={(event) => {
              event.stopPropagation();
              setPreviewOpen(false);
            }}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
          >
            <X className="size-6" />
          </button>
          <div className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
            <img src={resolvedSrc} alt={alt} className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain shadow-2xl" />
            <p className="max-w-[92vw] rounded-full bg-black/60 px-4 py-1.5 text-center text-sm font-medium text-white">{alt}</p>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function TriforcePlaceholder() {
  return (
    <svg viewBox="0 0 24 24" className="h-2/5 w-2/5 text-primary/30" fill="currentColor" aria-hidden="true">
      <path d="M12 3 L21 19 L3 19 Z M12 8.2 L16.3 15.8 L7.7 15.8 Z" fillRule="evenodd" />
    </svg>
  );
}
