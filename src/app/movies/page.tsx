import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import MoviesClient from './MoviesClient';

export default async function MoviesPage() {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ Movies: messages.Movies, Watchlist: messages.Watchlist, Filter: messages.Filter }}>
      <MoviesClient />
    </NextIntlClientProvider>
  );
}
