'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages, Check, Monitor } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [mode, setMode] = useState<'auto' | 'en' | 'zh'>('auto');

  useEffect(() => {
    // Check if localStorage has a set language
    const storedLang = localStorage.getItem('i18nextLng');
    if (!storedLang || storedLang.includes('-')) { 
        // i18next might store 'zh-CN', 'en-US' etc.
        // If it matches what the detector put there, it might be auto?
        // Actually, i18next-browser-languagedetector writes to localStorage ALWAYS when initialized if configured.
        // So checking if it equals 'i18nextLng' is tricky.
        // A better way is to manage our own "mode" in localStorage if we want "auto" explicitly.
        // But to keep it simple: 
        // We can assume if the user manually picks a language, we set it.
        // To "reset" to auto, we clear localStorage and reload or re-init.
        
        // However, for this UI state, let's try to infer.
        // We can use a separate key for "user_language_preference" vs "i18nextLng"
        // Or we just set i18n.changeLanguage which sets i18nextLng.
        // To go back to auto, we remove i18nextLng.
    }
    
    // But since we can't easily know if i18nextLng came from user or detector (unless we wipe it on load),
    // Let's just rely on a simple heuristic or local state.
    // Actually, let's rely on the current resolved language for the checkmark,
    // and separate the "Auto" logic.
    
    // If we want to support "Auto", we need to be able to clear the override.
    
  }, []);

  const changeLanguage = (lang: 'en' | 'zh' | 'auto') => {
    if (lang === 'auto') {
      localStorage.removeItem('i18nextLng');
      // We might need to reload or re-run detection.
      // calling i18n.changeLanguage(undefined) might not work as expected depending on version.
      // A reload is the safest way to reset to browser default if we rely on detection on init.
      // Or we can try to detect manually.
      // let's try a soft reset:
      const detected = i18n.services.languageDetector?.detect?.();
       if (detected) {
          // If detected returns an array or string
          const langToUse = typeof detected === 'string' ? detected : detected[0];
          i18n.changeLanguage(langToUse);
      } else {
         // Fallback
          i18n.changeLanguage('zh');
      }
       setMode('auto');
    } else {
      i18n.changeLanguage(lang);
      setMode(lang);
    }
  };

  const currentLang = i18n.language;
  const isZh = currentLang.startsWith('zh');
  const isEn = currentLang.startsWith('en');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title={t('menu.settings.language', 'Language')}>
          <Languages className="h-4 w-4" />
          <span className="sr-only">Switch Language</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 px-2 font-normal"
            onClick={() => changeLanguage('zh')}
          >
            {isZh && mode !== 'auto' && <Check className="h-4 w-4" />}
            {!isZh && <span className="w-4" />}
            <span className="flex-1 text-left">中文</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 px-2 font-normal"
            onClick={() => changeLanguage('en')}
          >
            {isEn && mode !== 'auto' && <Check className="h-4 w-4" />}
            {!isEn && <span className="w-4" />}
            <span className="flex-1 text-left">English</span>
          </Button>
           <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 px-2 font-normal"
            onClick={() => changeLanguage('auto')}
          >
            {mode === 'auto' && <Check className="h-4 w-4" />}
            {mode !== 'auto' && <span className="w-4" />}
            <span className="flex-1 text-left">Auto</span>
             <Monitor className="h-3 w-3 text-muted-foreground ml-auto" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
