import zhTW from './zh-TW';
import en from './en';
import ja from './ja';

type MessageKeys = keyof typeof zhTW;
type Messages = Record<MessageKeys, string>;

const localeMap: Record<string, Messages> = {
  'zh-TW': zhTW,
  'en': en,
  'ja': ja,
};

const locale = (import.meta.env.VITE_LOCALE as string) || 'zh-TW';
const messages: Messages = localeMap[locale] ?? zhTW;

export function t(key: MessageKeys): string {
  return messages[key] ?? key;
}

export function getLocale(): string {
  return locale;
}
