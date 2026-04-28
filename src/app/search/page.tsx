import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import SearchClient from './SearchClient';

export default async function SearchPage() {
  const messages = await getMessages();
  
  const searchMessages = {
    Search: messages.Search,
    Watchlist: messages.Watchlist,
    Filter: messages.Filter
  };

  return (
    <NextIntlClientProvider messages={searchMessages}>
      <SearchClient />
    </NextIntlClientProvider>
  );
}
