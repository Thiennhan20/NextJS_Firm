import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import LoginClient from './LoginClient';

export default async function LoginPage() {
  const messages = await getMessages();
  
  // Only pass translations needed for the login page
  const authMessages = {
    LoginPage: messages.LoginPage,
    LoginForm: messages.LoginForm,
    RegisterForm: messages.RegisterForm
  };

  return (
    <NextIntlClientProvider messages={authMessages}>
      <LoginClient />
    </NextIntlClientProvider>
  );
}
