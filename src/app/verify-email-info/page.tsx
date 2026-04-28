import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import VerifyEmailInfoClient from './VerifyEmailInfoClient';

export default async function VerifyEmailInfoPage() {
  const messages = await getMessages();
  
  const authMessages = {
    VerifyEmailInfo: messages.VerifyEmailInfo
  };

  return (
    <NextIntlClientProvider messages={authMessages}>
      <VerifyEmailInfoClient />
    </NextIntlClientProvider>
  );
}
