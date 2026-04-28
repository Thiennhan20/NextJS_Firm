import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import VerifyEmailClient from './VerifyEmailClient';

export default async function VerifyEmailPage() {
  const messages = await getMessages();
  
  const authMessages = {
    VerifyEmail: messages.VerifyEmail
  };

  return (
    <NextIntlClientProvider messages={authMessages}>
      <VerifyEmailClient />
    </NextIntlClientProvider>
  );
}
