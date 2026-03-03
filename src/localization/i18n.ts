import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as RNLocalize from 'react-native-localize'
import AsyncStorage from '@react-native-async-storage/async-storage'

import en from './locales/en.json'
import ru from './locales/ru.json'
import am from './locales/am.json'
import { STORAGE_KEYS } from '../utils/storageKeys'

const fallbackLng = 'am'

const resources = {
    en: { translation: en },
    ru: { translation: ru },
    am: { translation: am },
}

const languageDetector: any = {
    type: 'languageDetector',
    async: true,

    detect: async (callback: (lang: string) => void) => {
        try {
            const savedLang = await AsyncStorage.getItem(STORAGE_KEYS.LANG)

            if (savedLang) {
                callback(savedLang)
                return
            }

            const locales = RNLocalize.getLocales()
            const deviceLang = locales[0]?.languageCode

            callback(deviceLang || fallbackLng)
        } catch (e) {
            callback(fallbackLng)
        }
    },

    init: () => {},
    cacheUserLanguage: async (lang: string) => {
        await AsyncStorage.setItem(STORAGE_KEYS.LANG, lang)
    },
}

export const changeAppLanguage = async (lang: 'en' | 'ru' | 'am') => {
    await i18n.changeLanguage(lang)
    await AsyncStorage.setItem(STORAGE_KEYS.LANG, lang)
}

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        // @ts-ignore
        compatibilityJSON: 'v3',
        resources,
        fallbackLng,
        supportedLngs: ['en', 'ru', 'am'],
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    })

export default i18n