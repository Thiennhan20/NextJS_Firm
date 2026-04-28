import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import TVShowDetailClient from './TVShowDetailClient';

export default async function TVShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ TVShows: messages.TVShows, Watch: messages.Watch, Comments: messages.Comments, Watchlist: messages.Watchlist }}>
      <TVShowDetailClient params={params} />
    </NextIntlClientProvider>
  );
}
