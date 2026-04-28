import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import ForgotPasswordClient from './ForgotPasswordClient';

export default async function ForgotPasswordPage() {
  const messages = await getMessages();
  
  // Only pass translations needed for forgot password page
  const authMessages = {
    ForgotPassword: messages.ForgotPassword
  };

  return (
    <NextIntlClientProvider messages={authMessages}>
      <ForgotPasswordClient />
    </NextIntlClientProvider>
  );
}
