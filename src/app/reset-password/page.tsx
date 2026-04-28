import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import ResetPasswordClient from './ResetPasswordClient';

export default async function ResetPasswordPage() {
  const messages = await getMessages();
  
  const authMessages = {
    ResetPassword: messages.ResetPassword
  };

  return (
    <NextIntlClientProvider messages={authMessages}>
      <ResetPasswordClient />
    </NextIntlClientProvider>
  );
}
