import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import StreamingLobbyClient from './StreamingLobbyClient';

export default async function StreamingLobbyPage() {
  const messages = await getMessages();
  
  // Only pass translations needed for the streaming lobby page
  const streamingMessages = {
    StreamingLobby: messages.StreamingLobby
  };

  return (
    <NextIntlClientProvider messages={streamingMessages}>
      <StreamingLobbyClient />
    </NextIntlClientProvider>
  );
}
