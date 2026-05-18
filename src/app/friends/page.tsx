import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import FriendsClient from './FriendsClient';

import { Suspense } from 'react';

export default async function FriendsPage() {
  const messages = await getMessages();
  
  const userMessages = {
    Profile: messages.Profile,
    Friends: messages.Friends,
  };

  return (
    <NextIntlClientProvider messages={userMessages}>
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <FriendsClient />
      </Suspense>
    </NextIntlClientProvider>
  );
}
