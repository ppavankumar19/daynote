import { getRequestConfig } from 'next-intl/server';

const SUPPORTED_LOCALES = ['en', 'te', 'hi', 'ja'];

export default getRequestConfig(async ({ locale }) => {
  const safeLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'en';

  return {
    messages: (await import(`./messages/${safeLocale}.json`)).default,
  };
});
