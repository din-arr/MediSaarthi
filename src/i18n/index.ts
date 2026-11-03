import type { Dictionary, LanguageCode } from "./types";
import { en } from "./en";
import { hi } from "./hi";
import { bn } from "./bn";

export const dictionaries: Record<LanguageCode, Dictionary> = { en, hi, bn };
export const languageOptions: Array<{ code: LanguageCode; native: string; english: string; short: string }> = [
  { code: "en", native: "English", english: "English", short: "EN" },
  { code: "hi", native: "हिन्दी", english: "Hindi", short: "हिं" },
  { code: "bn", native: "বাংলা", english: "Bengali", short: "বাং" },
];
