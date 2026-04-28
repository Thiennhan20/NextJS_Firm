import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import StreamingRoomClient from './StreamingRoomClient';

export default async function StreamingRoomPage() {
  const messages = await getMessages();
  
  // Only pass translations needed for the streaming room page
  const streamingMessages = {
    StreamingRoom: messages.StreamingRoom,
    Watch: messages.Watch
  };

  return (
    <NextIntlClientProvider messages={streamingMessages}>
      <StreamingRoomClient />
    </NextIntlClientProvider>
  );
}
