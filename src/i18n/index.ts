import { createI18n } from 'vue-i18n';
import es from '../locales/es.json';
import en from '../locales/en.json';
import it from '../locales/it.json';
import de from '../locales/de.json';

function detectLocale() {
  const saved = localStorage.getItem('locale');
  if (saved && ['es','en','it','de'].includes(saved)) return saved;
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  const short = nav.toLowerCase().slice(0,2);
  if (["es","en","it","de"].includes(short)) return short;
  return 'en';
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { es, en, it, de }
});

export function setHtmlLang(lang: string) {
  document.documentElement.setAttribute('lang', lang);
}
