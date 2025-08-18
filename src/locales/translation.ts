import { SkiCycleRunConfig } from "skicyclerun.config";

import type I18nKeys from "./keys";
import { en } from "./languages/en";
import { fr_CA } from "./languages/fr_CA";

export type Translation = {
  [K in I18nKeys]: string;
};

const map: { [key: string]: Translation } = {
  en: en,
  "fr-ca": fr_CA,
};

export function getTranslation(lang: string): Translation {
  return map[lang.toLowerCase()] || en;
}

export function i18n(key: I18nKeys, ...interpolations: string[]): string {
  const lang = SkiCycleRunConfig.locale.lang;
  let translation = getTranslation(lang)[key];
  interpolations.forEach((interpolation) => {
    translation = translation.replace("{{}}", interpolation);
  });
  return translation;
}
