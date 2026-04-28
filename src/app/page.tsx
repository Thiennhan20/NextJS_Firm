import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import HomePageClient from './HomePageClient';

export default async function Home() {
  const messages = await getMessages();
  
  // Only pass translations needed for the home page to the client
  const homeMessages = {
    HomePage: messages.HomePage,
    RecentlyWatched: messages.RecentlyWatched,
    Trending: messages.Trending,
    ComingSoonSection: messages.ComingSoonSection,
    StreamingRooms: messages.StreamingRooms,
    Entertainment: messages.Entertainment,
    Comments: messages.Comments,
    Watchlist: messages.Watchlist
  };

  return (
    <NextIntlClientProvider messages={homeMessages}>
      <HomePageClient />
    </NextIntlClientProvider>
  );
}
