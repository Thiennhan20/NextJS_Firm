import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const messages = await getMessages();

  const settingsMessages = {
    Profile: messages.Profile
  };

  return (
    <NextIntlClientProvider messages={settingsMessages}>
      <SettingsClient />
    </NextIntlClientProvider>
  );
}