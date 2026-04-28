import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import WatchlistClient from './WatchlistClient';

export default async function WatchlistPage() {
  const messages = await getMessages();
  
  const userMessages = {
    WatchlistPage: messages.WatchlistPage,
    Watchlist: messages.Watchlist
  };

  return (
    <NextIntlClientProvider messages={userMessages}>
      <WatchlistClient />
    </NextIntlClientProvider>
  );
}
