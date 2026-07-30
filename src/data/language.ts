import {LanguageType} from "../types/language.type.ts";

// `name` is the English name — the modal shows it as the secondary line, and it
// is what Settings stores and compares on. `native` is the language's own name,
// which is what the player actually reads: a language picker that says
// "Armenian" while the app is already in Armenian is the one label that must
// never be translated *into* the current language, only written in its own.
export const languages: LanguageType[] = [
    {name: 'Armenian', native: 'Հայերեն', flag: '🇦🇲', code: 'am'},
    {name: 'Russian', native: 'Русский', flag: '🇷🇺', code: 'ru'},
    {name: 'English', native: 'English', flag: '🇬🇧', code: 'en'},
];

export const nativeNameOf = (code: string): string =>
    languages.find(l => l.code === code)?.native ?? code;
