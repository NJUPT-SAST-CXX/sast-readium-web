import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(
    resourcesToBackend((language: string, namespace: string) => {
      let lang = language;
      if (language.startsWith("zh")) {
        lang = "zh";
      } else if (language.startsWith("en")) {
        lang = "en";
      }
      return import(`@/locales/${lang}/${namespace}.json`);
    })
  )
  .init({
    supportedLngs: ["en", "zh"],
    fallbackLng: "zh",
    debug: process.env.NODE_ENV === "development",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    ns: ["translation"],
    defaultNS: "translation",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
