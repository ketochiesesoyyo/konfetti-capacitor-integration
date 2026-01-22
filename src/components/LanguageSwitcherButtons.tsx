import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export const LanguageSwitcherButtons = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.substring(0, 2) || 'en';

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-1 bg-muted rounded-full p-1">
      <button
        onClick={() => changeLanguage('en')}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
          currentLang === 'en'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        ENG
      </button>
      <button
        onClick={() => changeLanguage('es')}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
          currentLang === 'es'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        ESP
      </button>
    </div>
  );
};
