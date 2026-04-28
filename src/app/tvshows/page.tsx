import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import TVShowsClient from './TVShowsClient';

export default async function TVShowsPage() {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ TVShows: messages.TVShows, Watchlist: messages.Watchlist, Filter: messages.Filter }}>
      <TVShowsClient />
    </NextIntlClientProvider>
  );
}
