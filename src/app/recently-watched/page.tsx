import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import RecentlyWatchedClient from './RecentlyWatchedClient';

export default async function RecentlyWatchedPage() {
  const messages = await getMessages();

  const pageMessages = {
    RecentlyWatched: messages.RecentlyWatched,
  };

  return (
    <NextIntlClientProvider messages={pageMessages}>
      <RecentlyWatchedClient />
    </NextIntlClientProvider>
  );
}
