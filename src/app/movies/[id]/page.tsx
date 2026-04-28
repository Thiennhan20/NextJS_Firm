import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import MovieDetailClient from './MovieDetailClient';

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ Movies: messages.Movies, Watch: messages.Watch, Comments: messages.Comments, Watchlist: messages.Watchlist }}>
      <MovieDetailClient params={params} />
    </NextIntlClientProvider>
  );
}
