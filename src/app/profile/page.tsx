import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const messages = await getMessages();
  
  const userMessages = {
    Profile: messages.Profile
  };

  return (
    <NextIntlClientProvider messages={userMessages}>
      <ProfileClient />
    </NextIntlClientProvider>
  );
}
