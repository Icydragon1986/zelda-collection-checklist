import { isTauri } from "@/lib/platform";

export function registerServiceWorker(): void {
  if (isTauri() || !import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      console.warn("Impossible d'activer le mode hors ligne.", error);
    });
  });
}
