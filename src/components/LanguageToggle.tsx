import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
      aria-label={t("language.toggle")}
      title={t("language.toggle")}
      className="relative"
    >
      <Languages className="size-4" />
      <span className="absolute right-0.5 bottom-0 text-[8px] font-bold uppercase">{language}</span>
    </Button>
  );
}
